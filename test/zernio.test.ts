import { afterEach, describe, expect, it, vi } from "vitest";
import { handleZernioAdmin, toRule, toZernioBody, zernioEnabled } from "../src/zernio";

const env = { ADMIN_TOKEN: "admin", ZERNIO_API_KEY: "sk_test" } as unknown as Env;
const auth = { Authorization: "Bearer admin", "Content-Type": "application/json" };

afterEach(() => vi.unstubAllGlobals());

function stubZernio(routes: Record<string, unknown>, calls: Array<{ url: string; method: string; body: unknown }> = []) {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : null });
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer sk_test");
    for (const [key, value] of Object.entries(routes)) if (url.includes(key)) return Response.json(value);
    return Response.json({ error: "not found" }, { status: 404 });
  }));
  return calls;
}

const accounts = { accounts: [{ _id: "acc1", platform: "instagram", profileId: "prof1" }] };

describe("Zernio mode", () => {
  it("is enabled only when the API key is set", () => {
    expect(zernioEnabled(env)).toBe(true);
    expect(zernioEnabled({ ADMIN_TOKEN: "admin" } as unknown as Env)).toBe(false);
  });

  it("turns the form into a Zernio body with a link button and a follow gate", () => {
    const body = toZernioBody({
      keywords: ["לינק"], matchMode: "exact", targetUrl: "https://example.com",
      messageTemplate: "היי {{username}}, הנה הלינק\n{{url}}", commentReplyOptions: ["תודה", "בדרך אליך"],
      followGate: true, followPrompt: "עקבו ואז לחצו", followButton: "עקבתי", enabled: true,
    });
    expect(body.dmMessage).toBe("היי {{username}}, הנה הלינק");
    expect(body.buttons).toEqual([{ type: "url", title: "לינק", url: "https://example.com" }]);
    expect(body.audience).toEqual({ followerStatus: "follower", whenUnknown: "verify" });
    expect(body.followGate).toMatchObject({ message: "עקבו ואז לחצו", buttonLabel: "עקבתי" });
    expect(body.commentReply).toBe("תודה");
    expect(body.commentReplyVariations).toEqual(["בדרך אליך"]);
  });

  it("sends to everyone and skips the gate when it is off, and sends no public reply for stories", () => {
    const body = toZernioBody({
      keywords: ["מדריך"], targetUrl: "https://example.com", messageTemplate: "{{url}}", followGate: false,
      triggerSource: "story_reply", commentReplyOptions: ["x"],
    });
    expect(body.audience).toEqual({ followerStatus: "any" });
    expect(body).not.toHaveProperty("followGate");
    expect(body).not.toHaveProperty("commentReply");
    expect(body.trigger).toBe("story_reply");
  });

  it("rejects a missing keyword and a non-http link", () => {
    expect(() => toZernioBody({ keywords: [], targetUrl: "https://a.b", messageTemplate: "x", followPrompt: "p" })).toThrow("keywords");
    expect(() => toZernioBody({ keywords: ["a"], targetUrl: "javascript:alert(1)", messageTemplate: "x", followPrompt: "p" })).toThrow("targetUrl");
  });

  it("maps a Zernio automation back to the dashboard rule with its counters", () => {
    const rule = toRule({
      id: "a1", trigger: "comment", platformPostId: "m1", keywords: ["לינק"], matchMode: "contains",
      dmMessage: "הנה", buttons: [{ type: "url", url: "https://example.com" }], commentReply: "תודה",
      audience: { followerStatus: "follower" }, followGate: { message: "עקבו", buttonLabel: "עקבתי" },
      isActive: true, stats: { triggered: 9, dmsSent: 7, dmsFailed: 1, followGatePassed: 4 },
    });
    expect(rule).toMatchObject({
      id: "a1", mediaMode: "selected", mediaIds: ["m1"], targetUrl: "https://example.com", messageTemplate: "הנה\n{{url}}",
      followGate: true, commentCount: 9, sentCount: 7, followerCount: 4, failedCount: 1,
    });
  });

  it("requires the admin token", async () => {
    const response = await handleZernioAdmin(new Request("https://w.test/api/automations"), env, new URL("https://w.test/api/automations"));
    expect(response.status).toBe(401);
  });

  it("lists automations for the connected account's profile", async () => {
    const calls = stubZernio({ "/accounts?platform": accounts, "/comment-automations": { automations: [{ id: "a1", keywords: ["x"], isActive: true }] } });
    const url = new URL("https://w.test/api/automations");
    const response = await handleZernioAdmin(new Request(url, { headers: auth }), env, url);
    const payload = await response.json<{ automations: Array<{ id: string }> }>();
    expect(payload.automations[0]?.id).toBe("a1");
    expect(calls.map((call) => call.url)).toContain("https://zernio.com/api/v1/comment-automations?profileId=prof1");
  });

  it("loads posts from the account, newest first, and marks reels", async () => {
    stubZernio({ "/accounts?platform": accounts, "/accounts/acc1/posts": {
      posts: [
        { id: "p1", message: "ריל", permalink: "https://www.instagram.com/reel/abc/", picture: "https://x/p1.jpg", mediaType: "video", createdTime: "2026-11-20T00:00:00Z" },
        { id: "p2", message: "פוסט", permalink: "https://www.instagram.com/p/def/", picture: "https://x/p2.jpg", mediaType: "image", createdTime: "2020-01-01T00:00:00Z" },
      ],
      pagination: { hasMore: true, nextCursor: "c2" },
    } });
    const url = new URL("https://w.test/api/instagram/media");
    const response = await handleZernioAdmin(new Request(url, { headers: auth }), env, url);
    const payload = await response.json<{ media: Array<{ id: string; source: string }>; nextCursor: string | null }>();
    expect(payload.media.map((item) => [item.id, item.source])).toEqual([["p1", "reel"], ["p2", "feed"]]);
    expect(payload.nextCursor).toBe("c2");
  });

  it("creates one automation per selected post", async () => {
    const calls = stubZernio({ "/accounts?platform": accounts, "/comment-automations": { automation: { id: "n1", keywords: ["לינק"] } } });
    const url = new URL("https://w.test/api/automations");
    const response = await handleZernioAdmin(new Request(url, {
      method: "POST", headers: auth,
      body: JSON.stringify({
        keywords: ["לינק"], targetUrl: "https://example.com", messageTemplate: "{{url}}", followGate: false,
        mediaIds: ["old1", "old2"], mediaMode: "selected", triggerSource: "comment",
      }),
    }), env, url);
    expect(response.status).toBe(201);
    const posts = calls.filter((call) => call.method === "POST");
    expect(posts.map((call) => (call.body as { platformPostId: string }).platformPostId)).toEqual(["old1", "old2"]);
    expect(posts[0]?.body).toMatchObject({ accountId: "acc1", profileId: "prof1" });
  });

  it("deletes by automation id", async () => {
    const calls = stubZernio({ "/comment-automations/6b096d3828104c7769fe9a20": { success: true } });
    const url = new URL("https://w.test/api/automations/6b096d3828104c7769fe9a20");
    const response = await handleZernioAdmin(new Request(url, { method: "DELETE", headers: auth }), env, url);
    expect(response.status).toBe(200);
    expect(calls[0]).toMatchObject({ method: "DELETE" });
  });
});
