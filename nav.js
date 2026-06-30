/**
 * IGNITE_APEX — Shared Navigation & Data Bridge
 * Injects system nav into all tools + manages localStorage data flow
 */

// ─── STORAGE KEYS ─────────────────────────────────────────────────────────────
const IA = {
  CONFIG_KEY:  'ignite_apex_config',
  DEALS_KEY:   'ignite_apex_deals',
  REPORT_KEY:  'ignite_apex_report_meta',
  ENGAGE_KEY:  'ignite_apex_engage',

  save(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); return true; }
    catch(e) { console.warn('IA save failed:', e); return false; }
  },
  load(key) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch(e) { return null; }
  },
  clear(key) { try { localStorage.removeItem(key); } catch(e) {} },

  // Config helpers
  saveConfig(cfg) { this.save(this.CONFIG_KEY, { ...cfg, _savedAt: Date.now() }); },
  loadConfig()    { return this.load(this.CONFIG_KEY); },
  saveDeals(deals){ this.save(this.DEALS_KEY, { ...deals, _savedAt: Date.now() }); },
  loadDeals()     { return this.load(this.DEALS_KEY); },
  saveReportMeta(m){ this.save(this.REPORT_KEY, { ...m, _savedAt: Date.now() }); },
  loadReportMeta(){ return this.load(this.REPORT_KEY); },
  saveEngage(e)   { this.save(this.ENGAGE_KEY, { ...e, _savedAt: Date.now() }); },
  loadEngage()    { return this.load(this.ENGAGE_KEY); },

  // Data health check
  getHealth() {
    const cfg   = this.loadConfig();
    const deals = this.loadDeals();
    const meta  = this.loadReportMeta();
    return {
      hasConfig:  !!(cfg && cfg.product && cfg.unworkable),
      hasDeals:   !!(deals && (
                    (deals.pipeCM  && deals.pipeCM.length)  ||
                    (deals.pipeQ1  && deals.pipeQ1.length)  ||
                    (deals.pipe007 && deals.pipe007.length)  ||
                    (deals.pipeQ2  && deals.pipeQ2.length)
                  )) || (function(){
                    // Also check new deal registry (ia_deal_registry)
                    try {
                      const reg = JSON.parse(localStorage.getItem('ia_deal_registry')||'[]');
                      return reg.length > 0;
                    } catch(e){ return false; }
                  })(),
      hasMeta:    !!(meta && meta.priorForecast > 0),
      cfg, deals, meta,
      // Error margin estimate when data missing
      estimatedError() {
        if (!this.hasConfig && !this.hasDeals) return 45;
        if (!this.hasDeals) return 32;
        if (!this.hasConfig) return 22;
        if (!this.hasMeta)   return 15;
        return null; // calculated from real data
      }
    };
  },

  timeSince(ts) {
    if (!ts) return 'never';
    const mins = Math.round((Date.now() - ts) / 60000);
    if (mins < 1)   return 'just now';
    if (mins < 60)  return mins + 'm ago';
    const hrs = Math.round(mins / 60);
    if (hrs < 24)   return hrs + 'h ago';
    return Math.round(hrs / 24) + 'd ago';
  }
};

// ─── CURRENT PAGE DETECTION ───────────────────────────────────────────────────
function IA_currentPage() {
  const p = window.location.pathname;
  if (p.includes('/universal'))  return 'universal';
  if (p.includes('/system'))     return 'system';
  if (p.includes('/configure'))   return 'configure';
  if (p.includes('/weekly'))     return 'weekly';
  if (p.includes('/report'))     return 'report';
  if (p.includes('/framework'))  return 'framework';
  return 'home';
}

