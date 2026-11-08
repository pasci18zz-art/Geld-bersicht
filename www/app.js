/* Geld – Budget & Schulden
 * Läuft komplett offline. Alle Daten liegen nur im localStorage dieses Handys.
 * Beträge werden intern in Cent (ganze Zahlen) gespeichert.
 */
'use strict';

/* ---------- Hilfsfunktionen ---------- */
const KEY = 'geldapp.v1';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = (n) => String(n).padStart(2, '0');
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => fmtDate(new Date());
const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const monthOf = (ds) => ds.slice(0, 7);
const curMonth = () => todayStr().slice(0, 7);
const addMonth = (m, k) => {
  let [y, mo] = m.split('-').map(Number);
  mo += k;
  while (mo > 12) { mo -= 12; y++; }
  while (mo < 1) { mo += 12; y--; }
  return `${y}-${pad(mo)}`;
};
const daysIn = (m) => { const [y, mo] = m.split('-').map(Number); return new Date(y, mo, 0).getDate(); };
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const MONTHS_S = ['Jan', 'Feb', 'März', 'Apr', 'Mai', 'Juni', 'Juli', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const monthName = (m) => MONTHS[+m.slice(5) - 1] + ' ' + m.slice(0, 4);
function dateLabel(ds) {
  if (ds === todayStr()) return 'Heute';
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (ds === fmtDate(y)) return 'Gestern';
  const d = parseDate(ds);
  return `${WD[d.getDay()]}, ${d.getDate()}. ${MONTHS_S[d.getMonth()]}`;
}
/** Cent → "1.234,56 €" (negativ mit echtem Minuszeichen) */
function eur(c) {
  c = Math.round(c || 0);
  const a = Math.abs(c);
  return (c < 0 ? '−' : '') + Math.floor(a / 100).toLocaleString('de-DE') + ',' + pad(a % 100) + ' €';
}
const signed = (c) => (c > 0 ? '+' : '') + eur(c);
/** "12,50" / "12.5" / "-1.234,56" → Cent */
function parseEur(s) {
  s = String(s == null ? '' : s).trim().replace(/[\s€]/g, '').replace('−', '-');
  if (!s) return 0;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : Math.round(n * 100);
}
const centsToInput = (c) => (c ? (c / 100).toFixed(2).replace('.', ',').replace(/,00$/, '') : '');

/* ---------- Symbole ---------- */
const I = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
  gear: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  next: '<path d="m9 18 6-6-6-6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
  people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',
  bank: '<path d="M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
  repeat: '<path d="M4 11V9a3 3 0 0 1 3-3h12M16 3l3 3-3 3M20 13v2a3 3 0 0 1-3 3H5M8 21l-3-3 3-3"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2.5v3M16 2.5v3"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M16 15h2"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/>',
  // Gebäck
  croissant: '<path d="M2.5 15C4 9.5 8 6.5 12 6.5s8 3 9.5 8.5L18 16.5l-2.5-4.5L12 14l-3.5-2L6 16.5z"/><path d="M8.5 12 9.6 7.6M15.5 12l-1.1-4.4M12 14V6.5"/>',
  apfel: '<path d="M3 16a9 9 0 0 1 18 0z"/><path d="M5.5 18.5v-2.5M9 18.5v-2.5M12.5 18.5v-2.5M16 18.5v-2.5M19 18.5v-2.5"/><path d="M12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 9V7.5"/>',
  stange: '<path d="M5.2 17.8a2.5 2.5 0 0 1-1-4.3L16 4.7a2.5 2.5 0 0 1 3.3 3.6L7.5 18.3a2.5 2.5 0 0 1-2.3-.5z"/><path d="M8 14h.01M11 11.5h.01M14 9h.01M16.5 7h.01"/>',
  schnecke: '<circle cx="12" cy="12" r="9"/><path d="M12 12a1.5 1.5 0 1 1 1.5-1.5A3.5 3.5 0 1 1 9 14a5.5 5.5 0 1 1 8.5-5"/>',
  pizza: '<path d="M3.5 6.5c5.5-3 11.5-3 17 0L12 21.5z"/><path d="M4.6 8.8c4.8-2.3 10-2.3 14.8 0"/><circle cx="10" cy="11.5" r="1.2"/><circle cx="14" cy="13.5" r="1.2"/><circle cx="12" cy="17" r=".8"/>',
  brezel: '<path d="M7 19.5C3.5 18 2 14 3.5 10S9 4.5 12 8c3-3.5 7-2 8.5 2s0 8-3.5 9.5"/><path d="M7 19.5 15.5 11M17 19.5 8.5 11"/>',
  kbrezel: '<path d="M7 19.5C3.5 18 2 14 3.5 10S9 4.5 12 8c3-3.5 7-2 8.5 2s0 8-3.5 9.5"/><path d="M7 19.5 15.5 11M17 19.5 8.5 11"/><path d="M6 9.5h.01M8.5 7.5h.01M15.5 7.5h.01M18 9.5h.01M12 14.5h.01" stroke-width="2.6"/>',
  broetchen: '<path d="M3 14c0-4 4-7 9-7s9 3 9 7-4 4.5-9 4.5S3 18 3 14z"/><path d="M8 11.5c2.5 1.5 5.5 1.5 8 0"/>',
  snack: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  anderes: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'
};
const svg = (name, extra = '') => `<svg viewBox="0 0 24 24" aria-hidden="true" ${extra}>${I[name] || I.snack}</svg>`;
const PRODUCT_ICONS = ['croissant', 'apfel', 'stange', 'schnecke', 'pizza', 'brezel', 'kbrezel', 'broetchen', 'snack'];

const COLORS = ['#2E8F55', '#2A8A84', '#3E6E8E', '#9A7A12', '#5E7A2A', '#B4542E', '#7457B8', '#B03A6A'];

/* ---------- Daten ---------- */
function defaults() {
  return {
    v: 1,
    created: curMonth(),
    // home: Startseite · startBalance/startDate/startTs: Kontostand-Anker · debtsInBalance: Schulden im Kontostand mitrechnen
    settings: { theme: 'auto', carry: false, lastBackup: null, home: 'schulden', startBalance: null, startDate: null, startTs: 0, debtsInBalance: true },
    accounts: [
      { id: 'a1', name: 'Essen & Snacks', budget: 12000, color: '#2E8F55' },
      { id: 'a2', name: 'Freizeit', budget: 15000, color: '#2A8A84' },
      { id: 'a3', name: 'Tanken', budget: 10000, color: '#9A7A12' },
      { id: 'a4', name: 'Kleidung', budget: 8000, color: '#5E7A2A' },
      { id: 'a5', name: 'Handy & Abos', budget: 3000, color: '#3E6E8E' }
    ],
    expenses: [],   // {id, amount, accountId, note, date, ts, recurringId?, importKey?}
    income: [],     // {id, amount, note, date, ts, recurringId?, importKey?}
    recurring: [],  // {id, kind:'expense'|'income', name, amount, accountId, day, start, skipped:[]}
    people: [],     // {id, name, color}
    debts: [],      // {id, personId, type:'buy'|'pay', amount, text, date}
    products: [
      { id: 'croissant', name: 'Schinken-Käse-Croissant', price: 129, icon: 'croissant', fav: true },
      { id: 'apfel', name: 'Apfeltasche', price: 89, icon: 'apfel' },
      { id: 'stange', name: 'Käsestange', price: 79, icon: 'stange' },
      { id: 'schnecke', name: 'Pizzaschnecke', price: 119, icon: 'schnecke' },
      { id: 'pizza', name: 'Pizzastück', price: 149, icon: 'pizza' },
      { id: 'brezel', name: 'Laugenbrezel', price: 39, icon: 'brezel' },
      { id: 'kbrezel', name: 'Käselaugenbrezel', price: 79, icon: 'kbrezel' },
      { id: 'broetchen', name: 'Laugenbrötchen', price: 29, icon: 'broetchen' }
    ]
  };
}

let S = load();
function load() {
  const d = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return d;
    const s = JSON.parse(raw);
    return normalize(s);
  } catch (e) {
    return d;
  }
}
function normalize(s) {
  const d = defaults();
  const out = Object.assign({}, d, s);
  out.settings = Object.assign({}, d.settings, s.settings || {});
  ['accounts', 'expenses', 'income', 'recurring', 'people', 'debts', 'products'].forEach((k) => { if (!Array.isArray(out[k])) out[k] = d[k]; });
  return out;
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
    return true;
  } catch (e) {
    toast('Speicher voll – lösche ein paar Snack-Fotos');
    return false;
  }
}

/* Rückgängig: vor jeder Änderung wird der alte Stand gemerkt */
let undoSnap = null;
function commit(msg, mutate, opts = {}) {
  const snap = JSON.stringify(S);
  mutate();
  if (!save()) { S = JSON.parse(snap); return; }
  if (opts.undo === false) { undoSnap = null; if (msg) toast(msg); }
  else { undoSnap = snap; toast(msg, 'Rückgängig', doUndo); }
  if (opts.after) opts.after(); else render();
}
function doUndo() {
  if (!undoSnap) return;
  S = JSON.parse(undoSnap);
  undoSnap = null;
  save();
  toast('Rückgängig gemacht');
  render();
}

/* ---------- Berechnungen ---------- */
const acc = (id) => S.accounts.find((a) => a.id === id);
const person = (id) => S.people.find((p) => p.id === id);
const budgetTotal = () => S.accounts.reduce((s, a) => s + a.budget, 0);
const spentIn = (m, accId) => S.expenses
  .filter((e) => monthOf(e.date) === m && (!accId || e.accountId === accId))
  .reduce((s, e) => s + e.amount, 0);
const incomeIn = (m) => S.income.filter((i) => monthOf(i.date) === m).reduce((s, i) => s + i.amount, 0);
/** Einnahmen und Ausgaben eines Monats gemischt, neueste zuerst (_k: 'in' | 'out') */
const txsOf = (m) => S.income.filter((i) => monthOf(i.date) === m).map((x) => ({ ...x, _k: 'in' }))
  .concat(S.expenses.filter((e) => monthOf(e.date) === m).map((x) => ({ ...x, _k: 'out' })))
  .sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));

/* Echter Kontostand: Anker (Kontostand + Zeitpunkt) + alle Buchungen danach.
 * Eine Buchung zählt, wenn sie nach dem Anker-Tag liegt – oder am Anker-Tag selbst, aber erst danach eingetragen wurde.
 * Importierte Buchungen haben ts = 0, weil der Kontostand aus dem Auszug sie schon enthält. */
function counted(x) {
  const st = S.settings;
  if (st.startBalance == null || !st.startDate) return false;
  return x.date > st.startDate || (x.date === st.startDate && (x.ts || 0) > (st.startTs || 0));
}
function realBalance() {
  const st = S.settings;
  if (st.startBalance == null) return null;
  let b = st.startBalance;
  S.income.forEach((i) => { if (counted(i)) b += i.amount; });
  S.expenses.forEach((e) => { if (counted(e)) b -= e.amount; });
  if (st.debtsInBalance) S.debts.forEach((d) => { if (counted(d)) b += d.type === 'pay' ? d.amount : -d.amount; });
  return b;
}
function setBalanceAnchor(cents, date) {
  S.settings.startBalance = cents;
  S.settings.startDate = date || todayStr();
  S.settings.startTs = Date.now();
}
function carryFor(m) {
  if (!S.settings.carry) return 0;
  const p = addMonth(m, -1);
  if (p < S.created) return 0;
  return budgetTotal() - spentIn(p);
}
const saldo = (pid) => S.debts.filter((d) => d.personId === pid).reduce((s, d) => s + (d.type === 'pay' ? d.amount : -d.amount), 0);
function look(c) {
  if (c < 0) return { cls: 'minus', text: eur(c), status: 'im Minus', long: 'schuldet dir ' + eur(-c) };
  if (c > 0) return { cls: 'plus', text: signed(c), status: 'im Plus', long: 'hat ' + eur(c) + ' Guthaben' };
  return { cls: 'zero', text: eur(0), status: 'ausgeglichen', long: 'alles ausgeglichen' };
}

