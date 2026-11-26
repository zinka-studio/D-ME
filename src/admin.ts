import { secureStringEqual } from "./security";
import type { AdminAutomationInput, AutomationRow, InstagramMediaItem, MatchMode, StorySourceRow } from "./types";
import { rowToAutomation } from "./logic";
import { listInstagramMedia, MetaApiError } from "./meta-api";

interface AutomationAdminRow extends AutomationRow {
  comment_count: number;
  sent_count: number;
  follower_count: number;
  failed_count: number;
}

export function mergeLearnedHighlights(media: InstagramMediaItem[], learned: StorySourceRow[]): InstagramMediaItem[] {
  const activeStoryIds = new Set(media.filter((item) => item.source === "story").map((item) => item.id));
  const highlights: InstagramMediaItem[] = learned
    .filter((row) => !activeStoryIds.has(row.story_id))
    .map((row) => ({
      id: row.story_id,
      caption: "היילייט שנלמד מתגובה",
      mediaType: "STORY",
      mediaUrl: row.story_url || null,
      thumbnailUrl: null,
      permalink: null,
      timestamp: row.last_seen_at,
      source: "highlight",
    }));
  return [...media, ...highlights];
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

async function isAuthorized(request: Request, env: Env): Promise<boolean> {
  const authorization = request.headers.get("authorization") || "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  return secureStringEqual(supplied, env.ADMIN_TOKEN);
}

async function readBoundedJson(request: Request): Promise<AdminAutomationInput> {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 64_000) throw new Error("Request body is too large");
  const payload: unknown = await request.json();
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new Error("Request body must be a JSON object");
  }
  return payload as AdminAutomationInput;
}

