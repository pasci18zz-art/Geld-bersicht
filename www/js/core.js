/* Geld – Finanzmanager · Kern: Hilfsfunktionen, Symbole, Daten, Berechnungen
 * Läuft komplett offline. Alle Beträge in Cent (ganze Zahlen).
 */
'use strict';

/* ---------- Hilfsfunktionen ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = (n) => String(n).padStart(2, '0');
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => fmtDate(new Date());
const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (ds, n) => { const d = parseDate(ds); d.setDate(d.getDate() + n); return fmtDate(d); };
const daysBetween = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 864e5);
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
const lastDay = (m) => `${m}-${pad(daysIn(m))}`;
const weekStart = (ds) => { const d = parseDate(ds); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return fmtDate(d); };
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const MONTHS_S = ['Jan', 'Feb', 'März', 'Apr', 'Mai', 'Juni', 'Juli', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const MONTHS_XS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const WD_L = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const monthName = (m) => MONTHS[+m.slice(5) - 1] + ' ' + m.slice(0, 4);
function dateLabel(ds) {
  const t = todayStr();
  if (ds === t) return 'Heute';
  if (ds === addDays(t, -1)) return 'Gestern';
  if (ds === addDays(t, 1)) return 'Morgen';
  const d = parseDate(ds);
  return `${WD[d.getDay()]}, ${d.getDate()}. ${MONTHS_S[d.getMonth()]}${ds.slice(0, 4) !== t.slice(0, 4) ? ' ' + ds.slice(0, 4) : ''}`;
}
function dueLabel(ds) {
  if (!ds) return 'kommt noch';
  const n = daysBetween(todayStr(), ds);
  if (n === 0) return 'heute fällig';
  if (n === 1) return 'morgen';
  if (n === -1) return 'seit gestern fällig';
  if (n < 0) return `seit ${-n} Tagen fällig`;
  if (n < 7) return `in ${n} Tagen`;
  return dateLabel(ds);
}
/** Cent → "1.234,56 €" (ohne Verstecken – für Texte wie Meldungen) */
function eur(c) {
  c = Math.round(c || 0);
  const a = Math.abs(c);
  return (c < 0 ? '−' : '') + Math.floor(a / 100).toLocaleString('de-DE') + ',' + pad(a % 100) + ' €';
}
/** "12,50" / "12.5" / "-1.234,56" → Cent */
function parseEur(s) {
  s = String(s == null ? '' : s).trim().replace(/[\s€]/g, '').replace('−', '-');
  if (!s) return 0;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : Math.round(n * 100);
}
/** Rechenzeile wie „3×1,79+2,49“ → Cent (Punkt vor Strich) */
function calcExpr(e) {
  e = String(e || '').replace(/[+×−]$/, '').replace(/−/g, '+-'); if (!e) return 0;
  const sum = e.split('+').reduce((s, term) => s + term.split('×').reduce((a, x) => a * (parseFloat(x.replace(',', '.')) || 0), 1), 0);
  return Math.round(sum * 100);
}
const centsToInput = (c) => (c ? (c / 100).toFixed(2).replace('.', ',').replace(/,00$/, '') : '');

