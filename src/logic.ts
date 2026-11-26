import type {
  AutomationConfig,
  AutomationRow,
  DeliveryDecision,
  InstagramWebhookEvent,
} from "./types";
import { FOLLOW_CHECK_PAYLOAD } from "./types";

export function normalizeText(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("he-IL");
}

export function parseMediaIds(value: string): string[] {
  if (value === "*") return ["*"];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      const ids = parsed.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
      if (ids.length) return ids;
    }
  } catch {
    // Existing rows store one plain media id.
  }
  return value.trim() ? [value.trim()] : ["*"];
}

export function rowToAutomation(row: AutomationRow): AutomationConfig {
  const parsed: unknown = JSON.parse(row.keywords_json);
  if (!Array.isArray(parsed) || !parsed.every((value) => typeof value === "string")) {
    throw new Error(`Automation ${row.id} has invalid keywords_json`);
  }

  let replyOptions: string[] = [];
  try {
    const raw = JSON.parse(row.reply_options_json || "[]");
    if (Array.isArray(raw)) replyOptions = raw.filter((value): value is string => typeof value === "string" && Boolean(value.trim())).map((value) => value.trim());
  } catch { replyOptions = []; }
  if (!replyOptions.length) replyOptions = [row.message_template];
  let commentReplyOptions: string[] = [];
  try {
    const raw = JSON.parse(row.comment_reply_options_json || "[]");
    if (Array.isArray(raw)) commentReplyOptions = raw.filter((value): value is string => typeof value === "string" && Boolean(value.trim())).map((value) => value.trim());
  } catch { commentReplyOptions = []; }
  const mediaIds = parseMediaIds(row.media_id);
  const triggerSource = row.trigger_source === "story_reply" ? "story_reply" : "comment";
  const mediaMode = triggerSource === "story_reply" && mediaIds.includes("*")
    ? "stories"
    : mediaIds.includes("*") ? "all" : "selected";
  return {
    id: row.id,
    enabled: row.enabled === 1,
    mediaId: mediaIds[0] ?? "*",
    mediaIds,
    mediaMode,
    triggerSource,
    keywords: parsed,
    matchMode: row.match_mode,
    targetUrl: row.target_url,
    messageTemplate: row.message_template,
    replyOptions,
    commentReplyOptions,
    followGate: row.follow_gate === 1,
    followPrompt: row.follow_prompt,
    followButton: row.follow_button,
    followCheckFailOpen: row.follow_check_fail_open === 1,
  };
}

export function findMatchingAutomation(
  rows: AutomationRow[],
  mediaId: string,
  commentText: string,
  triggerSource: "comment" | "story_reply" = "comment",
): { automation: AutomationConfig; keyword: string } | null {
  const normalizedComment = normalizeText(commentText);
  const sortedRows = [...rows].sort((left, right) => {
    const leftExact = parseMediaIds(left.media_id).includes(mediaId) ? 1 : 0;
    const rightExact = parseMediaIds(right.media_id).includes(mediaId) ? 1 : 0;
    return rightExact - leftExact;
  });

  for (const row of sortedRows) {
    const automation = rowToAutomation(row);
    if (!automation.enabled) continue;
    if (automation.triggerSource !== triggerSource) continue;
    if (!automation.mediaIds.includes("*") && !automation.mediaIds.includes(mediaId)) continue;

    for (const keyword of automation.keywords) {
      const normalizedKeyword = normalizeText(keyword);
      if (!normalizedKeyword) continue;
      const matches = automation.matchMode === "contains"
        ? normalizedComment.includes(normalizedKeyword)
        : normalizedComment === normalizedKeyword;
      if (matches) return { automation, keyword };
    }
  }

  return null;
}

export function renderMessage(
  template: string,
  values: { url: string; username: string; keyword: string },
): string {
  const variants = template.split("\n---\n").map((value) => value.trim()).filter(Boolean);
  const selected = variants[Math.floor(Math.random() * variants.length)] ?? template;
  return selected
    .replaceAll("{{url}}", values.url)
    .replaceAll("{{username}}", values.username)
    .replaceAll("{{keyword}}", values.keyword);
}