/* Feste Ausgaben automatisch eintragen */
function applyRecurring() {
  const cm = curMonth();
  const td = +todayStr().slice(8);
  let changed = false;
  S.recurring.forEach((r) => {
    if (!/^\d{4}-\d{2}$/.test(r.start || '')) r.start = cm;
    let m = r.start;
    let guard = 0;
    const isIn = r.kind === 'income';
    const list = isIn ? S.income : S.expenses;
    while (m <= cm && guard++ < 240) {
      const day = Math.min(r.day, daysIn(m));
      const due = m < cm || day <= td;
      const skipped = (r.skipped || []).includes(m);
      if (due && !skipped && !list.some((e) => e.recurringId === r.id && monthOf(e.date) === m)) {
        const date = `${m}-${pad(day)}`;
        if (isIn) list.push({ id: uid(), amount: r.amount, note: r.name, date, ts: Date.now(), recurringId: r.id });
        else list.push({ id: uid(), amount: r.amount, accountId: r.accountId, note: r.name, date, ts: Date.now(), recurringId: r.id });
        changed = true;
      }
      m = addMonth(m, 1);
    }
  });
  if (changed) save();
}

/* ---------- Navigation ---------- */
/** Startseite: standardmäßig die Schulden-Übersicht (in den Einstellungen änderbar) */
const homeName = () => (S.settings.home === 'uebersicht' ? 'uebersicht' : 'schulden');
const stack = [location.hash || '#/' + homeName()];
let replacing = false;
function route() {
  const h = location.hash.replace(/^#\/?/, '') || homeName();
  const [name, arg] = h.split('/');
  return { name: decodeURIComponent(name), arg: arg ? decodeURIComponent(arg) : '' };
}
function go(path) { location.hash = '#/' + path; }
/** Richtung der nächsten Seitenanimation: 'fwd' | 'back' | 'tab-l' | 'tab-r' | 'fade' */
let navDir = null;
function back(fallback) {
  if (stack.length > 1) history.back();
  else { replacing = true; navDir = 'back'; location.replace('#/' + fallback); }
}
window.addEventListener('hashchange', () => {
  const h = location.hash;
  if (replacing) { stack[stack.length - 1] = h; replacing = false; navDir = navDir || 'fade'; }
  else if (stack.length > 1 && stack[stack.length - 2] === h) { stack.pop(); navDir = 'back'; }
  else { stack.push(h); navDir = 'fwd'; }
  closeSheetNow();
  render();
  window.scrollTo(0, 0);
});

/* ---------- Oberfläche: Toast & Sheet ---------- */
let toastTimer = null;
function toast(msg, btnText, onBtn) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>` + (btnText ? `<button type="button">${esc(btnText)}</button>` : '');
  t.classList.toggle('has-btn', !!btnText);
  if (btnText) $('button', t).onclick = () => { hideToast(); onBtn(); };
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, btnText ? 5000 : 2600);
}
function hideToast() { $('#toast').classList.remove('show'); }

function openSheet(html, mount) {
  const root = $('#sheet-root');
  root.innerHTML = `<div class="sheet-backdrop"><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div></div>`;
  const bd = $('.sheet-backdrop', root);
  bd.addEventListener('click', (e) => { if (e.target === bd) closeSheet(); });
  $$('[data-close]', root).forEach((b) => b.addEventListener('click', closeSheet));
  if (mount) mount($('.sheet', root));
}
/** Sofort schließen (z. B. beim Seitenwechsel) */
function closeSheetNow() { $('#sheet-root').innerHTML = ''; }
/** Weich ausblenden; ein inzwischen neu geöffnetes Fenster bleibt unberührt */
function closeSheet() {
  const root = $('#sheet-root');
  const node = root.firstElementChild;
  if (!node || node.classList.contains('closing')) return;
  node.classList.add('closing');
  setTimeout(() => { if (root.firstElementChild === node) root.innerHTML = ''; }, 190);
}
function confirmSheet(title, text, okText, onOk) {
  openSheet(`<h2>${esc(title)}</h2><p class="muted" style="margin:0">${esc(text)}</p>
    <div class="actions"><button class="btn ghost" data-close>Abbrechen</button><button class="btn danger" id="ok">${esc(okText)}</button></div>`,
  (el) => { $('#ok', el).onclick = () => { closeSheet(); onOk(); }; });
}
const swatches = (cur) => `<div class="swatches" role="radiogroup" aria-label="Farbe">${COLORS.map((c) =>
  `<button type="button" class="swatch${c === cur ? ' on' : ''}" data-color="${c}" style="background:${c}" role="radio" aria-checked="${c === cur}" aria-label="Farbe ${c}"></button>`).join('')}</div>`;
function bindSwatches(el, onPick) {
  $$('.swatch', el).forEach((b) => b.addEventListener('click', () => {
    $$('.swatch', el).forEach((x) => { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); });
    b.classList.add('on'); b.setAttribute('aria-checked', 'true');
    onPick(b.dataset.color);
  }));
}

/* Klicks direkt nach langem Drücken ignorieren */
let suppressClickUntil = 0;
document.addEventListener('click', (e) => {
  if (Date.now() < suppressClickUntil) { e.stopPropagation(); e.preventDefault(); }
}, true);

/* Zahlenfeld */
function keypadHTML() {
  return `<div class="keypad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'del'].map((k) =>
    `<button type="button" class="key" data-key="${k}" aria-label="${k === 'del' ? 'Löschen' : k === ',' ? 'Komma' : k}">${k === 'del' ? '⌫' : k}</button>`).join('')}</div>`;
}
function pressKey(str, k) {
  if (k === 'del') return str.slice(0, -1);
  if (k === ',') return str.includes(',') ? str : (str || '0') + ',';
  const parts = str.split(',');
  if (parts.length === 2 && parts[1].length >= 2) return str;
  if (parts[0].length >= 6 && parts.length === 1) return str;
  return str === '0' ? k : str + k;
}

const productVisual = (p) => (p.photo ? `<img src="${p.photo}" alt="">` : svg(p.icon || 'snack'));

/* ---------- Ansichten ---------- */
let viewMonth = curMonth();
let draft = {};
let lastRouteKey = '';
let tapTimer = null;
let tapId = null;

const VIEWS = {};

/* Übersicht */
VIEWS.uebersicht = {
  nav: 'uebersicht',
  html() {
    const m = viewMonth;
    const isCur = m === curMonth();
    const carry = carryFor(m);
    const total = budgetTotal() + carry;
    const spent = spentIn(m);
    const avail = total - spent;
    const pct = total > 0 ? clamp(Math.round(avail / total * 100), 0, 100) : 0;
    const C = 2 * Math.PI * 44;
    const daysLeft = isCur ? daysIn(m) - +todayStr().slice(8) + 1 : 0;
    const perDay = isCur && daysLeft > 0 ? Math.floor(Math.max(0, avail) / daysLeft) : 0;

    const accRows = S.accounts.map((a) => {
      const sp = spentIn(m, a.id);
      const rest = a.budget - sp;
      const over = rest < 0;
      const w = a.budget > 0 ? clamp(Math.round(sp / a.budget * 100), 0, 100) : (sp > 0 ? 100 : 0);
      return `<div class="row"><span class="dot" style="background:${a.color}"></span>
        <div class="grow" style="display:flex;flex-direction:column;gap:6px">
          <div class="between"><span class="b ell">${esc(a.name)}</span><span class="b ${over ? 'minus' : ''}" style="white-space:nowrap">${over ? eur(rest) : eur(rest) + ' übrig'}</span></div>
          <div class="bar"><i style="width:${w}%;background:${over ? 'var(--minus)' : a.color}"></i></div>
        </div></div>`;
    }).join('');

    let owed = 0; let owedN = 0;
    S.people.forEach((p) => { const s = saldo(p.id); if (s < 0) { owed += -s; owedN++; } });

    const recent = txsOf(m).slice(0, 5);
    const inM = incomeIn(m);
    const bal = realBalance();
    const net = inM - spent;
    const balanceCard = bal === null
      ? `<button class="card pad" id="balance" style="text-align:left;color:var(--text);display:flex;gap:14px;align-items:center;width:100%">
          <span class="acc-ic" style="background:var(--accentSoft);color:var(--accent)">${svg('bank')}</span>
          <div class="grow"><div class="b">Kontostand einrichten</div><div class="small">Trag einmal deinen echten Kontostand ein. Danach rechnet die App mit deinen Einnahmen und Ausgaben weiter.</div></div>${svg('next', 'style="color:var(--sub)"')}</button>`
      : `<section class="card pad" style="display:flex;flex-direction:column;gap:12px" aria-label="Kontostand">
          <div class="between" style="align-items:flex-start">
            <div><div class="eyebrow ${bal < 0 ? 'minus' : 'plus'}">Kontostand</div><div class="big ${bal < 0 ? 'minus' : ''}">${eur(bal)}</div></div>
            <button class="icon-btn sm" id="balance" aria-label="Kontostand ändern">${svg('edit')}</button>
          </div>
          <div class="grid2" style="gap:8px">
            <div style="padding:10px 12px;border-radius:16px;background:var(--chip)"><div class="small b">Einnahmen</div><div class="bb plus" style="font-size:17px">+${eur(inM)}</div></div>
            <div style="padding:10px 12px;border-radius:16px;background:var(--chip)"><div class="small b">Ausgaben</div><div class="bb minus" style="font-size:17px">−${eur(spent)}</div></div>
          </div>
          <div class="between"><span class="small">${monthName(m)}: ${net >= 0 ? 'Plus' : 'Minus'} <b class="${net >= 0 ? 'plus' : 'minus'}">${signed(net)}</b></span><a class="link" href="#/ausgabe/einnahme">+ Einnahme</a></div>
        </section>`;

    const backupDays = S.settings.lastBackup ? Math.floor((Date.now() - S.settings.lastBackup) / 864e5) : null;
    const hasData = S.expenses.length + S.income.length + S.debts.length > 10;
    const backupHint = hasData && (backupDays === null || backupDays > 30)
      ? `<a href="#/einstellungen" class="card pad" style="display:flex;gap:12px;align-items:center;text-decoration:none;color:var(--text)">
          ${svg('download')}<div class="grow"><div class="b">Zeit für ein Backup</div><div class="small">${backupDays === null ? 'Noch nie gesichert' : 'Letztes vor ' + backupDays + ' Tagen'} – damit bei einem Handywechsel nichts verloren geht.</div></div></a>`
      : '';

    return `<div class="page">
      <header class="head">
        <div>
          <div style="display:flex;align-items:center;gap:2px;margin-left:-8px">
            <button class="icon-btn sm plain" id="mprev" aria-label="Vorheriger Monat">${svg('back')}</button>
            <span class="sub">${monthName(m)}</span>
            <button class="icon-btn sm plain" id="mnext" aria-label="Nächster Monat" ${isCur ? 'disabled' : ''}>${svg('next')}</button>
          </div>
          <h1>Übersicht</h1>
        </div>
        <a class="icon-btn" href="#/einstellungen" aria-label="Einstellungen">${svg('gear')}</a>
      </header>

      ${balanceCard}

      <section class="card pad" style="display:flex;align-items:center;gap:16px" aria-label="Noch verfügbar">
        <svg viewBox="0 0 104 104" style="width:104px;height:104px" role="img" aria-label="${pct} Prozent frei">
          <circle cx="52" cy="52" r="44" stroke="var(--line)" stroke-width="10"/>
          <circle cx="52" cy="52" r="44" stroke="${avail < 0 ? 'var(--minus)' : 'var(--accent)'}" stroke-width="10" stroke-dasharray="${(C * pct / 100).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 52 52)"/>
          <text x="52" y="52" text-anchor="middle" font-size="20" font-weight="800" fill="var(--text)" stroke="none" font-family="inherit">${pct}%</text>
          <text x="52" y="69" text-anchor="middle" font-size="11" font-weight="600" fill="var(--sub)" stroke="none" font-family="inherit">frei</text>
        </svg>
        <div class="grow" style="display:flex;flex-direction:column;gap:4px">
          <span class="eyebrow ${avail < 0 ? 'minus' : 'plus'}">${avail < 0 ? 'Überzogen' : 'Noch verfügbar'}</span>
          <span class="big ${avail < 0 ? 'minus' : ''}">${eur(avail)}</span>
          <span class="small">von ${eur(total)}${isCur ? ' · noch ' + daysLeft + (daysLeft === 1 ? ' Tag' : ' Tage') : ''}</span>
          ${carry ? `<span class="small">inkl. ${signed(carry)} aus dem Vormonat</span>` : ''}
          ${isCur ? `<span class="pill soft" style="align-self:flex-start;margin-top:4px">≈ ${eur(perDay)} pro Tag</span>` : ''}
        </div>
      </section>

      <section class="card pad-s" aria-label="Konten">
        <h2 class="h2">Konten <a href="#/konten">Bearbeiten</a></h2>
        ${accRows || '<div class="empty">Noch keine Konten.</div>'}
      </section>

      <a href="#/schulden" class="card" style="text-decoration:none;color:var(--text);padding:14px 16px;display:flex;align-items:center;gap:14px">
        <span class="acc-ic" style="background:var(--minusSoft);color:var(--minus)">${svg('people')}</span>
        <div class="grow">
          <div class="small b">Dir wird geschuldet</div>
          <div style="font-size:20px;font-weight:800">${eur(owed)} <span class="small b">${owedN ? 'von ' + owedN + (owedN === 1 ? ' Person' : ' Leuten') : ''}</span></div>
        </div>
        ${svg('next', 'style="color:var(--sub)"')}
      </a>

      ${backupHint}

      <section class="card pad-s" aria-label="Letzte Ausgaben">
        <h2 class="h2">Zuletzt <a href="#/verlauf">Alle</a></h2>
        ${recent.length ? recent.map(expenseRow).join('') : '<div class="empty" style="padding:14px">Diesen Monat noch nichts eingetragen.</div>'}
      </section>
    </div>`;
  },
  mount() {
    $('#mprev').onclick = () => { viewMonth = addMonth(viewMonth, -1); render(); };
    $('#mnext').onclick = () => { if (viewMonth < curMonth()) { viewMonth = addMonth(viewMonth, 1); render(); } };
    if ($('#balance')) $('#balance').onclick = () => balanceSheet();
    bindExpenseRows();
  }
};

/** Kontostand eintragen oder korrigieren */
function balanceSheet() {
  const cur = realBalance();
  openSheet(`<h2>${cur === null ? 'Kontostand einrichten' : 'Kontostand korrigieren'}</h2>
    <p class="muted" style="margin:0">Schau in dein Online-Banking und trag den Kontostand ein, den du <b>jetzt</b> hast. Ab jetzt rechnet die App alle neuen Einnahmen und Ausgaben dazu oder ab.</p>
    <label class="field"><span class="sr">Kontostand in Euro</span><input id="b-amt" inputmode="decimal" placeholder="z. B. 523,40" value="${cur === null ? '' : centsToInput(cur)}"><span class="unit">€</span></label>
    <p class="small" style="margin:0 4px">Bei einem Minus ein „−“ davor schreiben.</p>
    <button class="btn" id="b-save">Speichern</button>`,
  (el) => {
    setTimeout(() => $('#b-amt', el).focus(), 50);
    $('#b-save', el).onclick = () => {
      const raw = $('#b-amt', el).value.trim();
      if (!raw) { $('#b-amt', el).focus(); return; }
      const cents = parseEur(raw);
      closeSheet();
      commit('Kontostand gespeichert', () => setBalanceAnchor(cents));
    };
  });
}

function expenseRow(e) {
  const isIn = e._k === 'in';
  const a = isIn ? null : acc(e.accountId);
  const rec = e.recurringId ? ' ' + svg('repeat', 'style="width:13px;height:13px;vertical-align:-2px;color:var(--sub)"') : '';
  return `<button class="row" data-exp="${e.id}">
    <span class="dot" style="background:${isIn ? 'var(--accent)' : a ? a.color : 'var(--sub)'}"></span>
    <div class="grow"><div class="b ell">${esc(e.note || (isIn ? 'Einnahme' : a ? a.name : 'Ausgabe'))}${rec}</div>
    <div class="small ell">${isIn ? 'Einnahme' : esc(a ? a.name : 'Ohne Konto')} · ${dateLabel(e.date)}</div></div>
    <span class="b ${isIn ? 'plus' : ''}" style="white-space:nowrap">${isIn ? '+' + eur(e.amount) : eur(e.amount)}</span></button>`;
}
function bindExpenseRows() {
  $$('[data-exp]').forEach((b) => b.addEventListener('click', () => go('ausgabe/' + b.dataset.exp)));
}

/* Verlauf */
VIEWS.verlauf = {
  nav: 'uebersicht',
  html() {
    const m = viewMonth;
    const list = txsOf(m);
    const groups = [];
    list.forEach((e) => {
      const g = groups[groups.length - 1];
      if (g && g.date === e.date) g.items.push(e); else groups.push({ date: e.date, items: [e] });
    });
    const dayNet = (items) => items.reduce((s, e) => s + (e._k === 'in' ? e.amount : -e.amount), 0);
    const inM = incomeIn(m); const outM = spentIn(m);
    return `<div class="page">
      <div class="topbar">
        <button class="icon-btn" id="back" aria-label="Zurück">${svg('back')}</button>
        <h1>Alle Buchungen</h1>
      </div>
      <div class="between" style="padding:0 6px"><span class="sub">${monthName(m)}</span><span class="small b"><span class="plus">+${eur(inM)}</span> · <span class="minus">−${eur(outM)}</span></span></div>
      ${groups.length ? groups.map((g) => { const n = dayNet(g.items); return `<section class="card pad-s"><h2 class="h2">${dateLabel(g.date)}<span class="small b ${n >= 0 ? 'plus' : ''}">${signed(n)}</span></h2>${g.items.map(expenseRow).join('')}</section>`; }).join('')
    : `<div class="card empty">${svg('wallet')}<div>Keine Buchungen in diesem Monat.</div></div>`}
    </div>`;
  },
  mount() {
    $('#back').onclick = () => back('uebersicht');
    bindExpenseRows();
  }
};

/* Konten */
let editBudget = null;
VIEWS.konten = {
  nav: 'konten',
  html() {
    const m = curMonth();
    const cards = S.accounts.map((a) => {
      const sp = spentIn(m, a.id);
      const rest = a.budget - sp;
      const over = rest < 0;
      const p = a.budget > 0 ? Math.round(sp / a.budget * 100) : 0;
      const editing = editBudget === a.id;
      return `<section class="card" style="padding:14px 16px;display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="acc-ic" data-edit-acc="${a.id}" style="background:${a.color}22;color:${a.color};border:none" aria-label="${esc(a.name)} bearbeiten">${esc(a.name.charAt(0).toUpperCase())}</button>
          <button class="grow" data-edit-acc="${a.id}" style="background:none;border:none;text-align:left;padding:0;color:var(--text)">
            <div class="b ell" style="font-size:16px">${esc(a.name)}</div>
            <div class="small">${eur(sp)} ausgegeben</div>
          </button>
          <button class="chip" data-budget="${a.id}" aria-expanded="${editing}">${eur(a.budget).replace(',00', '')} / Monat</button>
        </div>
        <div class="bar l"><i style="width:${clamp(p, 0, 100)}%;background:${over ? 'var(--minus)' : a.color}"></i></div>
        <div class="between" style="font-size:13px"><span class="muted">${p} % verbraucht</span><span class="b ${over ? 'minus' : ''}">${over ? eur(-rest) + ' drüber' : eur(rest) + ' übrig'}</span></div>
        ${editing ? `<div style="display:flex;align-items:center;gap:8px;padding-top:4px">
          <button class="key" style="width:60px;font-size:16px" data-step="-1000" aria-label="10 Euro weniger">−10</button>
          <label class="field grow" style="min-height:46px"><span class="sr">Budget in Euro</span><input inputmode="decimal" id="budget-input" value="${centsToInput(a.budget)}"><span class="unit">€</span></label>
          <button class="key" style="width:60px;font-size:16px" data-step="1000" aria-label="10 Euro mehr">+10</button>
        </div>` : ''}
      </section>`;
    }).join('');

    const rec = S.recurring.slice().sort((a, b) => a.day - b.day).map((r) => {
      const a = acc(r.accountId);
      const isIn = r.kind === 'income';
      return `<button class="row" data-rec="${r.id}"><span class="dot" style="background:${isIn ? 'var(--accent)' : a ? a.color : 'var(--sub)'}"></span>
        <div class="grow"><div class="b ell">${esc(r.name)}</div><div class="small">jeden ${r.day}. · ${isIn ? 'Einnahme' : esc(a ? a.name : 'Ohne Konto')}</div></div>
        <span class="b ${isIn ? 'plus' : ''}">${isIn ? '+' : ''}${eur(r.amount)}</span></button>`;
    }).join('');

    return `<div class="page">
      <header class="head">
        <div><div class="sub">Monatsbudget ${eur(budgetTotal())}</div><h1>Konten</h1></div>
        <button class="icon-btn primary" id="add-acc" aria-label="Konto anlegen">${svg('plus')}</button>
      </header>
      <p class="small" style="margin:0 6px">Tipp auf das Budget, um es zu ändern – auf den Namen, um das Konto zu bearbeiten.</p>
      ${cards || '<div class="card empty">Noch keine Konten.</div>'}
      <section class="card pad-s" aria-label="Feste Buchungen">
        <h2 class="h2">Feste Buchungen <button class="link" id="add-rec">+ Neu</button></h2>
        <p class="small" style="margin:0 2px 6px">Werden jeden Monat automatisch eingetragen, z. B. Handyvertrag oder Spotify – oder Einnahmen wie Taschengeld und Gehalt.</p>
        ${rec || '<div class="empty" style="padding:12px">Noch keine festen Buchungen.</div>'}
      </section>
    </div>`;
  },
  mount() {
    $('#add-acc').onclick = () => accountSheet(null);
    $('#add-rec').onclick = () => recurringSheet(null);
    $$('[data-edit-acc]').forEach((b) => b.onclick = () => accountSheet(b.dataset.editAcc));
    $$('[data-rec]').forEach((b) => b.onclick = () => recurringSheet(b.dataset.rec));
    $$('[data-budget]').forEach((b) => b.onclick = () => { editBudget = editBudget === b.dataset.budget ? null : b.dataset.budget; render(); });
    const inp = $('#budget-input');
    if (inp) {
      const a = acc(editBudget);
      const setB = (c) => { a.budget = Math.max(0, c); save(); };
      inp.addEventListener('change', () => { setB(parseEur(inp.value)); render(); });
      $$('[data-step]').forEach((b) => b.onclick = () => { setB(a.budget + +b.dataset.step); render(); });
    }
  }
};

function accountSheet(id) {
  const a = id ? acc(id) : null;
  let color = a ? a.color : COLORS[S.accounts.length % COLORS.length];
  openSheet(`<h2>${a ? 'Konto bearbeiten' : 'Neues Konto'}</h2>
    <label class="field"><span class="sr">Name</span><input id="f-name" placeholder="Name, z. B. Essen" value="${esc(a ? a.name : '')}" maxlength="30"></label>
    <label class="field"><span class="sr">Budget pro Monat</span><input id="f-budget" inputmode="decimal" placeholder="Budget pro Monat" value="${a ? centsToInput(a.budget) : ''}"><span class="unit">€ / Monat</span></label>
    <div class="label">Farbe</div>${swatches(color)}
    <button class="btn" id="f-save">Speichern</button>
    ${a ? '<button class="btn danger" id="f-del">' + svg('trash') + 'Konto löschen</button>' : ''}`,
  (el) => {
    bindSwatches(el, (c) => { color = c; });
    $('#f-save', el).onclick = () => {
      const name = $('#f-name', el).value.trim();
      if (!name) { $('#f-name', el).focus(); return; }
      const budget = parseEur($('#f-budget', el).value);
      closeSheet();
      commit(a ? 'Konto gespeichert' : 'Konto angelegt', () => {
        if (a) Object.assign(a, { name, budget, color });
        else S.accounts.push({ id: uid(), name, budget, color });
      });
    };
    if (a) $('#f-del', el).onclick = () => confirmSheet('Konto löschen?', `„${a.name}“ wird gelöscht. Bisherige Ausgaben bleiben erhalten, stehen dann aber unter „Ohne Konto“.`, 'Löschen',
      () => commit('Konto gelöscht', () => { S.accounts = S.accounts.filter((x) => x.id !== a.id); }));
  });
}

function recurringSheet(id) {
  const r = id ? S.recurring.find((x) => x.id === id) : null;
  const accOpts = S.accounts.map((a) => `<option value="${a.id}" ${r && r.accountId === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('');
  const isIn = !!(r && r.kind === 'income');
  openSheet(`<h2>${r ? 'Feste Buchung' : 'Neue feste Buchung'}</h2>
    <label class="field"><span class="sr">Art</span><select id="r-kind"><option value="expense" ${isIn ? '' : 'selected'}>Ausgabe (z. B. Handyvertrag)</option><option value="income" ${isIn ? 'selected' : ''}>Einnahme (z. B. Taschengeld, Gehalt)</option></select></label>
    <label class="field"><span class="sr">Name</span><input id="r-name" placeholder="Name, z. B. Handyvertrag" value="${esc(r ? r.name : '')}" maxlength="40"></label>
    <label class="field"><span class="sr">Betrag</span><input id="r-amt" inputmode="decimal" placeholder="Betrag" value="${r ? centsToInput(r.amount) : ''}"><span class="unit">€</span></label>
    <label class="field">${svg('calendar')}<span class="muted b">Jeden</span><input id="r-day" type="number" inputmode="numeric" min="1" max="31" value="${r ? r.day : 1}" style="max-width:60px"><span class="muted b">. im Monat</span></label>
    <label class="field" id="r-accwrap" style="${isIn ? 'display:none' : ''}"><span class="sr">Konto</span><select id="r-acc">${accOpts}</select></label>
    ${r ? '' : '<p class="small" style="margin:0 4px">Ist der Tag diesen Monat schon vorbei, wird sie gleich eingetragen.</p>'}
    <button class="btn" id="r-save">Speichern</button>
    ${r ? '<button class="btn danger" id="r-del">' + svg('trash') + 'Nicht mehr eintragen</button>' : ''}`,
  (el) => {
    $('#r-kind', el).onchange = () => { $('#r-accwrap', el).style.display = $('#r-kind', el).value === 'income' ? 'none' : ''; };
    $('#r-save', el).onclick = () => {
      const name = $('#r-name', el).value.trim();
      const amount = parseEur($('#r-amt', el).value);
      const day = clamp(parseInt($('#r-day', el).value, 10) || 1, 1, 31);
      const kind = $('#r-kind', el).value === 'income' ? 'income' : 'expense';
      const accountId = $('#r-acc', el).value;
      if (!name) { $('#r-name', el).focus(); return; }
      if (amount <= 0) { $('#r-amt', el).focus(); return; }
      closeSheet();
      commit('Feste Buchung gespeichert', () => {
        if (r) {
          // Art geändert: bereits automatisch eingetragene Buchungen dieses Eintrags entfernen
          if ((r.kind === 'income') !== (kind === 'income')) {
            S.expenses = S.expenses.filter((e) => e.recurringId !== r.id);
            S.income = S.income.filter((e) => e.recurringId !== r.id);
            r.skipped = [];
          }
          Object.assign(r, { kind, name, amount, day, accountId });
        } else S.recurring.push({ id: uid(), kind, name, amount, day, accountId, start: curMonth(), skipped: [] });
        applyRecurring();
      });
    };
    if (r) $('#r-del', el).onclick = () => { closeSheet(); commit('Feste Buchung entfernt', () => { S.recurring = S.recurring.filter((x) => x.id !== r.id); }); };
  });
}

