/* Geld – Start, Lebenszyklus, App-Sperre, Mitteilungen, Android-Anbindung */
'use strict';

/* Verlassen der App → alles wieder verstecken (und ggf. sperren). Nach längerer Pause → Startseite. */
const AWAY_MS = 120000;
let hiddenAt = 0; let actionAt = 0;
// Fingerabdruck-Dialog und Datei-Auswahl pausieren die App kurz – das zählt nicht als „verlassen“
const bioQuiet = () => bioBusy || Date.now() - bioEnd < 1500;
let pickerAt = 0; let pickerAway = false;
document.addEventListener('click', (e) => {
  const t = e.target.closest && (e.target.closest('input[type=file]') || e.target.closest('label'));
  if (t && (t.matches('input[type=file]') || t.querySelector('input[type=file]'))) pickerAt = Date.now();
}, true);
function onLeave() {
  if (bioQuiet()) return;
  if (Date.now() - pickerAt < 2000) { pickerAway = true; return; }
  if (!hiddenAt) hiddenAt = Date.now();
  revealed = false; manualHide = false;
}
function onResume() {
  if (bioQuiet()) return;
  if (pickerAway) { pickerAway = false; if (!hiddenAt) return; }
  const away = hiddenAt ? Date.now() - hiddenAt : 0;
  const wasAway = !!hiddenAt;
  hiddenAt = 0;
  revealed = false;
  applyAutoPlans();
  syncNotifications();
  if (wasAway && lockOn() && away >= (S.settings.lockDelay || 0) * 1000) showLock();
  if (S.settings.jumpHome !== false && away > AWAY_MS && Date.now() - actionAt > 3000 && curPath() !== homeTab()) { tabTo(homeTab(), 'fade'); return; }
  render(false);
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') onResume(); else onLeave(); });
window.addEventListener('pagehide', onLeave);

/* Zeitfenster: wenn eins beginnt oder endet, die Ansicht neu zeichnen (nicht beim Tippen) */
let lastHid = null;
setInterval(() => {
  const h = hiddenNow();
  if (lastHid === null) { lastHid = h; return; }
  if (h === lastHid) return;
  const a = document.activeElement;
  if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return;
  if (document.querySelector('#sheet-root .sheet')) return;
  lastHid = h; render(false);
}, 20000);

/* ================= App-Sperre ================= */
const lockOn = () => !!S.settings.lock && isNative();
let locked = false;
function showLock() {
  if (locked) return;
  locked = true;
  let el = $('#lock');
  if (!el) { el = document.createElement('div'); el.id = 'lock'; document.body.appendChild(el); }
  el.innerHTML = `<div class="lock-box">
    <span class="lock-ic">${svg('lock')}</span>
    <h1>Geld ist gesperrt</h1>
    <button type="button" class="btn" id="lock-go">${svg('finger')}Entsperren</button>
    <button type="button" class="link" id="lock-pin">Mit Handy-PIN entsperren</button>
  </div>`;
  el.className = 'show';
  $('#lock-go').onclick = () => tryUnlock(false);
  $('#lock-pin').onclick = () => tryUnlock(true);
  setTimeout(() => tryUnlock(false), 250);
}
async function tryUnlock(pin) {
  if (bioBusy) return;
  if (await bioAuth('Geld entsperren', pin)) {
    locked = false;
    const el = $('#lock'); if (!el) return;
    el.className = 'hide';
    setTimeout(() => { if (!locked) el.remove(); }, motionOn() ? 320 : 0);
  }
}

/* ================= Mitteilungen ================= */
const NOTIF_BASE = 7100000; const NOTIF_BACKUP = NOTIF_BASE + 1500000;
const notifPlug = () => (isNative() ? plugin('LocalNotifications') : null);
function notifId(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return NOTIF_BASE + (Math.abs(h) % 1000000); }
async function notifPermission(ask) {
  const L = notifPlug(); if (!L) return false;
  try {
    let p = await L.checkPermissions();
    if (p.display !== 'granted' && ask) p = await L.requestPermissions();
    return p.display === 'granted';
  } catch (e) { return false; }
}
let notifTimer = null;
function syncNotifications() { if (!notifPlug()) return; clearTimeout(notifTimer); notifTimer = setTimeout(() => doSyncNotifications().catch(() => {}), 900); }
async function doSyncNotifications() {
  const L = notifPlug(); if (!L) return;
  const pend = await L.getPending().catch(() => ({ notifications: [] }));
  const ours = (pend.notifications || []).filter((n) => n.id >= NOTIF_BASE && n.id < NOTIF_BASE + 2000000);
  if (ours.length) await L.cancel({ notifications: ours.map((n) => ({ id: n.id })) });
  if (S.demo || !(await notifPermission(false))) return;
  const [hh, mm] = (S.settings.remindTime || '09:00').split(':').map(Number);
  const atDay = (ds) => { const d = parseDate(ds); d.setHours(hh || 0, mm || 0, 0, 0); return d; };
  const now = Date.now(); const list = [];
  if (S.settings.remind) {
    S.plans.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach((p) => {
      const at = atDay(p.date); if (at.getTime() <= now + 5000 || list.length >= 40) return;
      const isIn = p.kind === 'in'; const name = p.title || catById(p.cat).name;
      list.push({
        id: notifId(p.id + '|' + p.date),
        title: p.auto ? 'Heute wird gebucht' : isIn ? 'Heute kommt Geld' : 'Heute fällig',
        body: `${name} · ${isIn ? '+' : '−'}${eur(p.amount).replace('−', '')}${p.auto ? ' (automatisch)' : ''}`,
        schedule: { at, allowWhileIdle: true },
        smallIcon: 'ic_stat_geld', iconColor: '#3E8E5E',
        actionTypeId: p.auto ? '' : isIn ? 'PLAN_IN' : 'PLAN_OUT',
        extra: { planId: p.id, due: p.date }
      });
    });
  }
  const n = S.settings.backupEvery;
  if (n) {
    let at = new Date((S.settings.lastBackup || now) + n * 864e5); at.setHours(hh || 0, mm || 0, 0, 0);
    if (at.getTime() <= now + 5000) { at = atDay(addDays(todayStr(), 1)); }
    list.push({ id: NOTIF_BACKUP, title: 'Zeit für ein Backup', body: 'Tippen, um deine Daten zu sichern.', schedule: { at, allowWhileIdle: true }, smallIcon: 'ic_stat_geld', iconColor: '#3E8E5E', extra: { backup: true } });
  }
  if (list.length) await L.schedule({ notifications: list });
}
function bookPlanFromNotif(planId, due) {
  const p = S.plans.find((x) => x.id === planId);
  if (!p || (due && p.date !== due)) { toast('Schon erledigt'); return; }
  commit(`Gebucht: ${p.title || catById(p.cat).name}`, () => bookPlan(p));
}
function initNotifications() {
  const L = notifPlug(); if (!L) return;
  L.registerActionTypes({ types: [
    { id: 'PLAN_OUT', actions: [{ id: 'paid', title: 'Bezahlt' }] },
    { id: 'PLAN_IN', actions: [{ id: 'paid', title: 'Erhalten' }] }
  ] }).catch(() => {});
  L.addListener('localNotificationActionPerformed', (e) => {
    const x = (e && e.notification && e.notification.extra) || {};
    actionAt = Date.now();
    setTimeout(() => {
      closeSheetNow();
      if (x.backup) { tabTo(homeTab()); exportBackup(); return; }
      if (x.planId) {
        if (e.actionId === 'paid') bookPlanFromNotif(x.planId, x.due);
        if (curPath() !== 'geplant') tabTo('geplant');
      }
    }, 120);
  });
  syncNotifications();
}

/** Aktionen von außen (Kacheln, Kurzbefehle): geld://eintragen | mitbringen | zahlung | ausgabe | lidl */
function handleActionUrl(url) {
  const m = /^geld:\/\/([a-z]+)/i.exec(url || '');
  if (!m) return;
  const debts = S.settings.debts;
  const path = {
    eintragen: 'neu/out',
    mitbringen: debts ? 'schnell/mitbringen' : 'neu/lidl',
    zahlung: debts ? 'schnell/zahlung' : 'neu/refund',
    ausgabe: 'neu/out',
    lidl: 'neu/lidl'
  }[m[1].toLowerCase()];
  if (!path) return;
  actionAt = Date.now();
  closeSheetNow();
  stack = [homeTab()];
  go(path, 'fwd');
}

function boot() {
  applyAutoPlans();
  stack = [homeTab()];
  bindSwipe();
  render(true);
  if (lockOn()) showLock();
  // Kurzbefehle der Web-Version: ?a=eintragen | mitbringen | zahlung | ausgabe | lidl
  const a = new URLSearchParams(location.search).get('a');
  if (a) handleActionUrl('geld://' + a);
  window.addEventListener('resize', () => movePill($('#nav')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') goBack();
    const t = e.target.closest && e.target.closest('[data-reveal]');
    if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); requestReveal(); }
  });

  if (isNative()) {
    const App = plugin('App');
    if (App && App.addListener) {
      App.addListener('backButton', () => { if (locked || !goBack()) { try { App.exitApp(); } catch (e) { /* egal */ } } });
      App.addListener('appStateChange', (st) => { if (st && st.isActive) onResume(); else onLeave(); });
      App.addListener('appUrlOpen', (e) => handleActionUrl(e && e.url));
      if (App.getLaunchUrl) App.getLaunchUrl().then((r) => { if (r && r.url) handleActionUrl(r.url); }).catch(() => { /* kein Start über eine Aktion */ });
    }
    initNotifications();
    if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
  } else if ('serviceWorker' in navigator && window.top === window && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
}
boot();
