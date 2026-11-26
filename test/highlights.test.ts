import { describe, expect, it } from "vitest";
import { mergeLearnedHighlights } from "../src/admin";
import type { InstagramMediaItem } from "../src/types";

describe("learned Highlight sources", () => {
  it("keeps active Stories in Story and exposes only expired learned sources as Highlights", () => {
    const media: InstagramMediaItem[] = [{
      id: "active-story",
      caption: "סטורי פעיל",
      mediaType: "STORY",
      mediaUrl: "https://cdn.example/active.jpg",
      thumbnailUrl: null,
      permalink: null,
      timestamp: "2026-09-22T08:00:00Z",
      source: "story",
    }];

    const result = mergeLearnedHighlights(media, [
      { story_id: "active-story", story_url: "https://cdn.example/active.jpg", last_seen_at: "2026-09-22T08:01:00Z" },
      { story_id: "saved-highlight", story_url: "https://cdn.example/highlight.jpg", last_seen_at: "2026-09-20T08:00:00Z" },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: "active-story", source: "story" });
    expect(result[1]).toMatchObject({
      id: "saved-highlight",
      source: "highlight",
      mediaUrl: "https://cdn.example/highlight.jpg",
    });
  });
});