/* Ausgabe eintragen / bearbeiten */
/** Summe und Text eines Lidl-Warenkorbs (Menge je Snack) */
function cartInfo(cart) {
  let sum = 0; let count = 0; const parts = [];
  S.products.forEach((pr) => { const q = cart[pr.id] || 0; if (q) { sum += q * pr.price; count += q; parts.push((q > 1 ? q + '× ' : '') + pr.name); } });
  return { sum, count, parts };
}

VIEWS.ausgabe = {
  nav: null,
  init(arg) {
    const id = arg && arg !== 'einnahme' && arg !== 'lidl' ? arg : null;
    const inc = id ? S.income.find((x) => x.id === id) : null;
    const e = inc || (id ? S.expenses.find((x) => x.id === id) : null);
    const kind = inc || arg === 'einnahme' ? 'in' : arg === 'lidl' ? 'lidl' : 'out';
    const firstAcc = S.accounts[0] ? S.accounts[0].id : null;
    const foodAcc = (S.accounts.find((x) => /essen|snack|lebensmittel/i.test(x.name)) || {}).id || firstAcc;
    draft = e
      ? { id: e.id, kind, amt: centsToInput(e.amount), acc: e.accountId || firstAcc, note: e.note || '', date: e.date, share: false, person: null, cart: {} }
      : { id: null, kind, amt: '', acc: kind === 'lidl' ? foodAcc : firstAcc, note: '', date: todayStr(), share: false, person: null, cart: {} };
  },
  html() {
    const d = draft;
    const isIn = d.kind === 'in';
    const isLidl = d.kind === 'lidl' && !d.id;
    const ci = cartInfo(d.cart || {});
    const amount = isLidl ? ci.sum : parseEur(d.amt);
    let hint = '&nbsp;';
    if (isIn) hint = 'Kommt auf dein Konto dazu.';
    else if (d.share) hint = 'Zählt nicht zu deinem Budget – du bekommst es ja zurück.';
    else if (d.acc && acc(d.acc)) {
      const a = acc(d.acc);
      const old = d.id ? (S.expenses.find((x) => x.id === d.id) || {}).amount || 0 : 0;
      const rest = a.budget - spentIn(monthOf(d.date), a.id) + old - amount;
      hint = esc(a.name) + (rest < 0 ? ': danach ' + eur(-rest) + ' drüber' : ': danach noch ' + eur(rest) + ' übrig');
    }
    const people = S.people.map((p) => `<button class="chip${d.person === p.id ? ' on' : ''}" data-person-pick="${p.id}" role="radio" aria-checked="${d.person === p.id}">${esc(p.name)}</button>`).join('');
    const seg = d.id ? '' : `<div class="chips center" role="radiogroup" aria-label="Art der Buchung">
        <button class="chip${!isIn && !isLidl ? ' on' : ''}" data-kind="out" role="radio" aria-checked="${!isIn && !isLidl}">Ausgabe</button>
        <button class="chip${isLidl ? ' on' : ''}" data-kind="lidl" role="radio" aria-checked="${isLidl}">Lidl</button>
        <button class="chip${isIn ? ' on' : ''}" data-kind="in" role="radio" aria-checked="${isIn}">Einnahme</button></div>`;
    if (isLidl) {
      const prods = S.products.slice().sort((a, b) => (b.fav ? 1 : 0) - (a.fav ? 1 : 0));
      const tiles = prods.map((pr) => {
        const q = d.cart[pr.id] || 0;
        return `<div class="tile">
          <button class="tile-main${q ? ' on' : ''}" data-add="${pr.id}" aria-label="${esc(pr.name)}, ${eur(pr.price)}${q ? ', ' + q + ' ausgewählt' : ''}">
            <span class="tile-img">${productVisual(pr)}</span>
            <span class="tile-name">${esc(pr.name)}</span>
            <span class="tile-price">${eur(pr.price)}</span>
          </button>
          ${pr.fav ? svg('star', 'class="fav"') : ''}
          ${q ? `<span class="qty">${q}×</span><button class="less" data-less="${pr.id}" aria-label="Ein ${esc(pr.name)} weniger">−</button>` : ''}
        </div>`;
      }).join('');
      const label = ci.count ? ci.count + (ci.count === 1 ? ' Teil' : ' Teile') : 'Noch nichts ausgewählt';
      return `<div class="page withbar">
        <div class="topbar">
          <button class="icon-btn" id="close" aria-label="Schließen">${svg('close')}</button>
          <h1 class="center">Lidl – für mich</h1>
          <span style="width:44px"></span>
        </div>
        ${seg}
        <p class="small" style="margin:0 2px;text-align:center">Tippe an, was du dir geholt hast. ${amount > 0 ? hint : ''}</p>
        <div class="chips center" role="radiogroup" aria-label="Konto">${S.accounts.map((a) =>
    `<button class="chip${d.acc === a.id ? ' on' : ''}" data-acc="${a.id}" role="radio" aria-checked="${d.acc === a.id}">${esc(a.name)}</button>`).join('')}</div>
        <div class="grid3">${tiles}</div>
        <div style="display:flex;gap:8px">
          <label class="field grow">${svg('pen')}<span class="sr">Notiz</span><input id="note" placeholder="Notiz (optional)" value="${esc(d.note)}" maxlength="60"></label>
          <label class="field" style="padding:0 10px;flex:0 0 auto"><span class="sr">Datum</span><input id="date" type="date" value="${d.date}" max="${todayStr()}" style="font-size:14px;max-width:132px"></label>
        </div>
      </div>
      <div class="bottombar">
        <div class="grow"><div class="small b">${label}</div><div style="font-size:20px;font-weight:800">${eur(ci.sum)}</div></div>
        <button class="link" id="clear">Leeren</button>
        <button class="btn" id="save" ${ci.sum > 0 ? '' : 'disabled'}>Speichern</button>
      </div>`;
    }
    return `<div class="page nonav">
      <div class="topbar">
        <button class="icon-btn" id="close" aria-label="Schließen">${svg('close')}</button>
        <h1 class="center">${d.id ? (isIn ? 'Einnahme bearbeiten' : 'Ausgabe bearbeiten') : (isIn ? 'Neue Einnahme' : 'Neue Ausgabe')}</h1>
        ${d.id ? `<button class="icon-btn" id="del" aria-label="Löschen" style="color:var(--minus)">${svg('trash')}</button>` : '<span style="width:44px"></span>'}
      </div>
      ${seg}
      <div><div class="amount ${isIn ? 'plus' : ''}" aria-live="polite">${isIn ? '+' : ''}${esc(d.amt || '0')} €</div><div class="small" style="text-align:center">${hint}</div></div>
      ${d.share || isIn ? '' : `<div class="chips center" role="radiogroup" aria-label="Konto">${S.accounts.map((a) =>
    `<button class="chip${d.acc === a.id ? ' on' : ''}" data-acc="${a.id}" role="radio" aria-checked="${d.acc === a.id}">${esc(a.name)}</button>`).join('')}</div>`}
      <div style="display:flex;gap:8px">
        <label class="field grow">${svg('pen')}<span class="sr">Wofür?</span><input id="note" placeholder="${isIn ? 'Von wem? z. B. Taschengeld' : 'Wofür? z. B. Lidl'}" value="${esc(d.note)}" maxlength="60"></label>
        <label class="field" style="padding:0 10px;flex:0 0 auto"><span class="sr">Datum</span><input id="date" type="date" value="${d.date}" max="${todayStr()}" style="font-size:14px;max-width:132px"></label>
      </div>
      ${d.id || isIn ? '' : `<button class="toggle-row" id="share" aria-pressed="${d.share}">${svg('people')}<span class="grow">Für jemanden mitbezahlt</span><span class="switch"></span></button>`}
      ${d.share && !isIn ? (people ? `<div class="chips" role="radiogroup" aria-label="Person">${people}</div>` : '<div class="small" style="margin:0 6px">Noch keine Personen – leg sie unter „Schulden“ an.</div>') : ''}
      ${keypadHTML()}
      <button class="btn" id="save" ${amount > 0 && (isIn || !d.share || d.person) ? '' : 'disabled'}>${d.share && !isIn ? 'Bei Schulden eintragen' : 'Speichern'}</button>
    </div>`;
  },
  mount() {
    const d = draft;
    const isIn = d.kind === 'in';
    $('#close').onclick = () => back('uebersicht');
    $$('[data-kind]').forEach((b) => b.onclick = () => {
      d.kind = b.dataset.kind;
      if (d.kind !== 'out') d.share = false;
      if (d.kind === 'lidl') { const a = S.accounts.find((x) => /essen|snack|lebensmittel/i.test(x.name)); if (a) d.acc = a.id; }
      render();
    });
    $$('[data-add]').forEach((b) => b.onclick = () => { d.cart[b.dataset.add] = (d.cart[b.dataset.add] || 0) + 1; render(); });
    $$('[data-less]').forEach((b) => b.onclick = () => { const k = b.dataset.less; d.cart[k] = Math.max(0, (d.cart[k] || 0) - 1); render(); });
    if ($('#clear')) $('#clear').onclick = () => { d.cart = {}; d.note = ''; render(); };
    $$('.key').forEach((k) => k.onclick = () => { d.amt = pressKey(d.amt, k.dataset.key); render(); });
    $$('[data-acc]').forEach((b) => b.onclick = () => { d.acc = b.dataset.acc; render(); });
    $$('[data-person-pick]').forEach((b) => b.onclick = () => { d.person = b.dataset.personPick; render(); });
    $('#note').addEventListener('input', (e) => { d.note = e.target.value; });
    $('#date').addEventListener('change', (e) => { if (e.target.value) { d.date = e.target.value; render(); } });
    const sh = $('#share');
    if (sh) sh.onclick = () => { d.share = !d.share; render(); };
    if ($('#del')) $('#del').onclick = () => {
      const e = (isIn ? S.income : S.expenses).find((x) => x.id === d.id);
      commit(isIn ? 'Einnahme gelöscht' : 'Ausgabe gelöscht', () => {
        if (isIn) S.income = S.income.filter((x) => x.id !== d.id);
        else S.expenses = S.expenses.filter((x) => x.id !== d.id);
        if (e && e.recurringId) {
          const r = S.recurring.find((x) => x.id === e.recurringId);
          if (r) { r.skipped = r.skipped || []; r.skipped.push(monthOf(e.date)); }
        }
      }, { after: () => back('uebersicht') });
    };
    $('#save').onclick = () => {
      if (d.kind === 'lidl' && !d.id) {
        const ci = cartInfo(d.cart);
        if (ci.sum <= 0) return;
        const note = d.note.trim() || ci.parts.join(', ');
        commit(`${eur(ci.sum)} eingetragen`, () => {
          S.expenses.push({ id: uid(), amount: ci.sum, accountId: d.acc, note, date: d.date, ts: Date.now() });
        }, { after: () => { if (monthOf(d.date) !== viewMonth) viewMonth = monthOf(d.date); back('uebersicht'); } });
        return;
      }
      const amount = parseEur(d.amt);
      if (amount <= 0) return;
      if (isIn) {
        commit(d.id ? 'Einnahme gespeichert' : `+${eur(amount)} eingetragen`, () => {
          if (d.id) Object.assign(S.income.find((x) => x.id === d.id), { amount, note: d.note.trim(), date: d.date });
          else S.income.push({ id: uid(), amount, note: d.note.trim(), date: d.date, ts: Date.now() });
        }, { after: () => { if (monthOf(d.date) !== viewMonth) viewMonth = monthOf(d.date); back('uebersicht'); } });
        return;
      }
      if (d.share) {
        const p = person(d.person);
        if (!p) return;
        commit(`${p.name}: ${eur(amount)} eingetragen`, () => {
          S.debts.push({ id: uid(), personId: p.id, type: 'buy', amount, text: d.note.trim() || 'Mitbezahlt', date: d.date, ts: Date.now() });
        }, { after: () => back('uebersicht') });
        return;
      }
      commit(d.id ? 'Ausgabe gespeichert' : `${eur(amount)} eingetragen`, () => {
        if (d.id) Object.assign(S.expenses.find((x) => x.id === d.id), { amount, accountId: d.acc, note: d.note.trim(), date: d.date });
        else S.expenses.push({ id: uid(), amount, accountId: d.acc, note: d.note.trim(), date: d.date, ts: Date.now() });
      }, { after: () => { if (monthOf(d.date) !== viewMonth) viewMonth = monthOf(d.date); back('uebersicht'); } });
    };
  }
};