// ─── NAV STYLES ───────────────────────────────────────────────────────────────
function IA_injectNavStyles() {
  if (document.getElementById('ia-nav-styles')) return;
  const style = document.createElement('style');
  style.id = 'ia-nav-styles';
  style.textContent = `
    #ia-nav {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
      background: rgba(8,9,13,0.97); border-top: 1px solid #252D42;
      backdrop-filter: blur(12px); font-family: 'Outfit', sans-serif;
      transition: transform .3s ease;
    }
    #ia-nav.collapsed { transform: translateY(calc(100% - 32px)); }
    #ia-nav-toggle {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 1.25rem; height: 32px; cursor: pointer;
      border-bottom: 1px solid #1E2535;
    }
    #ia-nav-toggle-left { display: flex; align-items: center; gap: .6rem; }
    .ia-nav-logo { font-family: 'Syne', sans-serif; font-size: .72rem; font-weight: 800; color: #F0F2FA; }
    .ia-nav-logo em { color: #F59E0B; font-style: normal; }
    .ia-health-bar { display: flex; gap: .35rem; align-items: center; }
    .ia-dot { width: 7px; height: 7px; border-radius: 50%; }
    .ia-dot.green  { background: #10B981; box-shadow: 0 0 4px #10B981; }
    .ia-dot.amber  { background: #F59E0B; box-shadow: 0 0 4px #F59E0B; }
    .ia-dot.red    { background: #EF4444; box-shadow: 0 0 4px #EF4444; }
    .ia-dot.grey   { background: #4A5270; }
    .ia-toggle-arrow { color: #4A5270; font-size: .7rem; transition: transform .3s; }
    #ia-nav.collapsed .ia-toggle-arrow { transform: rotate(180deg); }
    #ia-nav-body { display: flex; align-items: stretch; padding: .5rem 1rem; gap: .5rem; flex-wrap: wrap; }
    .ia-nav-item {
      display: flex; align-items: center; gap: .45rem; padding: .4rem .75rem;
      border-radius: 8px; text-decoration: none; transition: all .2s;
      border: 1.5px solid #1E2535; cursor: pointer; background: transparent;
      font-family: 'Outfit', sans-serif; font-size: .72rem; font-weight: 600;
      color: #8892AA; white-space: nowrap;
    }
    .ia-nav-item:hover { background: #141720; border-color: #252D42; color: #F0F2FA; }
    .ia-nav-item.active { background: #1E1400; border-color: #F59E0B; color: #F59E0B; }
    .ia-nav-item .ia-item-dot { width: 6px; height: 6px; border-radius: 50%; background: #4A5270; flex-shrink: 0; }
    .ia-nav-item.status-ok   .ia-item-dot { background: #10B981; }
    .ia-nav-item.status-warn .ia-item-dot { background: #F59E0B; }
    .ia-nav-item.status-bad  .ia-item-dot { background: #EF4444; }
    .ia-nav-sep { width: 1px; background: #1E2535; margin: .3rem 0; flex-shrink: 0; }
    .ia-nav-data-status {
      margin-left: auto; display: flex; align-items: center; gap: .5rem;
      font-size: .65rem; color: #4A5270; font-weight: 600; letter-spacing: .5px;
    }
    .ia-status-chip {
      padding: .2rem .55rem; border-radius: 4px; font-size: .62rem;
      font-weight: 700; letter-spacing: .5px; text-transform: uppercase;
    }
    .ia-status-chip.ok   { background: #021810; color: #10B981; border: 1px solid #10B981; }
    .ia-status-chip.warn { background: #1E1400; color: #F59E0B; border: 1px solid #F59E0B; }
    .ia-status-chip.bad  { background: #180404; color: #EF4444; border: 1px solid #EF4444; }

    /* WARNING BANNER */
    .ia-warning-banner {
      background: #180404; border: 2px solid #EF4444; border-radius: 12px;
      padding: 1.25rem 1.5rem; margin: 1rem 0;
      font-family: 'Outfit', sans-serif;
    }
    .ia-wb-head { display: flex; align-items: center; gap: .75rem; margin-bottom: .75rem; }
    .ia-wb-icon { font-size: 1.5rem; flex-shrink: 0; }
    .ia-wb-title { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 800; color: #EF4444; }
    .ia-wb-subtitle { font-size: .72rem; color: #EF4444; opacity: .7; margin-top: .15rem; }
    .ia-wb-error { font-family: 'Syne', sans-serif; font-size: 2.5rem; font-weight: 800; color: #EF4444; line-height: 1; }
    .ia-wb-error-label { font-size: .6rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #EF4444; opacity: .6; margin-top: .15rem; }
    .ia-wb-body { display: flex; gap: 1.5rem; align-items: flex-start; }
    .ia-wb-desc { flex: 1; font-size: .82rem; color: #FCA5A5; line-height: 1.6; }
    .ia-wb-items { display: flex; flex-direction: column; gap: .4rem; margin-top: .6rem; }
    .ia-wb-item { display: flex; align-items: flex-start; gap: .5rem; font-size: .78rem; color: #FCA5A5; line-height: 1.4; }
    .ia-wb-item-dot { width: 6px; height: 6px; border-radius: 50%; background: #EF4444; flex-shrink: 0; margin-top: 5px; }
    .ia-wb-actions { display: flex; flex-direction: column; gap: .5rem; flex-shrink: 0; }
    .ia-wb-btn {
      padding: .5rem 1rem; border-radius: 8px; font-size: .75rem; font-weight: 700;
      cursor: pointer; border: none; font-family: 'Outfit', sans-serif;
      text-decoration: none; display: block; text-align: center; transition: all .2s;
    }
    .ia-wb-btn.primary { background: #F59E0B; color: #000; }
    .ia-wb-btn.primary:hover { background: #FCD34D; }
    .ia-wb-btn.secondary { background: transparent; color: #EF4444; border: 1.5px solid #EF4444; }
    .ia-wb-btn.secondary:hover { background: #EF4444; color: #fff; }

    /* PARTIAL WARNING */
    .ia-partial-warn {
      background: #1E1400; border: 1px solid #F59E0B; border-radius: 8px;
      padding: .75rem 1rem; margin: .75rem 0; font-size: .78rem;
      color: #FCD34D; line-height: 1.5; font-family: 'Outfit', sans-serif;
      display: flex; gap: .6rem; align-items: flex-start;
    }

    /* BODY PADDING for nav */
    body { padding-bottom: 80px !important; }
  `;
  document.head.appendChild(style);
}

