const SECURITY_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' https: data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

const HTML = `<!doctype html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>D-ME - Instagram Automation Studio</title>
  <link rel="stylesheet" href="/admin/styles.css">
</head>
<body>
  <header class="masthead" data-node-id="13441:1706">
    <a class="brand" href="/admin" aria-label="D-ME Automation Studio">
      <span class="brand-name">D-ME</span>
      <small>Automation Studio</small>
    </a>
    <nav class="rail-nav" aria-label="ניווט משני">
      <button class="nav-tab active" data-view="builder" type="button">יצירת אוטומציה</button>
      <button class="nav-tab" data-view="library" type="button" aria-controls="appDrawer" aria-expanded="false">האוטומציות שלי <span id="navRuleCount">0</span></button>
      <button class="nav-tab" data-view="analytics" type="button" aria-controls="appDrawer" aria-expanded="false">אנליטיקות</button>
    </nav>
    <section class="rail-summary" aria-labelledby="railSummaryTitle">
      <h3 id="railSummaryTitle">רצות עכשיו</h3>
      <div class="rail-cards" id="railCards"><p class="rail-empty">אחרי החיבור יופיעו כאן האוטומציות הפעילות.</p></div>
    </section>
    <div class="connection" id="connectionBox" data-node-id="13441:1738">
      <label for="adminToken">מפתח ניהול</label>
      <input id="adminToken" type="password" autocomplete="off" placeholder="הדבק מפתח" aria-label="מפתח ניהול">
      <button class="small-button" id="connectButton" type="button"><span class="status-dot" id="statusDot"></span><span class="connection-label">חיבור</span></button>
    </div>
  </header>

  <main>
    <div class="topbar"><time id="todayLabel"></time></div>
    <section class="hero">
      <h1>אוטומציה חדשה<span class="dot">.</span></h1>
      <p>בוחרים תוכן, מגדירים מילת טריגר ומחליטים בדיוק איזו הודעה תגיע למגיב.</p>
    </section>
    <div class="rail-metrics" aria-label="סיכום פעילות" data-node-id="13441:1722">
    <div><strong id="metricActive">0</strong><span>אוטומציות פעילות</span><small id="metricTotal">מתוך 0</small></div>
    <div><strong id="metricMessages">0</strong><span>הודעות שנשלחו</span></div>
    <div><strong id="metricGate">0</strong><span>עברו בדיקת עוקב</span></div>
    <div><strong id="metricNoReply">0</strong><span>ללא תגובה</span></div>
  </div>


    <form id="automationForm" novalidate>
      <input id="automationId" type="hidden">
      <div class="workspace">
        <div class="builder">
          <section class="panel content-panel" aria-labelledby="contentTitle">
            <div class="panel-heading">
              <span class="step">01</span>
              <div><h2 id="contentTitle">על אילו אייטמים עובדים?</h2></div>
              <fieldset class="content-filter" aria-label="סוג התוכן">
                <legend class="sr-only">סוג התוכן</legend>
                <label><input type="radio" name="contentFilter" value="feed" checked><span>פוסט</span></label>
                <label><input type="radio" name="contentFilter" value="reel"><span>ריל</span></label>
                <label><input type="radio" name="contentFilter" value="story"><span>סטורי</span></label>
              </fieldset>
              <button class="text-button" id="refreshMedia" type="button">רענון מאינסטגרם <span>↻</span></button>
            </div>
            <div class="media-grid" id="mediaGrid">
              <label class="media-card all-media selected" data-media-id="*">
                <input class="media-checkbox" type="checkbox" name="mediaIds" value="*" aria-label="בחירת כל הפוסטים" checked>
                <span class="selection-check" aria-hidden="true">✓</span>
                <span class="all-symbol">∞</span>
                <strong>כל הפוסטים</strong>
                <small>הטריגר יעבוד בכל תוכן</small>
              </label>
              <div class="empty-media" id="mediaHint">
                <span>◎</span>
                <p>הכנס מפתח ניהול ולחץ חיבור כדי לטעון את הפוסטים וה-Reels.</p>
              </div>
            </div>
            <div class="selection-line">אפשר לבחור כמה פוסטים. נבחר: <strong id="selectedMediaLabel">כל הפוסטים</strong></div>
          </section>

          <section class="panel" aria-labelledby="triggerTitle">
            <div class="panel-heading">
              <span class="step">02</span>
              <div><h2 id="triggerTitle">מה המגיב צריך לכתוב?</h2></div>
            </div>
            <div class="field-grid two">
              <label class="field wide">
                <span>מילות תגובה <small>אפשר להפריד בפסיק</small></span>
                <input id="keywords" required maxlength="500" placeholder="לינק, פרטים, שלח לי">
              </label>
              <fieldset class="field segmented-field">
                <legend>אופן ההתאמה</legend>
                <div class="segmented">
                  <label><input type="radio" name="matchMode" value="exact" checked><span>מדויקת</span></label>
                  <label><input type="radio" name="matchMode" value="contains"><span>מכילה</span></label>
                </div>
              </fieldset>
            </div>
          </section>

          <section class="panel public-panel" aria-labelledby="responseTitle">
            <div class="panel-heading">
              <span class="step">03</span>
              <div><h2 id="responseTitle">מה נכתוב בתגובה הפומבית?</h2></div>
            </div>
            <div class="field-grid single">
              <label class="field">
                <span>תגובה פומבית ל-Comment <small>עד 3 נוסחים חלופיים</small></span>
                <textarea class="comment-reply-option" id="commentReply" maxlength="500" rows="2">תודה על התגובה, {{username}} - שולח לך את הפרטים בפרטי 👀</textarea>
                <textarea class="comment-reply-option" maxlength="500" rows="2">ראיתי אותך, {{username}}. הפרטים בדרך אליך.</textarea>
                <textarea class="comment-reply-option" maxlength="500" rows="2">מעולה, {{username}} - בדוק/י את ההודעה הפרטית שלך.</textarea>
                <small class="tokens">אפשר להשאיר ריק. משתנים: <button type="button" data-token="{{username}}">שם משתמש</button><button type="button" data-token="{{keyword}}">מילת תגובה</button></small>
              </label>
            </div>
          </section>
          <section class="panel gate-panel" aria-labelledby="gateTitle" data-node-id="13441:1653">
            <div class="gate-card">
              <div class="panel-heading gate-heading"><span class="step">04</span><div><h2 id="gateTitle">שליחה רק לעוקבים?</h2></div></div>
              <label class="switch-row">
                <input id="followGate" type="checkbox" checked>
                <span class="switch" aria-hidden="true"></span>
                <span><b>שליחה רק לעוקבים</b><small>מי שלא עוקב יקבל בקשה לעקוב וכפתור בדיקה נוסף.</small></span>
              </label>
              <div class="gate-fields" id="gateFields">
                <label class="field">
                  <span>הודעה למי שלא עוקב</span>
                  <textarea id="followPrompt" maxlength="1000" rows="3">כמעט שם 👀
עקוב אחרי @your_account ואז לחץ על הכפתור כדי לקבל את הלינק.</textarea>
                </label>
                <label class="field compact">
                  <span>טקסט הכפתור</span>
                  <input id="followButton" maxlength="20" value="עקבתי">
                </label>
              </div>
            </div>
          </section>
          <section class="panel private-panel" aria-labelledby="privateTitle" data-node-id="13441:1680">
            <div class="panel-heading">
              <span class="step">05</span>
              <div><h2 id="privateTitle">מה נשלח למגיב?</h2></div>
            </div>
            <div class="field-grid private-grid">
              <label class="field">
                <span>הודעה פרטית למגיב</span>
                <textarea id="messageTemplate" required maxlength="1000" rows="4" placeholder="היי {{username}}, הנה הלינק שביקשת&#10;{{url}}">היי {{username}}, הנה הלינק שביקשת
{{url}}</textarea>
                <small class="tokens">משתנים זמינים: <button type="button" data-token="{{username}}">שם משתמש</button><button type="button" data-token="{{url}}">לינק</button><button type="button" data-token="{{keyword}}">מילת תגובה</button></small>
              </label>
              <label class="field url-field">
                <span>קישור URL</span>
                <input id="targetUrl" type="url" required placeholder="https://example.com/..." dir="ltr">
              </label>
            </div>
          </section>
        </div>

        <aside class="preview-column">
          <div class="preview-sticky">
            <div class="preview-label"><span>LIVE PREVIEW</span><i></i></div>
            <div class="phone">
              <div class="phone-top"><span>‹</span><div class="avatar">D</div><div><b>your_account</b><small>Active now</small></div></div>
              <div class="chat-date">היום, 12:48</div>
              <div class="bubble incoming" id="previewKeyword">לינק</div>
              <div class="comment-preview" id="previewPublicReply"><b>your_account</b> תודה על התגובה, @username - שולח לך את הפרטים בפרטי</div>
              <div class="bubble outgoing" id="previewMessage">היי @username, הנה הלינק שביקשת 👇<br>https://example.com/...</div>
              <div class="preview-gate" id="previewGate"><span>✓</span> נשלח לאחר בדיקת עוקב</div>
            </div>
            <div class="publish-card">
              <label class="switch-row slim">
                <input id="enabled" type="checkbox" checked>
                <span class="switch" aria-hidden="true"></span>
                <span><b>האוטומציה פעילה</b></span>
              </label>
              <button class="primary-button" id="saveButton" type="submit"><span>שמירת האוטומציה</span><i>←</i></button>
              <button class="secondary-button" id="resetButton" type="button">אוטומציה חדשה</button>
            </div>
          </div>
        </aside>
      </div>
    </form>

    <section class="rules-section" aria-labelledby="rulesTitle">
      <div class="section-title"><div><p>הספרייה שלך</p><h2 id="rulesTitle">אוטומציות אחרונות</h2></div><button class="text-button" type="button" data-open-library>הצג הכל</button></div>
      <div class="rules-list" id="rulesList"><div class="empty-rules">האוטומציות השמורות יופיעו כאן אחרי החיבור.</div></div>
    </section>
  </main>
  <div class="drawer-backdrop" id="drawerBackdrop" hidden></div>
  <aside class="app-drawer" id="appDrawer" aria-labelledby="drawerTitle" aria-modal="true" role="dialog" hidden>
    <div class="drawer-header">
      <h2 id="drawerTitle">האוטומציות שלי</h2>
      <button class="drawer-close" id="drawerClose" type="button" aria-label="סגירת החלונית">×</button>
    </div>
    <div class="drawer-body">
      <section id="drawerLibrary" aria-label="כל האוטומציות">
        <div class="rules-list drawer-rules" id="rulesListAll"><div class="empty-rules">האוטומציות השמורות יופיעו כאן אחרי החיבור.</div></div>
      </section>
      <section id="drawerAnalytics" aria-labelledby="analyticsTitle" hidden>
        <div class="drawer-subtitle"><h3 id="analyticsTitle">תמונת מצב</h3><span>30 הימים האחרונים</span></div>
        <div class="analytics-grid"><div><span>תגובות שנקלטו</span><strong id="analyticsComments">0</strong><small>יתעדכן עם כל אירוע חדש</small></div><div><span>הודעות שנשלחו</span><strong id="analyticsMessages">0</strong><small>פרטיות + הודעות המשך</small></div><div><span>שיעור המרה</span><strong id="analyticsConversion">0%</strong><small>מגיבים שהמשיכו במסלול</small></div></div>
        <div class="analytics-empty"><span>◎</span><p>האנליטיקות מתחילות להצטבר מהרגע שהאוטומציה הראשונה פעילה.</p></div>
      </section>
    </div>
  </aside>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <script src="/admin/app.js" defer></script>
</body>
</html>`;

