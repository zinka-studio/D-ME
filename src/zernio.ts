import { secureStringEqual } from "./security";

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

/**
 * Zernio mode: the dashboard manages comment-to-DM automations that Zernio runs.
 * Zernio holds the Instagram connection, listens for comments and sends the messages,
 * so no Meta app, webhook or polling is needed in this Worker.
 */

const ZERNIO_BASE = "https://zernio.com/api/v1";

type ZernioEnv = Env & { ZERNIO_ACCOUNT_ID?: string; ZERNIO_PROFILE_ID?: string };

export function zernioEnabled(env: Env): boolean {
  return Boolean(env.ZERNIO_API_KEY);
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

class ZernioError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function zernio<T>(env: Env, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${ZERNIO_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.ZERNIO_API_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let payload: unknown = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }
  if (!response.ok) {
    const record = (payload ?? {}) as { error?: unknown; message?: unknown };
    const detail = typeof record.error === "string" ? record.error
      : typeof (record.error as { message?: unknown } | undefined)?.message === "string" ? String((record.error as { message: string }).message)
      : typeof record.message === "string" ? record.message : `HTTP ${response.status}`;
    throw new ZernioError(detail, response.status);
  }
  return payload as T;
}

interface ZernioAccount { _id?: string; id?: string; platform?: string; username?: string; displayName?: string; profilePicture?: string | null; profileId?: string | { _id?: string; id?: string } }



type ResolvedAccount = { accountId: string; profileId: string; username?: string; profilePicture?: string | null };
let cachedAccount: ResolvedAccount | null = null;

async function resolveAccount(env: Env): Promise<ResolvedAccount> {
  const e = env as ZernioEnv;
  if (e.ZERNIO_ACCOUNT_ID && e.ZERNIO_PROFILE_ID) return { accountId: e.ZERNIO_ACCOUNT_ID, profileId: e.ZERNIO_PROFILE_ID };
  if (cachedAccount) return cachedAccount;
  const payload = await zernio<{ accounts?: ZernioAccount[] }>(env, "/accounts?platform=instagram");
  const accounts = (payload.accounts ?? []).filter((account) => !account.platform || account.platform === "instagram");
  const chosen = e.ZERNIO_ACCOUNT_ID
    ? accounts.find((account) => (account._id ?? account.id) === e.ZERNIO_ACCOUNT_ID)
    : accounts[0];
  if (!chosen) throw new ZernioError("No Instagram account is connected in Zernio. Connect one in the Zernio dashboard first.", 409);
  const profile = chosen.profileId;
  const profileId = typeof profile === "string" ? profile : profile?._id ?? profile?.id ?? e.ZERNIO_PROFILE_ID ?? "";
  const accountId = chosen._id ?? chosen.id ?? "";
  if (!accountId || !profileId) throw new ZernioError("Zernio did not return an account or profile id.", 502);
  cachedAccount = { accountId, profileId, username: chosen.username, profilePicture: chosen.profilePicture ?? null };
  return cachedAccount;
}

interface ZernioAutomation {
  id: string;
  name?: string;
  trigger?: string;
  accountId?: string;
  platformPostId?: string;
  postTitle?: string;
  keywords?: string[];
  matchMode?: string;
  dmMessage?: string;
  buttons?: Array<{ type?: string; title?: string; url?: string }>;
  commentReply?: string;
  commentReplyVariations?: string[];
  audience?: { followerStatus?: string; whenUnknown?: string };
  followGate?: { message?: string; buttonLabel?: string; notFollowingMessage?: string };
  isActive?: boolean;
  stats?: { triggered?: number; dmsSent?: number; dmsFailed?: number; followGatePassed?: number };
}

/** Zernio automation -> the shape the dashboard already uses. */
export function toRule(automation: ZernioAutomation) {
  const trigger = automation.trigger === "story_reply" ? "story_reply" : "comment";
  const postId = automation.platformPostId || "";
  const url = automation.buttons?.find((button) => button.type === "url")?.url ?? "";
  const dm = automation.dmMessage ?? "";
  const gated = automation.audience?.followerStatus === "follower";
  const commentReplyOptions = [automation.commentReply, ...(automation.commentReplyVariations ?? [])]
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    .slice(0, 3);
  const stats = automation.stats ?? {};
  return {
    id: automation.id,
    enabled: automation.isActive !== false,
    mediaId: postId || "*",
    mediaIds: [postId || "*"],
    mediaMode: trigger === "story_reply" ? "stories" : postId ? "selected" : "all",
    triggerSource: trigger,
    keywords: automation.keywords ?? [],
    matchMode: automation.matchMode === "exact" ? "exact" : "contains",
    targetUrl: url,
    messageTemplate: url ? `${dm}\n{{url}}` : dm,
    replyOptions: [url ? `${dm}\n{{url}}` : dm],
    commentReplyOptions,
    followGate: gated,
    followPrompt: automation.followGate?.message ?? "",
    followButton: automation.followGate?.buttonLabel ?? "עקבתי",
    followCheckFailOpen: true,
    commentCount: Number(stats.triggered) || 0,
    sentCount: Number(stats.dmsSent) || 0,
    followerCount: Number(stats.followGatePassed) || 0,
    failedCount: Number(stats.dmsFailed) || 0,
  };
}

interface RuleInput {
  id?: unknown; enabled?: unknown; mediaIds?: unknown; mediaMode?: unknown; triggerSource?: unknown;
  keywords?: unknown; matchMode?: unknown; targetUrl?: unknown; messageTemplate?: unknown;
  commentReplyOptions?: unknown; followGate?: unknown; followPrompt?: unknown; followButton?: unknown;
}

function text(value: unknown, field: string, max: number, required = true): string {
  if (typeof value !== "string" || !value.trim()) {
    if (required) throw new Error(`${field} is required`);
    return "";
  }
  const trimmed = value.trim();
  if (trimmed.length > max) throw new Error(`${field} is too long`);
  return trimmed;
}

/** Dashboard form -> the body Zernio expects. The link becomes a URL button, so the text carries no {{url}}. */
export function toZernioBody(input: RuleInput) {
  const keywords = Array.isArray(input.keywords)
    ? input.keywords.filter((value): value is string => typeof value === "string" && Boolean(value.trim())).map((value) => value.trim()).slice(0, 20)
    : [];
  if (!keywords.length) throw new Error("keywords is required");
  const targetUrl = text(input.targetUrl, "targetUrl", 2_000);
  if (!/^https?:\/\//i.test(targetUrl)) throw new Error("targetUrl must start with http:// or https://");
  const template = text(input.messageTemplate, "messageTemplate", 1_000);
  const dmMessage = template.replace(/\s*\{\{url\}\}\s*/g, "\n").trim() || "הנה הלינק שביקשת 👇";
  const replies = Array.isArray(input.commentReplyOptions)
    ? input.commentReplyOptions.filter((value): value is string => typeof value === "string" && Boolean(value.trim())).map((value) => value.trim()).slice(0, 3)
    : [];
  const gated = input.followGate !== false;
  const prompt = text(input.followPrompt, "followPrompt", 640, gated);
  const buttonLabel = text(input.followButton, "followButton", 20, false) || "עקבתי";
  const storyReply = input.triggerSource === "story_reply";
  return {
    trigger: storyReply ? "story_reply" : "comment",
    keywords,
    matchMode: input.matchMode === "contains" ? "contains" : "exact",
    dmMessage: dmMessage.slice(0, 600),
    buttons: [{ type: "url", title: "לינק", url: targetUrl }],
    ...(storyReply || !replies.length ? {} : {
      commentReply: replies[0],
      commentReplyVariations: replies.slice(1),
    }),
    audience: gated ? { followerStatus: "follower", whenUnknown: "verify" } : { followerStatus: "any" },
    ...(gated ? { followGate: { message: prompt, buttonLabel, notFollowingMessage: prompt } } : {}),
    repeatPolicy: { mode: "once" },
    publicReplyPolicy: "after_dm",
    isActive: input.enabled !== false,
  };
}

function mediaItem(post: { id?: string; message?: string; createdTime?: string; permalink?: string; picture?: string; mediaType?: string }): InstagramMediaItem | null {
  if (!post.id) return null;
  const kind = String(post.mediaType ?? "").toLowerCase();
  const reel = /\/reel\//.test(post.permalink ?? "") || kind === "reel" || kind === "reels";
  return {
    id: post.id,
    caption: post.message ?? "",
    mediaType: post.mediaType ?? "UNKNOWN",
    mediaUrl: post.picture ?? null,
    thumbnailUrl: post.picture ?? null,
    permalink: post.permalink ?? null,
    timestamp: post.createdTime ?? null,
    source: reel ? "reel" : "feed",
  };
}

async function isAuthorized(request: Request, env: Env): Promise<boolean> {
  const authorization = request.headers.get("authorization") || "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!env.ADMIN_TOKEN || !supplied) return false;
  return secureStringEqual(supplied, env.ADMIN_TOKEN);
}

/** What is connected, and how much of the month is left (plan, usage, request rate limit). */
async function readStatus(env: Env) {
  const headers = { Authorization: `Bearer ${env.ZERNIO_API_KEY}` };
  const [accountResult, usageResult] = await Promise.allSettled([
    resolveAccount(env),
    fetch(`${ZERNIO_BASE}/usage`, { headers }).then(async (response) => ({
      ok: response.ok,
      status: response.status,
      body: await response.json().catch(() => ({})) as Record<string, unknown>,
      rate: {
        limit: Number(response.headers.get("X-RateLimit-Limit")) || null,
        remaining: Number(response.headers.get("X-RateLimit-Remaining")) || null,
        reset: Number(response.headers.get("X-RateLimit-Reset")) || null,
      },
    })),
  ]);
  const usage = usageResult.status === "fulfilled" && usageResult.value.ok ? usageResult.value : null;
  const body = (usage?.body ?? {}) as { planName?: string; billingPeriod?: string; billingSystem?: string; limits?: Record<string, number>; usage?: Record<string, unknown>; spend?: Record<string, number> };
  return {
    providers: [
      { id: "zernio", name: "Zernio", role: "מנוע האוטומציות והתזמון", connected: accountResult.status === "fulfilled",
        detail: accountResult.status === "fulfilled" ? "מחובר" : "לא נמצא חשבון אינסטגרם מחובר" },
    ],
    plan: usage ? {
      name: body.planName ?? null, period: body.billingPeriod ?? null, billing: body.billingSystem ?? null,
      limits: body.limits ?? {}, usage: body.usage ?? {}, spend: body.spend ?? null,
    } : null,
    rateLimit: usage?.rate ?? null,
    usageError: usage ? null : "לא ניתן לקרוא את נתוני השימוש מ-Zernio",
  };
}

export async function handleZernioAdmin(request: Request, env: Env, url: URL): Promise<Response> {
  if (!await isAuthorized(request, env)) return json({ error: "Unauthorized" }, 401);
  if (!zernioEnabled(env)) return json({ error: "ZERNIO_API_KEY is not set on this Worker. Run: npm run setup -- --apply" }, 503);
  try {
    if (request.method === "GET" && url.pathname === "/api/instagram/profile") {
      const account = await resolveAccount(env);
      return json({ profile: { username: account.username ?? "", profilePictureUrl: account.profilePicture ?? null } });
    }

    if (request.method === "GET" && url.pathname === "/api/status") return json(await readStatus(env));

    if (request.method === "GET" && url.pathname === "/api/automations") {
      const { profileId } = await resolveAccount(env);
      const payload = await zernio<{ automations?: ZernioAutomation[] }>(env, `/comment-automations?profileId=${encodeURIComponent(profileId)}`);
      return json({ automations: (payload.automations ?? []).map(toRule) });
    }

    if (request.method === "GET" && url.pathname === "/api/instagram/media") {
      const { accountId } = await resolveAccount(env);
      const cursor = url.searchParams.get("cursor");
      const query = `limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
      const payload = await zernio<{ posts?: Array<Parameters<typeof mediaItem>[0]>; pagination?: { hasMore?: boolean; nextCursor?: string | null } }>(
        env, `/accounts/${encodeURIComponent(accountId)}/posts?${query}`);
      const media = (payload.posts ?? []).map(mediaItem).filter((item): item is InstagramMediaItem => item !== null);
      return json({ media, nextCursor: payload.pagination?.hasMore ? payload.pagination.nextCursor ?? null : null });
    }

    if (request.method === "POST" && url.pathname === "/api/automations") {
      if (Number(request.headers.get("content-length") || "0") > 64_000) return json({ error: "Request body is too large" }, 413);
      const input = await request.json() as RuleInput;
      const { accountId, profileId } = await resolveAccount(env);
      const body = toZernioBody(input);
      const existingId = typeof input.id === "string" && /^[0-9a-f]{24}$/i.test(input.id) ? input.id : "";
      const mediaIds = Array.isArray(input.mediaIds) ? input.mediaIds.filter((value): value is string => typeof value === "string") : [];
      const specific = body.trigger === "comment" ? mediaIds.filter((value) => value && value !== "*") : [];
      const label = body.keywords.slice(0, 2).join(", ");

      if (existingId) {
        const patch = { ...body, ...(specific.length ? { platformPostId: specific[0] } : {}), name: `D-ME ${label}` };
        const updated = await zernio<{ automation?: ZernioAutomation }>(env, `/comment-automations/${existingId}`, { method: "PATCH", body: JSON.stringify(patch) });
        return json({ automation: updated.automation ? toRule(updated.automation) : null }, 200);
      }
      const targets: Array<string | null> = specific.length ? specific : [null];
      const created: ZernioAutomation[] = [];
      for (const postId of targets) {
        const result = await zernio<{ automation?: ZernioAutomation }>(env, "/comment-automations", {
          method: "POST",
          body: JSON.stringify({ ...body, profileId, accountId, name: `D-ME ${label}`, ...(postId ? { platformPostId: postId } : {}) }),
        });
        if (result.automation) created.push(result.automation);
      }
      return json({ automation: created[0] ? toRule(created[0]) : null, created: created.length }, 201);
    }

    const deleteMatch = request.method === "DELETE" ? /^\/api\/automations\/([0-9a-f]{24})$/i.exec(url.pathname) : null;
    if (deleteMatch) {
      await zernio(env, `/comment-automations/${deleteMatch[1]}`, { method: "DELETE" });
      return json({ deleted: true });
    }
    return json({ error: "Not found" }, 404);
  } catch (error) {
    const status = error instanceof ZernioError ? (error.status === 401 ? 502 : error.status >= 400 && error.status < 500 ? 400 : 502) : 400;
    return json({ error: error instanceof Error ? error.message : "Request failed" }, status);
  }
}