export function decideDelivery(
  automation: Pick<AutomationConfig, "followGate" | "followCheckFailOpen">,
  followStatus: boolean | null,
): DeliveryDecision {
  if (!automation.followGate) {
    return { deliverLink: true, followStatus, reason: "gate_disabled" };
  }
  if (followStatus === true) {
    return { deliverLink: true, followStatus, reason: "follows" };
  }
  if (followStatus === false) {
    return { deliverLink: false, followStatus, reason: "not_following" };
  }
  if (automation.followCheckFailOpen) {
    return { deliverLink: true, followStatus, reason: "unknown_fail_open" };
  }
  return { deliverLink: false, followStatus, reason: "unknown_fail_closed" };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function readString(record: Record<string, unknown> | null, key: string): string {
  const value = record?.[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function parseFollowCheckEvent(value: unknown): FollowCheckEventCandidate | null {
  const event = asRecord(value);
  const sender = asRecord(event?.sender) ?? asRecord(event?.from);
  const message = asRecord(event?.message);
  const quickReply = asRecord(message?.quick_reply) ?? asRecord(event?.quick_reply);
  const userId = readString(sender, "id");
  const payload = readString(quickReply, "payload");
  if (!userId || payload !== FOLLOW_CHECK_PAYLOAD) return null;
  return { kind: "follow_check", userId };
}

type FollowCheckEventCandidate = Extract<InstagramWebhookEvent, { kind: "follow_check" }>;
type StoryReplyEventCandidate = Extract<InstagramWebhookEvent, { kind: "story_reply" }>;

function parseStoryReplyEvent(value: unknown, selfId: string): StoryReplyEventCandidate | null {
  const event = asRecord(value);
  const sender = asRecord(event?.sender) ?? asRecord(event?.from);
  const message = asRecord(event?.message);
  if (!message || asRecord(message.quick_reply)) return null;
  const replyTo = asRecord(message.reply_to) ?? asRecord(event?.reply_to);
  const story = asRecord(replyTo?.story) ?? asRecord(message.story);
  const referral = asRecord(message.referral) ?? asRecord(event?.referral);
  const referralSource = readString(referral, "source").toLocaleLowerCase("en-US");
  const userId = readString(sender, "id");
  const storyId = readString(story, "id") || readString(replyTo, "story_id") || readString(referral, "media_id");
  const storyUrl = readString(story, "url") || readString(referral, "ref");
  const text = readString(message, "text");
  const messageId = readString(message, "mid") || readString(message, "id");
  const username = readString(sender, "username");
  const isStoryReply = Boolean(storyId) || referralSource === "story";
  if (!isStoryReply || !userId || userId === selfId || !messageId || !text) return null;
  return { kind: "story_reply", messageId, storyId: storyId || storyUrl || "unknown-story", storyUrl, userId, username, text };
}

export function extractWebhookEvents(payload: unknown, selfId: string): InstagramWebhookEvent[] {
  const root = asRecord(payload);
  const entries = Array.isArray(root?.entry) ? root.entry : [];
  const events: InstagramWebhookEvent[] = [];

  for (const entryValue of entries) {
    const entry = asRecord(entryValue);
    const messaging = Array.isArray(entry?.messaging) ? entry.messaging : [];
    for (const messagingEvent of messaging) {
      const followCheck = parseFollowCheckEvent(messagingEvent);
      if (followCheck) {
        events.push(followCheck);
        continue;
      }
      const storyReply = parseStoryReplyEvent(messagingEvent, selfId);
      if (storyReply) events.push(storyReply);
    }

    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const changeValue of changes) {
      const change = asRecord(changeValue);
      const field = readString(change, "field");
      const value = asRecord(change?.value);

      if (field === "messages") {
        const followCheck = parseFollowCheckEvent(value);
        if (followCheck) {
          events.push(followCheck);
          continue;
        }
        const storyReply = parseStoryReplyEvent(value, selfId);
        if (storyReply) events.push(storyReply);
        continue;
      }
      if (field !== "comments" && field !== "live_comments") continue;

      const from = asRecord(value?.from);
      const media = asRecord(value?.media);
      const commentId = readString(value, "id") || readString(value, "comment_id");
      const userId = readString(from, "id") || readString(value, "user_id");
      const mediaId = readString(media, "id") || readString(value, "media_id");
      const text = readString(value, "text") || readString(value, "message");
      const username = readString(from, "username") || readString(value, "username");
      if (!commentId || !userId || !mediaId || !text || userId === selfId) continue;
      events.push({ kind: "comment", commentId, mediaId, userId, username, text });
    }
  }

  return events;
}