/* Schulden – Personenkarten */
VIEWS.schulden = {
  nav: 'schulden',
  html() {
    let owed = 0; let credit = 0;
    const cards = S.people.map((p) => {
      const s = saldo(p.id);
      if (s < 0) owed += -s; else credit += s;
      const l = look(s);
      return `<button class="pcard" data-person="${p.id}" aria-label="${esc(p.name)}, ${l.text}, ${l.status}. Tippen: mitgebracht, doppelt tippen: Zahlung, gedrückt halten: Übersicht">
        <div style="display:flex;align-items:center;gap:10px;width:100%">
          <span class="avatar" style="background:${p.color}" aria-hidden="true">${esc(p.name.charAt(0).toUpperCase())}</span>
          <span class="pname grow ell">${esc(p.name)}</span>
        </div>
        <span class="psaldo ${l.cls}">${l.text}</span>
        <span class="pill ${l.cls}">${l.status}</span>
      </button>`;
    }).join('');
    return `<div class="page">
      <header class="head">
        <div><div class="sub">Wer schuldet dir was?</div><h1>Schulden</h1></div>
        <button class="icon-btn primary" id="add-person" aria-label="Person hinzufügen">${svg('plus')}</button>
      </header>
      <section class="card pad" style="display:flex;flex-direction:column;gap:12px" aria-label="Zusammenfassung">
        <div class="between" style="align-items:flex-end">
          <div><div class="eyebrow minus">Dir wird geschuldet</div><div class="big">${eur(owed)}</div></div>
          <div class="right"><div class="eyebrow plus">Guthaben</div><div style="font-size:20px;font-weight:800">${eur(credit)}</div></div>
        </div>
        <div class="chips" style="gap:6px">
          <span class="hint"><b>Tippen</b> mitgebracht</span>
          <span class="hint"><b>2× tippen</b> Zahlung</span>
          <span class="hint"><b>Halten</b> Übersicht</span>
        </div>
      </section>
      ${S.people.length ? `<div class="grid2">${cards}<button class="pcard add" id="add-person-2">${svg('plus')}Person</button></div>`
    : `<div class="card empty">${svg('people')}<div>Noch niemand hier.</div><button class="btn" id="add-person-2" style="margin-top:14px">Erste Person anlegen</button></div>`}
    </div>`;
  },
  mount() {
    $('#add-person').onclick = () => personSheet(null);
    $('#add-person-2').onclick = () => personSheet(null);
    $$('[data-person]').forEach(bindGestures);
  }
};

