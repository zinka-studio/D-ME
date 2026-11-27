import { decideDelivery, extractWebhookEvents, findMatchingAutomation, renderMessage, rowToAutomation } from "./logic";
import { getFollowStatus, MetaApiError, sendInstagramCommentReply, sendInstagramMessage } from "./meta-api";
import type { AutomationConfig, AutomationRow, CommentEvent, FollowSessionRow, InstagramWebhookEvent, StoryReplyEvent } from "./types";
import { FOLLOW_CHECK_PAYLOAD } from "./types";

async function getEnabledAutomations(env: Env, _mediaId: string): Promise<AutomationRow[]> {
  const result = await env.DB.prepare(`
    SELECT * FROM automations
    WHERE enabled = 1
    ORDER BY created_at ASC
  `).all<AutomationRow>();
  return result.results;
}

async function getAutomation(env: Env, automationId: string): Promise<AutomationConfig | null> {
  const row = await env.DB.prepare("SELECT * FROM automations WHERE id = ? AND enabled = 1")
    .bind(automationId)
    .first<AutomationRow>();
  return row ? rowToAutomation(row) : null;
}

function gateMessage(automation: AutomationConfig): Record<string, unknown> {
  return {
    text: automation.followPrompt,
    quick_replies: [
      {
        content_type: "text",
        title: automation.followButton,
        payload: FOLLOW_CHECK_PAYLOAD,
      },
    ],
  };
}

async function markFailed(env: Env, commentId: string, error: unknown): Promise<void> {
  const code = error instanceof MetaApiError ? error.code : "PROCESSING_ERROR";
  const message = error instanceof Error ? error.message : "Unknown processing error";
  await env.DB.prepare(`
    UPDATE processed_comments
    SET status = 'failed', error_code = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
    WHERE comment_id = ?
  `).bind(code, message.slice(0, 1_000), commentId).run();
}

async function processComment(event: CommentEvent, env: Env): Promise<void> {
  const rows = await getEnabledAutomations(env, event.mediaId);
  const matched = findMatchingAutomation(rows, event.mediaId, event.text, "comment");
  if (!matched) return;

  const reservation = await env.DB.prepare(`
    INSERT OR IGNORE INTO processed_comments (
      comment_id, automation_id, instagram_user_id, media_id, comment_text, status
    ) VALUES (?, ?, ?, ?, ?, 'processing')
  `).bind(event.commentId, matched.automation.id, event.userId, event.mediaId, event.text).run();
  if (reservation.meta.changes === 0) return;

  try {
    if (matched.automation.commentReplyOptions.length) {
      const commentReply = matched.automation.commentReplyOptions[Math.floor(Math.random() * matched.automation.commentReplyOptions.length)];
      if (commentReply) await sendInstagramCommentReply(env, event.commentId, renderMessage(commentReply, { url: matched.automation.targetUrl, username: event.username, keyword: matched.keyword }));
    }
    const followStatus = matched.automation.followGate
      ? await getFollowStatus(event.userId, env.IG_ACCESS_TOKEN, env.IG_GRAPH_API_VERSION, env.IG_GRAPH_HOST)
      : null;
    const decision = decideDelivery(matched.automation, followStatus);
    const message = decision.deliverLink
      ? {
      text: renderMessage(matched.automation.replyOptions[Math.floor(Math.random() * matched.automation.replyOptions.length)] ?? matched.automation.messageTemplate, {
            url: matched.automation.targetUrl,
            username: event.username,
            keyword: matched.keyword,
          }),
        }
      : gateMessage(matched.automation);
    const sent = await sendInstagramMessage(env, {
      recipient: { comment_id: event.commentId },
      message,
    });

    if (decision.deliverLink) {
      await env.DB.prepare(`
        UPDATE processed_comments
        SET status = 'link_sent', profile_follow_status = ?, message_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE comment_id = ?
      `).bind(followStatus === null ? null : followStatus ? 1 : 0, sent.message_id ?? null, event.commentId).run();
      return;
    }

    await env.DB.batch([
      env.DB.prepare(`
        UPDATE processed_comments
        SET status = 'pending_follow', profile_follow_status = 0, message_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE comment_id = ?
      `).bind(sent.message_id ?? null, event.commentId),
      env.DB.prepare(`
        INSERT INTO follow_sessions (
          instagram_user_id, comment_id, automation_id, expires_at, updated_at
        ) VALUES (?, ?, ?, datetime('now', '+7 days'), CURRENT_TIMESTAMP)
        ON CONFLICT(instagram_user_id) DO UPDATE SET
          comment_id = excluded.comment_id,
          automation_id = excluded.automation_id,
          expires_at = excluded.expires_at,
          updated_at = CURRENT_TIMESTAMP
      `).bind(event.userId, event.commentId, matched.automation.id),
    ]);
  } catch (error) {
    await markFailed(env, event.commentId, error);
    throw error;
  }
}