// ─── BUILD NAV HTML ───────────────────────────────────────────────────────────
function IA_buildNav() {
  const cur   = IA_currentPage();
  const h     = IA.getHealth();
  const root  = (cur === 'home') ? '' : '../';

  const configStatus = h.hasConfig ? 'ok'   : 'bad';
  const dealStatus   = h.hasDeals  ? 'ok'   : (h.hasConfig ? 'warn' : 'bad');
  const reportStatus = h.hasMeta   ? 'ok'   : 'warn';
  const fwStatus     = 'ok'; // always accessible

  // Overall system health dot
  const allGood = h.hasConfig && h.hasDeals;
  const noneSet = !h.hasConfig && !h.hasDeals;
  const healthDotClass = allGood ? 'green' : noneSet ? 'red' : 'amber';

  const lastSaved = h.cfg ? IA.timeSince(h.cfg._savedAt) : null;

  const pages = [
    { id:'home',      href: root + '../',          label: 'Home',              icon:'🏠', status: 'ok' },
    { id:'universal', href: root + 'universal/',   label: 'SaaS System',       icon:'⚡', status: configStatus },
    { id:'system',    href: root + 'system/',      label: 'Deal Template',     icon:'🎯', status: dealStatus },
    { id:'framework', href: root + 'framework/',   label: 'Framework Guide',   icon:'📘', status: fwStatus },
    { id:'report',    href: root + 'report/',      label: 'Deal Report',       icon:'📊', status: reportStatus },
    { id:'configure',  href: root + 'configure/',   label: 'AI Builder',        icon:'🤖', status: configStatus },
    { id:'weekly',    href: root + 'weekly/',      label: 'Weekly Pipeline',   icon:'📅', status: 'ok' },
  ];

  const navItems = pages.map(p => {
    const active = p.id === cur ? 'active' : '';
    return `<a class="ia-nav-item ${active} status-${p.status}" href="${p.href}" title="${p.label}">
      <span>${p.icon}</span>
      <span>${p.label}</span>
      <span class="ia-item-dot"></span>
    </a>`;
  }).join('<div class="ia-nav-sep"></div>');

  const statusChip = allGood
    ? `<span class="ia-status-chip ok">System Configured</span>`
    : noneSet
    ? `<span class="ia-status-chip bad">Not Configured</span>`
    : `<span class="ia-status-chip warn">Partially Configured</span>`;

  const savedText = lastSaved ? `<span style="color:#4A5270;font-size:.6rem">Saved ${lastSaved}</span>` : '';

  return `
    <div id="ia-nav-toggle" onclick="IA_toggleNav()">
      <div id="ia-nav-toggle-left">
        <span class="ia-nav-logo">IGNITE<em>_</em>APEX</span>
        <span style="font-size:.58rem;color:#4A5270;letter-spacing:1.5px;text-transform:uppercase">Sales System</span>
        <div class="ia-health-bar">
          <div class="ia-dot ${healthDotClass}" title="System data health"></div>
          <div class="ia-dot ${h.hasConfig ? 'green' : 'grey'}" title="Config: ${h.hasConfig ? 'Saved' : 'Missing'}"></div>
          <div class="ia-dot ${h.hasDeals  ? 'green' : 'grey'}" title="Deals: ${h.hasDeals ? 'Saved' : 'Missing'}"></div>
          <div class="ia-dot ${h.hasMeta   ? 'green' : 'grey'}" title="Report meta: ${h.hasMeta ? 'Saved' : 'Missing'}"></div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:.5rem">
        ${savedText}
        <span class="ia-toggle-arrow">▲</span>
      </div>
    </div>
    <div id="ia-nav-body">
      ${navItems}
      <div class="ia-nav-data-status">
        ${statusChip}
      </div>
    </div>`;
}