/** 1× tippen → mitgebracht, 2× tippen → Zahlung, halten → Übersicht */
function bindGestures(el) {
  const id = el.dataset.person;
  let lt = null; let long = false; let sx = 0; let sy = 0;
  const cancel = () => { clearTimeout(lt); el.classList.remove('pressing'); };
  el.addEventListener('pointerdown', (e) => {
    long = false; sx = e.clientX; sy = e.clientY;
    el.classList.add('pressing');
    clearTimeout(lt);
    lt = setTimeout(() => {
      long = true;
      el.classList.remove('pressing');
      clearTimeout(tapTimer); tapTimer = null;
      if (navigator.vibrate) navigator.vibrate(25);
      suppressClickUntil = Date.now() + 500;
      go('person/' + id);
    }, 500);
  });
  el.addEventListener('pointermove', (e) => { if (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10) cancel(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => el.addEventListener(t, cancel));
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  el.addEventListener('click', () => {
    if (long) { long = false; return; }
    if (tapTimer && tapId === id) {
      clearTimeout(tapTimer); tapTimer = null;
      go('zahlung/' + id);
      return;
    }
    clearTimeout(tapTimer);
    tapId = id;
    tapTimer = setTimeout(() => { tapTimer = null; go('mitbringen/' + id); }, 280);
  });
}

function personSheet(id) {
  const p = id ? person(id) : null;
  let color = p ? p.color : COLORS[S.people.length % COLORS.length];
  openSheet(`<h2>${p ? 'Person bearbeiten' : 'Neue Person'}</h2>
    <label class="field"><span class="sr">Name</span><input id="p-name" placeholder="Name" value="${esc(p ? p.name : '')}" maxlength="24"></label>
    <div class="label">Farbe</div>${swatches(color)}
    <button class="btn" id="p-save">Speichern</button>
    ${p ? '<button class="btn danger" id="p-del">' + svg('trash') + 'Person löschen</button>' : ''}`,
  (el) => {
    bindSwatches(el, (c) => { color = c; });
    if (!p) setTimeout(() => $('#p-name', el).focus(), 50);
    $('#p-save', el).onclick = () => {
      const name = $('#p-name', el).value.trim();
      if (!name) { $('#p-name', el).focus(); return; }
      closeSheet();
      commit(p ? 'Gespeichert' : name + ' angelegt', () => {
        if (p) Object.assign(p, { name, color });
        else S.people.push({ id: uid(), name, color });
      });
    };
    if (p) $('#p-del', el).onclick = () => confirmSheet(`${p.name} löschen?`, 'Die Person und ihr ganzer Verlauf werden gelöscht.', 'Löschen',
      () => commit(p.name + ' gelöscht', () => {
        S.people = S.people.filter((x) => x.id !== p.id);
        S.debts = S.debts.filter((x) => x.personId !== p.id);
      }, { after: () => back('schulden') }));
  });
}

/* Mitgebracht (1× tippen) */
VIEWS.mitbringen = {
  nav: null,
  init() { draft = { cart: {}, extra: '', note: '' }; },
  html(id) {
    const p = person(id);
    if (!p) return notFound();
    const d = draft;
    const l = look(saldo(p.id));
    const prods = S.products.slice().sort((a, b) => (b.fav ? 1 : 0) - (a.fav ? 1 : 0));
    let sum = 0; let count = 0;
    prods.forEach((pr) => { const q = d.cart[pr.id] || 0; sum += q * pr.price; count += q; });
    const extra = parseEur(d.extra);
    sum += extra;
    const label = count ? count + (count === 1 ? ' Teil' : ' Teile') + (extra ? ' + Betrag' : '') : (extra ? 'Eigener Betrag' : 'Noch nichts ausgewählt');
    const tiles = prods.map((pr) => {
      const q = d.cart[pr.id] || 0;
      return `<div class="tile">
        <button class="tile-main${q ? ' on' : ''}" data-add="${pr.id}" aria-label="${esc(pr.name)}, ${eur(pr.price)}${q ? ', ' + q + ' ausgewählt' : ''}">
          <span class="tile-img">${productVisual(pr)}</span>
          <span class="tile-name">${esc(pr.name)}</span>
          <span class="tile-price">${eur(pr.price)}</span>
        </button>
        ${pr.fav ? svg('star', 'class="fav"') : ''}
        ${q ? `<span class="qty">${q}×</span><button class="less" data-less="${pr.id}" aria-label="Ein ${esc(pr.name)} weniger">−</button>` : ''}
      </div>`;
    }).join('');
    return `<div class="page withbar">
      <div class="topbar">
        <button class="icon-btn" id="back" aria-label="Zurück">${svg('back')}</button>
        <span class="avatar" style="background:${p.color}" aria-hidden="true">${esc(p.name.charAt(0).toUpperCase())}</span>
        <div class="grow"><h1 class="ell">${esc(p.name)} hat bekommen</h1><div class="small b ${l.cls}">aktuell ${l.text} · ${l.status}</div></div>
      </div>
      <p class="small" style="margin:0 2px">Tippe alles an, was du mitgebracht hast.</p>
      <div class="grid3">${tiles}
        <div class="tile"><button class="tile-main" id="other" aria-label="Anderer Betrag"><span class="tile-img">${svg('anderes')}</span><span class="tile-name">Anderes</span><span class="tile-price">Betrag unten</span></button></div>
      </div>
      <div style="display:flex;gap:8px">
        <label class="field" style="flex:0 0 120px;min-width:0;padding:0 14px"><span class="sr">Anderer Betrag in Euro</span><input id="extra" size="4" inputmode="decimal" placeholder="Betrag" value="${esc(d.extra)}"><span class="unit">€</span></label>
        <label class="field grow" style="padding:0 14px"><span class="sr">Wofür (optional)</span><input id="mnote" size="8" placeholder="Wofür? (optional)" value="${esc(d.note)}" maxlength="60"></label>
      </div>
    </div>
    <div class="bottombar">
      <div class="grow"><div class="small b">${label}</div><div style="font-size:20px;font-weight:800" id="sum">${eur(sum)}</div></div>
      <button class="link" id="clear">Leeren</button>
      <button class="btn" id="save" ${sum > 0 ? '' : 'disabled'}>Eintragen</button>
    </div>`;
  },
  mount(id) {
    const p = person(id);
    if (!p) return;
    const d = draft;
    $('#back').onclick = () => back('schulden');
    $$('[data-add]').forEach((b) => b.onclick = () => { d.cart[b.dataset.add] = (d.cart[b.dataset.add] || 0) + 1; render(); });
    $$('[data-less]').forEach((b) => b.onclick = () => { const k = b.dataset.less; d.cart[k] = Math.max(0, (d.cart[k] || 0) - 1); render(); });
    $('#other').onclick = () => $('#extra').focus();
    const ex = $('#extra');
    ex.addEventListener('input', () => { d.extra = ex.value; });
    ex.addEventListener('change', () => render());
    ex.addEventListener('keydown', (e) => { if (e.key === 'Enter') ex.blur(); });
    $('#mnote').addEventListener('input', (e) => { d.note = e.target.value; });
    $('#clear').onclick = () => { draft = { cart: {}, extra: '', note: '' }; render(); };
    $('#save').onclick = () => {
      let sum = 0;
      const parts = [];
      S.products.forEach((pr) => {
        const q = d.cart[pr.id] || 0;
        if (q) { sum += q * pr.price; parts.push((q > 1 ? q + '× ' : '') + pr.name); }
      });
      const extra = parseEur(d.extra);
      const note = d.note.trim();
      if (extra) { sum += extra; parts.push(note || 'Betrag'); } else if (note) parts.push(note);
      if (sum <= 0) return;
      commit(`${p.name}: ${eur(sum)} eingetragen`, () => {
        S.debts.push({ id: uid(), personId: p.id, type: 'buy', amount: sum, text: parts.join(', '), date: todayStr(), ts: Date.now() });
      }, { after: () => back('schulden') });
    };
  }
};

/* Zahlung (2× tippen) */
VIEWS.zahlung = {
  nav: null,
  init() { draft = { pay: '' }; },
  html(id) {
    const p = person(id);
    if (!p) return notFound();
    const s = saldo(p.id);
    const before = look(s);
    const payC = parseEur(draft.pay);
    const after = look(s + payC);
    const quick = [];
    if (s < 0) quick.push({ v: -s, t: 'Alles: ' + eur(-s) });
    [500, 1000, 2000].forEach((v) => quick.push({ v, t: eur(v).replace(',00', '') }));
    return `<div class="page nonav">
      <div class="topbar">
        <button class="icon-btn" id="back" aria-label="Zurück">${svg('back')}</button>
        <span class="avatar" style="background:${p.color}" aria-hidden="true">${esc(p.name.charAt(0).toUpperCase())}</span>
        <h1 class="ell">${esc(p.name)} hat bezahlt</h1>
      </div>
      <section class="card" style="padding:14px 18px;display:flex;align-items:center;justify-content:space-between">
        <div><div class="small b">Vorher</div><div style="font-size:20px;font-weight:800" class="${before.cls}">${before.text}</div></div>
        ${svg('next', 'style="color:var(--sub)"')}
        <div class="right"><div class="small b">Danach</div><div style="font-size:20px;font-weight:800" class="${after.cls}">${after.text}</div></div>
      </section>
      <div class="amount" aria-live="polite">${esc(draft.pay || '0')} €</div>
      <div class="chips center">${quick.map((q) => `<button class="chip" data-quick="${q.v}">${q.t}</button>`).join('')}</div>
      ${keypadHTML()}
      <button class="btn" id="save" ${payC > 0 ? '' : 'disabled'}>Zahlung eintragen</button>
    </div>`;
  },
  mount(id) {
    const p = person(id);
    if (!p) return;
    $('#back').onclick = () => back('schulden');
    $$('.key').forEach((k) => k.onclick = () => { draft.pay = pressKey(draft.pay, k.dataset.key); render(); });
    $$('[data-quick]').forEach((b) => b.onclick = () => { draft.pay = centsToInput(+b.dataset.quick); render(); });
    $('#save').onclick = () => {
      const amount = parseEur(draft.pay);
      if (amount <= 0) return;
      commit(`${p.name} hat ${eur(amount)} gezahlt`, () => {
        S.debts.push({ id: uid(), personId: p.id, type: 'pay', amount, text: 'Zahlung', date: todayStr(), ts: Date.now() });
      }, { after: () => back('schulden') });
    };
  }
};

/* Personen-Übersicht (halten) */
VIEWS.person = {
  nav: 'schulden',
  html(id) {
    const p = person(id);
    if (!p) return notFound();
    const s = saldo(p.id);
    const l = look(s);
    let buy = 0; let pay = 0;
    const entries = S.debts.filter((d) => d.personId === p.id);
    entries.forEach((d) => { if (d.type === 'pay') pay += d.amount; else buy += d.amount; });
    const list = entries.slice().sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
    return `<div class="page">
      <div class="topbar" style="justify-content:space-between">
        <button class="icon-btn" id="back" aria-label="Zurück">${svg('back')}</button>
        <div style="display:flex;gap:8px">
          <button class="icon-btn" id="share" aria-label="Stand teilen">${svg('share')}</button>
          <button class="icon-btn" id="edit" aria-label="Person bearbeiten">${svg('edit')}</button>
        </div>
      </div>
      <section class="card" style="padding:20px 18px 16px;display:flex;flex-direction:column;align-items:center;gap:4px">
        <span class="avatar l" style="background:${p.color}" aria-hidden="true">${esc(p.name.charAt(0).toUpperCase())}</span>
        <h1 style="margin:6px 0 0;font-size:22px;font-weight:800">${esc(p.name)}</h1>
        <div class="${l.cls}" style="font-size:44px;font-weight:800;letter-spacing:-0.03em">${l.text}</div>
        <span class="pill ${l.cls}" style="font-size:13px">${l.long}</span>
        <div class="grid2" style="width:100%;margin-top:12px;gap:8px">
          <div style="padding:10px 12px;border-radius:16px;background:var(--chip)"><div class="small b">Mitgebracht</div><div class="bb" style="font-size:17px">${eur(buy)}</div></div>
          <div style="padding:10px 12px;border-radius:16px;background:var(--chip)"><div class="small b">Bezahlt</div><div class="bb" style="font-size:17px">${eur(pay)}</div></div>
        </div>
      </section>
      <div class="grid2" style="gap:8px">
        <a class="btn ghost" href="#/mitbringen/${p.id}" style="text-decoration:none">+ Mitgebracht</a>
        <a class="btn" href="#/zahlung/${p.id}" style="text-decoration:none">Zahlung</a>
      </div>
      <section class="card pad-s" aria-label="Verlauf">
        <h2 class="h2">Verlauf</h2>
        ${list.length ? list.map((d) => `<button class="row sep" data-debt="${d.id}">
          <span class="badge-ic ${d.type === 'pay' ? 'plus' : 'minus'}" aria-hidden="true">${d.type === 'pay' ? '+' : '−'}</span>
          <div class="grow"><div class="b ell" style="font-size:13px">${esc(d.text)}</div><div class="small">${dateLabel(d.date)}</div></div>
          <span class="bb ${d.type === 'pay' ? 'plus' : 'minus'}" style="white-space:nowrap">${d.type === 'pay' ? '+' + eur(d.amount) : eur(-d.amount)}</span>
        </button>`).join('') : '<div class="empty" style="padding:12px">Noch keine Einträge.</div>'}
      </section>
    </div>`;
  },
  mount(id) {
    const p = person(id);
    if (!p) return;
    $('#back').onclick = () => back('schulden');
    $('#edit').onclick = () => personSheet(p.id);
    $('#share').onclick = () => shareStatus(p);
    $$('[data-debt]').forEach((b) => b.onclick = () => {
      const d = S.debts.find((x) => x.id === b.dataset.debt);
      openSheet(`<h2>${esc(d.text)}</h2><p class="muted" style="margin:0">${dateLabel(d.date)} · ${d.type === 'pay' ? 'Zahlung ' + eur(d.amount) : 'Mitgebracht ' + eur(d.amount)}</p>
        <button class="btn danger" id="d-del">${svg('trash')}Eintrag löschen</button><button class="btn ghost" data-close>Abbrechen</button>`,
      (el) => { $('#d-del', el).onclick = () => { closeSheet(); commit('Eintrag gelöscht', () => { S.debts = S.debts.filter((x) => x.id !== d.id); }); }; });
    });
  }
};

function shareStatus(p) {
  const s = saldo(p.id);
  const entries = S.debts.filter((d) => d.personId === p.id).sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id)).slice(0, 6);
  let text = `Hey ${p.name}, kleiner Zwischenstand: `;
  if (s < 0) text += `Du hast bei mir noch ${eur(-s)} offen.`;
  else if (s > 0) text += `Du hast bei mir noch ${eur(s)} Guthaben.`;
  else text += 'Wir sind quitt.';
  if (entries.length) {
    text += '\n\nZuletzt:\n' + entries.map((d) => `• ${d.type === 'pay' ? 'Zahlung' : d.text} – ${d.type === 'pay' ? '+' : ''}${eur(d.amount)} (${dateLabel(d.date)})`).join('\n');
  }
  const nativeShare = native() ? plugin('Share') : null;
  if (nativeShare) {
    nativeShare.share({ text, dialogTitle: 'Stand teilen' }).catch(() => {});
    return;
  }
  if (navigator.share) {
    navigator.share({ text }).catch(() => {});
    return;
  }
  openSheet(`<h2>Stand teilen</h2><textarea id="sh-text" readonly>${esc(text)}</textarea><button class="btn" id="sh-copy">Text kopieren</button>`,
    (el) => {
      $('#sh-copy', el).onclick = async () => {
        try { await navigator.clipboard.writeText(text); toast('Text kopiert'); closeSheet(); }
        catch (e) { $('#sh-text', el).select(); document.execCommand('copy'); toast('Text kopiert'); closeSheet(); }
      };
    });
}

