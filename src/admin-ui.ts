const SECURITY_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' https: data: blob:; media-src 'self' https: blob:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

const ICONS = {
  bolt: '<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  plug: '<path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0zM12 18v4"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  send: '<path d="M21 3L3 9.5l7.5 3L13 21z"/><path d="M21 3l-10.5 9.5"/>',
};

function icon(name: keyof typeof ICONS): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

function step(id: string, flow: string, title: string, body: string, extraHead = ""): string {
  return `<section class="panel" id="${id}" data-flow="${flow}" aria-labelledby="${id}Title">
            <div class="panel-heading">
              <span class="step"></span>
              <div class="panel-titles"><h2 id="${id}Title">${title}</h2><p class="panel-summary" data-summary></p></div>
              ${extraHead}
              <span class="panel-chevron">${icon("chevron")}</span>
            </div>
            <div class="panel-body">
${body}
              <button class="panel-next" type="button">המשך <i>←</i></button>
            </div>
          </section>`;
}

const HTML = `<!doctype html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>D-ME - Instagram Automation Studio</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%2032%2032%27%3E%3Crect%20x%3D%272%27%20y%3D%272%27%20width%3D%2728%27%20height%3D%2728%27%20rx%3D%278%27%20fill%3D%27%23ffd84a%27%20stroke%3D%27%23111%27%20stroke-width%3D%273%27/%3E%3Cpath%20d%3D%27M24%208L7%2013.5l7%203L16.5%2024z%20M24%208l-10%208.5%27%20fill%3D%27none%27%20stroke%3D%27%23111%27%20stroke-width%3D%272.6%27%20stroke-linejoin%3D%27round%27%20stroke-linecap%3D%27round%27/%3E%3C/svg%3E">
  <link rel="stylesheet" href="/admin/styles.css">
</head>
<body>
  <aside class="side" aria-label="תפריט">
    <a class="brand" href="/admin" aria-label="D-ME"><span class="logo"><span class="logo-mark">${icon("send")}</span><span class="brand-name">D-ME</span></span><small>Instagram Automation Studio</small></a>
    <nav class="nav" aria-label="ניווט">
      <button class="nav-tab active" data-view="automation" type="button">${icon("bolt")}<span>יצירת אוטומציה</span></button>
      <button class="nav-tab" data-view="post" type="button">${icon("image")}<span>יצירת פוסט</span></button>
      <button class="nav-tab" data-view="library" type="button">${icon("list")}<span>האוטומציות שלי</span><b class="count" id="navRuleCount">0</b></button>
      <button class="nav-tab" data-view="scheduled" type="button">${icon("calendar")}<span>פרסומים מתוזמנים</span><b class="count" id="navScheduledCount">0</b></button>
      <button class="nav-tab" data-view="analytics" type="button">${icon("chart")}<span>אנליטיקות</span></button>
      <button class="nav-tab" data-view="connections" type="button">${icon("plug")}<span>חיבורים ושימוש</span></button>
    </nav>
    <section class="rail-summary" aria-labelledby="railSummaryTitle">
      <h3 id="railSummaryTitle">רצות עכשיו</h3>
      <div class="rail-cards" id="railCards"><p class="rail-empty">אחרי החיבור יופיעו כאן האוטומציות הפעילות.</p></div>
    </section>
    <div class="account" id="accountBox">
      <div class="me" id="meChip" hidden><span class="avatar" id="meAvatar"></span><b id="meName"></b></div>
      <div class="connection" id="connectionBox">
        <label for="adminToken">מפתח ניהול</label>
        <input id="adminToken" type="password" autocomplete="current-password" placeholder="הדבקת הסיסמה">
        <button class="btn" id="connectButton" type="button"><span class="status-dot"></span><span class="connection-label">חיבור</span></button>
      </div>
    </div>
  </aside>

  <main>
    <form id="automationForm" novalidate>
      <input id="automationId" type="hidden">
      <div class="workspace" id="workspace">
        <div class="builder">
          ${step("contentPanel", "automation", "על איזה פוסט?", `
              <div class="toolbar">
                <fieldset class="seg" aria-label="סוג התוכן">
                  <label><input type="radio" name="contentFilter" value="feed" checked><span>פוסט</span></label>
                  <label><input type="radio" name="contentFilter" value="reel"><span>ריל</span></label>
                  <label><input type="radio" name="contentFilter" value="story"><span>סטורי</span></label>
                </fieldset>
                <button class="text-button" id="refreshMedia" type="button">רענון</button>
              </div>
              <div class="media-grid" id="mediaGrid"></div>`)}
          ${step("uploadPanel", "post", "התוכן", `
              <p class="hint">תמונה, סרטון או קרוסלה של עד 10. אפשר לגרור כדי לשנות סדר.</p>
              <div class="tiles" id="uploadTiles"></div>
              <input id="fileInput" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" multiple hidden>`)}
          ${step("captionPanel", "post", "תיאור", `
              <label class="field"><span>הכיתוב של הפוסט <small id="captionCount">0 / 2,200</small></span>
                <textarea id="caption" maxlength="2200" rows="5" placeholder="מה כותבים מתחת לפוסט?"></textarea></label>`)}
          ${step("coverPanel", "post", "תמונת שער", `
              <p class="hint" id="coverHint">תמונת שער רלוונטית לסרטון בודד או לריל. אחרי הפרסום אי אפשר לשנות אותה.</p>
              <div class="cover" id="coverBox" hidden>
                <video id="coverVideo" muted playsinline preload="metadata"></video>
                <label class="field"><span>בחירת פריים <small id="coverTime">0.0 שניות</small></span><input id="coverRange" type="range" min="0" max="0" step="100" value="0"></label>
                <label class="btn ghost file-btn">או העלאת תמונה<input id="coverFile" type="file" accept="image/jpeg,image/png" hidden></label>
                <p class="hint" id="coverFileName"></p>
              </div>`)}
          <label class="toggle-row" data-flow="post" id="automationToggleRow">
            <span><b>להוסיף אוטומציה לפוסט הזה</b><small>מי שמגיב במילה מקבל הודעה עם לינק, מהשנייה שהפוסט עולה</small></span>
            <input id="withAutomation" type="checkbox"><span class="switch" aria-hidden="true"></span>
          </label>
          ${step("triggerPanel", "rule", "מה המגיב צריך לכתוב?", `
              <div class="field-grid">
                <label class="field"><span>מילות תגובה <small>אפשר כמה, מופרדות בפסיק</small></span>
                  <input id="keywords" maxlength="500" placeholder="לינק, פרטים, שלח לי"></label>
                <fieldset class="field"><legend>אופן ההתאמה</legend>
                  <div class="seg"><label><input type="radio" name="matchMode" value="exact" checked><span>מילה מדויקת</span></label><label><input type="radio" name="matchMode" value="contains"><span>מכילה</span></label></div>
                </fieldset>
              </div>`)}
          ${step("publicPanel", "rule", "תגובה פומבית", `
              <label class="field"><span>תגובה מתחת לפוסט <small>עד 3 נוסחים, נבחר אחד בכל פעם</small></span>
                <textarea class="comment-reply-option" id="commentReply" maxlength="500" rows="2">תודה על התגובה, {{username}} - שולח לך את הפרטים בפרטי</textarea>
                <textarea class="comment-reply-option" maxlength="500" rows="2">ראיתי, {{username}}. הפרטים בדרך אליך.</textarea>
                <textarea class="comment-reply-option" maxlength="500" rows="2"></textarea>
              </label>
              <p class="hint">משתנים: {{username}} שם המגיב. אפשר להשאיר ריק.</p>`)}
          ${step("gatePanel", "rule", "שליחה רק לעוקבים?", `
              <label class="switch-row"><input id="followGate" type="checkbox" checked><span class="switch" aria-hidden="true"></span>
                <span><b>שליחה רק לעוקבים</b><small>מי שלא עוקב מקבל בקשה לעקוב וכפתור, והלינק נשלח אחרי הלחיצה.</small></span></label>
              <div class="field-grid" id="gateFields">
                <label class="field"><span>הודעה למי שלא עוקב</span><textarea id="followPrompt" maxlength="640" rows="3">כמעט שם. עוקבים אחרי החשבון ולוחצים על הכפתור כדי לקבל את הלינק.</textarea></label>
                <label class="field"><span>טקסט הכפתור</span><input id="followButton" maxlength="20" value="עקבתי"></label>
              </div>`)}
          ${step("privatePanel", "rule", "ההודעה הפרטית והלינק", `
              <div class="field-grid">
                <label class="field"><span>הודעה פרטית</span><textarea id="messageTemplate" maxlength="1000" rows="4">היי {{username}}, הנה הלינק שביקשת</textarea></label>
                <label class="field"><span>לינק <small>נשלח ככפתור בהודעה</small></span><input id="targetUrl" type="url" placeholder="https://..." dir="ltr"></label>
              </div>`)}
          <section class="hero" aria-labelledby="heroTitle">
            <h3 id="heroTitle">סיכום לפני שמירה</h3>
            <div class="kpis" id="heroKpis" hidden>
              <div><b id="kpiComments">0</b><span>הגיבו</span></div><div><b id="kpiSent">0</b><span>נשלחו</span></div>
              <div><b id="kpiFollowers">0</b><span>עוקבים חדשים</span></div><div><b id="kpiFailed">0</b><span>נכשלו</span></div>
            </div>
            <dl class="sum" id="summaryList"></dl>
            <div class="publish" id="publishBox" hidden>
              <div class="seg two"><label><input type="radio" name="publishWhen" value="now"><span>פרסום עכשיו</span></label><label><input type="radio" name="publishWhen" value="schedule" checked><span>פרסום מתוזמן</span></label></div>
              <div class="when" id="whenFields"><label><span>תאריך</span><input id="publishDate" type="date"></label><label><span>שעה (ישראל)</span><input id="publishTime" type="time" value="10:00"></label></div>
            </div>
            <div class="actions" id="ruleActions">
              <button class="btn blue" id="saveActive" type="submit" data-enable="true">שמירה והפעלה</button>
              <button class="btn" id="savePaused" type="submit" data-enable="false">שמירה כמושהית</button>
            </div>
            <button class="btn blue wide" id="publishButton" type="submit" hidden>תזמון הפוסט ←</button>
            <button class="text-button" id="resetButton" type="button" hidden>ביטול העריכה</button>
          </section>
        </div>

        <aside class="side-col">


          <section class="phone phone-post" aria-label="תצוגה מקדימה של הפוסט">
            <div class="phone-head"><span class="avatar" id="previewAvatar"></span><b id="previewUsername">your_account</b></div>
            <div class="phone-media" id="previewMedia"></div>
            <p class="phone-caption" id="previewCaption"></p>
            <div class="phone-comments" id="previewComments"></div>
          </section>
          <section class="phone phone-dm" id="previewDm" aria-label="תצוגה מקדימה של ההודעה הפרטית">
            <p class="phone-label">הודעה פרטית</p>
            <div id="previewGate"><div class="bubble out" id="previewFollowPrompt"></div><span class="dm-button" id="previewFollowButton">עקבתי</span><div class="bubble in" id="previewFollowClick">עקבתי</div></div>
            <div class="bubble out" id="previewMessage"></div>
            <span class="dm-button link" id="previewLink">לינק</span>
          </section>
        </aside>
      </div>
    </form>

    <section class="view" id="libraryView" hidden aria-label="האוטומציות שלי"><div class="rules-list" id="rulesListAll"></div></section>
    <section class="view" id="scheduledView" hidden aria-label="פרסומים מתוזמנים"><div class="sched" id="scheduledList"></div></section>
    <section class="view" id="analyticsView" hidden aria-label="אנליטיקות">
      <div class="tiles-grid"><div class="stat"><span>תגובות שנקלטו</span><b id="analyticsComments">0</b></div><div class="stat"><span>הודעות שנשלחו</span><b id="analyticsMessages">0</b></div><div class="stat"><span>עברו את שער העוקבים</span><b id="analyticsFollowers">0</b></div><div class="stat"><span>אחוז המרה</span><b id="analyticsConversion">0%</b></div></div>
    </section>
    <section class="view" id="connectionsView" hidden aria-label="חיבורים ושימוש">
      <div class="tiles-grid" id="providerList"></div>
      <div class="tiles-grid" id="usageList"><p class="rail-empty">נטען אחרי החיבור.</p></div>
    </section>
  </main>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <script src="/admin/app.js" defer></script>