/* ---------- Symbole (eigene Strichzeichnungen, 24er Raster) ---------- */
const I = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2.5v3M16 2.5v3"/>',
  chart: '<path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M15 3.4A9 9 0 0 1 20.6 9H15z"/>',
  people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  next: '<path d="m9 18 6-6-6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  keypad: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 9h.01M11 9h.01M15 9h.01M7 12h.01M11 12h.01M15 12h.01M8 15.5h8" stroke-width="2.4"/>',
  bksp: '<path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7z"/><path d="m12 9 5 5M17 9l-5 5"/>',
  enter: '<path d="M20 5v7a3 3 0 0 1-3 3H5"/><path d="m9 11-4 4 4 4"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  gear: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.8-1.3"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',
  bank: '<path d="M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
  repeat: '<path d="M4 11V9a3 3 0 0 1 3-3h12M16 3l3 3-3 3M20 13v2a3 3 0 0 1-3 3H5M8 21l-3-3 3-3"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  refund: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  arrowIn: '<path d="M12 5v14M5 12l7 7 7-7"/>',
  arrowOut: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  send: '<path d="M21 3 10 14"/><path d="M21 3 14.5 21l-4.5-7-7-4.5z"/>',
  sort: '<path d="M7 4v16M4 7l3-3 3 3M17 20V4M14 17l3 3 3-3"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  // Kategorien
  cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.6 12.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.1L21 7H6"/>',
  basket: '<path d="M3 10h18l-1.6 9.1a1.5 1.5 0 0 1-1.5 1.2H6.1a1.5 1.5 0 0 1-1.5-1.2z"/><path d="m8 10 3-6M16 10l-3-6M9 14v3M15 14v3M12 14v3"/>',
  bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  package: '<path d="M3 7.5 12 3l9 4.5-9 4.5z"/><path d="M3 7.5v9L12 21l9-4.5v-9"/><path d="M12 12v9M7.5 5.2l9 4.6"/>',
  can: '<path d="M7 5.5C7 4.1 9.2 3 12 3s5 1.1 5 2.5v13c0 1.4-2.2 2.5-5 2.5s-5-1.1-5-2.5z"/><path d="M7 5.5C7 6.9 9.2 8 12 8s5-1.1 5-2.5"/><path d="m13 10-2.5 4H13l-2 4"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  fuel: '<path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h14M5 10h10"/><path d="M15 8l3 3v6a1.5 1.5 0 0 0 3 0V9l-3-3"/>',
  car: '<path d="M5 17h14v-5l-2-5H7l-2 5z"/><path d="M3 12h18"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>',
  bus: '<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M8 21v-3M16 21v-3"/><circle cx="8" cy="14.5" r=".8"/><circle cx="16" cy="14.5" r=".8"/>',
  bike: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-7h5l3 7M10 9 8 6H6M14 6h2l-1 3"/>',
  ticket: '<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
  gamepad: '<path d="M6 8h12a4 4 0 0 1 4 4v1a4 4 0 0 1-7 2.6L14 14h-4l-1 1.6A4 4 0 0 1 2 13v-1a4 4 0 0 1 4-4z"/><path d="M7 10.5v3M5.5 12h3"/><circle cx="16" cy="11" r=".8"/><circle cx="17.8" cy="13" r=".8"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
  tv: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  wifi: '<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r=".8"/>',
  shirt: '<path d="M8 3 3 6l2 4 2-1v12h10V9l2 1 2-4-5-3a4 4 0 0 1-8 0z"/>',
  shoe: '<path d="M3 17v-6l4-1 3 3 5 1 4 1.5a2 2 0 0 1 1.5 2V19H3z"/><path d="M3 19h18"/>',
  burger: '<path d="M4 11a8 6 0 0 1 16 0z"/><path d="M3 14.5h18"/><path d="M4.5 17.5h15a1.5 1.5 0 0 1-1.5 2H6a1.5 1.5 0 0 1-1.5-2z"/>',
  coffee: '<path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 2.5v2.5M12 2.5v2.5"/>',
  drink: '<path d="M7 7h10l-1.5 13a1.5 1.5 0 0 1-1.5 1.3h-4A1.5 1.5 0 0 1 8.5 20z"/><path d="M12 7l2-5h3"/>',
  pizza: '<path d="M3.5 6.5c5.5-3 11.5-3 17 0L12 21.5z"/><path d="M4.6 8.8c4.8-2.3 10-2.3 14.8 0"/><circle cx="10" cy="11.5" r="1.2"/><circle cx="14" cy="13.5" r="1.2"/><circle cx="12" cy="17" r=".8"/>',
  croissant: '<path d="M2.5 15C4 9.5 8 6.5 12 6.5s8 3 9.5 8.5L18 16.5l-2.5-4.5L12 14l-3.5-2L6 16.5z"/><path d="M8.5 12 9.6 7.6M15.5 12l-1.1-4.4M12 14V6.5"/>',
  apfel: '<path d="M3 16a9 9 0 0 1 18 0z"/><path d="M5.5 18.5v-2.5M9 18.5v-2.5M12.5 18.5v-2.5M16 18.5v-2.5M19 18.5v-2.5"/><path d="M12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 9V7.5"/>',
  stange: '<path d="M5.2 17.8a2.5 2.5 0 0 1-1-4.3L16 4.7a2.5 2.5 0 0 1 3.3 3.6L7.5 18.3a2.5 2.5 0 0 1-2.3-.5z"/><path d="M8 14h.01M11 11.5h.01M14 9h.01M16.5 7h.01"/>',
  schnecke: '<circle cx="12" cy="12" r="9"/><path d="M12 12a1.5 1.5 0 1 1 1.5-1.5A3.5 3.5 0 1 1 9 14a5.5 5.5 0 1 1 8.5-5"/>',
  brezel: '<path d="M7 19.5C3.5 18 2 14 3.5 10S9 4.5 12 8c3-3.5 7-2 8.5 2s0 8-3.5 9.5"/><path d="M7 19.5 15.5 11M17 19.5 8.5 11"/>',
  kbrezel: '<path d="M7 19.5C3.5 18 2 14 3.5 10S9 4.5 12 8c3-3.5 7-2 8.5 2s0 8-3.5 9.5"/><path d="M7 19.5 15.5 11M17 19.5 8.5 11"/><path d="M6 9.5h.01M8.5 7.5h.01M15.5 7.5h.01M18 9.5h.01M12 14.5h.01" stroke-width="2.6"/>',
  broetchen: '<path d="M3 14c0-4 4-7 9-7s9 3 9 7-4 4.5-9 4.5S3 18 3 14z"/><path d="M8 11.5c2.5 1.5 5.5 1.5 8 0"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12"/><path d="M12 8C10.5 4.5 7 4 7 6s3 2 5 2c2 0 5 0 5-2s-3.5-1.5-5 2z"/>',
  piggy: '<path d="M4.5 12.5A7 6.2 0 0 1 17.6 8.4L20 7.5V11l1.5.6v3l-2 .8a7 6 0 0 1-3.5 3.3V21h-2.5v-1.6a8 8 0 0 1-3 0V21H8v-2.6a6.6 6 0 0 1-3.5-5.9z"/><circle cx="15.5" cy="11" r=".9"/><path d="M9.5 8h3"/>',
  coins: '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M9 14v3c0 1.7 2.7 3 6 3s6-1.3 6-3v-4c0-1.6-2.4-2.9-5.5-3"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M16 15h2"/>',
  banknote: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z"/><path d="M4 20a2 2 0 0 0 2 2h13v-4"/>',
  cap: '<path d="M2 9 12 4l10 5-10 5z"/><path d="M6 11v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/><path d="M22 9v5"/>',
  school: '<path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M10 21v-5h4v5"/><circle cx="12" cy="10.5" r="1.5"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
  heart: '<path d="M12 20s-8-4.6-8-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8 2.8C20 15.4 12 20 12 20z"/>',
  pill: '<rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="m8.8 8.8 6.4 6.4"/>',
  dumbbell: '<path d="M6 7v10M18 7v10M3 9.5v5M21 9.5v5M6 12h12"/>',
  scissors: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8 7.5 20 18M8 16.5 20 6"/>',
  paw: '<circle cx="6.5" cy="10" r="1.7"/><circle cx="17.5" cy="10" r="1.7"/><circle cx="9.7" cy="6" r="1.6"/><circle cx="14.3" cy="6" r="1.6"/><path d="M12 12c-3 0-5.5 3.2-5.5 5.2 0 1.6 1.3 2.3 2.8 2.3 1.2 0 1.8-.6 2.7-.6s1.5.6 2.7.6c1.5 0 2.8-.7 2.8-2.3C17.5 15.2 15 12 12 12z"/>',
  plane: '<path d="M10.5 13 3 11l1.2-2 7 .6L15 4.5c.8-.9 2.5-1.1 3-.5s.4 2.2-.5 3L13 11l.6 7-2 1.2z"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/>',
  tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  dots: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  snack: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  // Energy-Dose mit drei Kratzspuren (eigene Zeichnung, kein Markenlogo)
  monster: '<path d="M7 5.5C7 4.1 9.2 3 12 3s5 1.1 5 2.5v13c0 1.4-2.2 2.5-5 2.5s-5-1.1-5-2.5z"/><path d="M7 5.5C7 6.9 9.2 8 12 8s5-1.1 5-2.5"/><path d="M9.3 10l.7 2.2-.7 2.2.7 2.4M12 9.6l.7 2.4-.7 2.3.7 2.6M14.7 10l.7 2.2-.7 2.2.7 2.4" stroke-width="1.6"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="3"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.3"/>',
  finger: '<path d="M12 11v3.5a6 6 0 0 0 1.2 3.6"/><path d="M8.7 21a9 9 0 0 1-1.7-5.3V11a5 5 0 0 1 10 0v2"/><path d="M4.5 16.5A13 13 0 0 1 4 13v-2a8 8 0 0 1 14.6-4.5M19.6 9.6c.3.8.4 1.6.4 2.4v1.5"/><path d="M17 16.5c0 1.6.4 3 1.1 4"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  anderes: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'
};
const svg = (name, extra = '') => `<svg viewBox="0 0 24 24" aria-hidden="true" ${extra}>${I[name] || I.tag}</svg>`;
/** Symbole, die man für Kategorien auswählen kann */
const PICK_ICONS = ['cart', 'basket', 'bag', 'package', 'can', 'bolt', 'fuel', 'car', 'bus', 'bike', 'ticket', 'gamepad', 'music', 'film', 'tv', 'phone',
  'wifi', 'repeat', 'shirt', 'shoe', 'burger', 'coffee', 'drink', 'pizza', 'croissant', 'gift', 'piggy', 'coins', 'wallet', 'banknote', 'book', 'cap',
  'school', 'pencil', 'briefcase', 'heart', 'pill', 'dumbbell', 'scissors', 'paw', 'plane', 'home', 'star', 'sparkle', 'tag', 'dots', 'monster', 'flag'];
