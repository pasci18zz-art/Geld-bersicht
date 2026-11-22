/* Geld – Start, Lebenszyklus, Android-Anbindung */
'use strict';

/* Verlassen der App → alles wieder verstecken. Nach längerer Pause → Startseite. */
const AWAY_MS = 120000;
let hiddenAt = 0; let actionAt = 0;
function onLeave() {
  if (!hiddenAt) hiddenAt = Date.now();
  revealed = false;
}
function onResume() {
  const away = hiddenAt ? Date.now() - hiddenAt : 0;
  hiddenAt = 0;
  revealed = false;
  applyAutoPlans();
  if (S.settings.jumpHome !== false && away > AWAY_MS && Date.now() - actionAt > 3000 && curPath() !== homeTab()) { tabTo(homeTab(), 'fade'); return; }
  render(false);
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') onResume(); else onLeave(); });
window.addEventListener('pagehide', onLeave);
window.addEventListener('blur', () => { if (document.visibilityState === 'hidden') onLeave(); });

/** Aktionen von außen (Kacheln, Kurzbefehle): geld://mitbringen | zahlung | ausgabe | lidl */
function handleActionUrl(url) {
  const m = /^geld:\/\/([a-z]+)/i.exec(url || '');
  if (!m) return;
  const debts = S.settings.debts;
  const path = {
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
  window.addEventListener('resize', () => movePill($('#nav')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') goBack();
    const t = e.target.closest && e.target.closest('[data-reveal]');
    if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); revealAll(); }
  });

  if (isNative()) {
    const App = plugin('App');
    if (App && App.addListener) {
      App.addListener('backButton', () => { if (!goBack()) { try { App.exitApp(); } catch (e) { /* egal */ } } });
      App.addListener('appStateChange', (st) => { if (st && st.isActive) onResume(); else onLeave(); });
      App.addListener('appUrlOpen', (e) => handleActionUrl(e && e.url));
      if (App.getLaunchUrl) App.getLaunchUrl().then((r) => { if (r && r.url) handleActionUrl(r.url); }).catch(() => { /* kein Start über eine Aktion */ });
    }
    if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
  } else if ('serviceWorker' in navigator && window.top === window && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
}
boot();
