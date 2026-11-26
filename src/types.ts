export const FOLLOW_CHECK_PAYLOAD = "DME_FOLLOW_CHECK";

export type MatchMode = "exact" | "contains";
export type MediaMode = "all" | "selected" | "stories";
export type TriggerSource = "comment" | "story_reply";

export interface AutomationRow {
  id: string;
  enabled: number;
  media_id: string;
  keywords_json: string;
  match_mode: MatchMode;
  target_url: string;
  message_template: string;
  reply_options_json?: string;
  comment_reply_options_json?: string;
  follow_gate: number;
  follow_prompt: string;
  follow_button: string;
  follow_check_fail_open: number;
  media_selection_mode?: "all" | "selected";
  trigger_source?: TriggerSource;
}

export interface AutomationConfig {
  id: string;
  enabled: boolean;
  mediaId: string;
  mediaIds: string[];
  mediaMode: MediaMode;
  triggerSource: TriggerSource;
  keywords: string[];
  matchMode: MatchMode;
  targetUrl: string;
  messageTemplate: string;
  replyOptions: string[];
  commentReplyOptions: string[];
  followGate: boolean;
  followPrompt: string;
  followButton: string;
  followCheckFailOpen: boolean;
}

export interface CommentEvent {
  kind: "comment";
  commentId: string;
  mediaId: string;
  userId: string;
  username: string;
  text: string;
}

export interface FollowCheckEvent {
  kind: "follow_check";
  userId: string;
}

export interface StoryReplyEvent {
  kind: "story_reply";
  messageId: string;
  storyId: string;
  storyUrl: string;
  userId: string;
  username: string;
  text: string;
}

export type InstagramWebhookEvent = CommentEvent | StoryReplyEvent | FollowCheckEvent;

export interface FollowSessionRow {
  instagram_user_id: string;
  comment_id: string;
  automation_id: string;
  expires_at: string;
}

export interface DeliveryDecision {
  deliverLink: boolean;
  followStatus: boolean | null;
  reason: "gate_disabled" | "follows" | "not_following" | "unknown_fail_open" | "unknown_fail_closed";
}

export interface MetaSendResponse {
  recipient_id?: string;
  message_id?: string;
}

export interface InstagramMediaItem {
  id: string;
  caption: string;
  mediaType: string;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  permalink: string | null;
  timestamp: string | null;
  source: "feed" | "reel" | "story" | "highlight";
}

export interface StorySourceRow {
  story_id: string;
  story_url: string | null;
  last_seen_at: string;
}

export interface AdminAutomationInput {
  id?: unknown;
  enabled?: unknown;
  mediaId?: unknown;
  mediaIds?: unknown;
  mediaMode?: unknown;
  keywords?: unknown;
  matchMode?: unknown;
  targetUrl?: unknown;
  messageTemplate?: unknown;
  replyOptions?: unknown;
  commentReplyOptions?: unknown;
  followGate?: unknown;
  followPrompt?: unknown;
  followButton?: unknown;
  followCheckFailOpen?: unknown;
  triggerSource?: unknown;
}