const PRODUCT_ICONS = ['croissant', 'apfel', 'stange', 'schnecke', 'pizza', 'brezel', 'kbrezel', 'broetchen', 'can', 'drink', 'snack'];
const COLORS = ['#2F6FD6', '#E8902E', '#5FAE3A', '#E0533F', '#8E63D6', '#2A9D96', '#D35D97', '#C99A1E', '#3E8E5E', '#5C6BC0', '#B35C3A', '#8792A6'];

/* ---------- Daten ---------- */
const KEY = 'geldapp.v2';      // neue Daten
const KEY_V1 = 'geldapp.v1';   // alte Daten (bleiben als Sicherung unangetastet liegen)

function defaultCats() {
  return [
    { id: 'c_lidl', kind: 'out', name: 'Lidl', icon: 'cart', color: '#2F6FD6', budget: 0 },
    { id: 'c_amazon', kind: 'out', name: 'Amazon', icon: 'package', color: '#E8902E', budget: 0 },
    { id: 'c_monster', kind: 'out', name: 'Monster', icon: 'can', color: '#5FAE3A', budget: 0 },
    { id: 'c_tanken', kind: 'out', name: 'Tanken', icon: 'fuel', color: '#E0533F', budget: 0 },
    { id: 'c_freizeit', kind: 'out', name: 'Freizeit', icon: 'gamepad', color: '#8E63D6', budget: 0 },
    { id: 'c_abos', kind: 'out', name: 'Abos & Handy', icon: 'repeat', color: '#2A9D96', budget: 0 },
    { id: 'c_kleidung', kind: 'out', name: 'Kleidung', icon: 'shirt', color: '#D35D97', budget: 0 },
    { id: 'c_sonst', kind: 'out', name: 'Sonstiges', icon: 'dots', color: '#8792A6', budget: 0 },
    { id: 'i_taschengeld', kind: 'in', name: 'Taschengeld', icon: 'piggy', color: '#3E8E5E' },
    { id: 'i_foerder', kind: 'in', name: 'Förderkurs', icon: 'school', color: '#2F6FD6' },
    { id: 'i_nachhilfe', kind: 'in', name: 'Nachhilfe', icon: 'cap', color: '#C99A1E' },
    { id: 'i_geschenke', kind: 'in', name: 'Geschenke', icon: 'gift', color: '#D35D97' },
    { id: 'i_sonst', kind: 'in', name: 'Sonstiges', icon: 'dots', color: '#8792A6' }
  ];
}
function defaultProducts() {
  return [
    { id: 'croissant', name: 'Schinken-Käse-Croissant', price: 129, icon: 'croissant', fav: true },
    { id: 'apfel', name: 'Apfeltasche', price: 89, icon: 'apfel' },
    { id: 'stange', name: 'Käsestange', price: 79, icon: 'stange' },
    { id: 'schnecke', name: 'Pizzaschnecke', price: 119, icon: 'schnecke' },
    { id: 'pizza', name: 'Pizzastück', price: 149, icon: 'pizza' },
    { id: 'brezel', name: 'Laugenbrezel', price: 39, icon: 'brezel' },
    { id: 'kbrezel', name: 'Käselaugenbrezel', price: 79, icon: 'kbrezel' },
    { id: 'broetchen', name: 'Laugenbrötchen', price: 29, icon: 'broetchen' }
  ];
}
function defaults() {
  return {
    v: 2,
    created: curMonth(),
    demo: false,
    settings: {
      theme: 'auto', glass: true, motion: true,
      privacy: true, privacyLimit: 5000,        // Beträge über 50 € verstecken
      debts: false,                              // optionaler Tab „Schulden“
      jumpHome: true,
      // Verstecken nur in diesen Zeiten (0 = Sonntag … 6 = Samstag), Aufdecken mit Fingerabdruck
      hideWin: { 1: [['07:45', '15:30']], 2: [['07:45', '15:30']], 3: [['07:45', '15:30']], 4: [['07:45', '15:30']], 5: [['07:45', '13:15']] },
      revealBio: true,
      lock: false, lockDelay: 60,                // App-Sperre mit Fingerabdruck, nach … Sekunden weg
      remind: true, remindTime: '09:00',         // Erinnerung an fällige geplante Buchungen
      backupEvery: 0,                            // Backup-Erinnerung: 0 = aus, 7 = wöchentlich, 30 = monatlich
      startBalance: null, startDate: null, startTs: 0,   // Konto (online)
      cashStart: null, cashDate: null, cashTs: 0,        // Bargeld
      lastBackup: null
    },
    cats: defaultCats(),
    tx: [],      // {id, kind:'out'|'in'|'refund', amount, cat, title, payee, date, ts, month?(refund), importKey?, planId?}
    plans: [],   // {id, kind:'out'|'in', amount, cat, title, payee, date, repeat:'none'|'monthly', auto:false}
    rules: {},   // Empfänger (klein) → Kategorie, wird beim Import gelernt
    goals: [],   // Sparziele {id, name, icon, color, target, saved}
    people: [], debts: [], products: defaultProducts()
  };
}