const DASHBOARD_CSS = `
@font-face{font-family:"Heebo";src:url("/fonts/Heebo-hebrew.woff2") format("woff2");font-weight:100 900;font-display:swap;unicode-range:U+0307-0308,U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F}
@font-face{font-family:"Heebo";src:url("/fonts/Heebo-latin.woff2") format("woff2");font-weight:100 900;font-display:swap;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
:root{color-scheme:light;--bg:#fff;--surface:#fff;--raised:#f3f3f3;--line:#e2e2e2;--line-strong:#bdbdbd;--text:#0a0a0a;--muted:#5f5f5f;--faint:#8c8c8c;--accent:#ff6f00;--accent-hover:#e66400;--accent-soft:#fff1e6;--accent-line:#ffc08a;--accent-strong:#c24f00;--accent-ink:#0a0a0a;--success:var(--accent);--radius:16px;--radius-lg:20px;--sidebar:max(13.75rem,16.67vw);--card-line:var(--line);--shadow:0 1px 2px rgba(0,0,0,.04),0 10px 30px rgba(0,0,0,.06);--fs-xs:max(.75rem,calc(12px));--fs-sm:max(.8125rem,calc(13px));--fs-md:max(.875rem,calc(15px));--fs-lg:max(1rem,calc(18px));--fs-xl:max(1.25rem,calc(24px));--fs-num:max(1.5rem,calc(30px));--fs-title:max(1.75rem,calc(40px))}
*,*::before,*::after{box-sizing:border-box;font-family:"Heebo",system-ui,-apple-system,"Segoe UI","Arial Hebrew",Arial,sans-serif!important}
html,body{margin:0;min-height:100%;background:var(--bg);color:var(--text)}
body{font-size:var(--fs-md);line-height:1.5;font-weight:400;overflow-x:hidden}
button,input,textarea{font:inherit;color:inherit}
button{cursor:pointer;background:none;border:0;padding:0}
[hidden]{display:none!important}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
.masthead{position:fixed;top:0;right:0;bottom:0;z-index:20;width:var(--sidebar);display:flex;flex-direction:column;padding:32px 20px 22px;background:var(--bg);border-left:1px solid var(--line)}
.brand{display:flex;flex-direction:column;align-items:flex-start;gap:6px;margin-bottom:40px;color:var(--text);text-decoration:none}
.brand-name{font-size:var(--fs-xl);font-weight:700;letter-spacing:-.02em}
.brand small{font-size:var(--fs-xs);color:var(--muted)}
.rail-nav{display:grid;gap:3px}
.nav-tab{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:44px;padding:10px 13px;border-radius:10px;color:var(--muted);font-size:var(--fs-md);text-align:right;transition:background .15s,color .15s}
.nav-tab:hover{background:var(--raised);color:var(--text)}
.nav-tab.active{background:var(--accent-soft);color:var(--accent-strong)}
.nav-tab span{min-width:24px;padding:1px 8px;border-radius:99px;background:var(--raised);color:var(--muted);font-size:var(--fs-xs);text-align:center}
.rail-summary{display:flex;flex-direction:column;min-height:0;margin-top:24px}
.rail-summary h3{margin:0 0 10px;padding:0 4px;color:var(--muted);font-size:var(--fs-xs);font-weight:500}
.rail-cards{display:grid;gap:10px;align-content:start;overflow-y:auto;padding-bottom:4px;scrollbar-width:thin;scrollbar-color:var(--line-strong) transparent}
.rail-empty{margin:0;padding:14px;border:1px dashed var(--line);border-radius:14px;color:var(--faint);font-size:var(--fs-xs);line-height:1.5;text-align:center}
.rail-card{display:grid;gap:2px;width:100%;padding:12px;background:var(--surface);border:1px solid var(--card-line);border-radius:14px;text-align:right;transition:border-color .15s,background .15s}
.rail-card:hover{border-color:var(--accent-line);background:var(--raised)}
.rail-card strong,.rail-card small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rail-card strong{font-size:var(--fs-sm);font-weight:600}
.rail-card small{color:var(--muted);font-size:var(--fs-xs)}
.rail-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:10px;padding-top:10px;border-top:1px solid var(--line)}
.rail-stats>div{min-width:0;text-align:center}
.rail-stats b{display:block;font-size:var(--fs-md);font-weight:600;font-variant-numeric:tabular-nums}
.rail-stats span{display:block;color:var(--muted);font-size:var(--fs-xs)}
.connection{margin-top:auto;display:grid;gap:8px;padding-top:16px;border-top:1px solid var(--line)}
.connection label{font-size:var(--fs-xs);color:var(--muted)}
.connection input{width:100%;height:40px;padding:0 12px;background:#fff;border:1px solid var(--line-strong);border-radius:10px;font-size:var(--fs-sm);text-align:right}
.connection input:focus{border-color:var(--accent)}
.small-button{display:flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);font-size:var(--fs-sm);font-weight:500}
.small-button:hover{border-color:var(--accent-line)}
.status-dot{width:8px;height:8px;border-radius:50%;background:var(--faint)}
.connection.connected .status-dot{background:var(--success)}
.connection.connected .connection-label{font-size:0}
.connection.connected .connection-label::after{content:"מחובר";font-size:var(--fs-sm)}
main{margin-right:var(--sidebar);padding:0 36px 48px;display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-content:start}
.topbar{position:sticky;top:0;z-index:10;display:flex;align-items:center;min-height:72px;margin:0 -36px 8px;padding:14px 36px;background:rgba(255,255,255,.92);border-bottom:1px solid var(--line);backdrop-filter:blur(8px);color:var(--muted);font-size:var(--fs-sm)}
.hero{padding:8px 0 0}
.hero h1{margin:0;font-size:var(--fs-title);font-weight:600;line-height:1.18}
.hero h1 .dot{color:var(--accent)}
.hero p{margin:6px 0 0;color:var(--muted);font-size:var(--fs-md)}
.rail-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));padding:22px 18px;background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-lg);box-shadow:var(--shadow)}
.rail-metrics>div{display:flex;flex-direction:column;min-width:0;padding:0 18px}
.rail-metrics>div+div{border-inline-start:1px solid var(--line)}
.rail-metrics span{order:1;color:var(--muted);font-size:var(--fs-sm)}
.rail-metrics strong{order:2;margin:8px 0 4px;font-size:var(--fs-num);font-weight:600;font-variant-numeric:tabular-nums;line-height:1.2}
.rail-metrics small{order:3;color:var(--faint);font-size:var(--fs-xs)}
#automationForm{min-width:0}
.workspace{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:16px;align-items:start}
.builder{display:grid;gap:16px;min-width:0}
.panel{position:relative;min-width:0;padding:24px;background:var(--surface);border:1px solid var(--card-line);border-radius:var(--radius-lg);box-shadow:var(--shadow)}
.panel-heading{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:0 0 20px}
.panel-heading>div{flex:1;min-width:0}
.panel-heading h2{margin:0;font-size:var(--fs-xl);font-weight:600;line-height:1.25}
.step{display:inline-grid;place-items:center;min-width:36px;height:28px;padding:0 10px;border-radius:99px;background:var(--accent-soft);color:var(--accent-strong);font-size:var(--fs-sm);font-weight:600;font-variant-numeric:tabular-nums}
.text-button{padding:8px 12px;border-radius:10px;background:var(--raised);color:var(--muted);font-size:var(--fs-sm)}
.text-button:hover{color:var(--text)}
.content-filter{display:flex;gap:6px;margin:0;padding:0;border:0}
.content-filter label{position:relative;cursor:pointer}
.content-filter input,.segmented input,.switch-row input{position:absolute;opacity:0;pointer-events:none}
.content-filter span{display:grid;place-items:center;min-height:36px;padding:0 14px;border-radius:10px;background:var(--raised);color:var(--muted);font-size:var(--fs-sm);white-space:nowrap}
.content-filter input:checked+span{background:var(--accent-soft);color:var(--accent-strong);font-weight:600}
.content-filter input:focus-visible+span,.segmented input:focus-visible+span{outline:2px solid var(--accent)}
.media-grid{display:flex;gap:10px;min-height:112px;padding:2px 2px 10px;overflow-x:auto;scrollbar-width:thin;scrollbar-color:var(--line-strong) transparent}
.media-card{position:relative;flex:0 0 112px;height:104px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:10px;overflow:hidden;border:1px solid var(--line);border-radius:14px;background:var(--raised);color:var(--text);text-align:center;cursor:pointer}
.media-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.media-card.selected{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}
.media-checkbox{position:absolute;inset:0;z-index:2;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}
.selection-check{position:absolute;top:8px;right:8px;z-index:1;display:grid;place-items:center;width:20px;height:20px;border:1px solid var(--line-strong);border-radius:6px;background:#fff;font-size:var(--fs-xs)}
.media-card.selected .selection-check{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.media-badge{position:absolute;top:8px;left:8px;z-index:1;padding:2px 8px;border-radius:99px;background:#fff;color:var(--text);font-size:var(--fs-xs)}
.media-caption{position:absolute;inset:auto 0 0;z-index:1;padding:28px 8px 8px;background:linear-gradient(transparent,rgba(0,0,0,.85));font-size:var(--fs-xs);line-height:1.35;text-align:right}
.all-symbol{font-size:var(--fs-num);line-height:1;color:var(--accent-strong)}
.all-media strong{font-size:var(--fs-sm)}
.all-media small{color:var(--muted);font-size:var(--fs-xs);line-height:1.3}
.empty-media{flex:1 0 220px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px;border:1px dashed var(--line);border-radius:14px;color:var(--muted);text-align:center}
.empty-media p{margin:4px 0 0;font-size:var(--fs-xs);line-height:1.5}
.selection-line{margin-top:8px;color:var(--muted);font-size:var(--fs-xs)}
.selection-line strong{color:var(--text);font-weight:500}
.field-grid{display:grid;gap:16px}
.field-grid.two{grid-template-columns:minmax(0,1fr) 260px;align-items:end}
.private-grid{grid-template-columns:minmax(0,1fr) 280px}
.field,fieldset.field{display:grid;gap:8px;min-width:0;margin:0;padding:0;border:0}
.field>span,.field legend{padding:0;font-size:var(--fs-sm);font-weight:500}
.field>span small{margin-right:6px;color:var(--muted);font-weight:400}
.field input:not([type=radio]):not([type=checkbox]),.field textarea{width:100%;min-height:44px;padding:11px 14px;background:#fff;border:1px solid var(--line-strong);border-radius:12px;color:var(--text);font-size:var(--fs-md);line-height:1.5;resize:none}
.field textarea{field-sizing:content;height:auto!important}
.field input::placeholder,.field textarea::placeholder{color:var(--faint)}
.field input:focus,.field textarea:focus{outline:0;border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}
.comment-reply-option:first-of-type,.private-panel textarea,.gate-panel textarea{border-color:var(--accent)!important}
#followPrompt,#messageTemplate{min-height:96px}
.segmented{display:grid;grid-template-columns:1fr 1fr;gap:4px;height:44px;padding:4px;background:var(--raised);border:1px solid var(--line);border-radius:12px}
.segmented label{cursor:pointer}
.segmented span{display:grid;place-items:center;height:100%;border-radius:8px;color:var(--muted);font-size:var(--fs-sm);font-weight:500}
.segmented input:checked+span{background:var(--accent-soft);color:var(--accent-strong)}
.tokens{display:flex;flex-wrap:wrap;align-items:center;gap:6px;color:var(--muted);font-size:var(--fs-xs)}
.tokens button{padding:4px 10px;border-radius:8px;background:var(--raised);color:var(--accent-strong);font-size:var(--fs-xs)}
.switch-row{display:flex;align-items:center;gap:12px;cursor:pointer}
.switch{position:relative;flex:none;width:46px;height:26px;border-radius:99px;background:#cfcfcf;transition:background .2s}
.switch::after{content:"";position:absolute;top:3px;right:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .2s}
.switch-row input:checked+.switch{background:var(--accent)}
.switch-row input:checked+.switch::after{transform:translateX(-20px)}
.switch-row input:focus-visible+.switch{outline:2px solid var(--accent);outline-offset:2px}
.switch-row b{display:block;font-size:var(--fs-md);font-weight:500}
.switch-row small{display:block;color:var(--muted);font-size:var(--fs-xs)}
.gate-fields{display:grid;grid-template-columns:minmax(0,1fr) 240px;gap:16px;margin-top:16px;transition:opacity .2s}
.gate-fields.disabled{opacity:.35;pointer-events:none}
.public-panel.story-disabled .field-grid{opacity:.32;pointer-events:none}
.preview-column{position:sticky;top:88px}
.preview-sticky{display:grid;gap:16px}
.preview-label{display:none}
.publish-card{order:-1;display:grid;gap:12px;padding:20px;background:var(--surface);border:1px solid var(--card-line);border-radius:var(--radius-lg);box-shadow:var(--shadow)}
.primary-button,.secondary-button{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;border-radius:12px;font-size:var(--fs-md);font-weight:600}
.primary-button{height:48px;background:var(--accent);color:var(--accent-ink);box-shadow:0 10px 30px rgba(255,111,0,.28);transition:background .15s,transform .15s}
.primary-button:hover{background:var(--accent-hover)}
.primary-button:active{transform:translateY(1px)}
.primary-button:disabled{opacity:.5;cursor:wait}
.primary-button i{font-style:normal}
.secondary-button{height:44px;border:1px solid var(--line);color:var(--text)}
.secondary-button:hover{background:var(--raised)}
.phone{position:relative;width:100%;max-width:300px;min-height:520px;margin:0 auto;padding:16px 14px 24px;border:8px solid #0e0e10;border-radius:44px;background:#fff;color:#0a0a0a;box-shadow:var(--shadow)}
.phone::before{content:"9:41";display:block;padding:0 10px 12px;font-size:var(--fs-xs);font-weight:600;direction:ltr}
.phone-top{display:grid;grid-template-columns:24px 36px 1fr;align-items:center;gap:8px;padding:0 2px 10px;border-bottom:1px solid #e2e1de}
.phone-top>span{font-size:var(--fs-xl);color:#6e6e72}
.phone-top .avatar{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:var(--accent);color:var(--accent-ink);font-size:var(--fs-md);font-weight:700}
.phone-top b,.phone-top small{display:block;font-size:var(--fs-xs)}
.phone-top small{color:#6e6e72}
.chat-date{margin:12px 0;color:#8a8a8e;font-size:var(--fs-xs);text-align:center}
.bubble{max-width:80%;margin:8px 0;padding:9px 12px;border-radius:16px;font-size:var(--fs-sm);line-height:1.45;word-break:break-word}
.bubble.incoming{margin-right:auto;background:#efefef}
.bubble.outgoing{margin-left:auto;background:var(--accent-soft);border:1px solid var(--accent-line);white-space:normal}
.comment-preview{margin:4px 0 14px;padding:8px 10px;border-right:3px solid var(--accent);border-radius:8px;background:#f7f7f7;font-size:var(--fs-xs);line-height:1.5}
.preview-gate{display:flex;align-items:center;gap:8px;width:max-content;max-width:100%;margin:12px auto 0;padding:6px 12px;border-radius:99px;background:var(--accent-soft);color:var(--accent-strong);font-size:var(--fs-xs)}
.preview-gate span{display:grid;place-items:center;width:16px;height:16px;border-radius:50%;background:var(--accent);color:#0a0a0a;font-size:11px}
.rules-section{align-self:start;padding:20px;background:var(--surface);border:1px solid var(--card-line);border-radius:var(--radius-lg);box-shadow:var(--shadow)}
.section-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 8px}
.section-title p{display:none}
.section-title h2{margin:0;font-size:var(--fs-xl);font-weight:600}
.rule-row{position:relative;display:grid;grid-template-columns:56px minmax(0,1fr) auto;grid-template-rows:auto auto auto;column-gap:12px;row-gap:2px;align-items:center;padding:14px 0;border-top:1px solid var(--line)}
.rule-thumb{grid-column:1;grid-row:1/4;display:grid;place-items:center;width:56px;height:56px;border-radius:12px;background:var(--raised);color:var(--accent-strong);font-size:var(--fs-xl);object-fit:cover}
.rule-multi{position:absolute;top:8px;right:38px;padding:1px 7px;border-radius:99px;background:var(--accent);color:var(--accent-ink);font-size:var(--fs-xs);font-weight:600}
.rule-index{display:none}
.rule-copy{grid-column:2;grid-row:1;min-width:0}
.rule-copy strong,.rule-copy small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rule-copy strong{font-size:var(--fs-md);font-weight:600}
.rule-copy small{color:var(--muted);font-size:var(--fs-xs)}
.rule-match{grid-column:2;grid-row:2;color:var(--muted);font-size:var(--fs-xs)}
.rule-match strong{color:var(--text);font-weight:500}
.rule-match small{margin-right:6px}
.rule-status{grid-column:2;grid-row:3;color:var(--muted);font-size:var(--fs-xs)}
.rule-status::before{content:"";display:inline-block;width:8px;height:8px;margin-left:6px;border-radius:50%;background:var(--faint)}
.rule-status.active::before{background:var(--success)}
.rule-count{grid-column:3;grid-row:1/3;text-align:center}
.rule-count strong{display:block;font-size:var(--fs-lg);font-weight:600}
.rule-count span{color:var(--muted);font-size:var(--fs-xs)}
.rule-actions{grid-column:3;grid-row:3;display:flex;justify-content:flex-end;gap:4px}
.rule-actions button{display:grid;place-items:center;width:32px;height:32px;border-radius:8px}
.rule-actions button:hover{background:var(--raised)}
.rule-actions img{display:block;width:16px;height:16px}
.empty-rules{padding:28px 4px;color:var(--muted);font-size:var(--fs-sm);text-align:center}
.drawer-backdrop{position:fixed;inset:0 var(--sidebar) 0 0;z-index:18;background:rgba(0,0,0,.35);backdrop-filter:blur(2px);opacity:0;transition:opacity .2s}
.drawer-backdrop.open{opacity:1}
.app-drawer{position:fixed;top:0;bottom:0;right:var(--sidebar);z-index:19;display:flex;flex-direction:column;width:min(480px,92vw);background:var(--surface);border-left:1px solid var(--line);box-shadow:-12px 0 64px rgba(0,0,0,.18);transform:translateX(102%);transition:transform .24s ease}
.app-drawer.open{transform:none}
.drawer-header{display:flex;align-items:center;justify-content:space-between;flex:0 0 auto;min-height:72px;padding:0 24px;border-bottom:1px solid var(--line)}
.drawer-header h2{margin:0;font-size:var(--fs-xl);font-weight:600}
.drawer-close{width:36px;height:36px;border-radius:10px;background:var(--raised);font-size:var(--fs-xl);line-height:1}
.drawer-close:hover{background:var(--accent);color:#0a0a0a}
.drawer-body{min-height:0;overflow-y:auto;padding:20px 24px 32px}
.drawer-subtitle{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.drawer-subtitle h3{margin:0;font-size:var(--fs-lg);font-weight:600}
.drawer-subtitle span{color:var(--muted);font-size:var(--fs-xs)}
.analytics-grid{display:grid;grid-template-columns:1fr;gap:12px}
.analytics-grid>div{display:grid;gap:6px;padding:18px;background:var(--raised);border:1px solid var(--line);border-radius:14px}
.analytics-grid span,.analytics-grid small{display:block;color:var(--muted);font-size:var(--fs-xs)}
.analytics-grid strong{display:block;font-size:var(--fs-title);font-weight:600;font-variant-numeric:tabular-nums;line-height:1.1}
.analytics-empty{margin-top:12px;padding:28px;border:1px dashed var(--line);border-radius:14px;color:var(--muted);text-align:center}
.analytics-empty span{color:var(--accent-strong);font-size:var(--fs-xl)}
.analytics-empty p{margin:8px 0 0;font-size:var(--fs-sm)}
.toast{position:fixed;left:24px;bottom:24px;z-index:30;max-width:360px;padding:12px 16px;border:1px solid #0a0a0a;border-radius:12px;background:#0a0a0a;color:#fff;font-size:var(--fs-sm);box-shadow:var(--shadow);transform:translateY(120px);opacity:0;transition:transform .25s,opacity .25s}
.toast.visible{transform:none;opacity:1}
.toast.error{background:var(--accent);border-color:var(--accent);color:#0a0a0a}
@media(min-width:1651px){main{grid-template-columns:minmax(0,1fr) 340px}.topbar,.hero,.rail-metrics{grid-column:1/-1}#automationForm{grid-column:1;grid-row:4}.rules-section{grid-column:2;grid-row:4}}
@media(min-width:1051px) and (max-width:1650px){.rules-section{display:none}.workspace{grid-template-columns:minmax(0,1fr) 300px}.app-drawer{width:min(460px,92vw)}}
@media(max-width:1050px){.rail-summary{display:none}.masthead{position:sticky;inset:0 0 auto;width:auto;flex-direction:row;flex-wrap:wrap;align-items:center;gap:8px 16px;padding:12px 16px;border-left:0;border-bottom:1px solid var(--line)}.brand{flex-direction:row;align-items:center;margin:0}.brand-name{font-size:var(--fs-lg)}.brand small{display:none}.rail-nav{display:flex;gap:4px;margin-inline-start:auto;overflow-x:auto}.nav-tab{width:auto;min-height:40px;gap:8px;white-space:nowrap}.connection{flex:1 1 100%;display:flex;align-items:center;margin:0;padding:0;border-top:0}.connection label{display:none}.connection input{flex:1}.small-button{flex:0 0 auto}main{margin-right:0;padding:0 16px 32px}.topbar{position:static;min-height:48px;margin:0 -16px;padding:10px 16px}.rail-metrics{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:20px}.rail-metrics>div:nth-child(3){border-inline-start:0}.workspace{grid-template-columns:1fr}.preview-column{position:static;width:100%;max-width:360px;margin:0 auto}.app-drawer,.drawer-backdrop{right:0}.app-drawer{width:min(420px,94vw)}.rules-section{display:block}}
@media(max-width:640px){.hero h1{font-size:var(--fs-xl)}.panel{padding:16px}.rail-metrics>div{padding:0 12px}.field-grid.two,.private-grid,.gate-fields{grid-template-columns:1fr}.content-filter{width:100%}.content-filter label{flex:1}.rule-row{grid-template-columns:48px minmax(0,1fr) auto}.rule-thumb{width:48px;height:48px}.rule-multi{right:30px}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition:none!important}}
`;

