/* Geld – Oberflächen-Bausteine: Navigation, Fenster, Diagramme, Effekte */
'use strict';

/* ---------- Meldung (Toast) ---------- */
let toastTimer = null;
function toast(msg, btnText, onBtn) {
  const t = $('#toast');
  if (!t) return;
  t.innerHTML = `<span>${esc(msg)}</span>` + (btnText ? `<button type="button">${esc(btnText)}</button>` : '');
  t.classList.toggle('has-btn', !!btnText);
  if (btnText) $('button', t).onclick = () => { hideToast(); onBtn(); };
  t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, btnText ? 5000 : 2600);
}
function hideToast() { const t = $('#toast'); if (t) t.classList.remove('show'); }

/* ---------- Fenster von unten (Sheet) ---------- */
function openSheet(html, mount) {
  const root = $('#sheet-root');
  root.innerHTML = `<div class="sheet-backdrop"><div class="sheet glass" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div></div>`;
  const bd = $('.sheet-backdrop', root);
  bd.addEventListener('click', (e) => { if (e.target === bd) closeSheet(); });
  $$('[data-close]', root).forEach((b) => b.addEventListener('click', () => closeSheet()));
  if (mount) mount($('.sheet', root));
}
function closeSheetNow() { $('#sheet-root').innerHTML = ''; }
function closeSheet() {
  const root = $('#sheet-root');
  const node = root.firstElementChild;
  if (!node || node.classList.contains('closing')) return;
  node.classList.add('closing');
  setTimeout(() => { if (root.firstElementChild === node) root.innerHTML = ''; }, 220);
}
const sheetOpen = () => { const n = $('#sheet-root').firstElementChild; return !!n && !n.classList.contains('closing'); };
function confirmSheet(title, text, okText, onOk) {
  openSheet(`<h2>${esc(title)}</h2><p class="muted" style="margin:0">${esc(text)}</p>
    <div class="actions"><button class="btn ghost" data-close>Abbrechen</button><button class="btn danger" id="ok">${esc(okText)}</button></div>`,
  (el) => { $('#ok', el).onclick = () => { closeSheet(); onOk(); }; });
}

/* ---------- Segment-Schalter mit gleitendem Daumen ---------- */
function segHTML(options, active, attr, extra = '') {
  const idx = Math.max(0, options.findIndex((o) => o[0] === active));
  return `<div class="seg" role="radiogroup" style="--n:${options.length};--i:${idx}" ${extra}><span class="seg-thumb" aria-hidden="true"></span>${options.map(([k, label]) =>
    `<button type="button" class="${k === active ? 'on' : ''}" ${attr}="${k}" role="radio" aria-checked="${k === active}">${label}</button>`).join('')}</div>`;
}
/** Segment sofort optisch umschalten (Daumen gleitet), bevor neu gezeichnet wird */
function segMove(btn) {
  const seg = btn.closest('.seg');
  if (!seg) return;
  const i = $$('button', seg).indexOf(btn);
  seg.style.setProperty('--i', i);
  $$('button', seg).forEach((b) => { b.classList.toggle('on', b === btn); b.setAttribute('aria-checked', b === btn); });
}

/* ---------- Zahlenfeld ---------- */
function keypadHTML() {
  return `<div class="keypad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'del'].map((k) =>
    `<button type="button" class="key" data-key="${k}" aria-label="${k === 'del' ? 'Löschen' : k === ',' ? 'Komma' : k}">${k === 'del' ? svg('bksp') : k}</button>`).join('')}</div>`;
}
function pressKey(str, k) {
  if (k === 'del') return str.slice(0, -1);
  if (k === ',') return str.includes(',') ? str : (str || '0') + ',';
  const parts = str.split(',');
  if (parts.length === 2 && parts[1].length >= 2) return str;
  if (parts[0].length >= 6 && parts.length === 1) return str;
  return str === '0' ? k : str + k;
}