/** Alte Daten (Version 1) in das neue Format übernehmen */
function guessIncomeCat(t) {
  t = String(t || '').toLowerCase();
  if (/taschen|eltern|mama|papa|mutter|vater/.test(t)) return 'i_taschengeld';
  if (/förder|foerder|kurs/.test(t)) return 'i_foerder';
  if (/nachhilfe/.test(t)) return 'i_nachhilfe';
  if (/geschenk|geburtstag|weihnacht|oma|opa/.test(t)) return 'i_geschenke';
  return 'i_sonst';
}
function migrateV1(o) {
  const s = defaults();
  s.created = o.created || s.created;
  const os = o.settings || {};
  ['theme', 'lastBackup', 'startBalance', 'startDate', 'startTs', 'jumpHome'].forEach((k) => { if (os[k] !== undefined) s.settings[k] = os[k]; });
  s.settings.debts = (o.people || []).length > 0;
  const accMap = {};
  (o.accounts || []).forEach((a) => {
    const n = String(a.name || '').toLowerCase();
    let id = null;
    if (/essen|snack|lebensmittel|lidl/.test(n)) id = 'c_lidl';
    else if (/tank|sprit|auto/.test(n)) id = 'c_tanken';
    else if (/freizeit/.test(n)) id = 'c_freizeit';
    else if (/handy|abo/.test(n)) id = 'c_abos';
    else if (/kleid|mode/.test(n)) id = 'c_kleidung';
    if (id) { const c = s.cats.find((x) => x.id === id); if (a.budget) c.budget = a.budget; accMap[a.id] = id; }
    else {
      const nid = 'c_' + uid();
      s.cats.splice(s.cats.findIndex((x) => x.id === 'c_sonst'), 0, { id: nid, kind: 'out', name: a.name, icon: 'tag', color: a.color || '#8792A6', budget: a.budget || 0 });
      accMap[a.id] = nid;
    }
  });
  (o.expenses || []).forEach((e) => s.tx.push({ id: e.id, kind: 'out', amount: e.amount, cat: accMap[e.accountId] || 'c_sonst', title: e.note || '', payee: '', date: e.date, ts: e.ts || 0, importKey: e.importKey }));
  (o.income || []).forEach((i) => s.tx.push({ id: i.id, kind: 'in', amount: i.amount, cat: guessIncomeCat(i.note), title: i.note || '', payee: '', date: i.date, ts: i.ts || 0, importKey: i.importKey }));
  (o.recurring || []).forEach((r) => {
    const isIn = r.kind === 'income';
    let date = `${curMonth()}-${pad(Math.min(r.day || 1, daysIn(curMonth())))}`;
    const list = isIn ? (o.income || []) : (o.expenses || []);
    if (list.some((e) => e.recurringId === r.id && monthOf(e.date) === curMonth())) date = addMonth(curMonth(), 1) + '-' + pad(Math.min(r.day || 1, daysIn(addMonth(curMonth(), 1))));
    s.plans.push({ id: r.id, kind: isIn ? 'in' : 'out', amount: r.amount, cat: isIn ? guessIncomeCat(r.name) : (accMap[r.accountId] || 'c_sonst'), title: r.name, payee: '', date, repeat: 'monthly', auto: true });
  });
  s.people = o.people || [];
  s.debts = o.debts || [];
  if (Array.isArray(o.products) && o.products.length) s.products = o.products;
  // Früher zählten Mitgebrachtes und Zahlungen im Kontostand mit → als Lidl-Ausgabe bzw. Rückzahlung übernehmen
  if (os.debtsInBalance !== false) {
    (o.debts || []).forEach((d) => {
      const p = (o.people || []).find((x) => x.id === d.personId);
      const name = p ? p.name : '';
      if (d.type === 'pay') s.tx.push({ id: 'm' + d.id, kind: 'refund', amount: d.amount, cat: 'c_lidl', title: 'Rückzahlung', payee: name, date: d.date, ts: d.ts || 0, month: monthOf(d.date) });
      else s.tx.push({ id: 'm' + d.id, kind: 'out', amount: d.amount, cat: 'c_lidl', title: d.text || 'Mitgebracht', payee: name ? 'für ' + name : '', date: d.date, ts: d.ts || 0 });
    });
  }
  return s;
}
function normalize(o) {
  const d = defaults();
  const s = Object.assign({}, d, o);
  s.settings = Object.assign({}, d.settings, o.settings || {});
  ['cats', 'tx', 'plans', 'people', 'debts', 'products', 'goals'].forEach((k) => { if (!Array.isArray(s[k])) s[k] = d[k] || []; });
  if (!s.rules || typeof s.rules !== 'object') s.rules = {};
  if (!s.settings.hideWin || typeof s.settings.hideWin !== 'object') s.settings.hideWin = d.settings.hideWin;
  // Alter Schulden-Tab → „Offen“: wer noch etwas schuldet, wird zur offenen Rückzahlung
  if (!s.settings.migOffen) {
    s.settings.migOffen = true;
    (s.people || []).forEach((pp) => {
      const bal = s.debts.filter((x) => x.personId === pp.id).reduce((a, x) => a + (x.type === 'pay' ? x.amount : -x.amount), 0);
      if (bal < 0 && !s.plans.some((p) => p.id === 'mo' + pp.id)) s.plans.push({ id: 'mo' + pp.id, kind: 'refund', amount: -bal, cat: 'c_lidl', title: 'Mitgebracht', payee: pp.name, date: null, repeat: 'none', acct: 'bar', month: curMonth(), auto: false });
    });
    s.settings.debts = false;
  }
  s.cats.forEach((c) => { if (c.id === 'c_monster' && c.icon === 'can') c.icon = 'monster'; });
  if (!s.cats.some((c) => c.kind === 'out')) s.cats = s.cats.concat(d.cats.filter((c) => c.kind === 'out'));
  if (!s.cats.some((c) => c.kind === 'in')) s.cats = s.cats.concat(d.cats.filter((c) => c.kind === 'in'));
  return s;
}
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
};
/** Läuft die App als Android-App (Capacitor)? */
function isNative() { return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); }
/** Gab es schon Daten? (dann zeigt „Was ist neu“ nach einem Update) */
const HAD_DATA = !!(store.get(KEY) || store.get(KEY_V1));
let S = load();
function load() {
  try {
    const raw = store.get(KEY);
    if (raw) return normalize(JSON.parse(raw));
    const old = store.get(KEY_V1);
    if (old) {
      const o = JSON.parse(old);
      const s = migrateV1(o);
      store.set(KEY, JSON.stringify(s));
      return s;
    }
  } catch (e) { /* kaputte Daten → frisch starten */ }
  return freshState();
}
/** Erster Start: im Browser/Artefakt mit Beispieldaten, in der App leer */
function freshState() {
  const s = defaults();
  if (!isNative()) { seedDemo(s); }
  return s;
}
function save() {
  if (!store.set(KEY, JSON.stringify(S))) { toast('Speichern hat nicht geklappt – Speicher voll?'); return false; }
  if (typeof syncNotifications === 'function') syncNotifications();
  return true;
}