/* Einstellungen */
VIEWS.einstellungen = {
  nav: null,
  html() {
    const st = S.settings;
    const prods = S.products.map((p) => `<button class="row sep" data-prod="${p.id}">
      <span class="thumb">${productVisual(p)}</span>
      <div class="grow"><div class="b ell">${esc(p.name)}${p.fav ? ' ' + svg('star', 'style="width:14px;height:14px;fill:var(--gold);stroke:none;vertical-align:-2px"') : ''}</div></div>
      <span class="b">${eur(p.price)}</span></button>`).join('');
    const lb = st.lastBackup ? new Date(st.lastBackup).toLocaleDateString('de-DE') : 'noch nie';
    return `<div class="page">
      <div class="topbar">
        <button class="icon-btn" id="back" aria-label="Zurück">${svg('back')}</button>
        <h1>Einstellungen</h1>
      </div>

      <section class="card pad-s">
        <h2 class="h2">Darstellung</h2>
        <div class="chips" role="radiogroup" aria-label="Darstellung" style="padding-bottom:8px">
          ${[['auto', 'Wie Handy'], ['light', 'Hell'], ['dark', 'Dunkel']].map(([k, t]) => `<button class="chip${st.theme === k ? ' on' : ''}" data-theme-pick="${k}" role="radio" aria-checked="${st.theme === k}">${t}</button>`).join('')}
        </div>
      </section>

      <section class="card pad-s">
        <h2 class="h2">Startseite</h2>
        <p class="small" style="margin:0 2px 8px">Diese Seite siehst du, wenn du die App öffnest.</p>
        <div class="chips" role="radiogroup" aria-label="Startseite" style="padding-bottom:8px">
          ${[['schulden', 'Schulden'], ['uebersicht', 'Übersicht']].map(([k, t]) => `<button class="chip${homeName() === k ? ' on' : ''}" data-home-pick="${k}" role="radio" aria-checked="${homeName() === k}">${t}</button>`).join('')}
        </div>
      </section>

      <section class="card pad-s">
        <h2 class="h2">Kontostand</h2>
        <button class="row" id="set-balance" style="padding:8px 2px">
          <span class="acc-ic" style="background:var(--accentSoft);color:var(--accent)">${svg('bank')}</span>
          <div class="grow"><div class="b">${realBalance() === null ? 'Noch nicht eingerichtet' : 'Aktuell ' + eur(realBalance())}</div><div class="small">Antippen, um den echten Kontostand einzutragen oder zu korrigieren.</div></div>${svg('next', 'style="color:var(--sub)"')}
        </button>
        <button class="toggle-row" id="debts-bal" aria-pressed="${!!st.debtsInBalance}" style="background:none;border:none;padding:8px 2px">
          ${svg('people')}<span class="grow">Schulden im Kontostand mitrechnen<br><span class="small" style="font-weight:500">Was du für andere mitgebracht hast, zählt als ausgegeben. Zahlungen von ihnen zählen als eingenommen.</span></span><span class="switch"></span>
        </button>
      </section>

      <section class="card pad-s">
        <h2 class="h2">Budget</h2>
        <button class="toggle-row" id="carry" aria-pressed="${!!st.carry}" style="background:none;border:none;padding:8px 2px">
          ${svg('repeat')}<span class="grow">Rest vom Vormonat mitnehmen<br><span class="small" style="font-weight:500">Übrig gebliebenes Geld (oder ein Minus) wird zum nächsten Monat dazugerechnet.</span></span><span class="switch"></span>
        </button>
      </section>

      <section class="card pad-s">
        <h2 class="h2">Snacks & Preise <button class="link" id="add-prod">+ Neu</button></h2>
        <p class="small" style="margin:0 2px 6px">Tippe auf einen Snack, um Preis, Namen oder Foto zu ändern.</p>
        ${prods}
      </section>

      <section class="card pad-s" style="padding-bottom:14px;display:flex;flex-direction:column;gap:8px">
        <h2 class="h2">Daten</h2>
        <p class="small" style="margin:0 2px">Alles bleibt nur auf diesem Handy. Letztes Backup: <b>${lb}</b></p>
        <button class="btn ghost" id="export">${svg('download')}Backup speichern</button>
        <label class="btn ghost" style="cursor:pointer">${svg('upload')}Backup laden<input type="file" id="import-file" accept=".json,application/json" class="sr"></label>
        <a class="btn ghost" href="#/import" style="text-decoration:none">${svg('bank')}Kontoauszug importieren (CSV)</a>
        <button class="btn danger" id="wipe">${svg('trash')}Alle Daten löschen</button>
      </section>
      <p class="small" style="text-align:center;margin:4px 0 0">Geld · Version 1.1 · offline</p>
    </div>`;
  },
  mount() {
    $('#back').onclick = () => back('uebersicht');
    $$('[data-theme-pick]').forEach((b) => b.onclick = () => { S.settings.theme = b.dataset.themePick; save(); render(); });
    $('#carry').onclick = () => { S.settings.carry = !S.settings.carry; save(); render(); };
    $$('[data-home-pick]').forEach((b) => b.onclick = () => { S.settings.home = b.dataset.homePick; save(); render(); });
    $('#set-balance').onclick = () => balanceSheet();
    $('#debts-bal').onclick = () => { S.settings.debtsInBalance = !S.settings.debtsInBalance; save(); render(); };
    $('#add-prod').onclick = () => productSheet(null);
    $$('[data-prod]').forEach((b) => b.onclick = () => productSheet(b.dataset.prod));
    $('#export').onclick = exportBackup;
    $('#import-file').addEventListener('change', (e) => importBackup(e.target.files[0]));
    $('#wipe').onclick = () => confirmSheet('Wirklich alles löschen?', 'Alle Konten, Ausgaben, Einnahmen, Personen und Schulden werden gelöscht. Mach vorher besser ein Backup.', 'Alles löschen',
      () => commit('Alles gelöscht', () => { S = defaults(); }));
  }
};

