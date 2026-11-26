import { afterEach, describe, expect, it, vi } from "vitest";
import { listInstagramMedia } from "../src/meta-api";

const env = {
  IG_ACCESS_TOKEN: "test-token",
  IG_GRAPH_API_VERSION: "v25.0",
  IG_USER_ID: "account-1",
} as unknown as Env;

afterEach(() => vi.unstubAllGlobals());

describe("Instagram media discovery", () => {
  it("maps media returned by the Instagram API", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/stories")) return Response.json({ data: [{
        id: "story-1",
        media_type: "IMAGE",
        media_url: "https://cdn.example/story.jpg",
        permalink: "https://instagram.com/stories/example/1",
        timestamp: "2026-09-22T08:00:00Z",
      }] });
      return Response.json({ data: [{
          id: "media-1",
          caption: "A reel",
          media_type: "VIDEO",
          media_product_type: "REELS",
          media_url: "https://cdn.example/video.mp4",
          thumbnail_url: "https://cdn.example/thumb.jpg",
          permalink: "https://instagram.com/reel/example",
          timestamp: "2026-09-17T12:00:00Z",
        }] });
    }));

    await expect(listInstagramMedia(env)).resolves.toEqual([
      {
        id: "story-1",
        caption: "",
        mediaType: "IMAGE",
        mediaUrl: "https://cdn.example/story.jpg",
        thumbnailUrl: null,
        permalink: "https://instagram.com/stories/example/1",
        timestamp: "2026-09-22T08:00:00Z",
        source: "story",
      },
      {
        id: "media-1",
        caption: "A reel",
        mediaType: "VIDEO",
        mediaUrl: "https://cdn.example/video.mp4",
        thumbnailUrl: "https://cdn.example/thumb.jpg",
        permalink: "https://instagram.com/reel/example",
        timestamp: "2026-09-17T12:00:00Z",
        source: "reel",
      },
    ]);
  });

  it("fails clearly before making a request when the token is missing", async () => {
    await expect(listInstagramMedia({ ...env, IG_ACCESS_TOKEN: "" })).rejects.toMatchObject({
      code: "TOKEN_NOT_CONFIGURED",
    });
  });
});
