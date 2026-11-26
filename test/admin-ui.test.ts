import { env, SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

async function ensureAutomationTables() {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS automations (
      id TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL,
      media_id TEXT NOT NULL,
      keywords_json TEXT NOT NULL,
      match_mode TEXT NOT NULL,
      target_url TEXT NOT NULL,
      message_template TEXT NOT NULL,
      reply_options_json TEXT NOT NULL DEFAULT '[]',
      comment_reply_options_json TEXT NOT NULL DEFAULT '[]',
      follow_gate INTEGER NOT NULL,
      follow_prompt TEXT NOT NULL,
      follow_button TEXT NOT NULL,
      follow_check_fail_open INTEGER NOT NULL,
      media_selection_mode TEXT NOT NULL DEFAULT 'selected',
      trigger_source TEXT NOT NULL DEFAULT 'comment',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS processed_comments (
      comment_id TEXT PRIMARY KEY,
      automation_id TEXT NOT NULL,
      status TEXT NOT NULL,
      profile_follow_status INTEGER
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS story_sources (
      story_id TEXT PRIMARY KEY,
      story_url TEXT,
      first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
  ]);
}

describe("admin interface", () => {
  it("serves the Hebrew automation builder with hardened headers", async () => {
    const response = await SELF.fetch("https://worker.test/admin");
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(html).toContain("אילו אייטמים עובדים");
    expect(html).toContain('id="appDrawer"');
    expect(html).toContain('id="drawerClose"');
    expect(html).toContain('class="rail-metrics"');
    expect(html).toContain('id="railCards"');
    expect(html).toContain('class="brand-name">D-ME');
    expect(html).toContain('<span class="step">04</span>');
    expect(html).toContain('<span class="step">05</span>');
    expect(html).not.toContain("הפוסט הבא");
    expect(html).not.toContain('__next__');
    expect(html).toContain('name="contentFilter"');
    expect(html).toMatch(/panel-heading[\s\S]*contentTitle[\s\S]*content-filter[\s\S]*refreshMedia/);
    expect(html).toContain('value="story"');
    expect(html).toContain('value="reel"');
    expect(html).not.toContain('value="highlight"');
    expect(html).not.toContain('class="dashboard-strip"');
    expect(html).toContain("/admin/app.js");
  });

  it("serves same-origin style and script assets", async () => {
    const [styles, script] = await Promise.all([
      SELF.fetch("https://worker.test/admin/styles.css"),
      SELF.fetch("https://worker.test/admin/app.js"),
    ]);

    expect(styles.headers.get("content-type")).toContain("text/css");
    expect(script.headers.get("content-type")).toContain("text/javascript");
    const stylesBody = await styles.text();
    const scriptBody = await script.text();
    expect(stylesBody).toContain("--design-px:0.052083333vw");
    expect(stylesBody).toContain("@media(max-width:640px){:root{--design-px:0.256410256vw}}");
    expect(stylesBody).toContain("/fonts/Heebo-hebrew.woff2");
    expect(stylesBody).toContain("--bg:#fff");
    expect(stylesBody).toContain("--accent:#ff6f00");
    expect(stylesBody).toContain("@media(min-width:1651px)");
    expect(stylesBody).toContain("@media(min-width:1051px) and (max-width:1650px)");
    expect(stylesBody).not.toMatch(/Talent|Plinko|Georgia/);
    const declarationsOnly = stylesBody.replace(/@media\s*\([^{}]+\)/g, "@media");
    expect(declarationsOnly).not.toMatch(/font-size\s*:[^;}]*\dpx\b/);
    expect(declarationsOnly).not.toMatch(/(?:width|height|padding|margin|gap|top|right|bottom|left)\s*:[^;}]*\dpx\b/);
    expect(scriptBody).toContain("sessionStorage");
    expect(scriptBody).toContain("openDrawer");
    expect(scriptBody).toContain("Escape");
    expect(scriptBody).toContain("state.automations.slice(0,4)");
    expect(scriptBody).toContain("rule.commentCount");
    expect(scriptBody).toContain("function renderRailSummary()");
    expect(scriptBody).toContain("actionIcon('edit')");
    expect(scriptBody).toContain("actionIcon('delete')");
    expect(scriptBody).toContain("aria-label','עריכת האוטומציה");
    expect(scriptBody).toContain("aria-label','מחיקת האוטומציה");
    expect(scriptBody).toContain("mediaMode:state.mediaMode");
    expect(scriptBody).not.toContain("NEXT_MEDIA_ID");
    expect(scriptBody).toContain("__stories__");
    expect(scriptBody).toContain("item.source==='highlight'");
    expect(scriptBody).toContain("triggerSource:state.triggerSource");
    expect(scriptBody).toContain("function designVw(value)");
    expect(scriptBody).not.toContain("area.style.height='30px'");
  });

  it("serves the action icons used by the rules list", async () => {
    for (const name of ["action-edit", "action-delete"]) {
      const response = await SELF.fetch(`https://worker.test/icons/${name}.svg`);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("image/svg+xml");
    }
  });

  it("protects Instagram media discovery with the admin token", async () => {
    const response = await SELF.fetch("https://worker.test/api/instagram/media");
    expect(response.status).toBe(401);
  });

  it("persists a Story and Highlight reply automation as a separate trigger source", async () => {
    await ensureAutomationTables();
    const headers = { Authorization: `Bearer ${env.ADMIN_TOKEN}`, "Content-Type": "application/json" };
    const response = await SELF.fetch("https://worker.test/api/automations", {
      method: "POST",
      headers,
      body: JSON.stringify({
        id: "story-reply-test",
        enabled: true,
        mediaId: "*",
        mediaIds: ["*"],
        mediaMode: "stories",
        triggerSource: "story_reply",
        keywords: ["לינק"],
        matchMode: "exact",
        targetUrl: "https://example.com/story-guide",
        messageTemplate: "הנה הלינק {{url}}",
        commentReplyOptions: [],
        followGate: false,
        followPrompt: "עקוב ואז בדוק",
        followButton: "עקבתי",
        followCheckFailOpen: true,
      }),
    });
    expect(response.status, await response.clone().text()).toBe(201);

    const listing = await SELF.fetch("https://worker.test/api/automations", { headers });
    const payload = await listing.json<{ automations: Array<Record<string, unknown>> }>();
    expect(payload.automations).toContainEqual(expect.objectContaining({
      id: "story-reply-test",
      mediaMode: "stories",
      triggerSource: "story_reply",
      mediaId: "*",
      commentReplyOptions: [],
    }));
  });
});
