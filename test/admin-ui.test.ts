import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("admin interface", () => {
  it("serves the Hebrew automation builder with hardened headers", async () => {
    const response = await SELF.fetch("https://worker.test/admin");
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(html).toContain("על איזה פוסט?");
    expect(html).toContain('data-view="automation"');
    expect(html).toContain('data-view="post"');
    expect(html).toContain('data-view="scheduled"');
    expect(html).toContain('id="railCards"');
    expect(html).toContain('id="withAutomation"');
    expect(html).toContain('id="summaryList"');
    expect(html).toContain('id="savePaused"');
    expect(html).toContain('class="brand-name">D-ME');
    expect(html).toContain('name="contentFilter"');
    expect(html).toContain('value="story"');
    expect(html).toContain('value="reel"');
    expect(html).not.toContain('value="highlight"');
    expect(html).not.toContain("הפוסט הבא");
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
    expect(stylesBody).toContain("/fonts/Rubik-hebrew.woff2");
    expect(stylesBody).toContain("--cobalt:#2343d6");
    expect(stylesBody).toContain("@media(min-width:641px) and (max-width:1050px){:root{--design-px:0.090909091vw}}");
    expect(stylesBody).not.toMatch(/Talent|Plinko|Georgia|Heebo/);
    const declarationsOnly = stylesBody.replace(/@media\s*\([^{}]+\)/g, "@media");
    expect(declarationsOnly).not.toMatch(/font-size\s*:[^;}]*\dpx\b/);
    expect(declarationsOnly).not.toMatch(/(?:width|height|padding|margin|gap|top|right|bottom|left)\s*:[^;}]*\dpx\b/);
    expect(scriptBody).toContain("sessionStorage");
    expect(scriptBody).toContain("function renderRailSummary()");
    expect(scriptBody).toContain("aria-label','עריכת האוטומציה");
    expect(scriptBody).toContain("מחיקת האוטומציה");
    expect(scriptBody).toContain("__stories__");
    expect(scriptBody).toContain("/api/media/upload");
    expect(scriptBody).toContain("/api/posts");
    expect(scriptBody).toContain("data-create-post");
    expect(scriptBody).not.toContain("NEXT_MEDIA_ID");
  });

  it("serves the action icons used by the rules list", async () => {
    for (const name of ["action-edit", "action-delete"]) {
      const response = await SELF.fetch(`https://worker.test/icons/${name}.svg`);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("image/svg+xml");
    }
  });

  it("serves the bundled Rubik font", async () => {
    const response = await SELF.fetch("https://worker.test/fonts/Rubik-hebrew.woff2");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("font/woff2");
  });

  it("protects post creation and uploads with the admin token", async () => {
    for (const path of ["/api/posts", "/api/media/upload"]) {
      const response = await SELF.fetch(`https://worker.test${path}`, { method: "POST" });
      expect(response.status).toBe(401);
    }
  });

  it("protects Instagram media discovery with the admin token", async () => {
    const response = await SELF.fetch("https://worker.test/api/instagram/media");
    expect(response.status).toBe(401);
  });
});