</body>
</html>`;

const DASHBOARD_CSS = `
@font-face{font-family:"Rubik";src:url("/fonts/Rubik-hebrew.woff2") format("woff2");font-weight:300 900;font-display:swap;unicode-range:U+0307-0308,U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F}
@font-face{font-family:"Rubik";src:url("/fonts/Rubik-latin.woff2") format("woff2");font-weight:300 900;font-display:swap;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
:root{color-scheme:light;--frame:#f6efe1;--side:#cfdaff;--surface:#fffaf0;--surface-2:#f1e8d6;--ink:#111;--text-2:#5d574c;--cobalt:#2343d6;--cobalt-soft:#dbe3ff;--tomato:#ff5b3a;--tomato-soft:#ffd2c6;--lemon:#ffd84a;--ok:#1f9d63;--ok-soft:#cdeedd;--bw:2px;--shadow:6px 6px 0 var(--ink);--shadow-sm:3px 3px 0 var(--ink);--pad:26px;--r-inner:12px;--r-card:calc(var(--r-inner) + var(--pad));--r-sm:10px;--gap:24px;--side-w:320px;--fs-xs:16px;--fs-sm:19px;--fs-md:21px;--fs-lg:25px;--fs-h2:30px;--fs-kpi:40px}
*,*::before,*::after{box-sizing:border-box;font-family:"Rubik",system-ui,"Arial Hebrew",Arial,sans-serif}
html,body{margin:0;min-height:100%;background:var(--frame);color:var(--ink)}
body{font-size:var(--fs-md);line-height:1.5;overflow-x:hidden}
button,input,textarea{font:inherit;color:inherit}
button{cursor:pointer;background:none;border:0;padding:0}
[hidden]{display:none!important}
:focus-visible{outline:3px solid var(--cobalt);outline-offset:2px}
fieldset{margin:0;padding:0;border:0;min-width:0}
legend{padding:0}
svg{display:block;width:22px;height:22px;flex:none}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:10px 20px;border:var(--bw) solid var(--ink);border-radius:var(--r-sm);box-shadow:var(--shadow-sm);background:var(--surface);font-weight:500;font-size:var(--fs-sm);transition:transform .12s,box-shadow .12s}
.btn:active{transform:translate(3px,3px);box-shadow:none}
.btn.blue{background:var(--cobalt);color:#fff}
.btn.ghost{box-shadow:none}
.btn.wide{width:100%;min-height:56px;font-size:var(--fs-md)}
.btn:disabled{opacity:.55;cursor:wait}
.text-button{color:var(--cobalt);font-weight:500;font-size:var(--fs-sm);text-decoration:underline;text-underline-offset:3px}
.hint{margin:0;color:var(--text-2);font-size:var(--fs-sm)}

.side{position:fixed;inset:24px 24px 24px auto;z-index:20;width:var(--side-w);display:flex;flex-direction:column;gap:20px;padding:24px 20px;background:var(--side);border:var(--bw) solid var(--ink);border-radius:var(--r-card);box-shadow:var(--shadow);overflow:hidden}
.brand{display:flex;flex-direction:column;color:var(--ink);text-decoration:none}
.logo{direction:ltr;align-self:flex-start;display:inline-flex;align-items:center;gap:12px;padding:8px 22px 8px 8px;background:var(--surface);border:3px solid var(--ink);border-radius:22px;box-shadow:6px 6px 0 var(--tomato),6px 6px 0 3px var(--ink)}
.logo-mark{display:grid;place-items:center;width:52px;height:52px;background:#fbc52b;border:3px solid var(--ink);border-radius:14px}
.logo-mark svg{width:30px;height:30px;stroke-width:2.6}
.brand-name{font-size:40px;font-weight:900;font-style:italic;letter-spacing:-.01em;line-height:1}
.brand small{margin-top:14px;color:var(--text-2);font-size:var(--fs-xs);font-weight:500}
.nav{display:grid;gap:6px}
.nav-tab{display:flex;align-items:center;gap:10px;width:100%;min-height:48px;padding:10px 12px;border:var(--bw) solid transparent;border-radius:var(--r-sm);font-weight:500;font-size:var(--fs-sm);text-align:right}
.nav-tab:hover{background:var(--surface)}
.nav-tab.active{background:var(--cobalt);color:#fff;border-color:var(--ink);box-shadow:var(--shadow-sm)}
.count{margin-inline-start:auto;min-width:28px;height:28px;display:grid;place-items:center;padding:0 6px;border-radius:99px;background:var(--lemon);border:var(--bw) solid var(--ink);color:var(--ink);font-size:var(--fs-xs)}
.rail-summary{display:flex;flex-direction:column;flex:1;min-height:0}
.rail-summary h3{margin:0 0 10px;color:var(--text-2);font-size:var(--fs-xs);font-weight:500}
.rail-cards{display:grid;gap:10px;align-content:start;overflow-y:auto;padding:2px 2px 8px 6px}
.rail-empty{margin:0;padding:14px;border:var(--bw) dashed var(--ink);border-radius:var(--r-inner);color:var(--text-2);font-size:var(--fs-xs);text-align:center}
.rail-card{display:grid;grid-template-columns:60px minmax(0,1fr);gap:10px;align-items:center;width:100%;padding:8px;background:var(--surface);border:var(--bw) solid var(--ink);border-radius:var(--r-inner);box-shadow:var(--shadow-sm);text-align:right}
.rail-thumb{display:grid;place-items:center;width:60px;height:60px;overflow:hidden;border:var(--bw) solid var(--ink);border-radius:8px;background:var(--surface-2);font-size:var(--fs-lg)}
.rail-thumb img{width:100%;height:100%;object-fit:cover}
.rail-card strong,.rail-card small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rail-card strong{font-size:var(--fs-sm)}
.rail-card small{color:var(--text-2);font-size:var(--fs-xs)}
.account{display:grid;gap:12px;padding-top:16px;border-top:var(--bw) solid var(--ink)}
.me{display:flex;align-items:center;gap:10px;font-weight:500;font-size:var(--fs-sm);min-width:0}
.me b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}
.avatar{flex:none;display:grid;place-items:center;width:40px;height:40px;overflow:hidden;border:var(--bw) solid var(--ink);border-radius:50%;background:var(--lemon);font-weight:700}
.avatar img{width:100%;height:100%;object-fit:cover}
.connection{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}
.connection label{grid-column:1/-1;color:var(--text-2);font-size:var(--fs-xs)}
.connection input{min-width:0;min-height:48px;padding:8px 12px;border:var(--bw) solid var(--ink);border-radius:var(--r-sm);background:var(--surface)}
.status-dot{width:10px;height:10px;border-radius:50%;background:var(--tomato);border:2px solid var(--ink)}
.connection.connected .status-dot{background:var(--ok)}
.connection.connected input{display:none}
.connection.connected{grid-template-columns:1fr}

main{margin-right:calc(var(--side-w) + 48px);padding:24px 24px 48px 24px}
.workspace{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,440px);gap:var(--gap);align-items:start}
.builder{display:grid;gap:18px;min-width:0}
.panel{min-width:0;padding:22px var(--pad);background:var(--surface);border:var(--bw) solid var(--ink);border-radius:var(--r-card);box-shadow:var(--shadow)}
.panel-heading{display:flex;align-items:center;gap:16px;cursor:pointer}
.step{flex:none;display:grid;place-items:center;width:48px;height:48px;border:var(--bw) solid var(--ink);border-radius:var(--r-sm);background:var(--cobalt-soft);font-weight:700;font-size:var(--fs-md)}
.panel.open .step{background:var(--cobalt);color:#fff}
.panel.done:not(.open) .step{background:var(--ok-soft)}
.panel-titles{min-width:0;flex:1}
.panel-titles h2{margin:0;font-size:var(--fs-h2);font-weight:700;line-height:1.2}
.panel-summary{margin:4px 0 0;color:var(--text-2);font-size:var(--fs-sm);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.panel.open .panel-summary{display:none}
.panel-chevron{flex:none;display:grid;place-items:center;width:40px;height:40px;border:var(--bw) solid var(--ink);border-radius:var(--r-sm);background:var(--surface-2);transition:transform .2s}
.panel.open .panel-chevron{transform:rotate(180deg)}
.panel-body{display:grid;gap:18px;margin-top:22px}
.panel:not(.open) .panel-body{display:none}
.panel-next{justify-self:end;display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:10px 22px;border:var(--bw) solid var(--ink);border-radius:var(--r-sm);box-shadow:var(--shadow-sm);background:var(--cobalt);color:#fff;font-weight:500;font-size:var(--fs-sm)}
.panel-next i{font-style:normal}
.toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.seg{display:inline-flex;border:var(--bw) solid var(--ink);border-radius:var(--r-sm);overflow:hidden;background:var(--surface)}
.seg label{position:relative}
.seg input{position:absolute;opacity:0;pointer-events:none}
.seg span{display:block;padding:10px 18px;font-weight:500;font-size:var(--fs-sm);cursor:pointer}
.seg label+label span{border-inline-start:var(--bw) solid var(--ink)}
.seg input:checked+span{background:var(--lemon)}
.seg input:focus-visible+span{outline:3px solid var(--cobalt);outline-offset:-4px}
.seg.two{display:grid;grid-template-columns:1fr 1fr}
.seg.two span{text-align:center}
.seg.two input:checked+span{background:var(--ink);color:#fff}

.media-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:18px}
.media-card{position:relative;display:flex;flex-direction:column;min-width:0;background:var(--surface);border:var(--bw) solid var(--ink);border-radius:var(--r-inner);overflow:hidden;cursor:pointer;transition:transform .15s,box-shadow .15s}
.media-card:hover{transform:translate(-2px,-2px);box-shadow:var(--shadow-sm)}
.media-card.selected{outline:4px solid var(--cobalt);outline-offset:2px;box-shadow:var(--shadow)}
.media-card input{position:absolute;opacity:0;pointer-events:none}
.media-thumb{position:relative;aspect-ratio:1;background:var(--surface-2);border-bottom:var(--bw) solid var(--ink)}
.media-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.media-badge{position:absolute;top:10px;right:10px;padding:2px 10px;border:var(--bw) solid var(--ink);border-radius:99px;background:var(--surface);font-size:var(--fs-xs);font-weight:500}
.selection-check{position:absolute;top:10px;left:10px;width:32px;height:32px;display:grid;place-items:center;border:var(--bw) solid var(--ink);border-radius:8px;background:var(--surface);font-weight:700}
.media-card.selected .selection-check{background:var(--cobalt);color:#fff}
.media-caption{margin:12px 14px 14px;font-size:var(--fs-sm);line-height:1.45;max-height:4.35em;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical}
.media-card.create{justify-content:center;align-items:center;gap:10px;min-height:260px;padding:20px;border-style:dashed;background:var(--cobalt-soft);text-align:center}
.media-card.create .plus{display:grid;place-items:center;width:56px;height:56px;border:var(--bw) solid var(--ink);border-radius:var(--r-inner);background:var(--lemon)}
.media-card.create strong{font-size:var(--fs-lg)}
.media-card.create small{color:var(--text-2);font-size:var(--fs-xs)}
.empty-media{grid-column:1/-1;padding:28px;border:var(--bw) dashed var(--ink);border-radius:var(--r-inner);color:var(--text-2);text-align:center}

.tiles{display:flex;flex-wrap:wrap;gap:16px}
.tile{position:relative;width:170px;aspect-ratio:4/5;border:var(--bw) solid var(--ink);border-radius:var(--r-inner);overflow:hidden;background:var(--surface-2);box-shadow:var(--shadow-sm);cursor:grab}
.tile.dragging{opacity:.45}
.tile img,.tile video{width:100%;height:100%;object-fit:cover;display:block}
.tile-n{position:absolute;top:8px;right:8px;width:30px;height:30px;display:grid;place-items:center;border:var(--bw) solid var(--ink);border-radius:99px;background:var(--lemon);font-weight:700;font-size:var(--fs-xs)}
.tile-x{position:absolute;top:8px;left:8px;width:30px;height:30px;display:grid;place-items:center;border:var(--bw) solid var(--ink);border-radius:8px;background:var(--surface);font-weight:700}
.tile-move{position:absolute;bottom:8px;inset-inline:8px;display:flex;justify-content:space-between}
.tile-move button{width:32px;height:32px;border:var(--bw) solid var(--ink);border-radius:8px;background:var(--surface);font-weight:700}
.tile-state{position:absolute;inset:auto 0 48px;padding:4px;background:var(--ink);color:#fff;font-size:var(--fs-xs);text-align:center}
.tile.add{display:grid;place-items:center;align-content:center;gap:8px;border-style:dashed;box-shadow:none;background:var(--cobalt-soft);font-weight:500;font-size:var(--fs-sm);text-align:center;cursor:pointer}
.tile.add b{font-size:40px;line-height:1}
.cover{display:grid;gap:14px}
.cover video{width:220px;aspect-ratio:9/16;object-fit:cover;border:var(--bw) solid var(--ink);border-radius:var(--r-inner);background:var(--ink)}
.file-btn{justify-self:start;cursor:pointer}
input[type=range]{width:100%;accent-color:var(--cobalt)}

.toggle-row{display:flex;align-items:center;gap:16px;padding:20px var(--pad);background:var(--lemon);border:var(--bw) solid var(--ink);border-radius:var(--r-card);box-shadow:var(--shadow);cursor:pointer}
.toggle-row b{display:block;font-size:var(--fs-lg)}
.toggle-row small{display:block;color:var(--text-2);font-size:var(--fs-sm)}
.toggle-row>span:first-child{flex:1}
.toggle-row input,.switch-row input{position:absolute;opacity:0;pointer-events:none}
.switch{position:relative;flex:none;width:64px;height:36px;border:var(--bw) solid var(--ink);border-radius:99px;background:var(--surface-2);transition:background .2s}
.switch::after{content:"";position:absolute;top:4px;right:4px;width:24px;height:24px;border:var(--bw) solid var(--ink);border-radius:50%;background:#fff;transition:right .2s}
input:checked+.switch{background:var(--cobalt)}
input:checked+.switch::after{right:30px}
input:focus-visible+.switch{outline:3px solid var(--cobalt);outline-offset:2px}
.switch-row{position:relative;display:flex;align-items:center;gap:14px;cursor:pointer}
.switch-row b{display:block}
.switch-row small{display:block;color:var(--text-2);font-size:var(--fs-sm)}
.field-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.field{display:grid;gap:8px;align-content:start;min-width:0}
.field>span,.field legend{font-size:var(--fs-sm);font-weight:500}
.field small{color:var(--text-2);font-weight:400}
.field input:not([type=range]),.field textarea{width:100%;min-height:52px;padding:12px 14px;border:var(--bw) solid var(--ink);border-radius:var(--r-inner);background:#fff;font-size:var(--fs-md)}
.field textarea{resize:vertical;line-height:1.5}
.field textarea+textarea{margin-top:4px}
#gateFields.disabled{opacity:.45;pointer-events:none}
.public-off{opacity:.5}

.side-col{position:sticky;top:2.5vh;height:95vh;display:flex;flex-direction:column;gap:16px;min-width:0}
.hero,.phone{min-width:0}
.hero{display:grid;gap:12px;padding:18px;background:var(--tomato);border:var(--bw) solid var(--ink);border-radius:var(--r-card);box-shadow:var(--shadow)}
.hero h3{margin:0;font-size:var(--fs-lg)}
.kpis{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.kpis div{padding:8px 12px;background:var(--surface);border:var(--bw) solid var(--ink);border-radius:var(--r-inner)}
.kpis b{display:block;font-size:var(--fs-kpi);font-variant-numeric:tabular-nums;line-height:1.1}
.kpis span{color:var(--text-2);font-size:var(--fs-xs)}
.sum{display:grid;margin:0;padding:2px 14px;background:var(--surface);border:var(--bw) solid var(--ink);border-radius:var(--r-inner)}
.sum-row{display:grid;grid-template-columns:80px minmax(0,1fr) auto;gap:10px;align-items:baseline;padding:8px 0}
.sum-row+.sum-row{border-top:1px solid var(--surface-2)}
.sum dt{color:var(--text-2);font-size:var(--fs-xs)}
.sum dd{margin:0;font-size:var(--fs-sm);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sum .missing dd{color:#b8321a}
.sum-edit{color:var(--cobalt);font-size:var(--fs-xs);font-weight:700;text-decoration:underline;text-underline-offset:3px}
.publish{display:grid;gap:12px}
.when{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.when label{display:grid;gap:6px;font-size:var(--fs-xs)}
.when input{min-height:48px;padding:8px 12px;border:var(--bw) solid var(--ink);border-radius:var(--r-sm);background:var(--surface)}
.actions{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.hero .text-button{justify-self:start;color:var(--ink)}

.phone{padding:14px;background:var(--surface);border:var(--bw) solid var(--ink);border-radius:var(--r-card);box-shadow:var(--shadow)}
.phone-head{flex:none;display:flex;align-items:center;gap:10px;font-size:var(--fs-xs)}
.phone-head .avatar{width:30px;height:30px}
.phone-post{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.phone-dm{flex:none}
.phone-media{flex:1 1 auto;min-height:80px;display:grid;place-items:center;margin:10px 0;overflow:hidden;border:var(--bw) solid var(--ink);border-radius:var(--r-inner);background:var(--surface-2);font-size:40px}
.phone-media img,.phone-media video{width:100%;height:100%;object-fit:cover}
.phone-caption{flex:none;margin:0 0 6px;font-size:var(--fs-xs);overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical}
.phone-comments{flex:none}
.phone-comment{margin:4px 0;font-size:var(--fs-xs)}
.phone-comment .reply{margin-inline-start:22px;color:var(--text-2)}
.phone-label{margin:0 0 6px;color:var(--text-2);font-size:var(--fs-xs);text-align:center}
.bubble{max-width:85%;width:max-content;margin:5px 0;padding:7px 12px;border:var(--bw) solid var(--ink);border-radius:14px;font-size:var(--fs-xs);line-height:1.4;overflow-wrap:anywhere}
.bubble.out{margin-inline-start:auto;background:var(--cobalt);color:#fff;border-end-end-radius:4px}
.bubble.in{background:var(--surface-2);border-end-start-radius:4px}
.dm-button{display:block;width:70%;margin:5px 0 5px auto;padding:5px;border:var(--bw) solid var(--ink);border-radius:10px;background:var(--lemon);font-weight:700;font-size:var(--fs-xs);text-align:center}
.dm-button.link{background:var(--surface)}

.view{display:grid;gap:18px}
.rules-list,.sched{display:grid;gap:16px}
.rule-row,.sched-row{display:grid;grid-template-columns:96px minmax(0,1fr) auto;gap:20px;align-items:center;padding:16px 20px;background:var(--surface);border:var(--bw) solid var(--ink);border-radius:var(--r-card);box-shadow:var(--shadow)}
.row-thumb{display:grid;place-items:center;width:96px;height:96px;overflow:hidden;border:var(--bw) solid var(--ink);border-radius:var(--r-inner);background:var(--surface-2);font-size:var(--fs-kpi)}
.row-thumb img,.row-thumb video{width:100%;height:100%;object-fit:cover}
.row-copy{min-width:0}
.row-copy h3{margin:0 0 6px;font-size:var(--fs-lg)}
.row-copy p{margin:0 0 10px;color:var(--text-2);font-size:var(--fs-sm);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.tags{display:flex;flex-wrap:wrap;gap:8px}
.pill{display:inline-block;padding:2px 10px;border:var(--bw) solid var(--ink);border-radius:99px;background:var(--surface-2);font-size:var(--fs-xs);font-weight:500}
.pill.ok{background:var(--ok-soft)}.pill.blue{background:var(--cobalt-soft)}.pill.lemon{background:var(--lemon)}.pill.red{background:var(--tomato-soft)}
.row-actions{display:grid;gap:8px;justify-items:stretch}
.row-actions .btn{min-height:42px;padding:6px 16px}
.when-big{padding:8px 16px;border:var(--bw) solid var(--ink);border-radius:var(--r-inner);background:var(--cobalt-soft);text-align:center}
.when-big b{display:block;font-size:var(--fs-lg)}
.when-big small{color:var(--text-2);font-size:var(--fs-xs)}
.tiles-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px}
.stat{display:grid;gap:6px;padding:20px;background:var(--surface);border:var(--bw) solid var(--ink);border-radius:var(--r-card);box-shadow:var(--shadow)}
.stat span,.stat small{color:var(--text-2);font-size:var(--fs-xs)}
.stat b{font-size:var(--fs-kpi);line-height:1.1;font-variant-numeric:tabular-nums}
.empty-rules{padding:28px;border:var(--bw) dashed var(--ink);border-radius:var(--r-card);color:var(--text-2);text-align:center}
.toast{position:fixed;left:24px;bottom:24px;z-index:50;max-width:520px;padding:14px 18px;border:var(--bw) solid var(--ink);border-radius:var(--r-inner);box-shadow:var(--shadow-sm);background:var(--ink);color:#fff;font-size:var(--fs-sm);opacity:0;transform:translateY(12px);pointer-events:none;transition:opacity .2s,transform .2s}
.toast.visible{opacity:1;transform:none}
.toast.error{background:var(--tomato);color:var(--ink)}

@media(max-width:1050px){.workspace{grid-template-columns:minmax(0,1fr)}.side-col{position:static;height:auto}.phone-media{flex:none;aspect-ratio:1}}
@media(max-width:640px){
:root{--pad:16px;--gap:16px;--r-inner:10px;--fs-xs:12px;--fs-sm:14px;--fs-md:15px;--fs-lg:17px;--fs-h2:19px;--fs-kpi:26px;--shadow:4px 4px 0 var(--ink)}
.side{position:static;inset:auto;width:auto;margin:16px 16px 0;padding:16px;gap:12px;overflow:visible}
.brand-name{font-size:28px}.logo{gap:8px;padding:5px 14px 5px 5px;border-radius:16px}.logo-mark{width:38px;height:38px;border-radius:10px}.logo-mark svg{width:22px;height:22px}.brand small{display:none}
.nav{grid-auto-flow:column;grid-auto-columns:max-content;overflow-x:auto;padding:2px 2px 8px}
.nav-tab{min-height:40px;padding:6px 10px;white-space:nowrap}
.rail-summary{display:none}
.account{order:-1;grid-template-columns:minmax(0,1fr) auto;align-items:center;padding:0;border:0}
.brand{order:-2}
.connection{grid-template-columns:minmax(0,1fr) auto}
.connection label{display:none}
.avatar{width:32px;height:32px}
main{margin:0;padding:16px 16px 40px}
.panel{padding:16px}
.step{width:38px;height:38px}
.panel-chevron{width:32px;height:32px}
.media-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.media-card.create{min-height:0;padding:8px;gap:4px}
.media-card.create .plus{width:34px;height:34px}
.media-card.create small{display:none}
.media-caption{margin:6px 8px 8px;font-size:11px;-webkit-line-clamp:2;max-height:2.9em}
.media-badge{top:5px;right:5px;padding:0 6px;font-size:10px}
.selection-check{top:5px;left:5px;width:22px;height:22px;border-radius:6px}
.tile{width:calc((100% - 32px) / 3)}
.field-grid{grid-template-columns:1fr}
.actions{grid-template-columns:1fr}
.sum-row{grid-template-columns:70px minmax(0,1fr) auto}
.rule-row,.sched-row{grid-template-columns:64px minmax(0,1fr);padding:12px}
.row-thumb{width:64px;height:64px}
.row-actions{grid-column:1/-1;grid-template-columns:repeat(3,minmax(0,1fr))}
.when-big{grid-column:1/-1}
.toast{left:16px;right:16px;bottom:16px}
}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important;scroll-behavior:auto!important}}
`;

const JAVASCRIPT = String.raw`
(function(){
  'use strict';
  var STORY_MEDIA_ID='__stories__';
  var state={token:sessionStorage.getItem('dmeAdminToken')||'',view:'automation',media:[],mediaError:'',automations:[],posts:[],selectedMediaIds:[],mediaMode:'selected',triggerSource:'comment',contentFilter:'feed',uploads:[],cover:null,profile:null,editing:null};
  var byId=function(id){return document.getElementById(id)};
  var form=byId('automationForm');var tokenInput=byId('adminToken');
  tokenInput.value=state.token;

  function toast(message,isError){var el=byId('toast');el.textContent=message;el.className='toast visible'+(isError?' error':'');clearTimeout(toast.timer);toast.timer=setTimeout(function(){el.className='toast'},4200)}
  async function api(path,options){options=options||{};var headers=Object.assign({'Authorization':'Bearer '+state.token},options.headers||{});if(options.body&&typeof options.body==='string')headers['Content-Type']='application/json';var response=await fetch(path,Object.assign({},options,{headers:headers}));var payload=await response.json().catch(function(){return {error:'תגובה לא תקינה מהשרת'}});if(!response.ok)throw new Error(payload.error||'הפעולה נכשלה');return payload}
  function escapeHtml(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function text(value,fallback){return typeof value==='string'&&value.trim()?value.trim():fallback}
  function num(value){return Number(value||0).toLocaleString('he-IL')}
  function mediaImage(item){return item&&(item.thumbnailUrl||item.mediaUrl)||''}
  function keywordList(){return byId('keywords').value.split(/[,\n]/).map(function(v){return v.trim()}).filter(Boolean)}

  /* ---------- views and steps ---------- */
  var panels=Array.prototype.slice.call(document.querySelectorAll('.builder .panel'));
  function visiblePanels(){return panels.filter(function(p){return !p.hidden})}
  function setOpenPanel(target){panels.forEach(function(p){p.classList.toggle('open',p===target)})}
  function numberSteps(){visiblePanels().forEach(function(p,i){p.querySelector('.step').textContent=String(i+1).padStart(2,'0')})}
  function applyFlow(){var post=state.view==='post';var withRule=!post||byId('withAutomation').checked;
    document.querySelectorAll('[data-flow]').forEach(function(el){var flow=el.dataset.flow;el.hidden=flow==='automation'?post:flow==='post'?!post:!withRule});
    byId('publishBox').hidden=!post;byId('publishButton').hidden=!post;byId('ruleActions').hidden=post;
    numberSteps();updateHero();updatePreview()}
  function showView(view){state.view=view;var builder=view==='automation'||view==='post';form.hidden=!builder;
    byId('libraryView').hidden=view!=='library';byId('scheduledView').hidden=view!=='scheduled';byId('analyticsView').hidden=view!=='analytics';byId('connectionsView').hidden=view!=='connections';
    document.querySelectorAll('.nav-tab').forEach(function(t){t.classList.toggle('active',t.dataset.view===view)});
    if(builder){applyFlow();var first=visiblePanels()[0];if(!document.querySelector('.panel.open:not([hidden])'))setOpenPanel(first)}
    if(view==='scheduled')loadPosts();if(view==='connections')loadStatus();window.scrollTo({top:0})}
  panels.forEach(function(panel){panel.querySelector('.panel-heading').addEventListener('click',function(event){if(event.target.closest('input,button:not(.panel-chevron),fieldset,label'))return;setOpenPanel(panel.classList.contains('open')?null:panel)});
    panel.querySelector('.panel-next').addEventListener('click',function(){panel.classList.add('done');var list=visiblePanels();var i=list.indexOf(panel);setOpenPanel(list[i+1]||null);var next=list[i+1];if(next)next.scrollIntoView({behavior:'smooth',block:'start'})})});

  /* ---------- existing posts (automation flow) ---------- */
  function itemMatchesFilter(item){var f=state.contentFilter;return f==='feed'?item.source==='feed':f==='reel'?item.source==='reel':item.source==='story'||item.source==='highlight'}
  function renderMedia(){var grid=byId('mediaGrid');grid.innerHTML='';
    document.querySelectorAll('input[name="contentFilter"]').forEach(function(i){i.checked=i.value===state.contentFilter});
    if(state.contentFilter!=='story'){var create=document.createElement('button');create.type='button';create.className='media-card create';create.dataset.createPost='1';create.innerHTML='<span class="plus">+</span><strong>יצירת פוסט חדש</strong><small>מעלים, מתזמנים, והאוטומציה נדלקת כשהוא עולה</small>';grid.appendChild(create)}
    else{var stories=document.createElement('label');var on=state.mediaMode==='stories';stories.className='media-card create'+(on?' selected':'');stories.dataset.mediaId=STORY_MEDIA_ID;stories.innerHTML='<input type="checkbox" '+(on?'checked':'')+' aria-label="כל הסטוריז"><span class="plus">◉</span><strong>כל הסטוריז</strong><small>תגובה לכל סטורי</small>';grid.appendChild(stories)}
    var visible=state.media.filter(itemMatchesFilter);
    visible.forEach(function(item){var selected=state.mediaMode==='selected'&&state.selectedMediaIds.indexOf(item.id)>=0;var card=document.createElement('label');card.className='media-card'+(selected?' selected':'');card.dataset.mediaId=item.id;
      var kind=item.source==='reel'?'ריל':item.source==='story'||item.source==='highlight'?'סטורי':String(item.mediaType).toLowerCase().indexOf('carousel')>=0?'קרוסלה':'פוסט';
      var image=mediaImage(item);card.innerHTML='<input type="checkbox" '+(selected?'checked':'')+' aria-label="בחירת '+escapeHtml(text(item.caption,kind).slice(0,60))+'"><span class="media-thumb">'+(image?'<img src="'+escapeHtml(image)+'" alt="" loading="lazy">':'')+'<span class="media-badge">'+kind+'</span><span class="selection-check" aria-hidden="true">'+(selected?'✓':'')+'</span></span><span class="media-caption">'+escapeHtml(text(item.caption,kind))+'</span>';grid.appendChild(card)});
    if(!visible.length){var hint=document.createElement('div');hint.className='empty-media';hint.textContent=state.mediaError?'התוכן לא נטען: '+state.mediaError:state.token?'אין כאן תוכן מהסוג הזה.':'מתחברים עם מפתח הניהול בתחתית התפריט כדי לטעון את הפוסטים.';grid.appendChild(hint)}}
  function selectMedia(id){if(id===STORY_MEDIA_ID){var on=state.mediaMode!=='stories';state.mediaMode=on?'stories':'selected';state.triggerSource='story_reply';state.selectedMediaIds=on?['*']:[]}else{var item=state.media.find(function(v){return v.id===id});var source=item&&(item.source==='story'||item.source==='highlight')?'story_reply':'comment';if(state.triggerSource!==source||state.mediaMode!=='selected')state.selectedMediaIds=[];state.triggerSource=source;state.mediaMode='selected';var at=state.selectedMediaIds.indexOf(id);if(at>=0)state.selectedMediaIds.splice(at,1);else state.selectedMediaIds.push(id)}renderMedia();updateHero();updatePreview()}
  function selectionLabel(){if(state.mediaMode==='stories')return 'כל הסטוריז';if(!state.selectedMediaIds.length)return '';if(state.selectedMediaIds.length>1)return state.selectedMediaIds.length+' פוסטים';var item=state.media.find(function(v){return v.id===state.selectedMediaIds[0]});return text(item&&item.caption,'פוסט אחד').slice(0,60)}

  /* ---------- uploads (post flow) ---------- */
  function renderTiles(){var box=byId('uploadTiles');box.innerHTML='';state.uploads.forEach(function(u,i){var tile=document.createElement('div');tile.className='tile';tile.draggable=true;tile.dataset.index=i;
      tile.innerHTML=(u.type==='video'?'<video src="'+u.preview+'" muted playsinline preload="metadata"></video>':'<img src="'+u.preview+'" alt="">')+'<span class="tile-n">'+(i+1)+'</span><button type="button" class="tile-x" data-remove="'+i+'" aria-label="הסרה">×</button>'+(u.state!=='done'?'<span class="tile-state">'+(u.state==='error'?'ההעלאה נכשלה':'מעלה...')+'</span>':'')+'<div class="tile-move"><button type="button" data-move="'+i+'" data-dir="-1" aria-label="הזזה ימינה">›</button><button type="button" data-move="'+i+'" data-dir="1" aria-label="הזזה שמאלה">‹</button></div>';box.appendChild(tile)});
    if(state.uploads.length<10){var add=document.createElement('label');add.className='tile add';add.setAttribute('for','fileInput');add.innerHTML='<b>+</b>מהגלריה<br>או מהמחשב';box.appendChild(add)}
    updateCover();updateHero();updatePreview()}
  async function uploadFile(entry){try{var res=await fetch('/api/media/upload?filename='+encodeURIComponent(entry.file.name),{method:'POST',headers:{'Authorization':'Bearer '+state.token,'Content-Type':entry.file.type},body:entry.file});var payload=await res.json().catch(function(){return {}});if(!res.ok)throw new Error(payload.error||'ההעלאה נכשלה');entry.url=payload.url;entry.state='done'}catch(error){entry.state='error';toast(error.message,true)}renderTiles()}
  byId('fileInput').addEventListener('change',function(event){if(!state.token){toast('קודם מתחברים עם מפתח הניהול',true);return}var files=Array.prototype.slice.call(event.target.files||[]).slice(0,10-state.uploads.length);files.forEach(function(file){var entry={file:file,type:file.type.indexOf('video/')===0?'video':'image',preview:URL.createObjectURL(file),state:'uploading',url:''};state.uploads.push(entry);uploadFile(entry)});event.target.value='';renderTiles()});
  byId('uploadTiles').addEventListener('click',function(event){var rm=event.target.closest('[data-remove]');if(rm){state.uploads.splice(Number(rm.dataset.remove),1);renderTiles();return}var mv=event.target.closest('[data-move]');if(mv){var i=Number(mv.dataset.move),j=i+Number(mv.dataset.dir);if(j<0||j>=state.uploads.length)return;var t=state.uploads[i];state.uploads[i]=state.uploads[j];state.uploads[j]=t;renderTiles()}});
  var dragFrom=null;byId('uploadTiles').addEventListener('dragstart',function(e){var t=e.target.closest('.tile[data-index]');if(!t)return;dragFrom=Number(t.dataset.index);t.classList.add('dragging')});
  byId('uploadTiles').addEventListener('dragover',function(e){if(dragFrom!==null)e.preventDefault()});
  byId('uploadTiles').addEventListener('drop',function(e){e.preventDefault();var t=e.target.closest('.tile[data-index]');if(dragFrom===null||!t)return;var to=Number(t.dataset.index);var moved=state.uploads.splice(dragFrom,1)[0];state.uploads.splice(to,0,moved);dragFrom=null;renderTiles()});
  byId('uploadTiles').addEventListener('dragend',function(){dragFrom=null;renderTiles()});
  function singleVideo(){return state.uploads.length===1&&state.uploads[0].type==='video'?state.uploads[0]:null}
  function updateCover(){var video=singleVideo();byId('coverBox').hidden=!video;byId('coverHint').textContent=video?'בוחרים פריים מתוך הסרטון, או מעלים תמונה. אחרי הפרסום אי אפשר לשנות.':'תמונת שער רלוונטית לסרטון בודד או לריל. כאן אין צורך בה.';if(video&&byId('coverVideo').dataset.src!==video.preview){byId('coverVideo').src=video.preview;byId('coverVideo').dataset.src=video.preview}}
  byId('coverVideo').addEventListener('loadedmetadata',function(){byId('coverRange').max=String(Math.floor(this.duration*1000))});
  byId('coverRange').addEventListener('input',function(){var ms=Number(this.value);byId('coverVideo').currentTime=ms/1000;byId('coverTime').textContent=(ms/1000).toFixed(1)+' שניות';state.coverOffset=ms;updateHero()});
  byId('coverFile').addEventListener('change',async function(event){var file=event.target.files&&event.target.files[0];if(!file)return;byId('coverFileName').textContent='מעלה '+file.name+'...';try{var res=await fetch('/api/media/upload?filename='+encodeURIComponent(file.name),{method:'POST',headers:{'Authorization':'Bearer '+state.token,'Content-Type':file.type},body:file});var p=await res.json();if(!res.ok)throw new Error(p.error||'ההעלאה נכשלה');state.cover=p.url;byId('coverFileName').textContent='שער: '+file.name}catch(error){byId('coverFileName').textContent='';toast(error.message,true)}updateHero()});

  /* ---------- summary card ---------- */
  function sumRow(label,value,panelId,missing){return '<div class="sum-row'+(missing?' missing':'')+'"><dt>'+label+'</dt><dd>'+escapeHtml(missing?'חסר':value)+'</dd><button type="button" class="sum-edit" data-open="'+panelId+'">עריכה</button></div>'}
  function updateHero(){var post=state.view==='post';var rule=!post||byId('withAutomation').checked;var rows='';var editing=state.editing&&!post;
    byId('heroTitle').textContent=editing?'האוטומציה הזאת':post?'סיכום לפני פרסום':'סיכום לפני שמירה';byId('heroKpis').hidden=!editing;
    if(editing){byId('kpiComments').textContent=num(editing.commentCount);byId('kpiSent').textContent=num(editing.sentCount);byId('kpiFollowers').textContent=num(editing.followerCount);byId('kpiFailed').textContent=num(editing.failedCount)}
    if(post){var done=state.uploads.filter(function(u){return u.state==='done'}).length;var kind=state.uploads.length>1?'קרוסלה, '+state.uploads.length+' פריטים':state.uploads.length?(state.uploads[0].type==='video'?'סרטון':'תמונה'):'';rows+=sumRow('תוכן',kind+(done<state.uploads.length?' (מעלה)':''),'uploadPanel',!state.uploads.length);rows+=sumRow('תיאור',byId('caption').value.trim().slice(0,50),'captionPanel',!byId('caption').value.trim());if(singleVideo())rows+=sumRow('שער',state.cover?'תמונה שהועלתה':((state.coverOffset||0)/1000).toFixed(1)+' שניות','coverPanel',false)}
    else rows+=sumRow('פוסט',selectionLabel(),'contentPanel',!selectionLabel());
    if(rule){var kw=keywordList();rows+=sumRow('מילה',kw.join(', '),'triggerPanel',!kw.length);rows+=sumRow('תגובה',state.triggerSource==='story_reply'?'אין בסטורי':text(byId('commentReply').value,'בלי תגובה פומבית').slice(0,40),'publicPanel',false);rows+=sumRow('עוקבים',byId('followGate').checked?'רק עוקבים':'כולם','gatePanel',false);rows+=sumRow('לינק',byId('targetUrl').value.trim(),'privatePanel',!byId('targetUrl').value.trim())}
    byId('summaryList').innerHTML=rows;
    byId('saveActive').textContent=editing?'שמירה והפעלה':'שמירה והפעלה';byId('savePaused').textContent=editing&&!editing.enabled?'שמירה, נשארת מושהית':'שמירה כמושהית';byId('resetButton').hidden=!editing;
    var schedule=(form.querySelector('input[name="publishWhen"]:checked')||{}).value!=='now';byId('whenFields').hidden=!schedule;byId('publishButton').textContent=schedule?'תזמון הפוסט ←':'פרסום עכשיו ←';
    visiblePanels().forEach(function(p){var s=p.querySelector('[data-summary]');var row=byId('summaryList').querySelector('[data-open="'+p.id+'"]');s.textContent=row?row.previousElementSibling.textContent:''})}
  byId('summaryList').addEventListener('click',function(event){var b=event.target.closest('[data-open]');if(!b)return;var p=byId(b.dataset.open);setOpenPanel(p);p.scrollIntoView({behavior:'smooth',block:'start'})});

  /* ---------- phone preview ---------- */
  function fill(el,value){el.innerHTML='';String(value).split('\n').forEach(function(line,i){if(i)el.appendChild(document.createElement('br'));el.appendChild(document.createTextNode(line))})}
  function updatePreview(){var post=state.view==='post';var rule=!post||byId('withAutomation').checked;var user=state.profile&&state.profile.username||'your_account';var box=byId('previewMedia');box.innerHTML='';
    var src=post?(state.uploads[0]&&state.uploads[0].preview):mediaImage(state.media.find(function(v){return v.id===state.selectedMediaIds[0]}));
    if(src){var isVideo=post&&state.uploads[0].type==='video';var m=document.createElement(isVideo?'video':'img');m.src=src;if(isVideo){m.muted=true;m.playsInline=true}else m.alt='';box.appendChild(m)}else box.textContent=post?'+':'◎';
    var caption=post?byId('caption').value.trim():'';byId('previewCaption').hidden=!caption;byId('previewCaption').innerHTML='<b>'+escapeHtml(user)+'</b> '+escapeHtml(caption);
    var comments=byId('previewComments');comments.innerHTML='';byId('previewDm').hidden=!rule;if(!rule)return;
    var kw=keywordList()[0]||'לינק';var story=state.triggerSource==='story_reply'&&!post;var reply=text(byId('commentReply').value,'');
    comments.innerHTML='<div class="phone-comment"><b>dana_c</b> '+escapeHtml(kw)+(story||!reply?'':'<div class="reply"><b>'+escapeHtml(user)+'</b> '+escapeHtml(reply.replaceAll('{{username}}','@dana_c'))+'</div>')+'</div>';
    var gate=byId('followGate').checked;byId('previewGate').hidden=!gate;fill(byId('previewFollowPrompt'),byId('followPrompt').value||'');var label=text(byId('followButton').value,'עקבתי');byId('previewFollowButton').textContent=label;byId('previewFollowClick').textContent=label;
    fill(byId('previewMessage'),(byId('messageTemplate').value||'הנה הלינק').replaceAll('{{username}}','@dana_c'));byId('gateFields').classList.toggle('disabled',!gate);byId('publicPanel').classList.toggle('public-off',story)}

  /* ---------- account ---------- */
  function showProfile(){var p=state.profile;if(!p)return;byId('meChip').hidden=false;byId('meName').textContent='@'+p.username;byId('previewUsername').textContent=p.username;['meAvatar','previewAvatar'].forEach(function(id){var a=byId(id);a.innerHTML=p.profilePictureUrl?'<img src="'+escapeHtml(p.profilePictureUrl)+'" alt="">':escapeHtml((p.username||'?').charAt(0).toUpperCase())})}
  function setConnected(on){byId('connectionBox').classList.toggle('connected',on);byId('connectButton').querySelector('.connection-label').textContent=on?'מחובר':'חיבור'}
  async function connect(){var token=tokenInput.value.trim();if(!token){toast('צריך להזין את מפתח הניהול',true);tokenInput.focus();return}state.token=token;sessionStorage.setItem('dmeAdminToken',token);byId('connectButton').disabled=true;
    try{var rules=await api('/api/automations');state.automations=rules.automations||[];setConnected(true);renderRules();
      var results=await Promise.allSettled([api('/api/instagram/media'),api('/api/instagram/profile'),api('/api/posts?status=scheduled')]);
      if(results[0].status==='fulfilled'){state.media=results[0].value.media||[];state.mediaError=''}else{state.media=[];state.mediaError=results[0].reason.message}
      if(results[1].status==='fulfilled'){state.profile=results[1].value.profile;showProfile()}
      if(results[2].status==='fulfilled'){state.posts=results[2].value.posts||[];renderPosts()}
      renderMedia();renderRules();updatePreview();toast('מחובר. הפוסטים והאוטומציות נטענו')}
    catch(error){setConnected(false);toast(error.message,true)}finally{byId('connectButton').disabled=false}}

  /* ---------- automations list and rail ---------- */
  function ruleMediaIds(rule){return Array.isArray(rule.mediaIds)&&rule.mediaIds.length?rule.mediaIds:[rule.mediaId||'*']}
  function ruleThumb(rule){var ids=ruleMediaIds(rule);var media=state.media.find(function(v){return ids.indexOf(v.id)>=0});var img=mediaImage(media);return img?'<img src="'+escapeHtml(img)+'" alt="" loading="lazy">':(rule.mediaMode==='stories'?'◉':rule.postId?'◷':ids.indexOf('*')>=0?'∞':'◎')}
  function ruleLabel(rule){var ids=ruleMediaIds(rule);if(rule.postId&&ids[0]==='*')return 'פוסט מתוזמן';if(rule.mediaMode==='stories')return 'כל הסטוריז';if(ids.indexOf('*')>=0)return 'כל הפוסטים';var media=state.media.find(function(v){return ids.indexOf(v.id)>=0});return text(media&&media.caption,'פוסט').slice(0,60)}
  function actionIcon(type){return '<img src="/icons/action-'+(type==='edit'?'delete':'edit')+'.svg" alt="">'}
  function renderRailSummary(){var box=byId('railCards');var active=state.automations.filter(function(r){return r.enabled});box.innerHTML='';if(!active.length){box.innerHTML='<p class="rail-empty">'+(state.automations.length?'אין אוטומציות פעילות כרגע.':'אחרי החיבור יופיעו כאן האוטומציות הפעילות.')+'</p>';return}
    active.forEach(function(rule){var card=document.createElement('button');card.type='button';card.className='rail-card';card.dataset.editRule=rule.id;card.setAttribute('aria-label','עריכת האוטומציה '+rule.keywords.join(', '));card.innerHTML='<span class="rail-thumb">'+ruleThumb(rule)+'</span><span><strong>'+escapeHtml(rule.keywords.join(', '))+'</strong><small>'+num(rule.commentCount)+' הגיבו · '+num(rule.sentCount)+' נשלחו</small></span>';box.appendChild(card)})}
  function renderRules(){var list=byId('rulesListAll');list.innerHTML='';if(!state.automations.length)list.innerHTML='<div class="empty-rules">עדיין אין אוטומציות. יוצרים את הראשונה ב"יצירת אוטומציה".</div>';
    state.automations.forEach(function(rule){var row=document.createElement('article');row.className='rule-row';row.innerHTML='<span class="row-thumb">'+ruleThumb(rule)+'</span><div class="row-copy"><h3>'+escapeHtml(rule.keywords.join(', '))+'</h3><p>'+escapeHtml(ruleLabel(rule))+'</p><div class="tags"><span class="pill '+(rule.enabled?'ok':'')+'">'+(rule.enabled?'פעילה':'מושהית')+'</span><span class="pill">'+(rule.followGate?'רק עוקבים':'לכולם')+'</span><span class="pill blue">'+num(rule.commentCount)+' הגיבו · '+num(rule.sentCount)+' נשלחו</span></div></div><div class="row-actions"><button type="button" class="btn" data-edit="'+escapeHtml(rule.id)+'" aria-label="עריכת האוטומציה '+escapeHtml(rule.keywords.join(', '))+'">עריכה</button><button type="button" class="btn" data-delete="'+escapeHtml(rule.id)+'" aria-label="מחיקת האוטומציה '+escapeHtml(rule.keywords.join(', '))+'">מחיקה</button></div>';list.appendChild(row)});
    renderRailSummary();updateMetrics()}
  function updateMetrics(){var sum=function(key){return state.automations.reduce(function(t,r){return t+Number(r[key]||0)},0)};var comments=sum('commentCount'),sent=sum('sentCount');byId('navRuleCount').textContent=state.automations.length;byId('analyticsComments').textContent=num(comments);byId('analyticsMessages').textContent=num(sent);byId('analyticsFollowers').textContent=num(sum('followerCount'));byId('analyticsConversion').textContent=comments?Math.round(sent/comments*100)+'%':'0%'}
  function editRule(id){var rule=state.automations.find(function(r){return r.id===id});if(!rule)return;state.editing=rule;showView('automation');byId('automationId').value=rule.id;byId('keywords').value=rule.keywords.join(', ');byId('targetUrl').value=rule.targetUrl;byId('messageTemplate').value=String(rule.messageTemplate||'').replace(/\s*\{\{url\}\}\s*/g,'').trim();
    var opts=rule.commentReplyOptions||[];document.querySelectorAll('.comment-reply-option').forEach(function(a,i){a.value=opts[i]||''});byId('followGate').checked=rule.followGate;byId('followPrompt').value=rule.followPrompt;byId('followButton').value=rule.followButton;
    var radio=form.querySelector('input[name="matchMode"][value="'+rule.matchMode+'"]');if(radio)radio.checked=true;state.triggerSource=rule.triggerSource||'comment';state.mediaMode=rule.mediaMode==='stories'?'stories':'selected';state.selectedMediaIds=rule.mediaMode==='stories'?['*']:ruleMediaIds(rule).filter(function(v){return v!=='*'});
    var first=state.media.find(function(v){return state.selectedMediaIds.indexOf(v.id)>=0});state.contentFilter=state.triggerSource==='story_reply'?'story':first&&first.source==='reel'?'reel':'feed';renderMedia();updateHero();updatePreview();setOpenPanel(byId('triggerPanel'))}
  function resetForm(){form.reset();state.editing=null;byId('automationId').value='';state.selectedMediaIds=[];state.mediaMode='selected';state.triggerSource='comment';state.contentFilter='feed';state.uploads=[];state.cover=null;state.coverOffset=0;
    byId('commentReply').value='תודה על התגובה, {{username}} - שולח לך את הפרטים בפרטי';byId('messageTemplate').value='היי {{username}}, הנה הלינק שביקשת';byId('followPrompt').value='כמעט שם. עוקבים אחרי החשבון ולוחצים על הכפתור כדי לקבל את הלינק.';byId('followButton').value='עקבתי';byId('followGate').checked=true;defaultDate();
    panels.forEach(function(p){p.classList.remove('done')});renderMedia();renderTiles();applyFlow();setOpenPanel(visiblePanels()[0])}
  async function handleRuleAction(event){var edit=event.target.closest('[data-edit]');if(edit){editRule(edit.dataset.edit);return}var del=event.target.closest('[data-delete]');if(!del)return;if(!confirm('למחוק את האוטומציה הזאת? מי שיגיב לא יקבל יותר הודעה.'))return;
    try{await api('/api/automations/'+encodeURIComponent(del.dataset.delete),{method:'DELETE'});state.automations=state.automations.filter(function(r){return r.id!==del.dataset.delete});renderRules();toast('האוטומציה נמחקה')}catch(error){toast(error.message,true)}}

  /* ---------- scheduled posts ---------- */
  function when(iso){if(!iso)return {date:'',left:''};var d=new Date(iso);var date=d.toLocaleDateString('he-IL',{weekday:'short',day:'numeric',month:'numeric'})+' · '+d.toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'});var days=Math.round((d-Date.now())/864e5);var left=d<Date.now()?'עבר המועד':days<1?'היום':days===1?'מחר':'בעוד '+days+' ימים';return {date:date,left:left}}
  function renderPosts(){var list=byId('scheduledList');byId('navScheduledCount').textContent=state.posts.length;list.innerHTML='';if(!state.posts.length){list.innerHTML='<div class="empty-rules">אין פרסומים מתוזמנים. יוצרים אחד ב"יצירת פוסט".</div>';return}
    state.posts.forEach(function(p){var rule=state.automations.find(function(r){return r.postId===p.id});var w=when(p.scheduledFor);var thumb=p.mediaUrl?(p.mediaType==='video'?'<video src="'+escapeHtml(p.mediaUrl)+'" muted preload="metadata"></video>':'<img src="'+escapeHtml(p.mediaUrl)+'" alt="" loading="lazy">'):'◷';
      var kind=p.mediaCount>1?'קרוסלה, '+p.mediaCount+' פריטים':p.mediaType==='video'?'סרטון':'תמונה';var status=p.status==='failed'?'<span class="pill red">נכשל</span>':'<span class="pill lemon">ממתין</span>';
      var row=document.createElement('article');row.className='sched-row';row.innerHTML='<span class="row-thumb">'+thumb+'</span><div class="row-copy"><h3>'+kind+'</h3><p>'+escapeHtml(text(p.caption,'בלי תיאור'))+'</p><div class="tags">'+status+(rule?'<span class="pill blue">עם אוטומציה: '+escapeHtml(rule.keywords.join(', '))+'</span>':'<span class="pill">בלי אוטומציה</span>')+(p.error?'<span class="pill red">'+escapeHtml(p.error).slice(0,80)+'</span>':'')+'</div></div><div class="row-actions"><div class="when-big"><b>'+w.date+'</b><small>'+w.left+'</small></div><button type="button" class="btn blue" data-publish="'+p.id+'">פרסום עכשיו</button><button type="button" class="btn" data-cancel="'+p.id+'">ביטול תזמון</button></div>';list.appendChild(row)})}
  async function loadPosts(){if(!state.token)return;try{var r=await api('/api/posts?status=scheduled');state.posts=r.posts||[];renderPosts()}catch(error){toast(error.message,true)}}
  byId('scheduledList').addEventListener('click',async function(event){var pub=event.target.closest('[data-publish]');var cancel=event.target.closest('[data-cancel]');if(!pub&&!cancel)return;
    if(pub&&!confirm('לפרסם את הפוסט עכשיו באינסטגרם?'))return;if(cancel&&!confirm('לבטל את התזמון? הפוסט לא יתפרסם.'))return;
    try{if(pub){await api('/api/posts/'+pub.dataset.publish+'/publish',{method:'POST',body:'{}'});toast('הפוסט נשלח לפרסום')}else{await api('/api/posts/'+cancel.dataset.cancel,{method:'DELETE'});toast('התזמון בוטל')}loadPosts()}catch(error){toast(error.message,true)}});

  /* ---------- connections ---------- */
  function tile(label,value,note){return '<div class="stat"><span>'+escapeHtml(label)+'</span><b>'+escapeHtml(value)+'</b><small>'+escapeHtml(note||'')+'</small></div>'}
  async function loadStatus(){if(!state.token)return;try{var s=await api('/api/status');byId('providerList').innerHTML=s.providers.map(function(p){return tile(p.name+' · '+p.role,p.connected?'מחובר':'לא מחובר',p.detail)}).join('');var plan=s.plan;var tiles=[];
      if(plan){tiles.push(tile('תוכנית',plan.name||'-',plan.period==='monthly'?'חיוב חודשי':plan.period||''));Object.keys(plan.limits||{}).forEach(function(k){var limit=plan.limits[k],used=Number((plan.usage||{})[k]||0);if(limit<0)return;tiles.push(tile(k==='uploads'?'העלאות':k==='profiles'?'פרופילים':k,num(Math.max(limit-used,0))+' נשארו',num(used)+' מתוך '+num(limit)))});if(plan.usage&&plan.usage.connectedAccounts!=null)tiles.push(tile('חשבונות מחוברים',String(plan.usage.connectedAccounts),''));if(plan.spend&&plan.spend.currentPeriodCents!=null)tiles.push(tile('חיוב החודש עד עכשיו','$'+(plan.spend.currentPeriodCents/100).toFixed(2),plan.spend.creditsRemainingCents?'קרדיט: $'+(plan.spend.creditsRemainingCents/100).toFixed(2):''))}
      if(s.rateLimit&&s.rateLimit.limit)tiles.push(tile('קריאות API בדקה',String(s.rateLimit.remaining==null?'-':s.rateLimit.remaining),'מתוך '+s.rateLimit.limit));byId('usageList').innerHTML=tiles.length?tiles.join(''):'<p class="rail-empty">'+escapeHtml(s.usageError||'אין נתוני שימוש')+'</p>'}catch(error){toast(error.message,true)}}

  /* ---------- submit ---------- */
  function ruleInput(enabled){var kw=keywordList();if(!kw.length)throw new Error('צריך מילת תגובה אחת לפחות');var url=byId('targetUrl').value.trim();if(!/^https?:\/\//i.test(url))throw new Error('צריך לינק שמתחיל ב-https://');
    return {enabled:enabled,triggerSource:state.view==='post'?'comment':state.triggerSource,mediaMode:state.mediaMode,keywords:kw,matchMode:form.querySelector('input[name="matchMode"]:checked').value,targetUrl:url,messageTemplate:byId('messageTemplate').value.trim(),commentReplyOptions:Array.prototype.map.call(document.querySelectorAll('.comment-reply-option'),function(a){return a.value.trim()}).filter(Boolean),followGate:byId('followGate').checked,followPrompt:byId('followPrompt').value.trim()||'עוקבים ולוחצים על הכפתור',followButton:byId('followButton').value.trim()||'עקבתי'}}
  function defaultDate(){var d=new Date(Date.now()+864e5);byId('publishDate').value=d.toISOString().slice(0,10)}
  function openMissing(){var miss=byId('summaryList').querySelector('.missing [data-open]');if(miss){var p=byId(miss.dataset.open);setOpenPanel(p);p.scrollIntoView({behavior:'smooth',block:'start'})}}
  form.addEventListener('submit',async function(event){event.preventDefault();if(!state.token){toast('קודם מתחברים עם מפתח הניהול בתחתית התפריט',true);return}var submitter=event.submitter;
    try{if(state.view==='post'){await submitPost();return}
      if(!state.selectedMediaIds.length){openMissing();throw new Error('צריך לבחור פוסט אחד לפחות')}
      var input=ruleInput(submitter&&submitter.dataset.enable==='true');input.id=byId('automationId').value||undefined;input.mediaIds=state.selectedMediaIds.slice();
      if(input.enabled&&!input.id&&!confirm('להפעיל עכשיו? מכאן כל מי שיגיב "'+input.keywords[0]+'" יקבל הודעה.'))return;
      submitter&&(submitter.disabled=true);var r=await api('/api/automations',{method:'POST',body:JSON.stringify(input)});var rules=await api('/api/automations');state.automations=rules.automations||[];renderRules();toast(r.created>1?r.created+' אוטומציות נשמרו':'האוטומציה נשמרה');resetForm()}
    catch(error){toast(error.message,true);openMissing()}finally{submitter&&(submitter.disabled=false)}});
  async function submitPost(){if(!state.uploads.length){openMissing();throw new Error('צריך להעלות תמונה או סרטון')}if(state.uploads.some(function(u){return u.state!=='done'}))throw new Error('מחכים שההעלאה תסתיים');
    var whenValue=form.querySelector('input[name="publishWhen"]:checked').value;var payload={caption:byId('caption').value,media:state.uploads.map(function(u){return {url:u.url,type:u.type}}),when:whenValue==='now'?'now':'schedule',timezone:'Asia/Jerusalem'};
    if(payload.when==='schedule'){var local=new Date(byId('publishDate').value+'T'+(byId('publishTime').value||'10:00'));if(isNaN(local))throw new Error('צריך תאריך ושעה');payload.scheduledFor=local.toISOString()}
    if(singleVideo()){if(state.cover)payload.coverUrl=state.cover;else payload.thumbOffset=state.coverOffset||0}
    if(byId('withAutomation').checked)payload.automation=ruleInput(true);
    var what=payload.when==='now'?'לפרסם עכשיו באינסטגרם':'לתזמן ל-'+when(payload.scheduledFor).date;if(!confirm(what+'?'+(payload.automation?' האוטומציה על "'+payload.automation.keywords[0]+'" תידלק כשהפוסט עולה.':'')))return;
    byId('publishButton').disabled=true;try{var r=await api('/api/posts',{method:'POST',body:JSON.stringify(payload)});toast(payload.when==='now'?'הפוסט נשלח לפרסום':'הפוסט תוזמן');if(r.automationError)toast('הפוסט נוצר, אבל האוטומציה לא: '+r.automationError,true);var rules=await api('/api/automations');state.automations=rules.automations||[];renderRules();resetForm();showView('scheduled')}finally{byId('publishButton').disabled=false}}

  /* ---------- wiring ---------- */
  document.querySelectorAll('.nav-tab').forEach(function(tab){tab.addEventListener('click',function(){if((tab.dataset.view==='automation'||tab.dataset.view==='post')&&state.view!==tab.dataset.view){state.editing=null;byId('withAutomation').checked=false;setOpenPanel(null)}showView(tab.dataset.view)})});
  byId('mediaGrid').addEventListener('click',function(event){if(event.target.closest('[data-create-post]')){event.preventDefault();state.editing=null;byId('withAutomation').checked=true;setOpenPanel(null);showView('post');return}var card=event.target.closest('[data-media-id]');if(!card)return;event.preventDefault();selectMedia(card.dataset.mediaId)});
  document.querySelectorAll('input[name="contentFilter"]').forEach(function(i){i.addEventListener('change',function(){state.contentFilter=i.value;renderMedia()})});
  byId('withAutomation').addEventListener('change',applyFlow);
  byId('railCards').addEventListener('click',function(event){var card=event.target.closest('[data-edit-rule]');if(card)editRule(card.dataset.editRule)});
  byId('rulesListAll').addEventListener('click',handleRuleAction);
  byId('resetButton').addEventListener('click',resetForm);
  byId('caption').addEventListener('input',function(){byId('captionCount').textContent=this.value.length.toLocaleString('he-IL')+' / 2,200'});
  form.addEventListener('input',function(){updateHero();updatePreview()});form.addEventListener('change',function(){updateHero();updatePreview()});
  byId('connectButton').addEventListener('click',function(){if(byId('connectionBox').classList.contains('connected')){byId('connectionBox').classList.remove('connected');tokenInput.focus();return}connect()});
  byId('refreshMedia').addEventListener('click',connect);
  tokenInput.addEventListener('keydown',function(event){if(event.key==='Enter'){event.preventDefault();connect()}});
  defaultDate();renderMedia();renderTiles();showView('automation');if(state.token)connect();
})();
`;

function asset(body: string, contentType: string): Response {
  return new Response(body, { headers: { ...SECURITY_HEADERS, "Content-Type": contentType } });
}

/** Every px in the stylesheet is a design pixel: 1920 wide on desktop, 1100 on tablets, 390 on phones. */
const RESPONSIVE_VW_SCALE = `
:root{--design-px:0.052083333vw}
@media(min-width:641px) and (max-width:1050px){:root{--design-px:0.090909091vw}}
@media(max-width:640px){:root{--design-px:0.256410256vw}}
`;

function convertDesignPixelsToVw(css: string): string {
  const mediaQueries: string[] = [];
  const protectedCss = css.replace(/@media\s*\([^{}]+\)/g, (query) => {
    mediaQueries.push(query);
    return `__DME_MEDIA_QUERY_${mediaQueries.length - 1}__`;
  });

  return protectedCss
    .replace(/(-?(?:\d+\.?\d*|\.\d+))px\b/g, (_match, value: string) => `calc(${value} * var(--design-px))`)
    .replace(/__DME_MEDIA_QUERY_(\d+)__/g, (_match, index: string) => mediaQueries[Number(index)] ?? "");
}

const RESPONSIVE_APP_CSS = RESPONSIVE_VW_SCALE + convertDesignPixelsToVw(DASHBOARD_CSS);

export function handleAdminUi(url: URL): Response | null {
  if (url.pathname === "/admin" || url.pathname === "/admin/") {
    return asset(HTML, "text/html; charset=utf-8");
  }
  if (url.pathname === "/admin/styles.css") {
    return asset(RESPONSIVE_APP_CSS, "text/css; charset=utf-8");
  }
  if (url.pathname === "/admin/app.js") {
    return asset(JAVASCRIPT, "text/javascript; charset=utf-8");
  }
  return null;
}