/* ---------- Diagramme ---------- */
/** Ring-Diagramm mit Symbolen auf den Stücken. items: [{cat, value}] */
function donutHTML(items, o = {}) {
  const size = o.size || 220; const sw = o.stroke || Math.round(size * 0.17);
  const r = (size - sw) / 2 - 10; const c = size / 2; const C = 2 * Math.PI * r;
  const total = items.reduce((s, x) => s + Math.max(0, x.value), 0);
  const list = items.filter((x) => x.value > 0);
  // Kuchen-Look: Stücke stoßen aneinander, nur eine feine Trennfuge
  const gap = list.length > 1 ? 2.4 : 0;
  let acc = 0;
  const segs = []; const bubbles = [];
  list.forEach((x, i) => {
    const len = (x.value / total) * C;
    // Kleine Stücke mit geraden Enden, damit sich die runden Kappen nicht überlappen
    const vis = Math.max(0.6, len - gap);
    const start = acc + gap / 2;
    segs.push(`<circle class="seg-arc" cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${x.cat.color}" stroke-width="${sw}" stroke-linecap="butt"
      stroke-dasharray="0 ${C.toFixed(2)}" data-dcat="${x.cat.id}" data-len="${vis.toFixed(2)}" data-c="${C.toFixed(2)}" style="--d:${i * 90}ms"
      transform="rotate(${(-90 + (start / C) * 360).toFixed(2)} ${c} ${c})"/>`);
    const mid = ((acc + len / 2) / C) * 2 * Math.PI - Math.PI / 2;
    if (o.icons !== false && x.value / total >= 0.06) {
      const bx = c + r * Math.cos(mid); const by = c + r * Math.sin(mid);
      bubbles.push(`<span class="d-bubble" data-dcat="${x.cat.id}" style="left:${(bx / size * 100).toFixed(2)}%;top:${(by / size * 100).toFixed(2)}%;--c:${x.cat.color};--d:${300 + i * 90}ms">${x.cat.photo ? `<img src="${x.cat.photo}" alt="">` : svg(x.cat.icon)}</span>`);
    }
    acc += len;
  });
  const empty = !list.length;
  return `<div class="donut" style="width:${size}px;height:${size}px">
    <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${esc(o.aria || 'Diagramm')}">
      <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="var(--track)" stroke-width="${sw}"/>
      ${segs.join('')}
    </svg>
    ${bubbles.join('')}
    <div class="d-center">${empty ? `<span class="small">${esc(o.emptyText || 'Noch nichts')}</span>` : `<span class="d-label">${esc(o.label || '')}</span><span class="d-value">${o.valueHTML || ''}</span>${o.sub ? `<span class="d-sub">${o.sub}</span>` : ''}`}</div>
  </div>`;
}
/** Ring-Stücke zeichnen (nach dem Einfügen aufrufen) */
function animateDonuts(root = document) {
  const arcs = $$('.seg-arc', root);
  if (!arcs.length) return;
  const run = () => arcs.forEach((a) => { a.style.strokeDasharray = `${a.dataset.len} ${a.dataset.c}`; });
  if (!motionOn() || swInstant) { arcs.forEach((a) => { a.style.transition = 'none'; }); run(); return; }
  requestAnimationFrame(() => requestAnimationFrame(run));
}
/** Balken: 12 Monate, Einnahmen und Ausgaben nebeneinander */
function barsHTML(months, maxV) {
  return `<div class="bars" role="img" aria-label="Einnahmen und Ausgaben je Monat">${months.map((mo, i) => {
    const hi = maxV ? Math.max(2, Math.round(mo.in / maxV * 100)) : 2;
    const ho = maxV ? Math.max(2, Math.round(mo.out / maxV * 100)) : 2;
    return `<button type="button" class="bar-col${mo.cur ? ' cur' : ''}" data-month="${mo.key}" style="--i:${i}" aria-label="${esc(mo.label)}">
      <span class="bar-pair"><i class="b-in" style="height:${mo.in ? hi : 0}%"></i><i class="b-out" style="height:${mo.out ? ho : 0}%"></i></span>
      <span class="bar-lbl">${MONTHS_XS[i]}</span></button>`;
  }).join('')}</div>`;
}