/* Rückgängig: vor jeder Änderung den alten Stand merken */
let undoSnap = null;
function commit(msg, mutate, opts = {}) {
  const snap = JSON.stringify(S);
  mutate();
  if (!save()) { S = JSON.parse(snap); return; }
  if (opts.undo === false) { undoSnap = null; if (msg) toast(msg); }
  else { undoSnap = snap; if (msg) toast(msg, 'Rückgängig', doUndo); }
  if (opts.after) opts.after(); else render(false);
}
function doUndo() {
  if (!undoSnap) return;
  S = JSON.parse(undoSnap);
  undoSnap = null;
  save();
  toast('Rückgängig gemacht');
  render(false);
}

/* ---------- Kategorien ---------- */
const FALLBACK_CAT = { id: '_', kind: 'out', name: 'Ohne Kategorie', icon: 'tag', color: '#8792A6', budget: 0 };
const catById = (id) => S.cats.find((c) => c.id === id) || FALLBACK_CAT;
const catsOf = (kind) => S.cats.filter((c) => c.kind === (kind === 'refund' ? 'out' : kind));
const defaultCatOf = (kind) => { const l = catsOf(kind); return (l.find((c) => c.id === 'c_lidl' && kind !== 'in') || l[0] || FALLBACK_CAT).id; };
/** Kategorie-Symbol – oder ein eigenes Bild (z. B. ein Logo aus der Galerie) */
const catIcon = (c, size = 40, extra = '') => `<span class="cat-ic${c.photo ? ' photo' : ''}" style="--c:${c.color};width:${size}px;height:${size}px" ${extra}>${c.photo ? `<img src="${c.photo}" alt="">` : svg(c.icon)}</span>`;