function requiredString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`);
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new Error(`${field} is too long`);
  return normalized;
}

function optionalBoolean(value: unknown, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") throw new Error("Boolean field has an invalid value");
  return value;
}

function validateInput(input: AdminAutomationInput) {
  const id = requiredString(input.id, "id", 80);
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(id)) throw new Error("id must contain only letters, numbers, underscores and hyphens");
  if (!Array.isArray(input.keywords) || input.keywords.length === 0 || input.keywords.length > 20) {
    throw new Error("keywords must contain 1 to 20 values");
  }
  const keywords = input.keywords.map((keyword) => requiredString(keyword, "keyword", 80));
  const targetUrl = requiredString(input.targetUrl, "targetUrl", 2_000);
  const parsedUrl = new URL(targetUrl);
  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") throw new Error("targetUrl must use HTTP or HTTPS");
  const matchMode: MatchMode = input.matchMode === "contains" ? "contains" : "exact";
  const followButton = requiredString(input.followButton ?? "עקבתי", "followButton", 20);
  const replyOptions = Array.isArray(input.replyOptions)
    ? input.replyOptions.map((value) => requiredString(value, "replyOption", 1_000)).slice(0, 4)
    : [];
  if (!replyOptions.length) replyOptions.push(requiredString(input.messageTemplate, "messageTemplate", 1_000));
  const commentReplyOptions = Array.isArray(input.commentReplyOptions)
    ? input.commentReplyOptions.map((value) => requiredString(value, "commentReplyOption", 500)).slice(0, 4)
    : [];
  const suppliedMediaIds = Array.isArray(input.mediaIds)
    ? input.mediaIds.map((value) => requiredString(value, "mediaId", 120)).slice(0, 25)
    : [];
  const triggerSource = input.triggerSource === "story_reply" ? "story_reply" : "comment";
  const requestedStoryMode = triggerSource === "story_reply" && input.mediaMode === "stories";
  const mediaIds = requestedStoryMode
    ? ["*"]
    : suppliedMediaIds.length
    ? Array.from(new Set(suppliedMediaIds))
    : [typeof input.mediaId === "string" && input.mediaId.trim() ? input.mediaId.trim() : "*"];
  const storedMediaId = mediaIds.includes("*") ? "*" : mediaIds.length === 1 ? mediaIds[0] : JSON.stringify(mediaIds);
  const mediaMode = requestedStoryMode ? "stories" : mediaIds.includes("*") ? "all" : "selected";
  return {
    id,
    enabled: optionalBoolean(input.enabled, true),
    mediaId: storedMediaId,
    mediaIds,
    mediaMode,
    triggerSource,
    keywords,
    matchMode,
    targetUrl,
    messageTemplate: replyOptions[0],
    replyOptions,
    commentReplyOptions,
    followGate: optionalBoolean(input.followGate, true),
    followPrompt: requiredString(input.followPrompt, "followPrompt", 1_000),
    followButton,
    followCheckFailOpen: optionalBoolean(input.followCheckFailOpen, true),
  };
}

export async function handleAdminRequest(request: Request, env: Env, url: URL): Promise<Response> {
  if (!await isAuthorized(request, env)) return json({ error: "Unauthorized" }, 401);

  if (request.method === "GET" && url.pathname === "/api/automations") {
    const result = await env.DB.prepare(`
      SELECT
        a.*,
        COUNT(pc.comment_id) AS comment_count,
        COALESCE(SUM(CASE WHEN pc.status = 'link_sent' THEN 1 ELSE 0 END), 0) AS sent_count,
        COALESCE(SUM(CASE WHEN pc.profile_follow_status = 1 THEN 1 ELSE 0 END), 0) AS follower_count,
        COALESCE(SUM(CASE WHEN pc.status = 'failed' THEN 1 ELSE 0 END), 0) AS failed_count
      FROM automations a
      LEFT JOIN processed_comments pc ON pc.automation_id = a.id
      GROUP BY a.id
      ORDER BY a.updated_at DESC, a.created_at DESC
    `).all<AutomationAdminRow>();
    return json({
      automations: result.results.map((row) => ({
        ...rowToAutomation(row),
        commentCount: Number(row.comment_count) || 0,
        sentCount: Number(row.sent_count) || 0,
        followerCount: Number(row.follower_count) || 0,
        failedCount: Number(row.failed_count) || 0,
      })),
    });
  }

  if (request.method === "GET" && url.pathname === "/api/instagram/media") {
    try {
      const media = await listInstagramMedia(env);
      const learned = await env.DB.prepare(`
        SELECT story_id, story_url, last_seen_at
        FROM story_sources
        ORDER BY last_seen_at DESC
        LIMIT 50
      `).all<StorySourceRow>();
      return json({ media: mergeLearnedHighlights(media, learned.results) });
    } catch (error) {
      const status = error instanceof MetaApiError && error.code === "TOKEN_NOT_CONFIGURED" ? 503 : 502;
      return json({
        error: error instanceof Error ? error.message : "Unable to load Instagram media",
      }, status);
    }
  }

  if (request.method === "POST" && url.pathname === "/api/automations") {
    try {
      const automation = validateInput(await readBoundedJson(request));
      const storedMediaId = automation.mediaMode === "stories" ? "*" : automation.mediaId;
      const storedMediaMode = automation.mediaMode === "stories" ? "all" : automation.mediaMode;
      await env.DB.prepare(`
        INSERT INTO automations (
          id, enabled, media_id, keywords_json, match_mode, target_url, message_template, reply_options_json, comment_reply_options_json,
          follow_gate, follow_prompt, follow_button, follow_check_fail_open, media_selection_mode, trigger_source, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          enabled = excluded.enabled,
          media_id = excluded.media_id,
          keywords_json = excluded.keywords_json,
          match_mode = excluded.match_mode,
          target_url = excluded.target_url,
          message_template = excluded.message_template,
          reply_options_json = excluded.reply_options_json,
          comment_reply_options_json = excluded.comment_reply_options_json,
          follow_gate = excluded.follow_gate,
          follow_prompt = excluded.follow_prompt,
          follow_button = excluded.follow_button,
          follow_check_fail_open = excluded.follow_check_fail_open,
          media_selection_mode = excluded.media_selection_mode,
          trigger_source = excluded.trigger_source,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        automation.id,
        automation.enabled ? 1 : 0,
        storedMediaId,
        JSON.stringify(automation.keywords),
        automation.matchMode,
        automation.targetUrl,
        automation.messageTemplate,
        JSON.stringify(automation.replyOptions),
        JSON.stringify(automation.commentReplyOptions),
        automation.followGate ? 1 : 0,
        automation.followPrompt,
        automation.followButton,
        automation.followCheckFailOpen ? 1 : 0,
        storedMediaMode,
        automation.triggerSource,
      ).run();
      return json({ automation: { ...automation, mediaId: storedMediaId } }, 201);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Invalid request" }, 400);
    }
  }

  const deleteMatch = url.pathname.match(/^\/api\/automations\/([a-z0-9_-]+)$/i);
  if (request.method === "DELETE" && deleteMatch?.[1]) {
    const result = await env.DB.prepare("DELETE FROM automations WHERE id = ?").bind(deleteMatch[1]).run();
    return result.meta.changes > 0 ? json({ deleted: true }) : json({ error: "Not found" }, 404);
  }

  return json({ error: "Not found" }, 404);
}