const JAVASCRIPT = String.raw`
(function(){
  'use strict';
  var STORY_MEDIA_ID='__stories__';
  var state={token:sessionStorage.getItem('dmeAdminToken')||'',media:[],mediaError:'',automations:[],selectedMediaIds:['*'],mediaMode:'all',triggerSource:'comment',contentFilter:'feed'};
  var byId=function(id){return document.getElementById(id)};
  var form=byId('automationForm');
  var tokenInput=byId('adminToken');
  tokenInput.value=state.token;
  function toast(message,isError){var el=byId('toast');el.textContent=message;el.className='toast visible'+(isError?' error':'');clearTimeout(toast.timer);toast.timer=setTimeout(function(){el.className='toast'},3200)}
  async function api(path,options){options=options||{};var headers=Object.assign({'Authorization':'Bearer '+state.token},options.headers||{});if(options.body)headers['Content-Type']='application/json';var response=await fetch(path,Object.assign({},options,{headers:headers}));var payload=await response.json().catch(function(){return {error:'תגובה לא תקינה מהשרת'}});if(!response.ok)throw new Error(payload.error||'הפעולה נכשלה');return payload}
  function setConnected(value){byId('connectionBox').classList.toggle('connected',value);var label=byId('connectButton').querySelector('.connection-label');if(label)label.textContent=value?'מחובר':'חיבור'}
  function text(value,fallback){return typeof value==='string'&&value.trim()?value.trim():fallback}
  function mediaImage(item){return item.thumbnailUrl||item.mediaUrl||''}
  function isMediaSelected(id){return state.selectedMediaIds.indexOf(id)>=0}
  function selectionMark(selected){return '<span class="selection-check" aria-hidden="true">'+(selected?'✓':'')+'</span>'}
  function mediaCheckbox(id,selected,label){return '<input class="media-checkbox" type="checkbox" name="mediaIds" value="'+escapeHtml(id)+'" aria-label="'+escapeHtml(label)+'" '+(selected?'checked':'')+'>'+selectionMark(selected)}
  function syncContentFilter(){document.querySelectorAll('input[name="contentFilter"]').forEach(function(input){input.checked=input.value===state.contentFilter})}
  function itemMatchesFilter(item){var f=state.contentFilter;return f==='feed'?item.source==='feed':f==='reel'?item.source==='reel':item.source==='story'||item.source==='highlight'}
  function renderMedia(){var grid=byId('mediaGrid');grid.innerHTML='';syncContentFilter();if(state.contentFilter==='feed'){var allSelected=state.mediaMode==='all';var all=document.createElement('label');all.className='media-card all-media'+(allSelected?' selected':'');all.dataset.mediaId='*';all.innerHTML=mediaCheckbox('*',allSelected,'בחירת כל הפוסטים')+'<span class="all-symbol">∞</span><strong>כל הפוסטים</strong><small>פוסטים ו-Reels</small>';grid.appendChild(all)}else if(state.contentFilter==='story'&&state.mediaMode==='stories'){var stories=document.createElement('label');stories.className='media-card all-media story-media selected';stories.dataset.mediaId=STORY_MEDIA_ID;stories.innerHTML=mediaCheckbox(STORY_MEDIA_ID,true,'בחירת כל תגובות הסטורי')+'<span class="all-symbol">◉</span><strong>כל הסטוריז</strong><small>אוטומציה קיימת</small>';grid.appendChild(stories)}var visible=state.media.filter(function(item){return itemMatchesFilter(item)});visible.forEach(function(item){var selected=state.mediaMode==='selected'&&isMediaSelected(item.id);var fallback=item.source==='story'?'סטורי פעיל':item.source==='highlight'?'היילייט שנלמד':'פוסט Instagram';var card=document.createElement('label');card.className='media-card'+(item.source==='story'?' active-story':'')+(item.source==='highlight'?' learned-highlight':'')+(selected?' selected':'');card.dataset.mediaId=item.id;card.insertAdjacentHTML('beforeend',mediaCheckbox(item.id,selected,'בחירת '+text(item.caption,fallback)));var image=mediaImage(item);if(image){var img=document.createElement('img');img.src=image;img.alt=text(item.caption,fallback);img.loading='lazy';card.appendChild(img)}var badge=document.createElement('span');badge.className='media-badge';badge.textContent=item.source==='story'||item.source==='highlight'?'סטורי':item.source==='reel'?'ריל':item.mediaType==='CAROUSEL_ALBUM'?'קרוסלה':'פוסט';card.appendChild(badge);var caption=document.createElement('span');caption.className='media-caption';caption.textContent=text(item.caption,fallback).slice(0,72);card.appendChild(caption);grid.appendChild(card)});if(!visible.length){var hint=document.createElement('div');hint.className='empty-media';var message=state.mediaError?'התוכן עדיין לא זמין: '+state.mediaError:state.contentFilter==='story'?'אין כרגע סטורי פעיל בחשבון.':state.contentFilter==='reel'?(state.token?'לא נמצאו רילים בחשבון Instagram.':'הכנס מפתח ניהול ולחץ חיבור כדי לטעון תוכן.'):(state.token?'לא נמצאו פוסטים בחשבון Instagram.':'הכנס מפתח ניהול ולחץ חיבור כדי לטעון תוכן.');var symbol=document.createElement('span');symbol.textContent=state.contentFilter==='story'?'◉':'◎';var copy=document.createElement('p');copy.textContent=message;hint.append(symbol,copy);grid.appendChild(hint)}}
  function selectedMedia(){return state.media.find(function(item){return item.id===state.selectedMediaIds[0]})}
  function updateSourceUi(){var story=state.triggerSource==='story_reply';byId('responseTitle').textContent=story?'בסטורי אין תגובה פומבית':'מה נכתוב בתגובה הפומבית?';document.querySelector('.public-panel').classList.toggle('story-disabled',story);document.querySelectorAll('.comment-reply-option').forEach(function(area){area.disabled=story});byId('previewPublicReply').hidden=story}
  function updateSelectedMediaLabel(){var item=selectedMedia();byId('selectedMediaLabel').textContent=state.mediaMode==='stories'?'כל תגובות הסטורי':state.mediaMode==='all'?'כל הפוסטים':state.selectedMediaIds.length>1?state.selectedMediaIds.length+' אייטמים נבחרו':state.selectedMediaIds.length?text(item&&item.caption,item&&item.source==='story'?'סטורי פעיל':item&&item.source==='highlight'?'סטורי':item&&item.source==='reel'?'ריל':'פוסט Instagram').slice(0,80):'לא נבחר אייטם';updateSourceUi()}
  function selectMedia(id){if(id==='*'){state.mediaMode='all';state.triggerSource='comment';state.selectedMediaIds=['*']}else if(id===STORY_MEDIA_ID){state.mediaMode='stories';state.triggerSource='story_reply';state.selectedMediaIds=['*']}else{var item=state.media.find(function(value){return value.id===id});var source=item&&(item.source==='story'||item.source==='highlight')?'story_reply':'comment';if(state.triggerSource!==source){state.selectedMediaIds=[]}state.triggerSource=source;state.mediaMode='selected';state.selectedMediaIds=state.selectedMediaIds.filter(function(value){return value!=='*'&&value!==STORY_MEDIA_ID});if(isMediaSelected(id)){state.selectedMediaIds=state.selectedMediaIds.filter(function(value){return value!==id})}else{state.selectedMediaIds.push(id)}}updateSelectedMediaLabel();renderMedia()}
  function setContentFilter(value){state.contentFilter=value;if(value==='feed'){if(state.triggerSource==='story_reply'){state.mediaMode='all';state.triggerSource='comment';state.selectedMediaIds=['*']}}else{var valid=state.media.filter(itemMatchesFilter).map(function(item){return item.id});state.selectedMediaIds=state.mediaMode==='selected'?state.selectedMediaIds.filter(function(id){return valid.indexOf(id)>=0}):[];state.mediaMode='selected';state.triggerSource=value==='story'?'story_reply':'comment'}updateSelectedMediaLabel();renderMedia()}
  function ruleMediaIds(rule){return Array.isArray(rule.mediaIds)&&rule.mediaIds.length?rule.mediaIds:[rule.mediaId||'*']}
  function actionIcon(type){return '<img src="/icons/action-'+(type==='edit'?'delete':'edit')+'.svg" alt="">'}
  function ruleMediaLabel(rule,ids,media){return rule.mediaMode==='stories'?'כל הסטוריז':ids.indexOf('*')>=0?'כל הפוסטים':ids.length>1?ids.length+' אייטמים':text(media&&media.caption,rule.triggerSource==='story_reply'?'סטורי פעיל':'אייטם ספציפי').slice(0,42)}
  function ruleMedia(rule){var ids=ruleMediaIds(rule);return ruleMediaLabel(rule,ids,state.media.find(function(item){return ids.indexOf(item.id)>=0}))}
  function renderRailSummary(){var box=byId('railCards');if(!box)return;var active=state.automations.filter(function(rule){return rule.enabled});box.innerHTML='';if(!active.length){box.innerHTML='<p class="rail-empty">'+(state.automations.length?'אין אוטומציות פעילות כרגע.':'אחרי החיבור יופיעו כאן האוטומציות הפעילות.')+'</p>';return}active.forEach(function(rule){var card=document.createElement('button');card.type='button';card.className='rail-card';card.dataset.editRule=rule.id;card.setAttribute('aria-label','עריכת האוטומציה '+rule.keywords.join(', '));card.innerHTML='<strong>'+escapeHtml(rule.keywords.join(', '))+'</strong><small>'+escapeHtml(ruleMedia(rule))+'</small><div class="rail-stats"><div><b>'+Number(rule.commentCount||0).toLocaleString('he-IL')+'</b><span>הגיבו</span></div><div><b>'+Number(rule.sentCount||0).toLocaleString('he-IL')+'</b><span>נשלח</span></div><div><b>'+Number(rule.followerCount||0).toLocaleString('he-IL')+'</b><span>עוקבים</span></div></div>';box.appendChild(card)})}
  function renderRuleList(list,rules){list.innerHTML='';if(!rules.length){list.innerHTML='<div class="empty-rules">עדיין אין אוטומציות. אפשר ליצור את הראשונה ממש כאן.</div>';return}rules.forEach(function(rule,index){var row=document.createElement('article');row.className='rule-row';var ids=ruleMediaIds(rule);var media=state.media.find(function(item){return ids.indexOf(item.id)>=0});var image=media&&mediaImage(media);if(image){var thumb=document.createElement('img');thumb.className='rule-thumb';thumb.src=image;thumb.alt=text(media.caption,rule.triggerSource==='story_reply'?'תמונת הסטורי':'תמונת הפוסט');thumb.loading='lazy';row.appendChild(thumb)}else{var placeholder=document.createElement('div');placeholder.className='rule-thumb rule-thumb-placeholder';placeholder.textContent=rule.mediaMode==='stories'?'◉':ids.indexOf('*')>=0?'∞':'◎';placeholder.setAttribute('aria-hidden','true');row.appendChild(placeholder)}if(ids.length>1){var multi=document.createElement('span');multi.className='rule-multi';multi.textContent='+'+(ids.length-1);multi.setAttribute('aria-label',ids.length+' אייטמים נבחרו');row.appendChild(multi)}var mediaLabel=ruleMediaLabel(rule,ids,media);var cells=[['rule-index',String(index+1).padStart(2,'0')],['rule-copy','<strong>'+escapeHtml(rule.keywords.join(', '))+'</strong><small>'+escapeHtml(mediaLabel)+'</small>'],['rule-match','<strong>'+escapeHtml(rule.matchMode==='contains'?'טקסט מכיל':'התאמה מדויקת')+'</strong><small>'+(rule.followGate?'בדיקת עוקב פעילה':'ללא בדיקת עוקב')+'</small>'],['rule-status '+(rule.enabled?'active':''),rule.enabled?'פעילה':'כבויה']];cells.forEach(function(cell){var div=document.createElement('div');div.className=cell[0];div.innerHTML=cell[1];row.appendChild(div)});var count=document.createElement('div');count.className='rule-count';count.innerHTML='<strong>'+Number(rule.commentCount||0).toLocaleString('he-IL')+'</strong><span>'+(rule.triggerSource==='story_reply'?'תגובות לסטורי':'תגובות')+'</span>';row.appendChild(count);var actions=document.createElement('div');actions.className='rule-actions';var edit=document.createElement('button');edit.type='button';edit.innerHTML=actionIcon('edit');edit.dataset.edit=rule.id;edit.title='עריכה';edit.setAttribute('aria-label','עריכת האוטומציה '+rule.keywords.join(', '));var del=document.createElement('button');del.type='button';del.innerHTML=actionIcon('delete');del.className='delete';del.dataset.delete=rule.id;del.title='מחיקה';del.setAttribute('aria-label','מחיקת האוטומציה '+rule.keywords.join(', '));actions.append(edit,del);row.appendChild(actions);list.appendChild(row)})}
  function renderRules(){renderRuleList(byId('rulesList'),state.automations.slice(0,4));renderRuleList(byId('rulesListAll'),state.automations);renderRailSummary()}
  function updateMetrics(){var active=state.automations.filter(function(rule){return rule.enabled}).length;var comments=state.automations.reduce(function(total,rule){return total+Number(rule.commentCount||0)},0);var messages=state.automations.reduce(function(total,rule){return total+Number(rule.sentCount||0)},0);var followers=state.automations.reduce(function(total,rule){return total+Number(rule.followerCount||0)},0);var failed=state.automations.reduce(function(total,rule){return total+Number(rule.failedCount||0)},0);byId('metricActive').textContent=active;byId('metricTotal').textContent='מתוך '+state.automations.length;byId('metricMessages').textContent=messages.toLocaleString('he-IL');byId('metricGate').textContent=followers.toLocaleString('he-IL');byId('metricNoReply').textContent=failed.toLocaleString('he-IL');byId('navRuleCount').textContent=state.automations.length;byId('analyticsComments').textContent=comments.toLocaleString('he-IL');byId('analyticsMessages').textContent=messages.toLocaleString('he-IL');byId('analyticsConversion').textContent=comments?Math.round(messages/comments*100)+'%':'0%'}
  function escapeHtml(value){return String(value).replace(/[&<>"']/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]})}
  function updatePreview(){var keyword=byId('keywords').value.split(/[,\n]/)[0].trim()||'לינק';var url=byId('targetUrl').value.trim()||'https://example.com/...';var message=byId('messageTemplate').value||'הנה הלינק שביקשת {{url}}';var publicReply=byId('commentReply').value||'תודה על התגובה, {{username}}';message=message.replaceAll('{{username}}','@username').replaceAll('{{keyword}}',keyword).replaceAll('{{url}}',url);publicReply=publicReply.replaceAll('{{username}}','@username').replaceAll('{{keyword}}',keyword);byId('previewKeyword').textContent=keyword;byId('previewPublicReply').innerHTML='<b>your_account</b> '+escapeHtml(publicReply);byId('previewMessage').innerHTML='';message.split('\n').forEach(function(line,index){if(index)byId('previewMessage').appendChild(document.createElement('br'));byId('previewMessage').appendChild(document.createTextNode(line))});byId('previewGate').hidden=!byId('followGate').checked;byId('gateFields').classList.toggle('disabled',!byId('followGate').checked)}
  function designVw(value){var base=window.innerWidth<=640?390:1920;return value/base*100+'vw'}
  function autoSizeTextareas(){document.querySelectorAll('.field textarea').forEach(function(area){if(area.classList.contains('comment-reply-option')){area.style.height=designVw(30);return}area.style.height='auto';var contentVw=area.scrollHeight/window.innerWidth*100;var base=window.innerWidth<=640?390:1920;area.style.height=Math.max(55/base*100,contentVw)+'vw'})}
  function resetForm(){form.reset();byId('automationId').value='';state.mediaMode='all';state.triggerSource='comment';state.contentFilter='feed';state.selectedMediaIds=['*'];byId('commentReply').value='תודה על התגובה, {{username}} - שולח לך את הפרטים בפרטי';byId('messageTemplate').value='היי {{username}}, הנה הלינק שביקשת\n{{url}}';byId('followPrompt').value='כמעט שם. עקוב אחרי @your_account ואז לחץ על הכפתור כדי לקבל את הלינק.';byId('followButton').value='עקבתי';byId('enabled').checked=true;byId('followGate').checked=true;updateSelectedMediaLabel();renderMedia();updatePreview();autoSizeTextareas();document.querySelector('.builder').scrollTo({top:0,behavior:'smooth'})}
  function editRule(id){var rule=state.automations.find(function(item){return item.id===id});if(!rule)return;byId('automationId').value=rule.id;byId('keywords').value=rule.keywords.join(', ');byId('targetUrl').value=rule.targetUrl;byId('messageTemplate').value=rule.messageTemplate;var publicOptions=rule.commentReplyOptions||[];document.querySelectorAll('.comment-reply-option').forEach(function(area,index){area.value=publicOptions[index]||''});byId('followGate').checked=rule.followGate;byId('followPrompt').value=rule.followPrompt;byId('followButton').value=rule.followButton;byId('enabled').checked=rule.enabled;var radio=form.querySelector('input[name="matchMode"][value="'+rule.matchMode+'"]');if(radio)radio.checked=true;state.mediaMode=rule.mediaMode||((ruleMediaIds(rule).indexOf('*')>=0)?'all':'selected');state.triggerSource=rule.triggerSource||'comment';state.selectedMediaIds=state.mediaMode==='stories'?['*']:ruleMediaIds(rule).slice();var selected=state.media.find(function(item){return state.selectedMediaIds.indexOf(item.id)>=0});state.contentFilter=state.triggerSource==='comment'?(selected&&selected.source==='reel'?'reel':'feed'):'story';updateSelectedMediaLabel();renderMedia();updatePreview();autoSizeTextareas();document.querySelector('.builder').scrollTo({top:0,behavior:'smooth'})}
  function makeId(){var existing=byId('automationId').value.trim();if(existing)return existing;var first=state.selectedMediaIds[0]||'*';var media=state.mediaMode==='stories'?'stories':first==='*'?'all':first.replace(/[^a-z0-9]/gi,'').slice(-8)||'item';return 'rule-'+media+'-'+Date.now().toString(36)}
  async function connect(){var token=tokenInput.value.trim();if(!token){toast('צריך להזין מפתח ניהול',true);tokenInput.focus();return}state.token=token;sessionStorage.setItem('dmeAdminToken',token);byId('connectButton').disabled=true;try{var rules=await api('/api/automations');state.automations=rules.automations||[];setConnected(true);renderRules();var mediaResult=await Promise.allSettled([api('/api/instagram/media')]);if(mediaResult[0].status==='fulfilled'){state.media=mediaResult[0].value.media||[];state.mediaError='';toast('החיבור הצליח - התוכן והאוטומציות נטענו')}else{state.media=[];state.mediaError=mediaResult[0].reason.message;toast('הניהול זמין. את פוסטי Instagram נטען אחרי חיבור Meta',true)}renderMedia();renderRules()}catch(error){setConnected(false);toast(error.message,true)}finally{byId('connectButton').disabled=false}}
  form.addEventListener('submit',async function(event){event.preventDefault();if(!state.token){toast('יש להתחבר עם מפתח ניהול לפני השמירה',true);return}if(!state.selectedMediaIds.length){toast('צריך לבחור לפחות אייטם אחד',true);byId('mediaGrid').focus();return}var keywords=byId('keywords').value.split(/[,\n]/).map(function(value){return value.trim()}).filter(Boolean);if(!keywords.length){toast('צריך להגדיר לפחות מילת תגובה אחת',true);byId('keywords').focus();return}var url=byId('targetUrl').value.trim();if(!url){toast('צריך להוסיף לינק',true);byId('targetUrl').focus();return}var payload={id:makeId(),enabled:byId('enabled').checked,mediaId:state.selectedMediaIds[0],mediaIds:state.selectedMediaIds.slice(),mediaMode:state.mediaMode,triggerSource:state.triggerSource,keywords:keywords,matchMode:form.querySelector('input[name="matchMode"]:checked').value,targetUrl:url,messageTemplate:byId('messageTemplate').value.trim(),followGate:byId('followGate').checked,followPrompt:byId('followPrompt').value.trim()||'עקוב ואז לחץ שוב',followButton:byId('followButton').value.trim()||'עקבתי - בדיקה',followCheckFailOpen:true};byId('saveButton').disabled=true;try{await api('/api/automations',{method:'POST',body:JSON.stringify(payload)});var rules=await api('/api/automations');state.automations=rules.automations||[];renderRules();byId('automationId').value=payload.id;toast(state.triggerSource==='story_reply'?'האוטומציה לסטורי או להיילייט נשמרה':'האוטומציה נשמרה בהצלחה')}catch(error){toast(error.message,true)}finally{byId('saveButton').disabled=false}});
  var rawApi=api;api=function(path,options){if(path==='/api/automations'&&options&&options.body){var body=JSON.parse(options.body);body.commentReplyOptions=state.triggerSource==='story_reply'?[]:Array.prototype.map.call(document.querySelectorAll('.comment-reply-option'),function(area){return area.value.trim()}).filter(Boolean);options.body=JSON.stringify(body)}return rawApi(path,options)};
  byId('mediaGrid').addEventListener('change',function(event){var input=event.target.closest('.media-checkbox');if(input)selectMedia(input.value)});
  document.querySelectorAll('input[name="contentFilter"]').forEach(function(input){input.addEventListener('change',function(){if(input.checked)setContentFilter(input.value)})});
  async function handleRuleAction(event){var edit=event.target.closest('[data-edit]');if(edit){closeDrawer();editRule(edit.dataset.edit);return}var del=event.target.closest('[data-delete]');if(!del)return;if(!confirm('למחוק את האוטומציה הזאת?'))return;try{await api('/api/automations/'+encodeURIComponent(del.dataset.delete),{method:'DELETE'});state.automations=state.automations.filter(function(rule){return rule.id!==del.dataset.delete});renderRules();updateMetrics();toast('האוטומציה נמחקה')}catch(error){toast(error.message,true)}}
  byId('railCards').addEventListener('click',function(event){var card=event.target.closest('[data-edit-rule]');if(card)editRule(card.dataset.editRule)});
  byId('rulesList').addEventListener('click',handleRuleAction);byId('rulesListAll').addEventListener('click',handleRuleAction);
  document.querySelectorAll('[data-token]').forEach(function(button){button.addEventListener('click',function(){var field=button.closest('.field');var area=field&&field.querySelector('textarea');if(!area)area=byId('messageTemplate');var start=area.selectionStart;var end=area.selectionEnd;area.value=area.value.slice(0,start)+button.dataset.token+area.value.slice(end);area.focus();area.setSelectionRange(start+button.dataset.token.length,start+button.dataset.token.length);updatePreview()})});
  var drawer=byId('appDrawer');var drawerBackdrop=byId('drawerBackdrop');var lastDrawerTrigger=null;
  function openDrawer(view,trigger){lastDrawerTrigger=trigger||document.activeElement;byId('drawerTitle').textContent=view==='analytics'?'אנליטיקות':'האוטומציות שלי';byId('drawerLibrary').hidden=view!=='library';byId('drawerAnalytics').hidden=view!=='analytics';drawer.hidden=false;drawerBackdrop.hidden=false;document.querySelectorAll('.nav-tab').forEach(function(item){var selected=item.dataset.view===view;item.classList.toggle('active',selected||view==='builder'&&item.dataset.view==='builder');if(item.hasAttribute('aria-expanded'))item.setAttribute('aria-expanded',selected?'true':'false')});requestAnimationFrame(function(){drawer.classList.add('open');drawerBackdrop.classList.add('open');byId('drawerClose').focus()})}
  function closeDrawer(){drawer.classList.remove('open');drawerBackdrop.classList.remove('open');document.querySelectorAll('.nav-tab').forEach(function(item){item.classList.toggle('active',item.dataset.view==='builder');if(item.hasAttribute('aria-expanded'))item.setAttribute('aria-expanded','false')});setTimeout(function(){if(!drawer.classList.contains('open')){drawer.hidden=true;drawerBackdrop.hidden=true}},240);if(lastDrawerTrigger&&lastDrawerTrigger.focus)lastDrawerTrigger.focus()}
  function showView(view,trigger){if(view==='builder'){closeDrawer();return}openDrawer(view,trigger)}
  document.querySelectorAll('.nav-tab').forEach(function(tab){tab.addEventListener('click',function(){showView(tab.dataset.view,tab)})});
  document.querySelector('[data-open-library]').addEventListener('click',function(event){showView('library',event.currentTarget)});byId('drawerClose').addEventListener('click',closeDrawer);drawerBackdrop.addEventListener('click',closeDrawer);document.addEventListener('keydown',function(event){if(event.key==='Escape'&&!drawer.hidden)closeDrawer();if(event.key==='Tab'&&!drawer.hidden){var focusable=drawer.querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');if(!focusable.length)return;var first=focusable[0];var last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}});
  form.addEventListener('input',function(){updatePreview();autoSizeTextareas()});window.addEventListener('resize',autoSizeTextareas);byId('connectButton').addEventListener('click',connect);byId('refreshMedia').addEventListener('click',connect);byId('resetButton').addEventListener('click',resetForm);tokenInput.addEventListener('keydown',function(event){if(event.key==='Enter'){event.preventDefault();connect()}});updatePreview();autoSizeTextareas();renderMedia();if(state.token)connect();
  var today=byId('todayLabel');if(today)today.textContent=new Date().toLocaleDateString('he-IL',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  setInterval(updateMetrics,500);
  updateMetrics();
  })();
`;

function asset(body: string, contentType: string): Response {
  return new Response(body, { headers: { ...SECURITY_HEADERS, "Content-Type": contentType } });
}

const RESPONSIVE_VW_SCALE = `
:root{--design-px:0.052083333vw}
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