/* ---------- Zeiträume ---------- */
/** Schlüssel: w2026-11-16 (Woche ab Montag) · m2026-11 · y2026 */
function keyFor(type, ds = todayStr()) {
  if (type === 'w') return 'w' + weekStart(ds);
  if (type === 'y') return 'y' + ds.slice(0, 4);
  return 'm' + ds.slice(0, 7);
}
function rangeOf(key) {
  const t = key[0]; const v = key.slice(1);
  if (t === 'w') {
    const to = addDays(v, 6); const a = parseDate(v); const b = parseDate(to);
    const label = a.getMonth() === b.getMonth() ? `${a.getDate()}.–${b.getDate()}. ${MONTHS_S[b.getMonth()]}` : `${a.getDate()}. ${MONTHS_S[a.getMonth()]} – ${b.getDate()}. ${MONTHS_S[b.getMonth()]}`;
    return { type: 'w', from: v, to, label, name: key === keyFor('w') ? 'Diese Woche' : label };
  }
  if (t === 'y') return { type: 'y', from: v + '-01-01', to: v + '-12-31', label: v, name: v === todayStr().slice(0, 4) ? 'Dieses Jahr' : v };
  return { type: 'm', from: v + '-01', to: lastDay(v), label: monthName(v), name: v === curMonth() ? 'Dieser Monat' : monthName(v) };
}
function shiftKey(key, n) {
  const t = key[0]; const v = key.slice(1);
  if (t === 'w') return 'w' + addDays(v, 7 * n);
  if (t === 'y') return 'y' + (+v + n);
  return 'm' + addMonth(v, n);
}
/** Für die Statistik: eine Rückzahlung zählt im gewählten Monat */
function effDate(t) {
  if (t.kind === 'refund' && t.month && t.month !== monthOf(t.date)) return t.month < monthOf(t.date) ? lastDay(t.month) : t.month + '-01';
  return t.date;
}
/** Ausgaben (brutto, zurück, netto) und Einnahmen je Kategorie im Zeitraum */
function stats(from, to) {
  const out = {}; const inc = {};
  let gross = 0; let refund = 0; let income = 0;
  S.tx.forEach((t) => {
    const d = effDate(t);
    if (d < from || d > to) return;
    if (t.kind === 'out') { (out[t.cat] = out[t.cat] || { gross: 0, refund: 0 }).gross += t.amount; gross += t.amount; }
    else if (t.kind === 'refund') { (out[t.cat] = out[t.cat] || { gross: 0, refund: 0 }).refund += t.amount; refund += t.amount; }
    else if (t.kind === 'in') { inc[t.cat] = (inc[t.cat] || 0) + t.amount; income += t.amount; }
  });
  const outList = Object.keys(out).map((id) => ({ cat: catById(id), gross: out[id].gross, refund: out[id].refund, net: out[id].gross - out[id].refund }))
    .sort((a, b) => b.net - a.net);
  const inList = Object.keys(inc).map((id) => ({ cat: catById(id), net: inc[id] })).sort((a, b) => b.net - a.net);
  const net = outList.reduce((s, x) => s + Math.max(0, x.net), 0);
  return { outList, inList, gross, refund, net, income };
}

/* ---------- Kontostand ---------- */
/* Anker (Kontostand + Zeitpunkt) + alle Buchungen danach. Eine Buchung zählt, wenn sie nach dem Anker-Tag liegt,
 * oder am Anker-Tag selbst, aber erst danach eingetragen wurde. Importierte Buchungen haben ts = 0. */
/* Zwei Töpfe: „online“ (Konto, Anker startBalance/startDate/startTs) und „bar“ (Bargeld, Anker cashStart/cashDate/cashTs).
 * Buchungen ohne acct gelten als online. Umbuchungen (kind 'transfer') gehen von acct nach to. */
