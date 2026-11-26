import { describe, expect, it } from "vitest";
import { decideDelivery, extractWebhookEvents, findMatchingAutomation, renderMessage } from "../src/logic";
import type { AutomationRow } from "../src/types";

const baseRow: AutomationRow = {
  id: "guide-link",
  enabled: 1,
  media_id: "*",
  keywords_json: JSON.stringify(["לינק", "קישור"]),
  match_mode: "exact",
  target_url: "https://example.com/guide",
  message_template: "הנה הלינק {{url}}",
  follow_gate: 1,
  follow_prompt: "עקוב ואז בדוק",
  follow_button: "עקבתי - בדיקה",
  follow_check_fail_open: 1,
  trigger_source: "comment",
};

describe("automation matching", () => {
  it("matches a normalized Hebrew keyword", () => {
    const result = findMatchingAutomation([baseRow], "media-1", "  לינק  ");
    expect(result?.automation.id).toBe("guide-link");
    expect(result?.keyword).toBe("לינק");
  });

  it("prefers an exact media rule over a wildcard rule", () => {
    const exact = { ...baseRow, id: "exact", media_id: "media-1" };
    const result = findMatchingAutomation([baseRow, exact], "media-1", "לינק");
    expect(result?.automation.id).toBe("exact");
  });

  it("matches every post selected by a multi-select automation", () => {
    const multi = { ...baseRow, id: "multi", media_id: JSON.stringify(["media-1", "media-2", "media-3"]) };
    expect(findMatchingAutomation([multi], "media-1", "לינק")?.automation.id).toBe("multi");
    expect(findMatchingAutomation([multi], "media-3", "לינק")?.automation.id).toBe("multi");
    expect(findMatchingAutomation([multi], "media-4", "לינק")).toBeNull();
  });

  it("matches a story reply only against story automations", () => {
    const story = { ...baseRow, id: "story", trigger_source: "story_reply" as const };
    expect(findMatchingAutomation([baseRow, story], "story-1", "לינק", "story_reply")?.automation.id).toBe("story");
    expect(findMatchingAutomation([story], "story-1", "לינק", "comment")).toBeNull();
  });

  it("renders approved placeholders", () => {
    expect(renderMessage("היי {{username}} - {{keyword}} - {{url}}", {
      username: "tester",
      keyword: "לינק",
      url: "https://example.com",
    })).toBe("היי tester - לינק - https://example.com");
  });
});
describe("follow gate", () => {
  it("delivers immediately to a follower", () => {
    expect(decideDelivery({ followGate: true, followCheckFailOpen: true }, true).deliverLink).toBe(true);
  });

  it("holds the link for a confirmed non-follower", () => {
    expect(decideDelivery({ followGate: true, followCheckFailOpen: true }, false).deliverLink).toBe(false);
  });

  it("fails open when Meta cannot answer", () => {
    expect(decideDelivery({ followGate: true, followCheckFailOpen: true }, null).reason).toBe("unknown_fail_open");
  });
});

describe("Instagram webhook parsing", () => {
  it("extracts a comment and ignores self-comments", () => {
    const payload = {
      object: "instagram",
      entry: [{
        changes: [
          { field: "comments", value: { id: "c-1", text: "לינק", from: { id: "person-1", username: "tester" }, media: { id: "m-1" } } },
          { field: "comments", value: { id: "c-2", text: "לינק", from: { id: "business" }, media: { id: "m-1" } } },
        ],
      }],
    };
    expect(extractWebhookEvents(payload, "business")).toEqual([{
      kind: "comment",
      commentId: "c-1",
      mediaId: "m-1",
      userId: "person-1",
      username: "tester",
      text: "לינק",
    }]);
  });

  it("extracts the follow-check quick reply", () => {
    const payload = {
      object: "instagram",
      entry: [{ messaging: [{ sender: { id: "person-1" }, message: { quick_reply: { payload: "DME_FOLLOW_CHECK" } } }] }],
    };
    expect(extractWebhookEvents(payload, "business")).toEqual([{ kind: "follow_check", userId: "person-1" }]);
  });

  it("extracts a reply to an active story or highlight as a story trigger", () => {
    const payload = {
      object: "instagram",
      entry: [{
        messaging: [{
          sender: { id: "person-1", username: "tester" },
          message: {
            mid: "message-1",
            text: "לינק",
            reply_to: { story: { id: "story-1", url: "https://instagram.com/stories/example/1" } },
          },
        }],
      }],
    };
    expect(extractWebhookEvents(payload, "business")).toEqual([{
      kind: "story_reply",
      messageId: "message-1",
      storyId: "story-1",
      storyUrl: "https://instagram.com/stories/example/1",
      userId: "person-1",
      username: "tester",
      text: "לינק",
    }]);
  });
});