// ─── INJECT NAV ───────────────────────────────────────────────────────────────
function IA_injectNav() {
  if (document.getElementById('ia-nav')) return;
  IA_injectNavStyles();
  const nav = document.createElement('div');
  nav.id = 'ia-nav';
  nav.innerHTML = IA_buildNav();
  document.body.appendChild(nav);
}

function IA_toggleNav() {
  const nav = document.getElementById('ia-nav');
  if (nav) nav.classList.toggle('collapsed');
}

// ─── WARNING BANNER BUILDER ───────────────────────────────────────────────────
function IA_buildWarningBanner(health, targetEl) {
  if (!targetEl) return;
  const err = health.estimatedError();
  if (!err) return; // Data is complete, no warning needed

  const missing = [];
  if (!health.hasConfig) missing.push({ label: 'Product & 4U Configuration', tool: 'SaaS System', href: '../universal/', reason: 'ICP scoring, discovery questions, objection scripts and ROI metrics cannot be calculated without your product configuration and 4U framework.' });
  if (!health.hasDeals)  missing.push({ label: 'Pipeline Deal Data', tool: 'Deal Template', href: '../system/', reason: 'Commit forecast, best case, Q1 weighted forecast and cash flow projection require active deal data from the Deal System Template.' });
  if (!health.hasMeta)   missing.push({ label: 'Prior Week Forecast vs Actual', tool: 'Weekly Report', href: '#', reason: 'Margin of error cannot be calculated without prior week forecast and actual data. Enter these manually above.' });

  const isBlocking = !health.hasDeals && !health.hasConfig;

  const banner = document.createElement('div');
  banner.className = 'ia-warning-banner';
  banner.innerHTML = `
    <div class="ia-wb-head">
      <div class="ia-wb-icon">⚠️</div>
      <div>
        <div class="ia-wb-title">Forecast Accuracy Warning — ${isBlocking ? 'Critical Data Missing' : 'Incomplete Data Detected'}</div>
        <div class="ia-wb-subtitle">Report generated with missing upstream data. Forecast integrity cannot be guaranteed.</div>
      </div>
      <div style="margin-left:auto;text-align:right">
        <div class="ia-wb-error">&gt;${err}%</div>
        <div class="ia-wb-error-label">Est. Error Margin</div>
      </div>
    </div>
    <div class="ia-wb-body">
      <div class="ia-wb-desc">
        <strong style="color:#EF4444">This report is unreliable until the following data is provided.</strong>
        The IGNITE_APEX forecast model requires data from upstream tools. Without this data, all forecast figures shown below are estimates based on zero inputs — they carry an estimated margin of error of <strong>&gt;${err}%</strong>, far exceeding the 5–9% target tolerance.
        <div class="ia-wb-items">
          ${missing.map(m => `<div class="ia-wb-item">
            <div class="ia-wb-item-dot"></div>
            <div><strong style="color:#FCA5A5">${m.label}</strong> — ${m.reason}
              ${m.href !== '#' ? `<br><a href="${m.href}" style="color:#F59E0B;text-decoration:none;font-weight:700;font-size:.75rem">→ Go to ${m.tool} to configure now</a>` : ''}
            </div>
          </div>`).join('')}
        </div>
      </div>
      <div class="ia-wb-actions">
        ${missing.filter(m => m.href !== '#').map(m =>
          `<a class="ia-wb-btn primary" href="${m.href}">Configure ${m.tool} →</a>`
        ).join('')}
        <button class="ia-wb-btn secondary" onclick="this.closest('.ia-warning-banner').style.display='none'">
          Proceed Anyway (Unreliable)
        </button>
      </div>
    </div>`;

  targetEl.insertBefore(banner, targetEl.firstChild);
}

// ─── PARTIAL WARNING INLINE ───────────────────────────────────────────────────
function IA_partialWarn(message, targetEl, toolHref, toolName) {
  if (!targetEl) return;
  const div = document.createElement('div');
  div.className = 'ia-partial-warn';
  div.innerHTML = `<span style="flex-shrink:0;font-size:1rem">⚠️</span>
    <div>${message}${toolHref ? ` <a href="${toolHref}" style="color:#F59E0B;font-weight:700;text-decoration:none">→ Configure in ${toolName}</a>` : ''}</div>`;
  targetEl.appendChild(div);
  return div;
}

// ─── AUTO-INIT ────────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', IA_injectNav);
} else {
  IA_injectNav();
}
