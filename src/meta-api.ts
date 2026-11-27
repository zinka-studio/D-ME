import type { InstagramMediaItem, MetaSendResponse } from "./types";

export class MetaApiError extends Error {
  readonly code: string;

  constructor(message: string, code = "META_API_ERROR") {
    super(message);
    this.name = "MetaApiError";
    this.code = code;
  }
}

async function readSmallJson(response: Response): Promise<unknown> {
  const contentLength = Number(response.headers.get("content-length") || "0");
  if (contentLength > 1_000_000) throw new MetaApiError("Meta returned an oversized response");
  return response.json<unknown>();
}

function readMetaError(payload: unknown): { message: string; code: string } {
  if (typeof payload !== "object" || payload === null) {
    return { message: "Meta API request failed", code: "META_API_ERROR" };
  }
  const error = "error" in payload && typeof payload.error === "object" && payload.error !== null
    ? payload.error as Record<string, unknown>
    : null;
  return {
    message: typeof error?.message === "string" ? error.message : "Meta API request failed",
    code: typeof error?.code === "number" || typeof error?.code === "string"
      ? String(error.code)
      : "META_API_ERROR",
  };
}
export const DEFAULT_GRAPH_HOST = "graph.instagram.com";

/** Base URL of the Instagram Graph API. The host is configurable because Meta serves new apps (Unified Login) and older apps (Instagram Login) from different hosts. */
export function graphBase(env: Pick<Env, "IG_GRAPH_API_VERSION"> & { IG_GRAPH_HOST?: string }): string {
  return `https://${env.IG_GRAPH_HOST || DEFAULT_GRAPH_HOST}/${env.IG_GRAPH_API_VERSION}`;
}

export async function getFollowStatus(
  userId: string,
  accessToken: string,
  graphVersion: string,
  graphHost: string = DEFAULT_GRAPH_HOST,
): Promise<boolean | null> {
  const url = new URL(`https://${graphHost || DEFAULT_GRAPH_HOST}/${graphVersion}/${encodeURIComponent(userId)}`);
  url.searchParams.set("fields", "is_user_follow_business");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = await readSmallJson(response);
  if (!response.ok) {
    const error = readMetaError(payload);
    console.error(JSON.stringify({ message: "follow status lookup failed", metaCode: error.code, status: response.status }));
    return null;
  }
  if (typeof payload === "object" && payload !== null && "is_user_follow_business" in payload) {
    const status = payload.is_user_follow_business;
    return typeof status === "boolean" ? status : null;
  }
  return null;
}

function optionalString(record: Record<string, unknown>, key: string): string | null {
  return typeof record[key] === "string" ? record[key] : null;
}

async function listMediaEdge(env: Env, edge: "media" | "stories"): Promise<InstagramMediaItem[]> {
  const url = new URL(`${graphBase(env)}/${env.IG_USER_ID}/${edge}`);
  url.searchParams.set("fields", edge === "stories"
    ? "id,media_type,media_url,thumbnail_url,permalink,timestamp"
    : "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp");
  url.searchParams.set("limit", "50");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${env.IG_ACCESS_TOKEN}` },
  });
  const payload = await readSmallJson(response);
  if (!response.ok) {
    const error = readMetaError(payload);
    throw new MetaApiError(error.message, error.code);
  }
  if (typeof payload !== "object" || payload === null || !("data" in payload) || !Array.isArray(payload.data)) {
    return [];
  }
  return payload.data.flatMap((item): InstagramMediaItem[] => {
    if (typeof item !== "object" || item === null || !("id" in item) || typeof item.id !== "string") return [];
    const record = item as Record<string, unknown>;
    return [{
      id: item.id,
      caption: optionalString(record, "caption") ?? "",
      mediaType: optionalString(record, "media_type") ?? "UNKNOWN",
      mediaUrl: optionalString(record, "media_url"),
      thumbnailUrl: optionalString(record, "thumbnail_url"),
      permalink: optionalString(record, "permalink"),
      timestamp: optionalString(record, "timestamp"),
      source: edge === "stories" ? "story" : optionalString(record, "media_product_type") === "REELS" ? "reel" : "feed",
    }];
  });
}

export async function listInstagramMedia(env: Env): Promise<InstagramMediaItem[]> {
  if (!env.IG_ACCESS_TOKEN) {
    throw new MetaApiError("Instagram access token is not configured", "TOKEN_NOT_CONFIGURED");
  }
  const feed = await listMediaEdge(env, "media");
  try {
    const stories = await listMediaEdge(env, "stories");
    return [...stories, ...feed];
  } catch (error) {
    console.warn(JSON.stringify({
      message: "active Instagram stories could not be listed",
      error: error instanceof Error ? error.message : String(error),
    }));
    return feed;
  }
}

export async function sendInstagramMessage(
  env: Env,
  requestBody: Record<string, unknown>,
): Promise<MetaSendResponse> {
  const url = `${graphBase(env)}/${env.IG_USER_ID}/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.IG_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
  const payload = await readSmallJson(response);
  if (!response.ok) {
    const error = readMetaError(payload);
    throw new MetaApiError(error.message, error.code);
  }
  if (typeof payload !== "object" || payload === null) return {};
  const record = payload as Record<string, unknown>;
  return {
    recipient_id: typeof record.recipient_id === "string" ? record.recipient_id : undefined,
    message_id: typeof record.message_id === "string" ? record.message_id : undefined,
  };
}

export async function sendInstagramCommentReply(
  env: Env,
  commentId: string,
  message: string,
): Promise<MetaSendResponse> {
  const url = `${graphBase(env)}/${encodeURIComponent(commentId)}/replies`;
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.IG_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  const payload = await readSmallJson(response);
  if (!response.ok) {
    const error = readMetaError(payload);
    throw new MetaApiError(error.message, error.code);
  }
  if (typeof payload !== "object" || payload === null) return {};
  const record = payload as Record<string, unknown>;
  return { message_id: typeof record.id === "string" ? record.id : undefined };
}