function productSheet(id) {
  const p = id ? S.products.find((x) => x.id === id) : null;
  const d = { name: p ? p.name : '', price: p ? centsToInput(p.price) : '', icon: p ? p.icon : 'snack', photo: p ? p.photo || null : null, fav: p ? !!p.fav : false };
  const draw = () => openSheet(`<h2>${p ? 'Snack bearbeiten' : 'Neuer Snack'}</h2>
    <div style="display:flex;gap:12px;align-items:center">
      <span class="tile-img" style="width:72px;height:72px;border-radius:22px">${d.photo ? `<img src="${d.photo}" alt="">` : svg(d.icon, 'style="width:44px;height:44px"')}</span>
      <div class="grow" style="display:flex;flex-direction:column;gap:8px">
        <label class="btn ghost" style="min-height:44px;cursor:pointer">${svg('camera')}Foto machen<input type="file" accept="image/*" capture="environment" class="sr" data-photo></label>
        <label class="btn ghost" style="min-height:44px;cursor:pointer">${svg('image')}Aus Galerie<input type="file" accept="image/*" class="sr" data-photo></label>
      </div>
    </div>
    ${d.photo ? '<button class="link" id="no-photo" style="align-self:flex-start">Foto entfernen</button>' : `<div class="chips" aria-label="Symbol">${PRODUCT_ICONS.map((ic) => `<button class="chip${d.icon === ic ? ' on' : ''}" data-icon="${ic}" aria-label="Symbol ${ic}" style="padding:0 8px">${svg(ic, 'style="width:24px;height:24px"')}</button>`).join('')}</div>`}
    <label class="field"><span class="sr">Name</span><input id="s-name" placeholder="Name" value="${esc(d.name)}" maxlength="40"></label>
    <label class="field"><span class="sr">Preis</span><input id="s-price" inputmode="decimal" placeholder="Preis" value="${esc(d.price)}"><span class="unit">€</span></label>
    <button class="toggle-row" id="s-fav" aria-pressed="${d.fav}">${svg('star')}<span class="grow">Favorit (steht ganz vorne)</span><span class="switch"></span></button>
    <button class="btn" id="s-save">Speichern</button>
    ${p ? '<button class="btn danger" id="s-del">' + svg('trash') + 'Snack löschen</button>' : ''}`,
  (el) => {
    const keep = () => { d.name = $('#s-name', el).value; d.price = $('#s-price', el).value; };
    $$('[data-photo]', el).forEach((inp) => inp.addEventListener('change', async () => {
      const f = inp.files[0];
      if (!f) return;
      keep();
      try { d.photo = await resizeImage(f, 192); } catch (e) { toast('Foto konnte nicht geladen werden'); }
      draw();
    }));
    if ($('#no-photo', el)) $('#no-photo', el).onclick = () => { keep(); d.photo = null; draw(); };
    $$('[data-icon]', el).forEach((b) => b.onclick = () => { keep(); d.icon = b.dataset.icon; draw(); });
    $('#s-fav', el).onclick = () => { keep(); d.fav = !d.fav; draw(); };
    $('#s-save', el).onclick = () => {
      keep();
      const name = d.name.trim();
      const price = parseEur(d.price);
      if (!name) { $('#s-name', el).focus(); return; }
      closeSheet();
      commit('Snack gespeichert', () => {
        const data = { name, price, icon: d.icon, photo: d.photo || undefined, fav: d.fav };
        if (p) Object.assign(p, data); else S.products.push(Object.assign({ id: uid() }, data));
      });
    };
    if (p) $('#s-del', el).onclick = () => { closeSheet(); commit('Snack gelöscht', () => { S.products = S.products.filter((x) => x.id !== p.id); }); };
  });
  draw();
}

/** Foto quadratisch zuschneiden und verkleinern (spart Speicher) */
function resizeImage(file, size) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const s = Math.min(img.naturalWidth, img.naturalHeight);
      c.getContext('2d').drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Bild')); };
    img.src = url;
  });
}

/* In der Android-App (Capacitor) gibt es echte Datei- und Teilen-Funktionen */
const native = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const plugin = (n) => (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[n]) || null;

async function exportBackupNative() {
  const FS = plugin('Filesystem'); const Share = plugin('Share');
  if (!FS || !Share) throw new Error('plugin');
  const name = `geld-backup-${todayStr()}.json`;
  const res = await FS.writeFile({ path: name, data: JSON.stringify(S, null, 1), directory: 'CACHE', encoding: 'utf8' });
  await Share.share({ title: 'Geld-Backup', files: [res.uri], dialogTitle: 'Backup speichern unter …' });
}

function exportBackup() {
  S.settings.lastBackup = Date.now();
  save();
  if (native()) {
    exportBackupNative().then(() => { toast('Backup erstellt'); render(); })
      .catch((e) => { if (!/cancel/i.test(String(e && e.message))) toast('Backup konnte nicht gespeichert werden'); });
    return;
  }
  const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `geld-backup-${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toast('Backup gespeichert (Downloads)');
  render();
}
function importBackup(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    let data;
    try { data = JSON.parse(r.result); } catch (e) { toast('Das ist keine Backup-Datei'); return; }
    if (!data || data.v !== 1 || !Array.isArray(data.accounts)) { toast('Das ist keine Backup-Datei'); return; }
    confirmSheet('Backup laden?', 'Alles, was gerade in der App ist, wird durch das Backup ersetzt.', 'Laden',
      () => commit('Backup geladen', () => { S = normalize(data); }));
  };
  r.readAsText(file);
}

/* ---------- CSV-Import (Kontoauszug, z. B. VR-Banking) ---------- */
let importRows = null;
let importSaldo = null;      // {amount, date} aus dem Auszug
let importUseSaldo = false;  // Kontostand aus dem Auszug übernehmen?
VIEWS.import = {
  nav: null,
  html() {
    const rows = importRows;
    const opts = (sel) => S.accounts.map((a) => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${esc(a.name)}</option>`).join('');
    const n = rows ? rows.filter((r) => r.on).length : 0;
    const nIn = rows ? rows.filter((r) => r.type === 'in').length : 0;
    const sal = importSaldo;
    return `<div class="page ${rows ? 'withbar' : ''}">
      <div class="topbar">
        <button class="icon-btn" id="back" aria-label="Zurück">${svg('back')}</button>
        <h1>Kontoauszug importieren</h1>
      </div>
      ${rows && sal ? `<button class="toggle-row" id="use-saldo" aria-pressed="${importUseSaldo}">${svg('bank')}<span class="grow">Kontostand übernehmen: <b>${eur(sal.amount)}</b><br><span class="small" style="font-weight:500">laut Auszug am ${dateLabel(sal.date)} – dein Kontostand in der App stimmt dann mit der Bank überein.</span></span><span class="switch"></span></button>` : ''}
      ${rows ? `<section class="card pad-s">
          <h2 class="h2">${rows.length} Buchungen gefunden</h2>
          <p class="small" style="margin:0 2px 6px">${rows.length - nIn} Ausgaben und ${nIn} Einnahmen. Wähle aus, was übernommen werden soll, und ordne Ausgaben einem Konto zu. Bereits importierte sind ausgegraut.</p>
          ${rows.map((r, i) => `<div class="imp-row${r.dup ? ' dup' : ''}">
            <input type="checkbox" class="check" data-i="${i}" ${r.on ? 'checked' : ''} aria-label="${esc(r.name)} übernehmen">
            <div class="grow"><div class="between"><span class="b ell">${esc(r.name || 'Unbekannt')}</span><span class="bb ${r.type === 'in' ? 'plus' : ''}" style="white-space:nowrap">${r.type === 'in' ? '+' : ''}${eur(r.amount)}</span></div>
              <div class="small ell">${dateLabel(r.date)}${r.purpose ? ' · ' + esc(r.purpose) : ''}</div>
              ${r.type === 'in' ? '<span class="pill soft" style="margin-top:6px">Einnahme</span>' : `<select data-acc-i="${i}" aria-label="Konto">${opts(r.acc)}</select>`}</div>
          </div>`).join('')}
        </section>`
    : `<section class="card pad" style="display:flex;flex-direction:column;gap:12px">
          <div class="b">So geht's</div>
          <ol class="small" style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px">
            <li>Im Online-Banking (Browser) der VR-Bank die Umsätze öffnen.</li>
            <li>Zeitraum wählen und als <b>CSV</b> exportieren.</li>
            <li>Die Datei hier auswählen – sie wird nur auf dem Handy gelesen.</li>
          </ol>
          <label class="btn" style="cursor:pointer">${svg('upload')}CSV-Datei wählen<input type="file" id="csv" accept=".csv,text/csv,text/plain" class="sr"></label>
          <p class="small" style="margin:0">Die App verbindet sich nie mit deiner Bank und kennt keine Zugangsdaten.</p>
        </section>`}
    </div>
    ${rows ? `<div class="bottombar"><div class="grow"><div class="small b">${n} ausgewählt</div></div>
      <button class="link" id="reset">Andere Datei</button><button class="btn" id="do-import" ${n ? '' : 'disabled'}>Importieren</button></div>` : ''}`;
  },
  mount() {
    $('#back').onclick = () => { importRows = null; back('einstellungen'); };
    const f = $('#csv');
    if (f) f.addEventListener('change', () => readCSV(f.files[0]));
    $$('[data-i]').forEach((c) => c.addEventListener('change', () => { importRows[+c.dataset.i].on = c.checked; render(); }));
    $$('[data-acc-i]').forEach((s) => s.addEventListener('change', () => { importRows[+s.dataset.accI].acc = s.value; }));
    if ($('#use-saldo')) $('#use-saldo').onclick = () => { importUseSaldo = !importUseSaldo; render(); };
    if ($('#reset')) $('#reset').onclick = () => { importRows = null; importSaldo = null; render(); };
    if ($('#do-import')) $('#do-import').onclick = () => {
      const sel = importRows.filter((r) => r.on);
      commit(`${sel.length} Buchungen importiert`, () => {
        // ts: 0 → der Kontostand aus dem Auszug enthält diese Buchungen schon
        sel.forEach((r) => {
          if (r.type === 'in') S.income.push({ id: uid(), amount: r.amount, note: r.name, date: r.date, ts: 0, importKey: r.key });
          else S.expenses.push({ id: uid(), amount: r.amount, accountId: r.acc, note: r.name, date: r.date, ts: 0, importKey: r.key });
        });
        if (importSaldo && importUseSaldo) setBalanceAnchor(importSaldo.amount, importSaldo.date);
      }, { after: () => { importRows = null; importSaldo = null; back('einstellungen'); } });
    };
  }
};

function readCSV(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    let text;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(r.result); }
    catch (e) { text = new TextDecoder('windows-1252').decode(r.result); }
    const rows = parseBankCSV(text);
    if (!rows) { toast('Format nicht erkannt – ist das eine CSV der Bank?'); return; }
    if (!rows.length) { toast('Keine Buchungen gefunden'); return; }
    importRows = rows;
    importSaldo = rows.saldo || null;
    importUseSaldo = !!importSaldo;
    render();
  };
  r.readAsArrayBuffer(file);
}
function splitCSV(text) {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim()) || '';
  const sep = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = []; let cell = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === sep) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