const acctOf = (t) => t.acct || 'online';
function anchorOf(acct) {
  const st = S.settings;
  // Bargeld startet von selbst bei 0 € (alle Bar-Buchungen zählen), bis du einen Wert einträgst
  if (acct === 'bar') return st.cashStart == null ? { start: 0, date: '0000-00-00', ts: 0 } : { start: st.cashStart, date: st.cashDate, ts: st.cashTs };
  return { start: st.startBalance, date: st.startDate, ts: st.startTs };
}
function countedIn(t, a) {
  if (a.start == null || !a.date) return false;
  return t.date > a.date || (t.date === a.date && (t.ts || 0) > (a.ts || 0));
}
function balanceOf(acct) {
  const a = anchorOf(acct);
  if (a.start == null) return null;
  let b = a.start;
  S.tx.forEach((t) => {
    if (!countedIn(t, a)) return;
    if (t.kind === 'transfer') { if (acctOf(t) === acct) b -= t.amount; if ((t.to || 'bar') === acct) b += t.amount; return; }
    if (acctOf(t) !== acct) return;
    b += t.kind === 'out' ? -t.amount : t.amount;
  });
  return b;
}
/** Gesamt = Online + Bar (null, wenn noch nichts eingerichtet ist) */
function balance() {
  const o = balanceOf('online'); const c = balanceOf('bar');
  if (S.settings.startBalance == null && S.settings.cashStart == null && !S.tx.some((t) => acctOf(t) === 'bar' || t.kind === 'transfer')) return null;
  return (o || 0) + (c || 0);
}
function setBalanceAnchor(cents, date) {
  S.settings.startBalance = cents;
  S.settings.startDate = date || todayStr();
  S.settings.startTs = Date.now();
}
function setCashAnchor(cents) {
  S.settings.cashStart = cents;
  S.settings.cashDate = todayStr();
  S.settings.cashTs = Date.now();
}
const planSum = () => S.plans.reduce((s, p) => s + (p.kind === 'refund' ? refundLeft(p) : p.kind === 'out' ? -p.amount : p.amount), 0);
/** Offene Rückzahlung: was davon noch fehlt (Teilbeträge zählen) */
const refundLeft = (p) => Math.max(0, p.amount - (p.paid || 0));
/** Geplant sortieren: nach Datum, offene Rückzahlungen („kommt noch“, ohne Datum) ans Ende */
const planOrder = (a, b) => (a.date || '9999').localeCompare(b.date || '9999');

/* Geplante Buchungen mit „automatisch“ am Fälligkeitstag buchen */
function applyAutoPlans() {
  const t = todayStr();
  let changed = false;
  S.plans.forEach((p) => {
    let guard = 0;
    while (p.auto && p.date && p.date <= t && guard++ < 36) {
      S.tx.push({ id: uid(), kind: p.kind, amount: p.amount, cat: p.cat, title: p.title, payee: p.payee || '', date: p.date, ts: Date.now(), planId: p.id, acct: p.acct || 'online', planDue: p.date, planSnap: planSnap(p) });
      if (p.repeat === 'monthly') p.date = nextMonthDate(p.date); else { p.done = true; break; }
      changed = true;
    }
  });
  if (S.plans.some((p) => p.done)) { S.plans = S.plans.filter((p) => !p.done); changed = true; }
  if (changed) save();
}
function nextMonthDate(ds) {
  const m = addMonth(monthOf(ds), 1);
  return `${m}-${pad(Math.min(+ds.slice(8), daysIn(m)))}`;
}

/* ---------- Verstecken (Privatsphäre) ---------- */
/* Versteckt wird nur in den eingestellten Zeitfenstern (z. B. Schulzeit) oder wenn du oben aufs Auge tippst.
 * Aufdecken per Tippen (in der App mit Fingerabdruck). Verlässt du die App, ist es wieder versteckt. */
let revealed = false;
let manualHide = false;
const nowHM = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
function inHideWindow() {
  const wins = (S.settings.hideWin || {})[new Date().getDay()] || [];
  const t = nowHM();
  return wins.some((w) => w && w[0] && w[1] && w[0] <= t && t < w[1]);
}
const hiddenNow = () => !!S.settings.privacy && !revealed && (manualHide || inHideWindow());
/** Kopie der Plan-Daten, damit ein bestätigter Plan sich wiederherstellen lässt */
const planSnap = (p) => Object.assign({ kind: p.kind, amount: p.amount, cat: p.cat, title: p.title, payee: p.payee || '', acct: p.acct || 'online', repeat: p.repeat || 'none' }, p.month ? { month: p.month } : {}, p.lines ? { lines: p.lines } : {}, p.backs ? { backs: p.backs } : {}, p.paid ? { paid: p.paid } : {}, p.fromId ? { fromId: p.fromId } : {});
function isMasked(abs, force) {
  if (!hiddenNow()) return false;
  if (force) return true;
  return abs > (S.settings.privacyLimit || 0);
}
/** Betrag als HTML – bei Bedarf versteckt. o.sign: '+' | '-' | 'auto'; o.force: immer verstecken (Kontostand) */
function money(c, o = {}) {
  const abs = Math.abs(Math.round(c || 0));
  const sign = o.sign === '+' ? '+' : o.sign === '-' ? '−' : (c < 0 ? '−' : '');
  const masked = isMasked(abs, o.force);
  const txt = masked ? '•••,•• €' : Math.floor(abs / 100).toLocaleString('de-DE') + ',' + pad(abs % 100) + ' €';
  return `<span class="amt${masked ? ' masked' : ''}${o.cls ? ' ' + o.cls : ''}"${masked ? ' data-reveal title="Versteckt – zum Anzeigen tippen"' : ''}>${sign}${txt}</span>`;
}