/* ---------- Effekte ---------- */
const motionOn = () => S.settings.motion !== false && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
/** Zahl hochzählen lassen */
function countUp(el, to, dur = 900) {
  if (!el) return;
  const fmt = (c) => { const a = Math.abs(Math.round(c)); return (c < 0 ? '−' : '') + Math.floor(a / 100).toLocaleString('de-DE') + ',' + pad(a % 100) + ' €'; };
  if (!motionOn()) { el.textContent = fmt(to); return; }
  const start = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - start) / dur);
    const e = 1 - Math.pow(1 - p, 4);
    el.textContent = fmt(to * e);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
/** kleine Konfetti-Punkte an einer Stelle */
function burst(x, y, colors) {
  if (!motionOn()) return;
  const cols = colors || ['var(--accent)', '#F2C14E', '#2F6FD6', '#D35D97'];
  for (let i = 0; i < 14; i++) {
    const p = document.createElement('i');
    p.className = 'particle';
    p.style.left = x + 'px'; p.style.top = y + 'px';
    p.style.background = cols[i % cols.length];
    document.body.appendChild(p);
    const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
    const dist = 40 + Math.random() * 50;
    const anim = p.animate([
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * dist}px), calc(-50% + ${Math.sin(a) * dist}px)) scale(.3)`, opacity: 0 }
    ], { duration: 650 + Math.random() * 250, easing: 'cubic-bezier(.2,.8,.2,1)' });
    anim.onfinish = () => p.remove();
  }
}
const vibrate = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* egal */ } };

/* ---------- Navigation (eigener Verlauf – funktioniert im Artefakt und in der App) ---------- */
const VIEWS = {};
let stack = [];
let navDir = 'fade';
let scrollMem = {};
let lastKey = '';
const homeTab = () => 'start';
const TAB_ORDER = () => ['start', 'buchungen', 'geplant', 'offen', 'auswertung'];
const curPath = () => stack[stack.length - 1] || homeTab();
function parsePath(p) { const i = p.indexOf('/'); return i < 0 ? { name: p, arg: '' } : { name: p.slice(0, i), arg: p.slice(i + 1) }; }
const route = () => parsePath(curPath());
function go(path, dir = 'fwd') {
  scrollMem[stack.length - 1] = window.scrollY;
  closeSheetNow();
  stack.push(path); navDir = dir; render(true); window.scrollTo(0, 0);
}
function replaceTo(path, dir = 'fade') {
  closeSheetNow();
  if (!stack.length) stack.push(path); else stack[stack.length - 1] = path;
  navDir = dir; render(true); window.scrollTo(0, 0);
}
function tabTo(name, dir) {
  if (stack.length === 1 && stack[0] === name) { window.scrollTo({ top: 0, behavior: motionOn() ? 'smooth' : 'auto' }); return; }
  const order = TAB_ORDER();
  const from = order.indexOf(route().name) >= 0 ? order.indexOf(route().name) : order.indexOf((VIEWS[route().name] || {}).nav || '');
  const to = order.indexOf(name);
  closeSheetNow();
  stack = [name]; scrollMem = {};
  navDir = dir || (from >= 0 && to >= 0 && to !== from ? (to > from ? 'tab-l' : 'tab-r') : 'fade');
  render(true); window.scrollTo(0, 0);
}
/** Zurück: Fenster schließen → eine Seite zurück → Startseite. false = schon ganz vorne */
function goBack() {
  if (sheetOpen()) { closeSheet(); return true; }
  if (stack.length > 1) {
    stack.pop(); navDir = 'back'; render(true);
    const y = scrollMem[stack.length - 1] || 0; requestAnimationFrame(() => window.scrollTo(0, y));
    return true;
  }
  if (curPath() !== homeTab()) { tabTo(homeTab(), 'tab-r'); return true; }
  return false;
}

/** Seite zeichnen. changed = Seitenwechsel (mit Animation) */
function render(changed) {
  applyTheme();
  const r = route();
  let v = VIEWS[r.name];
  if (!v || (v.needsDebts && !S.settings.debts)) { stack = [homeTab()]; v = VIEWS[homeTab()]; }
  const key = curPath();
  const isNew = key !== lastKey;
  if (isNew) { lastKey = key; if (v.init) v.init(r.arg); }
  const view = $('#view');
  view.className = '';
  view.innerHTML = v.html(r.arg);
  if (changed && motionOn()) {
    const cls = { fwd: 'in-fwd', back: 'in-back', 'tab-l': 'in-r', 'tab-r': 'in-l', fade: 'in-fade' }[navDir] || 'in-fade';
    void view.offsetWidth;
    view.className = 'anim ' + cls;
    clearTimeout(render._t);
    render._t = setTimeout(() => { view.className = ''; }, 1100);
  }
  navDir = 'fade';
  resetSwipeStyles();
  if (v.mount) v.mount(r.arg);
  animateDonuts(view);
  renderNav(v.nav);
  updateTopbar(v);
  if (changed) $$('[data-count]', view).forEach((el) => countUp(el, +el.dataset.count));
}

/* ---------- Leiste unten ---------- */
const NAV_ITEMS = () => [
  ['start', 'home', 'Start'], ['buchungen', 'list', 'Buchungen'], ['+'], ['geplant', 'calendar', 'Geplant'], ['auswertung', 'chart', 'Auswertung']
];
let navSig = '';
function renderNav(active) {
  const nav = $('#nav');
  const sig = NAV_ITEMS().map((x) => x[0]).join(',');
  if (sig !== navSig) {
    navSig = sig;
    nav.innerHTML = '<span class="nav-pill" aria-hidden="true"></span>' + NAV_ITEMS().map((it) => it[0] === '+'
      ? `<button type="button" class="nav-add" id="nav-add" aria-label="Neue Buchung (lange drücken: Rückzahlung)">
          <svg class="ring" viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="27"/></svg>${svg('plus')}</button>`
      : `<button type="button" class="nav-tab" data-tab="${it[0]}" aria-label="${it[2]}">${svg(it[1])}<span class="lbl">${it[2]}</span></button>`).join('');
    $$('.nav-tab', nav).forEach((b) => b.addEventListener('click', () => tabTo(b.dataset.tab)));
    bindAddButton($('#nav-add', nav));
  }
  nav.classList.toggle('hidden', !active);
  $$('.nav-tab', nav).forEach((b) => {
    const on = b.dataset.tab === active;
    b.classList.toggle('on', on);
    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  requestAnimationFrame(() => movePill(nav));
}
function movePill(nav) {
  const pill = $('.nav-pill', nav);
  const on = $('.nav-tab.on', nav);
  if (!pill) return;
  if (!on) { pill.style.opacity = '0'; return; }
  pill.style.opacity = '1';
  pill.style.width = on.offsetWidth + 'px';
  pill.style.transform = `translateX(${on.offsetLeft}px)`;
}
/** ＋ antippen = neue Buchung · lange drücken = Rückzahlung (Ring läuft voll) */
function bindAddButton(btn) {
  if (!btn) return;
  let timer = null; let long = false; let sx = 0; let sy = 0;
  const reset = () => { clearTimeout(timer); btn.classList.remove('holding'); };
  btn.addEventListener('pointerdown', (e) => {
    long = false; sx = e.clientX; sy = e.clientY;
    btn.classList.add('holding');
    timer = setTimeout(() => {
      long = true; btn.classList.remove('holding'); btn.classList.add('fired');
      setTimeout(() => btn.classList.remove('fired'), 500);
      vibrate(30);
      const r = btn.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2);
      go('neu/refund');
    }, 480);
  });
  btn.addEventListener('pointermove', (e) => { if (Math.hypot(e.clientX - sx, e.clientY - sy) > 14) reset(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => btn.addEventListener(t, reset));
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  btn.addEventListener('click', (e) => { if (long) { long = false; e.preventDefault(); return; } go('neu/out'); });
}

/* ---------- Kompakte Titelleiste beim Scrollen (wie bei Samsung) ---------- */
let topbarTitle = '';
function updateTopbar(v) {
  const h = $('#view h1');
  topbarTitle = v.title ? v.title() : (h ? h.textContent : '');
  $('#topbar-title').textContent = topbarTitle;
  onScroll();
}
let scrollRaf = 0;
function onScroll() {
  if (scrollRaf) return;
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = 0;
    const y = window.scrollY;
    $('#topbar').classList.toggle('show', y > 70 && !!topbarTitle);
    const hero = $('#view .hero h1');
    if (hero) {
      const p = clamp(y / 90, 0, 1);
      hero.style.opacity = String(1 - p * 0.9);
      hero.style.transform = `translate3d(0,${(-p * 10).toFixed(1)}px,0) scale(${(1 - p * 0.08).toFixed(3)})`;
    }
  });
}
window.addEventListener('scroll', onScroll, { passive: true });

/* ---------- Wischen zwischen den Haupt-Seiten ----------
   Die Seite folgt dem Finger 1:1, die Nachbarseite schiebt sich sichtbar mit herein, die Leiste unten wandert mit.
   Beim Loslassen entscheiden Weg und Schwung; die fertig gezeichnete Nachbarseite wird ohne Neuaufbau übernommen. */
let sw = null; let swRaf = 0; let swBusy = false; let swClickBlock = 0; let swInstant = false;
function tabTarget(dx) {
  const order = TAB_ORDER(); const i = order.indexOf(route().name);
  const t = i + (dx < 0 ? 1 : -1);
  return i >= 0 && t >= 0 && t < order.length ? order[t] : null;
}
function resetSwipeStyles() {
  const p = $('#view > .page'); if (p) { p.style.transition = ''; p.style.transform = ''; p.style.willChange = ''; }
  const pill = $('#nav .nav-pill'); if (pill) pill.style.transition = '';
}
/** Nachbarseite fertig gezeichnet daneben legen (oben angefangen, wie nach dem Wechsel) */
function makePeek(name) {
  const v = VIEWS[name]; if (!v) return null;
  const view = $('#view'); const r = view.getBoundingClientRect();
  const peek = document.createElement('div'); peek.id = 'peek'; peek.setAttribute('aria-hidden', 'true');
  const inner = document.createElement('div'); inner.className = 'peek-inner';
  inner.style.top = (r.top + window.scrollY) + 'px'; inner.style.left = r.left + 'px'; inner.style.width = r.width + 'px';
  try { inner.innerHTML = v.html(''); } catch (e) { return null; }
  $$('.seg-arc', inner).forEach((a) => { a.style.transition = 'none'; a.style.strokeDasharray = `${a.dataset.len} ${a.dataset.c}`; });
  peek.appendChild(inner); document.body.appendChild(peek);
  return inner;
}
function navGeom(name) {
  const tab = (VIEWS[name] && VIEWS[name].nav) || name; // „Offen“ gehört zum Tab „Geplant“
  const b = $(`#nav .nav-tab[data-tab="${tab}"]`);
  return b ? { x: b.offsetLeft, w: b.offsetWidth } : null;
}
function paintSwipe() {
  swRaf = 0;
  if (!sw || sw.lock !== 'h') return;
  const W = sw.W; let dx = sw.dx;
  const dir = dx < 0 ? 'next' : 'prev';
  if (dir !== sw.dir) { // Richtung gewechselt → andere Nachbarseite
    sw.dir = dir;
    const old = $('#peek'); if (old) old.remove();
    sw.target = tabTarget(dx); sw.peek = sw.target ? makePeek(sw.target) : null;
    sw.g1 = navGeom(sw.target);
  }
  if (!sw.target) dx = dx / (1 + Math.abs(dx) / 90) * 0.6; // am Rand: Gummiband
  const page = $('#view > .page');
  if (page) page.style.transform = `translate3d(${dx.toFixed(1)}px,0,0)`;
  if (sw.peek) sw.peek.style.transform = `translate3d(${(dx + (dx < 0 ? W : -W)).toFixed(1)}px,0,0)`;
  // Leiste unten: Markierung gleitet anteilig zum Ziel
  const pill = $('#nav .nav-pill');
  if (pill && sw.g0 && sw.g1) {
    const p = Math.min(1, Math.abs(dx) / W);
    pill.style.transition = 'none';
    pill.style.width = (sw.g0.w + (sw.g1.w - sw.g0.w) * p).toFixed(1) + 'px';
    pill.style.transform = `translateX(${(sw.g0.x + (sw.g1.x - sw.g0.x) * p).toFixed(1)}px)`;
  }
  const over = sw.target && Math.abs(dx) > W * 0.33;
  if (over !== sw.over) { sw.over = over; if (over) vibrate(6); }
}
function finishSwipe(commit) {
  const s = sw; sw = null; if (!s) return;
  if (swRaf) { cancelAnimationFrame(swRaf); swRaf = 0; }
  const page = $('#view > .page'); const peek = s.peek; const W = s.W;
  const from = s.target ? s.dx : s.dx / (1 + Math.abs(s.dx) / 90) * 0.6;
  const to = commit ? (s.dx < 0 ? -W : W) : 0;
  const rest = Math.abs(to - from);
  const ms = motionOn() ? Math.round(Math.max(150, Math.min(340, rest / Math.max(1.1, Math.abs(s.v) * 1.15)))) : 0;
  const ease = `transform ${ms}ms cubic-bezier(.22,.8,.3,1)`;
  swBusy = true;
  if (page) { page.style.transition = ease; page.style.transform = `translate3d(${to}px,0,0)`; }
  if (peek) { peek.style.transition = ease; peek.style.transform = `translate3d(${to + (s.dx < 0 ? W : -W)}px,0,0)`; }
  const pill = $('#nav .nav-pill');
  if (pill) { pill.style.transition = `transform ${ms}ms cubic-bezier(.22,.8,.3,1), width ${ms}ms cubic-bezier(.22,.8,.3,1)`; const g = commit ? s.g1 : s.g0; if (g) { pill.style.width = g.w + 'px'; pill.style.transform = `translateX(${g.x}px)`; } }
  setTimeout(() => {
    if (commit) {
      // Neue Seite übernehmen: gleich aussehend, ohne Einflug-Animation
      closeSheetNow();
      stack = [s.target]; scrollMem = {}; navDir = 'none'; swInstant = true;
      window.scrollTo(0, 0);
      render(false);
      swInstant = false;
    } else resetSwipeStyles();
    const p = $('#peek'); if (p) p.remove();
    swBusy = false;
  }, ms + 20);
}
function bindSwipe() {
  const v = $('#view');
  // Klick direkt nach einem Wisch nicht als Tippen werten
  document.addEventListener('click', (e) => { if (Date.now() < swClickBlock) { e.preventDefault(); e.stopPropagation(); } }, true);
  v.addEventListener('pointerdown', (e) => {
    if (sw && sw.lock === 'h') return;
    sw = null;
    if (swBusy || e.pointerType === 'mouse' || !e.isPrimary || sheetOpen()) return;
    const r = route();
    if (!TAB_ORDER().includes(r.name) || r.arg) return;
    if (e.target.closest && e.target.closest('input, select, textarea, .no-swipe, .hscroll')) return;
    sw = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lock: null, dx: 0, v: 0, pts: [], dir: null, W: window.innerWidth, g0: navGeom(route().name) };
  }, { passive: true });
  v.addEventListener('pointermove', (e) => {
    if (!sw || e.pointerId !== sw.id) return;
    const dx = e.clientX - sw.x0; const dy = e.clientY - sw.y0;
    if (sw.lock === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      sw.lock = Math.abs(dx) > Math.abs(dy) * 1.15 ? 'h' : 'v';
      if (sw.lock !== 'h') { sw = null; return; }
      try { v.setPointerCapture(e.pointerId); } catch (_) { /* egal */ }
      sw.x0 = e.clientX; // ab hier 1:1, ohne Sprung
      const page = $('#view > .page'); if (page) { page.style.transition = 'none'; page.style.willChange = 'transform'; }
    }
    sw.dx = e.clientX - sw.x0;
    const now = performance.now(); sw.pts.push({ t: now, x: e.clientX });
    while (sw.pts.length > 2 && now - sw.pts[0].t > 90) sw.pts.shift();
    if (!swRaf) swRaf = requestAnimationFrame(paintSwipe);
  }, { passive: true });
  const end = (e) => {
    if (!sw || e.pointerId !== sw.id) return;
    if (sw.lock !== 'h') { sw = null; return; }
    const pts = sw.pts; const a = pts[0]; const b = pts[pts.length - 1];
    sw.v = a && b && b.t > a.t ? (b.x - a.x) / (b.t - a.t) : 0; // px/ms
    swClickBlock = Date.now() + 350;
    if (sw.dir === null) paintSwipe();
    const fling = Math.abs(sw.v) > 0.35 && Math.sign(sw.v) === Math.sign(sw.dx) && Math.abs(sw.dx) > 24;
    const commit = e.type !== 'pointercancel' && !!sw.target && (Math.abs(sw.dx) > sw.W * 0.33 || fling);
    if (commit) vibrate(8);
    finishSwipe(commit);
  };
  v.addEventListener('pointerup', end, { passive: true });
  v.addEventListener('pointercancel', end, { passive: true });
}