function parseBankCSV(text) {
  const rows = splitCSV(text.replace(/^﻿/, ''));
  const hi = rows.findIndex((r) => r.some((c) => /betrag/i.test(c)) && r.some((c) => /buchungstag|datum/i.test(c)));
  if (hi < 0) return null;
  const h = rows[hi].map((c) => c.trim());
  const find = (re, not) => h.findIndex((c) => re.test(c) && !(not && not.test(c)));
  const iDate = find(/buchungstag/i) >= 0 ? find(/buchungstag/i) : find(/datum|valuta/i);
  const iAmt = find(/^betrag/i, /saldo/i) >= 0 ? find(/^betrag/i, /saldo/i) : find(/betrag|umsatz/i, /saldo/i);
  const iName = find(/name zahlungsbeteiligter|zahlungsempf|empf[aä]nger|auftraggeber|beg[uü]nstigter/i, /iban|bic|konto/i);
  const iPurpose = find(/verwendungszweck/i);
  const iSH = find(/^(soll\/haben|s\/h)$/i);
  const iSaldo = find(/saldo/i, /vor |vorher|anfang/i);
  if (iDate < 0 || iAmt < 0) return null;
  const known = new Set(S.expenses.concat(S.income).filter((e) => e.importKey).map((e) => e.importKey));
  const out = [];
  const withSaldo = []; // in Dateireihenfolge, um den neuesten Kontostand zu finden
  rows.slice(hi + 1).forEach((r) => {
    if (r.length < h.length / 2) return;
    const date = toISODate(r[iDate]);
    if (!date) return;
    let c = parseEur(r[iAmt]);
    if (iSH >= 0) { const sh = (r[iSH] || '').trim().toUpperCase(); if (sh === 'S') c = -Math.abs(c); else if (sh === 'H') c = Math.abs(c); }
    if (iSaldo >= 0 && String(r[iSaldo] || '').trim()) {
      let sa = parseEur(r[iSaldo]);
      if (/(^|\s)(s|soll)$/i.test(String(r[iSaldo]).trim())) sa = -Math.abs(sa);
      withSaldo.push({ date, amount: sa });
    }
    if (c === 0) return;
    const type = c < 0 ? 'out' : 'in';
    const name = (iName >= 0 ? r[iName] : '').trim().replace(/\s+/g, ' ');
    const purpose = (iPurpose >= 0 ? r[iPurpose] : '').trim().replace(/\s+/g, ' ').slice(0, 80);
    const amount = Math.abs(c);
    // Ausgaben-Schlüssel bleibt wie früher (damit schon importierte erkannt werden); Einnahmen bekommen ein Präfix
    const key = (type === 'in' ? 'in|' : '') + date + '|' + amount + '|' + name.toLowerCase();
    const dup = known.has(key);
    out.push({ type, date, amount, name: name || purpose.slice(0, 30), purpose, key, dup, on: !dup, acc: type === 'out' ? guessAccount(name + ' ' + purpose) : null });
  });
  out.sort((a, b) => b.date.localeCompare(a.date));
  if (withSaldo.length) {
    // Der Auszug ist meist neueste-zuerst sortiert, manchmal umgekehrt: nach Datum der ersten/letzten Zeile entscheiden
    const descending = withSaldo[0].date >= withSaldo[withSaldo.length - 1].date;
    const newest = descending ? withSaldo[0] : withSaldo[withSaldo.length - 1];
    out.saldo = newest;
  }
  return out;
}
function toISODate(s) {
  const m = String(s || '').trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (m) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; return `${y}-${pad(m[2])}-${pad(m[1])}`; }
  const iso = String(s || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? `${iso[1]}-${iso[2]}-${iso[3]}` : null;
}
function guessAccount(t) {
  t = t.toLowerCase();
  const rules = [
    [/lidl|aldi|rewe|edeka|kaufland|netto|penny|norma|b[aä]cker|baeckerei|dm-drogerie|rossmann|mcdonald|burger king|d[oö]ner/, /essen|snack|lebensmittel|einkauf/],
    [/aral|shell|esso|jet |total|tankstelle|agip|avia|star tank|orlen/, /tank|auto|sprit/],
    [/vodafone|telekom|o2|telefonica|congstar|aldi talk|spotify|netflix|disney|apple\.com|google|amazon prime/, /handy|abo/],
    [/h&m|zara|primark|zalando|about you|c&a|deichmann|snipes/, /kleid|mode/],
    [/kino|cinema|cinemaxx|steam|playstation|xbox|eventim|ticket/, /freizeit/]
  ];
  for (const [re, accRe] of rules) {
    if (re.test(t)) { const a = S.accounts.find((x) => accRe.test(x.name.toLowerCase())); if (a) return a.id; }
  }
  return S.accounts[0] ? S.accounts[0].id : null;
}

function notFound() {
  return `<div class="page"><div class="card empty"><div>Nicht gefunden.</div><a class="btn" href="#/uebersicht" style="margin-top:14px;text-decoration:none">Zur Übersicht</a></div></div>`;
}

/* ---------- Darstellung & Start ---------- */
const mq = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const t = S.settings.theme === 'auto' ? (mq.matches ? 'dark' : 'light') : S.settings.theme;
  document.documentElement.dataset.theme = t;
  $$('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', t === 'dark' ? '#0B120E' : '#EAF2EC'));
}
mq.addEventListener && mq.addEventListener('change', () => applyTheme());

function render() {
  applyTheme();
  const r = route();
  const v = VIEWS[r.name] || VIEWS.uebersicht;
  const key = r.name + '/' + r.arg;
  const changed = key !== lastRouteKey;
  if (changed) {
    lastRouteKey = key;
    if (r.name !== 'konten') editBudget = null;
    if (v.init) v.init(r.arg);
  }
  const view = $('#view');
  // Animationen nur beim Seitenwechsel – nicht bei jedem Antippen innerhalb einer Seite
  view.className = '';
  view.innerHTML = v.html(r.arg);
  if (changed) {
    const cls = { fwd: 'in-fwd', back: 'in-back', 'tab-l': 'in-r', 'tab-r': 'in-l', fade: 'in-fade' }[navDir] || 'in-fade';
    void view.offsetWidth;
    view.className = 'anim ' + cls;
    clearTimeout(render._t);
    render._t = setTimeout(() => { view.className = ''; }, 700);
  }
  if (changed) resetSwipeStyles();
  navDir = null;
  if (v.mount) v.mount(r.arg);
  const nav = $('#nav');
  nav.classList.toggle('hidden', !v.nav);
  $$('a', nav).forEach((a) => {
    const on = a.dataset.tab === v.nav;
    a.classList.toggle('on', on && !a.classList.contains('add'));
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

applyRecurring();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    applyRecurring();
    if (viewMonth > curMonth()) viewMonth = curMonth();
    render();
  }
});
render();

/* Haupt-Tabs (unten) ersetzen die aktuelle Seite statt sie zu stapeln – so führt „Zurück“ nicht durch alle Tabs */
$$('#nav a:not(.add)').forEach((a) => a.addEventListener('click', (e) => {
  const target = a.getAttribute('href');
  e.preventDefault();
  if (location.hash === target) return;
  const from = TABS.indexOf((VIEWS[route().name] || {}).nav || '');
  const to = TABS.indexOf(a.dataset.tab);
  navDir = from >= 0 && to >= 0 && to !== from ? (to > from ? 'tab-l' : 'tab-r') : 'fade';
  replacing = true;
  location.replace(target);
}));

/* ---------- Wischen zwischen den Haupt-Seiten ---------- */
const TABS = ['uebersicht', 'konten', 'schulden']; // Reihenfolge wie in der Leiste unten
let sw = null;
const viewEl = () => $('#view');
function swipeTo(dir) { // dir: -1 = zurück (nach rechts wischen), +1 = weiter
  const r = route();
  const i = TABS.indexOf(r.name);
  const t = i + dir;
  if (i < 0 || t < 0 || t >= TABS.length) return false;
  navDir = dir > 0 ? 'tab-l' : 'tab-r';
  replacing = true;
  location.replace('#/' + TABS[t]);
  return true;
}
/* Wischen per Pointer-Events. Das Scrollen nach oben/unten übernimmt der Browser selbst (touch-action: pan-y),
 * dadurch bleibt es flüssig – wir bekommen nur die waagerechten Bewegungen. */
let swRaf = 0; let swX = 0;
function tabTarget(dx) {
  const i = TABS.indexOf(route().name);
  const t = i + (dx < 0 ? 1 : -1);
  return t >= 0 && t < TABS.length ? t : -1;
}
function paintSwipe() {
  swRaf = 0;
  if (!sw || sw.lock !== 'h') return;
  const has = tabTarget(swX) >= 0;
  const v = viewEl();
  v.style.transform = `translate3d(${(swX * (has ? 0.5 : 0.12)).toFixed(1)}px,0,0)`;
  v.style.opacity = String((1 - Math.min(Math.abs(swX), 320) / (has ? 640 : 1600)).toFixed(3));
}
function resetSwipeStyles() {
  const v = $('#view');
  v.style.transition = ''; v.style.transform = ''; v.style.opacity = ''; v.style.willChange = '';
}
function startSwipe(e) {
  sw = null;
  if (e.pointerType === 'mouse' || !e.isPrimary) return;
  if ($('#sheet-root').firstElementChild) return;
  const r = route();
  if (!TABS.includes(r.name) || r.arg) return;
  if (e.target.closest && e.target.closest('input, select, textarea, [data-no-swipe]')) return;
  sw = { id: e.pointerId, x: e.clientX, y: e.clientY, t: Date.now(), lock: null, dx: 0 };
}
function moveSwipe(e) {
  if (!sw || e.pointerId !== sw.id) return;
  const dx = e.clientX - sw.x; const dy = e.clientY - sw.y;
  if (sw.lock === null) {
    if (Math.hypot(dx, dy) < 12) return;
    sw.lock = Math.abs(dx) > Math.abs(dy) * 1.4 ? 'h' : 'v';
    if (sw.lock === 'h') {
      const v = viewEl();
      try { v.setPointerCapture(e.pointerId); } catch (_) { /* nicht schlimm */ }
      v.style.willChange = 'transform, opacity';
      v.style.transition = 'none';
    }
  }
  if (sw.lock !== 'h') return;
  sw.dx = dx; swX = dx;
  if (!swRaf) swRaf = requestAnimationFrame(paintSwipe);
}
function endSwipe(e) {
  const s = sw; sw = null;
  if (!s || s.lock !== 'h') return;
  if (swRaf) { cancelAnimationFrame(swRaf); swRaf = 0; }
  const v = viewEl();
  const cancelled = e && e.type === 'pointercancel';
  const dx = s.dx; const fast = Date.now() - s.t < 260;
  const t = tabTarget(dx);
  const ok = !cancelled && t >= 0 && (Math.abs(dx) > 80 || (Math.abs(dx) > 40 && fast));
  if (ok) {
    // Alte Seite fliegt raus und bleibt unsichtbar, bis die neue gezeichnet ist (kein Aufblitzen)
    v.style.transition = 'transform .12s ease-in, opacity .12s ease-in';
    v.style.transform = `translate3d(${dx < 0 ? -40 : 40}px,0,0)`;
    v.style.opacity = '0';
    if (navigator.vibrate) navigator.vibrate(8);
    setTimeout(() => swipeTo(dx < 0 ? 1 : -1), 120);
    setTimeout(resetSwipeStyles, 700); // Sicherheitsnetz, falls kein Seitenwechsel passiert
  } else {
    v.style.transition = 'transform .22s cubic-bezier(.2,.8,.2,1), opacity .22s';
    v.style.transform = ''; v.style.opacity = '';
    setTimeout(resetSwipeStyles, 240);
  }
}
{
  const v = viewEl();
  v.addEventListener('pointerdown', startSwipe, { passive: true });
  v.addEventListener('pointermove', moveSwipe, { passive: true });
  v.addEventListener('pointerup', endSwipe, { passive: true });
  v.addEventListener('pointercancel', endSwipe, { passive: true });
}

/** Zurück-Taste / Zurück-Geste (Android): offenes Fenster schließen → eine Seite zurück → zur Startseite → App schließen */
function handleBack() {
  if ($('#sheet-root').firstElementChild) { closeSheet(); return true; }
  const r = route();
  if (stack.length > 1) { history.back(); return true; }
  if (r.name !== homeName() || r.arg) { replacing = true; navDir = 'back'; location.replace('#/' + homeName()); return true; }
  return false;
}
if (native()) {
  const AppPlugin = plugin('App');
  if (AppPlugin && AppPlugin.addListener) {
    AppPlugin.addListener('backButton', () => {
      if (!handleBack()) { try { AppPlugin.exitApp(); } catch (e) { /* nichts */ } }
    });
  }
}

if (native()) {
  // In der APK sind alle Dateien eingebaut – kein Service Worker nötig (und keine veralteten Dateien nach Updates)
  if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
} else if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