async function processStoryReply(event: StoryReplyEvent, env: Env): Promise<void> {
  if (event.storyId && event.storyId !== "unknown-story") {
    await env.DB.prepare(`
      INSERT INTO story_sources (story_id, story_url, last_seen_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(story_id) DO UPDATE SET
        story_url = CASE WHEN excluded.story_url <> '' THEN excluded.story_url ELSE story_sources.story_url END,
        last_seen_at = CURRENT_TIMESTAMP
    `).bind(event.storyId, event.storyUrl || "").run();
  }
  const rows = await getEnabledAutomations(env, event.storyId);
  const matched = findMatchingAutomation(rows, event.storyId, event.text, "story_reply");
  if (!matched) return;

  const reservation = await env.DB.prepare(`
    INSERT OR IGNORE INTO processed_comments (
      comment_id, automation_id, instagram_user_id, media_id, comment_text, status
    ) VALUES (?, ?, ?, ?, ?, 'processing')
  `).bind(event.messageId, matched.automation.id, event.userId, event.storyId, event.text).run();
  if (reservation.meta.changes === 0) return;

  try {
    const followStatus = matched.automation.followGate
      ? await getFollowStatus(event.userId, env.IG_ACCESS_TOKEN, env.IG_GRAPH_API_VERSION, env.IG_GRAPH_HOST)
      : null;
    const decision = decideDelivery(matched.automation, followStatus);
    const message = decision.deliverLink
      ? {
          text: renderMessage(matched.automation.replyOptions[Math.floor(Math.random() * matched.automation.replyOptions.length)] ?? matched.automation.messageTemplate, {
            url: matched.automation.targetUrl,
            username: event.username,
            keyword: matched.keyword,
          }),
        }
      : gateMessage(matched.automation);
    const sent = await sendInstagramMessage(env, {
      recipient: { id: event.userId },
      message,
    });

    if (decision.deliverLink) {
      await env.DB.prepare(`
        UPDATE processed_comments
        SET status = 'link_sent', profile_follow_status = ?, message_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE comment_id = ?
      `).bind(followStatus === null ? null : followStatus ? 1 : 0, sent.message_id ?? null, event.messageId).run();
      return;
    }

    await env.DB.batch([
      env.DB.prepare(`
        UPDATE processed_comments
        SET status = 'pending_follow', profile_follow_status = 0, message_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE comment_id = ?
      `).bind(sent.message_id ?? null, event.messageId),
      env.DB.prepare(`
        INSERT INTO follow_sessions (
          instagram_user_id, comment_id, automation_id, expires_at, updated_at
        ) VALUES (?, ?, ?, datetime('now', '+7 days'), CURRENT_TIMESTAMP)
        ON CONFLICT(instagram_user_id) DO UPDATE SET
          comment_id = excluded.comment_id,
          automation_id = excluded.automation_id,
          expires_at = excluded.expires_at,
          updated_at = CURRENT_TIMESTAMP
      `).bind(event.userId, event.messageId, matched.automation.id),
    ]);
  } catch (error) {
    await markFailed(env, event.messageId, error);
    throw error;
  }
}

async function processFollowCheck(userId: string, env: Env): Promise<void> {
  const session = await env.DB.prepare(`
    SELECT instagram_user_id, comment_id, automation_id, expires_at
    FROM follow_sessions
    WHERE instagram_user_id = ? AND expires_at > CURRENT_TIMESTAMP
  `).bind(userId).first<FollowSessionRow>();
  if (!session) return;
  const automation = await getAutomation(env, session.automation_id);
  if (!automation) return;

  const followStatus = await getFollowStatus(userId, env.IG_ACCESS_TOKEN, env.IG_GRAPH_API_VERSION, env.IG_GRAPH_HOST);
  const decision = decideDelivery(automation, followStatus);
  const message = decision.deliverLink
    ? { text: renderMessage(automation.replyOptions[Math.floor(Math.random() * automation.replyOptions.length)] ?? automation.messageTemplate, { url: automation.targetUrl, username: "", keyword: "" }) }
    : gateMessage(automation);
  const sent = await sendInstagramMessage(env, {
    recipient: { id: userId },
    message,
  });

  if (!decision.deliverLink) {
    await env.DB.prepare(`
      UPDATE follow_sessions SET updated_at = CURRENT_TIMESTAMP WHERE instagram_user_id = ?
    `).bind(userId).run();
    return;
  }

  await env.DB.batch([
    env.DB.prepare(`
      UPDATE processed_comments
      SET status = 'link_sent', profile_follow_status = ?, message_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE comment_id = ?
    `).bind(followStatus === null ? null : followStatus ? 1 : 0, sent.message_id ?? null, session.comment_id),
    env.DB.prepare("DELETE FROM follow_sessions WHERE instagram_user_id = ?").bind(userId),
  ]);
}

async function processEvent(event: InstagramWebhookEvent, env: Env): Promise<void> {
  if (event.kind === "comment") {
    await processComment(event, env);
    return;
  }
  if (event.kind === "story_reply") {
    await processStoryReply(event, env);
    return;
  }
  await processFollowCheck(event.userId, env);
}

export async function processWebhookPayload(payload: unknown, env: Env): Promise<void> {
  const events = extractWebhookEvents(payload, env.IG_USER_ID);
  const results = await Promise.allSettled(events.map((event) => processEvent(event, env)));
  for (const result of results) {
    if (result.status === "rejected") {
      console.error(JSON.stringify({
        message: "Instagram webhook event failed",
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      }));
    }
  }
  await env.DB.prepare("DELETE FROM follow_sessions WHERE expires_at <= CURRENT_TIMESTAMP").run();
}