/* ---------- Darstellung ---------- */
function applyTheme() {
  const st = S.settings;
  const root = document.documentElement;
  if (st.theme === 'light' || st.theme === 'dark') root.dataset.theme = st.theme;
  else if (root.dataset.theme && root.dataset.mine) delete root.dataset.theme;
  if (st.theme === 'light' || st.theme === 'dark') root.dataset.mine = '1'; else delete root.dataset.mine;
  root.classList.toggle('noglass', st.glass === false);
  root.classList.toggle('nomotion', !motionOn());
}

/* ---------- Kleine Bausteine ---------- */
const ACCT_NAME = { online: 'Konto', bar: 'Bar' };
function txRow(t, i = 0) {
  if (t.kind === 'transfer') {
    const from = ACCT_NAME[acctOf(t)]; const to = ACCT_NAME[t.to || 'bar'];
    return `<button type="button" class="row tx-row" data-tx="${t.id}" style="--i:${i}">
      ${catIcon({ color: 'var(--sub)', icon: 'banknote' }, 42)}
      <span class="grow"><span class="r-title ell">${esc(t.title || (t.to === 'online' ? 'Eingezahlt' : 'Abgehoben'))}</span><span class="r-sub ell">${from} → ${to} · ${dateLabel(t.date)}</span></span>
      <span class="r-amt zero">${money(t.amount)}</span></button>`;
  }
  const c = catById(t.cat);
  const isOut = t.kind === 'out';
  const title = t.title || t.payee || c.name;
  const backSum = (t.backs || []).reduce((s, b) => s + b.c, 0);
  const openBack = (t.backs || []).some((b) => S.plans.some((p) => p.id === b.planId));
  const slip = [t.lines && t.lines.length > 1 ? t.lines.length + ' Posten' : '', backSum ? `${eur(backSum)} zurück${openBack ? ' (offen)' : ''}` : ''].filter(Boolean).join(', ');
  const sub = [t.kind === 'refund' ? (t.payee ? 'von ' + t.payee : 'zurückbekommen') : (t.payee && t.payee !== title ? t.payee : ''), slip || c.name, acctOf(t) === 'bar' ? 'Bar' : '', dateLabel(t.date)].filter(Boolean).join(' · ');
  return `<button type="button" class="row tx-row" data-tx="${t.id}" style="--i:${i}">
    <span class="ic-wrap">${catIcon(c, 42)}${t.kind === 'refund' ? `<span class="ic-badge">${svg('refund')}</span>` : ''}</span>
    <span class="grow"><span class="r-title ell">${esc(title)}</span><span class="r-sub ell">${esc(sub)}</span></span>
    <span class="r-amt ${isOut ? 'neg' : 'pos'}">${money(t.amount, { sign: isOut ? '-' : '+' })}</span>
  </button>`;
}
function bindTxRows(root = document) {
  $$('[data-tx]', root).forEach((b) => b.addEventListener('click', () => go('neu/e' + b.dataset.tx)));
}
const emptyHTML = (icon, text, btn) => `<div class="empty">${svg(icon)}<div>${text}</div>${btn || ''}</div>`;