/* ---------- Beispieldaten (nur im Browser/Artefakt, klar gekennzeichnet) ---------- */
function seedDemo(s) {
  s.demo = true;
  const t = todayStr();
  const m = curMonth(); const pm = addMonth(m, -1);
  const d = (mm, day) => `${mm}-${pad(Math.min(day, daysIn(mm)))}`;
  const past = (ds) => (ds <= t ? ds : null);
  const add = (kind, amount, cat, title, payee, date, extra = {}) => { if (date) s.tx.push(Object.assign({ id: uid() + Math.random().toString(36).slice(2, 4), kind, amount, cat, title, payee, date, ts: 0 }, extra)); };
  // ein paar Monate Verlauf für Jahr und Diagramme
  for (let k = 5; k >= 1; k--) {
    const mm = addMonth(m, -k);
    add('in', 6000, 'i_taschengeld', 'Taschengeld', 'Eltern', d(mm, 1));
    add('in', 4000 + k * 500, 'i_nachhilfe', 'Nachhilfe Mathe', 'Familie Weber', d(mm, 12));
    add('out', 3800 + k * 300, 'c_lidl', 'Lidl', 'Lidl', d(mm, 6));
    add('out', 2400 + k * 200, 'c_lidl', 'Lidl', 'Lidl', d(mm, 19));
    add('out', 1199, 'c_abos', 'Spotify', 'Spotify', d(mm, 15));
    add('out', 1500 + k * 120, 'c_monster', 'Monster', 'Lidl', d(mm, 10));
    if (k % 2) add('out', 2999 + k * 400, 'c_amazon', 'Bestellung', 'Amazon', d(mm, 22));
    add('refund', 1200 + k * 100, 'c_lidl', 'Rückzahlung', 'Freunde', d(mm, 25), { month: mm });
  }
  add('in', 6000, 'i_taschengeld', 'Taschengeld', 'Eltern', past(d(m, 1)));
  add('out', 4630, 'c_lidl', 'Wocheneinkauf', 'Lidl', past(d(m, 3)));
  add('out', 1798, 'c_monster', 'Monster 6er', 'Lidl', past(d(m, 4)));
  add('out', 3490, 'c_amazon', 'Kopfhörer-Hülle', 'Amazon', past(d(m, 7)));
  add('out', 5000, 'c_tanken', 'Tanken', 'Aral', past(d(m, 9)));
  add('in', 4500, 'i_nachhilfe', 'Nachhilfe Englisch', 'Familie Weber', past(d(m, 10)));
  add('out', 2210, 'c_lidl', 'Lidl', 'Lidl', past(d(m, 13)));
  add('refund', 860, 'c_lidl', 'Rückzahlung', 'Lena', past(d(m, 14)), { month: m });
  add('out', 1199, 'c_abos', 'Spotify', 'Spotify', past(d(m, 15)));
  add('out', 1200, 'c_freizeit', 'Kino', 'Cinestar', past(d(m, 16)));
  add('in', 2000, 'i_geschenke', 'Geburtstag', 'Oma', past(d(m, 17)));
  add('out', 1365, 'c_lidl', 'Lidl', 'Lidl', past(addDays(t, -2)));
  add('out', 599, 'c_monster', 'Monster', 'Lidl', past(addDays(t, -1)));
  add('refund', 420, 'c_lidl', 'Rückzahlung', 'Tim', t, { month: m });
  s.plans.push({ id: uid(), kind: 'in', amount: 12000, cat: 'i_foerder', title: 'Förderkurs Oktober', payee: 'Schule', date: addDays(t, 4), repeat: 'none', auto: false });
  s.plans.push({ id: uid(), kind: 'out', amount: 1199, cat: 'c_abos', title: 'Spotify', payee: 'Spotify', date: d(addMonth(m, 1), 15), repeat: 'monthly', auto: false });
  s.plans.push({ id: uid(), kind: 'out', amount: 2500, cat: 'c_freizeit', title: 'Konzertkarte', payee: 'Eventim', date: addDays(t, 10), repeat: 'none', auto: false });
  s.cats.find((c) => c.id === 'c_lidl').budget = 12000;
  s.cats.find((c) => c.id === 'c_monster').budget = 3000;
  s.cats.find((c) => c.id === 'c_amazon').budget = 5000;
  s.settings.startBalance = 48734; s.settings.startDate = addDays(t, -30); s.settings.startTs = 0;
  // Bargeld: Rückzahlungen kommen bar, einmal am Automaten abgehoben
  s.tx.forEach((x) => { if (x.kind === 'refund') x.acct = 'bar'; });
  add('transfer', 4000, null, 'Abgehoben', 'Geldautomat', past(addDays(t, -6)), { acct: 'online', to: 'bar' });
  add('out', 450, 'c_lidl', 'Brötchen', 'Lidl', past(addDays(t, -3)), { acct: 'bar' });
  s.settings.cashStart = 2350; s.settings.cashDate = addDays(t, -30); s.settings.cashTs = 0;
  s.created = addMonth(m, -5);
  s.people = [{ id: 'p1', name: 'Lena', color: '#2A9D96' }, { id: 'p2', name: 'Tim', color: '#C99A1E' }];
  s.debts = [{ id: uid(), personId: 'p1', type: 'buy', amount: 168, text: 'Schinken-Käse-Croissant, Laugenbrezel', date: addDays(t, -1), ts: 0 }];
  s.goals = [{ id: 'g1', name: 'Führerschein', icon: 'car', color: '#2F6FD6', target: 250000, saved: 64000 }];
}
