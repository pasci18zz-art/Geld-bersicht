/* Geld – Bon einlesen (Texterkennung im Handy), Posten aufteilen, Tab „Offen“, „Was ist neu“ */
'use strict';

/* ================= Was ist neu ================= */
const APP_VERSION = '3.6';
const CHANGELOG = [
  { v: '3.6', title: 'Geplant & Lidl', items: [
    ['calendar', 'Geplant zeigt alle Rückzahlungen', 'Wieder im gewohnten Stil, mit „Erhalten“. Antippen = auch Teilbeträge.'],
    ['cart', 'Seite „Lidl“', 'Daneben (umschalten oder wischen): nur was dir jemand aus dem Lidl schuldet, nach Personen.'],
    ['people', 'Personen', 'In den Einstellungen: Personen anlegen, Reihenfolge festlegen (wer oben steht), Initialen und Farbe ändern.'],
    ['check', 'Zuordnen geht schneller', 'Einzelne Posten gehen beim Antippen nur an diese Person. Tippst du noch jemanden ein, wird geteilt.']
  ] },
  { v: '3.5', title: 'Offen bei Geplant, Bon schneller', items: [
    ['calendar', 'Offen ist jetzt bei Geplant', 'Oben zwischen „Geplant“ und „Offen“ umschalten oder von Geplant einfach weiter nach links wischen. Unten sind wieder vier Tabs.'],
    ['receipt', 'Bon lesen viel schneller', 'Jetzt mit der Texterkennung von Google direkt im Handy, ohne Internet. Meist in unter einer Sekunde.']
  ] },
  { v: '3.4', title: 'Bons einlesen & Offen', items: [
    ['receipt', 'Bon einlesen', 'Beim Eintragen oben auf „Bon“ tippen und einen Screenshot wählen, zum Beispiel aus Lidl Plus. Posten, Laden, Karte oder Bar landen von selbst auf dem Kassenzettel.'],
    ['share', 'Direkt an Geld teilen', 'In der Galerie oder in Lidl Plus auf „Teilen“ und dann „Geld“ tippen – der Bon wird sofort eingelesen.'],
    ['people', 'Posten aufteilen', 'Unter jedem Posten steht „Ich“. Antippen und auswählen, für wen er war, auch geteilt (z. B. 1 Brot für dich, 1 für Lena). Was dir zusteht, steht automatisch unter „Bekomme ich zurück“.'],
    ['wallet', '„Offen“', 'Wer dir wie viel schuldet, nach Personen sortiert. „Geld bekommen“ geht auch mit Teilbeträgen. Ersetzt den alten Schulden-Tab.'],
    ['sparkle', 'Was ist neu', 'Dieser Bildschirm kommt nach jedem Update einmal. Später findest du ihn in den Einstellungen.']
  ] },
  { v: '3.3', title: 'Flüssiges Wischen', items: [
    ['list', 'Wischen zwischen den Tabs', 'Die Seite folgt dem Finger, die nächste Seite gleitet sichtbar mit herein.']
  ] },
  { v: '3.2', title: 'Rechnen auf dem Zettel', items: [
    ['receipt', 'Taschenrechner in jeder Zeile', 'Mit × und + direkt rechnen, auch beim Geld, das du zurückbekommst.'],
    ['chart', 'Diagramm antippen', 'Mitte = große Übersicht, ein Stück = Buchungen dieser Kategorie.']
  ] },
  { v: '3.1', title: 'Neues Eintragen', items: [
    ['receipt', 'Kassenzettel', 'Posten, Anzahl und „Bekomme ich zurück“ – Rückzahlungen landen von selbst bei dir zum Abhaken.'],
    ['keypad', 'Zahlenfeld einklappbar', 'Der kleine Knopf über dem Zahlenfeld klappt es weg.']
  ] },
  { v: '3.0', title: 'Feinschliff', items: [
    ['eyeOff', 'Verstecken nach Uhrzeit', 'Zum Beispiel in der Schule automatisch, Aufdecken mit Fingerabdruck.'],
    ['lock', 'App-Sperre', 'Mit Fingerabdruck oder Handy-PIN.'],
    ['flag', 'Sparziele', 'In der Auswertung, mit Schätzung, wann du es schaffst.']
  ] }
];
VIEWS.neuigkeiten = {
  nav: null,
  html() {
    const [cur, ...old] = CHANGELOG;
    const item = ([ic, t, d], i) => `<div class="wn-item" style="--i:${i}"><span class="wn-ic">${svg(ic)}</span><span class="grow"><span class="b block">${esc(t)}</span><span class="small">${esc(d)}</span></span></div>`;
    return `<div class="page wn-page">
      <div class="topbar-row"><button type="button" class="icon-btn glass" id="back" aria-label="Zurück">${svg('back')}</button><span class="grow"></span></div>
      <header class="wn-hero"><span class="wn-badge">Version ${esc(cur.v)}</span><h1>Was ist neu</h1><p class="small">${esc(cur.title)}</p></header>
      <section class="card glass pad">${cur.items.map(item).join('')}</section>
      ${old.map((c) => `<details class="card glass wn-old"><summary><span class="b">${esc(c.v)}</span> · ${esc(c.title)}${svg('next')}</summary>${c.items.map(item).join('')}</details>`).join('')}
      <button type="button" class="btn" id="wn-ok">${svg('check')}Los geht's</button>
    </div>`;
  },
  mount() {
    $('#back').onclick = () => goBack();
    $('#wn-ok').onclick = () => goBack();
  }
};
/** Nach einem Update einmal zeigen (nicht bei der allerersten Installation) */
function maybeShowNews() {
  if (S.settings.seenVersion === APP_VERSION) return false;
  const show = HAD_DATA;
  S.settings.seenVersion = APP_VERSION; save();
  if (show) { go('neuigkeiten', 'fwd'); setTimeout(() => window.scrollTo(0, 0), 60); }
  return show;
}

/* ================= Texterkennung (Google ML Kit im Handy, offline) ================= */
/** Zeilen mit Position → Text Zeile für Zeile (Name links und Preis rechts landen in derselben Zeile) */
function rowsFromLines(lines) {
  const ls = lines.filter((l) => l && l.t).map((l) => ({ t: l.t, x: l.x, h: Math.max(1, l.h), cy: l.y + l.h / 2 })).sort((a, b) => a.cy - b.cy);
  const rows = [];
  ls.forEach((l) => {
    const r = rows.find((q) => Math.abs(q.cy - l.cy) < Math.min(q.h, l.h) * 0.6);
    if (r) { r.items.push(l); r.cy = (r.cy * r.n + l.cy) / (r.n + 1); r.n++; r.h = Math.max(r.h, l.h); } else rows.push({ cy: l.cy, h: l.h, n: 1, items: [l] });
  });
  return rows.sort((a, b) => a.cy - b.cy).map((r) => r.items.sort((a, b) => a.x - b.x).map((i) => i.t).join(' ')).join('\n');
}
async function runOCR(img) {
  const C = window.Capacitor;
  const P = isNative() && C && ((C.Plugins && C.Plugins.BonOcr) || (C.registerPlugin ? C.registerPlugin('BonOcr') : null));
  if (!P || !P.read) throw new Error('web');
  const r = await P.read({ data: img });
  return r && r.lines && r.lines.length ? rowsFromLines(r.lines) : ((r && r.text) || '');
}
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

/* ================= Bon verstehen ================= */
const STORES = [['Lidl', /\blidl\b/i], ['Aldi', /\baldi\b/i], ['Rewe', /\brewe\b/i], ['Edeka', /\bedeka\b/i], ['Netto', /\bnetto\b(?! *\d)/i], ['Penny', /\bpenny\b/i],
  ['Kaufland', /\bkaufland\b/i], ['dm', /\bdm[- ]?drogerie/i], ['Rossmann', /\brossmann\b/i], ['Norma', /\bnorma\b/i], ['Globus', /\bglobus\b/i]];
const STOP = /^(zu zahlen|summe|gesamt|total|zwischensumme|karte|bar\b|gegeben|r[uü]ckgeld|mwst|netto|brutto|steuer|ust|eur\b|girocard|ec[- ]?karte|kreditkarte|visa|mastercard|maestro|kontaktlos|betrag|datum|uhrzeit|beleg|terminal|trace|bon|kasse|filiale)/i;
const MONEY_RE = '(-?\\d{1,4}[.,]\\d{2})';
const toExpr = (s) => s.replace('.', ',').replace(/^-/, '');
function parseReceipt(text) {
  const raw = String(text || '').split('\n').map((l) => l.replace(/[|]/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
  const r = { store: '', items: [], total: null, acct: null, date: null };
  const head = raw.slice(0, 5).map((l) => l.replace(/\s/g, ''));
  if (head.some((l) => /^l\W{0,2}[i1l|!]?\W{0,2}d\W{0,2}[l1|i]$/i.test(l))) r.store = 'Lidl';
  if (!r.store) { const st = STORES.find(([, re]) => re.test(text)); if (st) r.store = st[0]; }
  if (!r.store && /\bzu zahlen\b/i.test(text)) r.store = 'Lidl'; // Lidl-Bons: Logo ist ein Bild, aber „Zu zahlen“ steht nur bei Lidl
  const reQty = new RegExp(`^(.*?)\\s+(\\d+[.,]\\d{2})\\s*[x×*]\\s*(\\d{1,3})\\s+${MONEY_RE}\\s*[A-Z]{0,2}\\*?$`, 'i');
  const reQty2 = new RegExp(`^(.*?)\\s+(\\d{1,3})\\s*[x×*]\\s*(\\d+[.,]\\d{2})\\s+${MONEY_RE}\\s*[A-Z]{0,2}\\*?$`, 'i');
  const reItem = new RegExp(`^(.*?[A-Za-zÄÖÜäöüß].*?)\\s+${MONEY_RE}\\s*(?:[A-Z]{1,2}\\*?|\\*)?$`);
  const reTotal = new RegExp(`^(zu zahlen|summe|gesamt(?:betrag)?|total|endbetrag)\\b.*?${MONEY_RE}`, 'i');
  let after = false;
  raw.forEach((l) => {
    const d = /(\d{2})\.(\d{2})\.(\d{2,4})/.exec(l);
    if (d && !r.date) {
      const y = d[3].length === 2 ? '20' + d[3] : d[3]; const ds = `${y}-${d[2]}-${d[1]}`;
      if (/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(ds) && ds <= todayStr() && ds > addDays(todayStr(), -400)) r.date = ds;
    }
    const tm = reTotal.exec(l);
    if (tm && r.total === null) { r.total = parseEur(tm[2]); after = true; return; }
    if (after) {
      if (/\b(bar|gegeben|r[uü]ckgeld)\b/i.test(l)) r.acct = 'bar';
      else if (!r.acct && /\b(karte|girocard|ec[- ]?karte|kreditkarte|visa|mastercard|maestro|kontaktlos|apple ?pay|google ?pay)\b/i.test(l)) r.acct = 'online';
      return;
    }
    if (/kg\s*[x×]|eur\s*\/\s*kg|\/kg\b/i.test(l)) return; // Gewichtszeile gehört zum Posten darüber
    let m = reQty.exec(l); let name; let expr; let amount;
    if (m) { name = m[1]; expr = `${toExpr(m[2])}×${m[3]}`; amount = parseEur(m[4]); }
    else if ((m = reQty2.exec(l))) { name = m[1]; expr = `${toExpr(m[3])}×${m[2]}`; amount = parseEur(m[4]); }
    else if ((m = reItem.exec(l))) { name = m[1]; amount = parseEur(m[2]); expr = toExpr(m[2]); }
    else return;
    name = name.replace(/[^\wÄÖÜäöüß.,&%'’+\- ]/g, '').replace(/\s+/g, ' ').trim();
    if (!name || STOP.test(name) || /^\d+$/.test(name)) return;
    if (amount < 0) { // Rabatt, Preisvorteil, Pfandrückgabe → vom Posten darüber abziehen
      const prev = r.items[r.items.length - 1];
      if (prev && !/pfand/i.test(name)) prev.expr += '−' + centsToInput(-amount);
      else r.items.push({ name, expr: '−' + expr });
      return;
    }
    if (calcExpr(expr) !== amount) expr = centsToInput(amount); // Menge passt nicht → nur Endbetrag
    r.items.push({ name, expr });
  });
  return r;
}

/* ================= Bon → Kassenzettel ================= */
function pickBon() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = () => { const f = inp.files && inp.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => importBon(rd.result); rd.readAsDataURL(f); };
  inp.click();
}
function busyOverlay(text, onCancel) {
  const el = document.createElement('div'); el.className = 'busy'; el.setAttribute('role', 'status');
  el.innerHTML = `<div class="busy-box"><span class="spinner" aria-hidden="true"></span><span class="b">${esc(text)}</span>${onCancel ? '<button type="button" class="link busy-x">Abbrechen</button>' : ''}</div>`;
  if (onCancel) $('.busy-x', el).onclick = onCancel;
  document.body.appendChild(el); return el;
}
async function importBon(src) {
  if (!F || route().name !== 'neu') return;
  let cancelled = false;
  const busy = busyOverlay('Bon wird gelesen …', () => { cancelled = true; busy.remove(); });
  try {
    const text = await withTimeout(runOCR(src), 30000);
    if (cancelled) return;
    const r = parseReceipt(text);
    if (!r.items.length) { toast('Auf dem Bild wurden keine Posten erkannt'); return; }
    F.kind = 'out';
    F.lines = r.items.map((i) => ({ name: i.name, expr: i.expr }));
    F.backs = F.backs.filter((b) => b.got || !b.auto);
    F.bon = { total: r.total, store: r.store };
    if (r.store) {
      F.payee = r.store;
      const rule = S.rules[r.store.toLowerCase()];
      const byName = S.cats.find((c) => c.kind === 'out' && c.name.toLowerCase() === r.store.toLowerCase());
      if (rule && S.cats.some((c) => c.id === rule && c.kind === 'out')) F.cat = rule; else if (byName) F.cat = byName.id;
    }
    if (r.acct) { F.acct = r.acct; F.acctSet = true; }
    if (r.date && !fIsPlan()) F.date = r.date;
    F.act = { sec: 'item', i: F.lines.length };
    vibrate(15);
    render(false);
  } catch (e) {
    if (cancelled) return;
    const m = (e && e.message) || '';
    toast(m === 'web' ? 'Bon lesen geht nur in der App' : m === 'timeout' ? 'Das Lesen hat zu lange gedauert – versuch es nochmal' : 'Der Bon konnte nicht gelesen werden');
  } finally { busy.remove(); }
}
/** Bild wurde von außen an Geld geteilt (Galerie, Lidl Plus …) */
function handleSharedImage(dataUrl) {
  if (!dataUrl) return;
  actionAt = Date.now();
  closeSheetNow();
  stack = [homeTab()];
  go('neu/out', 'fwd');
  setTimeout(() => importBon(dataUrl), 350);
}
async function checkSharedImage() {
  const C = window.Capacitor;
  if (!isNative() || !C) return;
  const P = (C.Plugins && C.Plugins.ShareIn) || (C.registerPlugin ? C.registerPlugin('ShareIn') : null);
  if (!P || !P.take) return;
  try { const r = await P.take(); if (r && r.data) handleSharedImage(r.data); } catch (e) { /* nichts geteilt */ }
}

/* ================= Posten aufteilen ================= */
/** Betrag eines Postens auf die Personen verteilen → [{who, c}] (who '' = ich) */
function lineParts(l) {
  const c = calcExpr(l.expr); const sh = (l.shares || []).filter((x) => x.w > 0);
  if (!sh.length) return [{ who: '', c }];
  const W = sh.reduce((s, x) => s + x.w, 0); let used = 0;
  return sh.map((x, i) => { const part = i === sh.length - 1 ? c - used : Math.round(c * x.w / W); used += part; return { who: x.who, c: part }; });
}
const shareLabel = (l) => {
  const sh = (l.shares || []).filter((x) => x.w > 0);
  if (!sh.length) return 'Ich';
  const names = sh.map((x) => (x.who || 'Ich') + (sh.length > 1 && x.w > 1 ? ' ×' + x.w : ''));
  return names.length > 2 ? names.slice(0, 2).join(', ') + ' +' + (names.length - 2) : names.join(' + ');
};
/** „Bekomme ich zurück“ aus den zugeordneten Posten neu berechnen (eigene, getippte Zeilen bleiben) */
function rebuildAutoBacks() {
  const per = new Map();
  F.lines.forEach((l) => lineParts(l).forEach((p) => {
    if (!p.who || p.c <= 0) return;
    const k = p.who.toLowerCase();
    if (!per.has(k)) per.set(k, { who: p.who, terms: [] });
    per.get(k).terms.push(centsToInput(p.c));
  }));
  const oldAuto = F.backs.filter((b) => b.auto && !b.got);
  const keep = F.backs.filter((b) => !b.auto || b.got);
  const autos = [...per.values()].map((x) => { const o = oldAuto.find((b) => b.who.toLowerCase() === x.who.toLowerCase()); return { who: x.who, expr: x.terms.join('+'), auto: true, planId: o ? o.planId : undefined }; });
  F.backs = autos.concat(keep);
  if (F.act.sec === 'back' && !F.backs[F.act.i]) F.act = { sec: 'item', i: F.lines.length - 1 };
}
function assignSheet(i) {
  const l = F.lines[i]; if (!l) return;
  let sh = (l.shares || []).filter((x) => x.w > 0).map((x) => ({ who: x.who, w: x.w }));
  if (!sh.length) sh = [{ who: '', w: 1 }];
  openSheet('<div id="as-body"></div>', (el) => {
    const draw = () => {
      const c = calcExpr(l.expr); const parts = lineParts({ expr: l.expr, shares: sh });
      const pool = nameSuggest(personPool(), '', sh.map((x) => x.who)).slice(0, 6);
      const names = ['', ...sh.map((x) => x.who), ...pool].filter((n, j, a) => a.indexOf(n) === j);
      $('#as-body', el).innerHTML = `<div class="between"><h2 class="ell">${esc(l.name || 'Posten ' + (i + 1))}</h2><span class="b">${eur(c)}</span></div>
        <div class="label">Für wen?</div>
        <div class="chips">${names.map((n) => `<button type="button" class="chip${sh.some((x) => x.who === n) ? ' on' : ''}" data-as="${esc(n)}">${sh.some((x) => x.who === n) ? svg('check') : ''}${n ? esc(n) : 'Ich'}</button>`).join('')}</div>
        <label class="field glass">${svg('plus')}<span class="sr">Andere Person</span><input id="as-new" placeholder="Andere Person" maxlength="30" autocomplete="off" enterkeyhint="done"></label>
        ${sh.length > 1 ? `<div class="label">Anteile</div><div class="as-rows">${sh.map((x, j) => `<div class="as-row"><span class="grow b ell">${x.who ? esc(x.who) : 'Ich'}</span>
          <button type="button" class="icon-btn sm" data-asm="${j}" aria-label="Weniger" ${x.w <= 1 ? 'disabled' : ''}>${svg('minus')}</button><span class="as-w">${x.w}</span>
          <button type="button" class="icon-btn sm" data-asp="${j}" aria-label="Mehr">${svg('plus')}</button><span class="as-c">${eur(parts[j].c)}</span></div>`).join('')}</div>` : ''}
        <button type="button" class="btn" id="as-ok">${svg('check')}Fertig</button>`;
      const multi = /×/.test(l.expr); // mehrere Stück (z. B. 0,89 × 2) → mehrere Personen antippen; sonst nur eine
      $$('[data-as]', el).forEach((b) => b.onclick = () => {
        const n = b.dataset.as; const j = sh.findIndex((x) => x.who === n);
        if (!multi) sh = [{ who: n, w: 1 }];
        else if (j >= 0) { if (sh.length > 1) sh.splice(j, 1); } else sh.push({ who: n, w: 1 });
        vibrate(6); draw();
      });
      const nw = $('#as-new', el);
      const addNew = () => { const n = nw.value.trim(); if (n && !sh.some((x) => x.who.toLowerCase() === n.toLowerCase())) sh.push({ who: n, w: 1 }); nw.value = ''; draw(); };
      nw.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addNew(); } });
      nw.addEventListener('change', addNew);
      $$('[data-asm]', el).forEach((b) => b.onclick = () => { const x = sh[+b.dataset.asm]; x.w = Math.max(1, x.w - 1); draw(); });
      $$('[data-asp]', el).forEach((b) => b.onclick = () => { const x = sh[+b.dataset.asp]; x.w = Math.min(99, x.w + 1); draw(); });
      $('#as-ok', el).onclick = () => {
        if (sh.length === 1 && !sh[0].who) delete l.shares; else l.shares = sh;
        rebuildAutoBacks(); closeSheet(); refreshArea();
      };
    };
    draw();
  });
}

/* ================= Tab „Offen“: wer schuldet mir was ================= */
const openRefunds = () => S.plans.filter((p) => p.kind === 'refund' && refundLeft(p) > 0);
/** Aus dem Lidl? (Kategorie Lidl oder Bon/Ausgabe bei Lidl) */
function isLidl(p) {
  const c = catById(p.cat);
  if (p.cat === 'c_lidl' || (c && /^lidl$/i.test(c.name))) return true;
  const o = p.fromId && (S.tx.find((t) => t.id === p.fromId) || S.plans.find((x) => x.id === p.fromId));
  return !!(o && /lidl/i.test(o.payee || ''));
}
const personByName = (n) => S.people.find((p) => p.name.trim().toLowerCase() === String(n || '').trim().toLowerCase());
/** Neue Namen automatisch in die Personen-Liste (Einstellungen) aufnehmen */
function ensurePeople(names) {
  names.forEach((n) => { n = (n || '').trim(); if (n && !personByName(n)) S.people.push({ id: uid(), name: n, color: COLORS[S.people.length % COLORS.length] }); });
}
function initialsOf(name) {
  const p = personByName(name); if (p && p.ini) return p.ini;
  const parts = String(name || '?').trim().split(/\s+/);
  return (parts.length > 1 ? parts[0].charAt(0) + parts[1].charAt(0) : parts[0].charAt(0)).toUpperCase() || '?';
}
function openByPerson() {
  const map = new Map();
  openRefunds().filter(isLidl).forEach((p) => {
    const name = (p.payee || '').trim(); const k = name.toLowerCase() || '~';
    if (!map.has(k)) map.set(k, { key: k, name: name || 'Ohne Namen', plans: [], left: 0 });
    const g = map.get(k); g.plans.push(p); g.left += refundLeft(p);
  });
  const rank = (g) => { const i = S.people.findIndex((p) => p.name.trim().toLowerCase() === g.key); return i < 0 ? 1e6 : i; };
  return [...map.values()].sort((a, b) => rank(a) - rank(b) || b.left - a.left);
}
const AV_COLORS = ['#2F6FD6', '#E8902E', '#8A5BD6', '#1F9E96', '#D6478A', '#4E9B2F', '#C99A1E'];
function avatarOf(name, size = 44) {
  const p = personByName(name); const ini = initialsOf(name);
  const col = (p && p.color) || AV_COLORS[Math.abs([...String(name || '?')].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7)) % AV_COLORS.length];
  return `<span class="avatar" style="background:${col};width:${size}px;height:${size}px;font-size:${Math.round(size * (ini.length > 2 ? 0.3 : ini.length > 1 ? 0.36 : 0.42))}px" aria-hidden="true">${esc(ini)}</span>`;
}
/** Wofür? Posten-Namen aus der Ausgabe, sonst Bezeichnung oder Kategorie */
function refundWhat(p) {
  const owner = p.fromId && (S.tx.find((t) => t.id === p.fromId) || S.plans.find((x) => x.id === p.fromId));
  const c = catById(p.cat);
  if (!owner) return { title: p.title || c.name, sub: '', date: null };
  const who = (p.payee || '').toLowerCase();
  const items = (owner.lines || []).filter((l) => (l.shares || []).some((x) => x.who.toLowerCase() === who)).map((l) => l.name).filter(Boolean);
  return { title: items.length ? items.join(', ') : (owner.title || owner.payee || c.name), sub: [owner.payee || c.name, owner.date ? dateLabel(owner.date) : ''].filter(Boolean).join(' · '), owner };
}
function refundItemHTML(p, i) {
  const w = refundWhat(p); const c = catById(p.cat);
  return `<button type="button" class="row of-item" data-ofp="${p.id}" style="--i:${i}">${catIcon(c, 36)}
    <span class="grow"><span class="r-title ell">${esc(w.title)}</span><span class="r-sub ell">${esc(w.sub || c.name)}${p.paid ? ` · ${eur(p.paid)} schon bekommen` : ''}</span></span>
    <span class="r-amt pos">${money(refundLeft(p), { force: true })}</span></button>`;
}
/** Oben umschalten: Geplant | Offen (beides unter dem Tab „Geplant“) */
const gpSegHTML = (cur) => segHTML([['geplant', 'Geplant'], ['offen', 'Lidl']], cur, 'data-gp', 'aria-label="Geplant oder Lidl"');
function bindGpSeg() {
  $$('[data-gp]').forEach((b) => b.onclick = () => { if (b.dataset.gp === route().name) return; segMove(b); vibrate(6); setTimeout(() => tabTo(b.dataset.gp), 150); });
}
VIEWS.offen = {
  nav: 'geplant',
  html() {
    const groups = openByPerson(); const total = groups.reduce((s, g) => s + g.left, 0);
    return `<div class="page">
      <header class="hero"><div class="grow"><div class="sub">Schuldet dir noch</div><h1>Lidl</h1></div>
        <div class="hero-actions"><button type="button" class="icon-btn glass primary" id="of-add" aria-label="Jemand schuldet mir etwas">${svg('plus')}</button></div></header>
      ${gpSegHTML('offen')}
      ${groups.length ? `<section class="card glass of-total"><span class="small">Insgesamt</span><span class="of-sum">${money(total, { force: true })}</span><span class="small">von ${groups.length} ${groups.length === 1 ? 'Person' : 'Personen'}</span></section>
      ${groups.map((g, gi) => `<section class="card glass pad-s of-person" style="--i:${gi}">
        <div class="of-head">${avatarOf(g.name)}<span class="grow"><span class="b block">${esc(g.name)}</span><span class="small">${g.plans.length} ${g.plans.length === 1 ? 'Eintrag' : 'Einträge'}</span></span>
          <span class="of-left">${money(g.left, { force: true })}</span></div>
        ${g.plans.map((p, i) => refundItemHTML(p, i)).join('')}
        <button type="button" class="btn of-get" data-ofget="${esc(g.key)}">${svg('check')}Geld bekommen</button>
      </section>`).join('')}`
    : `<section class="card glass">${emptyHTML('cart', 'Gerade schuldet dir niemand etwas aus dem Lidl.', '<button type="button" class="btn small-btn" id="of-add2">Eintragen, wer dir was schuldet</button>')}</section>`}
    </div>`;
  },
  mount() {
    bindGpSeg();
    $('#of-add').onclick = () => debtSheet(); if ($('#of-add2')) $('#of-add2').onclick = () => debtSheet();
    $$('[data-ofget]').forEach((b) => b.onclick = () => { const g = openByPerson().find((x) => x.key === b.dataset.ofget); if (g) receiveSheet(g.name, g.plans); });
    $$('[data-ofp]').forEach((b) => b.onclick = () => {
      const p = S.plans.find((x) => x.id === b.dataset.ofp); if (!p) return;
      const w = refundWhat(p);
      if (w.owner && S.tx.includes(w.owner)) go('neu/e' + w.owner.id);
      else if (w.owner) go('neu/p' + w.owner.id);
      else receiveSheet(p.payee || 'Ohne Namen', [p]);
    });
  }
};
/** Geld bekommen – auch Teilbeträge; älteste Einträge werden zuerst abgehakt */
function receiveSheet(name, plans) {
  const list = plans.slice(); const left = list.reduce((s, p) => s + refundLeft(p), 0);
  let acct = 'bar';
  openSheet('<div id="rc-body"></div>', (el) => {
    const draw = () => {
      $('#rc-body', el).innerHTML = `<div class="of-head">${avatarOf(name, 48)}<span class="grow"><h2 style="margin:0">Von ${esc(name)} bekommen</h2><span class="small">offen ${eur(left)}</span></span></div>
        <label class="field glass amt-field">${svg('coins')}<span class="sr">Betrag</span><input id="rc-amt" inputmode="decimal" value="${centsToInput(left)}" autocomplete="off" enterkeyhint="done"><span class="unit">€</span></label>
        <div class="chips">${[[left, 'Alles'], [Math.round(left / 2), 'Hälfte']].map(([v, l]) => `<button type="button" class="chip" data-rcv="${v}">${l} · ${eur(v)}</button>`).join('')}</div>
        ${segHTML([['bar', 'Bar'], ['online', 'Online']], acct, 'data-rca', 'aria-label="Bar oder online"')}
        <button type="button" class="btn" id="rc-ok">${svg('check')}Bekommen</button>`;
      $$('[data-rcv]', el).forEach((b) => b.onclick = () => { $('#rc-amt', el).value = centsToInput(+b.dataset.rcv); });
      $$('[data-rca]', el).forEach((b) => b.onclick = () => { segMove(b); acct = b.dataset.rca; });
      $('#rc-ok', el).onclick = () => {
        const amt = Math.min(left, parseEur($('#rc-amt', el).value));
        if (!(amt > 0)) { $('#rc-amt', el).focus(); return; }
        closeSheet();
        const r = $('#rc-ok', el).getBoundingClientRect(); burst(r.left + r.width / 2, r.top, ['var(--pos)', '#F2C14E', '#2F6FD6']); vibrate(20);
        commit(`${eur(amt)} von ${name} bekommen${amt < left ? ` · noch ${eur(left - amt)} offen` : ''}`, () => {
          let rest = amt;
          list.forEach((p0) => {
            const p = S.plans.find((x) => x.id === p0.id); if (!p || rest <= 0) return;
            const take = Math.min(rest, refundLeft(p)); if (take <= 0) return;
            S.tx.push({ id: uid(), kind: 'refund', amount: take, cat: p.cat, title: 'Rückzahlung', payee: p.payee || '', date: todayStr(), ts: Date.now(), acct, month: p.month || curMonth(), planId: p.id, planDue: null, planSnap: planSnap(p) });
            p.paid = (p.paid || 0) + take; rest -= take;
          });
          S.plans = S.plans.filter((p) => !(p.kind === 'refund' && refundLeft(p) <= 0));
        });
      };
    };
    draw();
  });
}
/** Jemand schuldet mir etwas, ohne Bon (z. B. etwas mitgebracht) */
function debtSheet() {
  const d = { who: '', amt: '', cat: S.cats.some((c) => c.id === 'c_lidl') ? 'c_lidl' : defaultCatOf('out'), title: '' };
  openSheet('<div id="db-body"></div>', (el) => {
    const draw = () => {
      $('#db-body', el).innerHTML = `<h2>Wer schuldet dir was?</h2>
        <label class="field glass">${svg('people')}<span class="sr">Name</span><input id="db-who" placeholder="Name" value="${esc(d.who)}" maxlength="30" autocomplete="off"></label>
        <div class="sugg" id="db-sugg"></div>
        <label class="field glass amt-field">${svg('coins')}<span class="sr">Betrag</span><input id="db-amt" inputmode="decimal" placeholder="Betrag" value="${esc(d.amt)}" autocomplete="off"><span class="unit">€</span></label>
        <label class="field glass">${svg('tag')}<span class="sr">Wofür</span><input id="db-title" placeholder="Wofür? (z. B. Pizzaschnecke)" value="${esc(d.title)}" maxlength="40" autocomplete="off"></label>
        <div class="hscroll no-swipe">${catsOf('out').map((c) => `<button type="button" class="cat-chip${c.id === d.cat ? ' on' : ''}" data-dbc="${c.id}" style="--c:${c.color}">${catIcon(c, 40)}<span>${esc(c.name)}</span></button>`).join('')}</div>
        <button type="button" class="btn" id="db-ok">${svg('check')}Eintragen</button>`;
      const who = $('#db-who', el); const box = $('#db-sugg', el);
      const fill = () => { box.innerHTML = suggHTML(nameSuggest(personPool(), who.value), 'data-dbp'); $$('[data-dbp]', box).forEach((c) => { c.onpointerdown = (e) => e.preventDefault(); c.onclick = () => { d.who = c.dataset.dbp; who.value = d.who; box.innerHTML = ''; }; }); };
      who.addEventListener('input', () => { d.who = who.value; fill(); }); fill();
      $('#db-amt', el).addEventListener('input', (e) => { d.amt = e.target.value; });
      $('#db-title', el).addEventListener('input', (e) => { d.title = e.target.value; });
      $$('[data-dbc]', el).forEach((b) => b.onclick = () => { d.cat = b.dataset.dbc; $$('[data-dbc]', el).forEach((x) => x.classList.toggle('on', x === b)); });
      $('#db-ok', el).onclick = () => {
        const amount = parseEur(d.amt); const name = d.who.trim();
        if (!name) { who.focus(); return; }
        if (!(amount > 0)) { $('#db-amt', el).focus(); return; }
        closeSheet();
        commit(`${name} schuldet dir ${eur(amount)}`, () => {
          S.plans.push({ id: uid(), kind: 'refund', amount, cat: d.cat, title: d.title.trim(), payee: name, date: null, repeat: 'none', acct: 'bar', month: curMonth(), auto: false });
          ensurePeople([name]);
        });
      };
    };
    draw();
  });
}

/* ================= Personen (Reihenfolge, Initialen, Farbe) ================= */
VIEWS.personen = {
  nav: null,
  html() {
    const left = (n) => openRefunds().filter((p) => (p.payee || '').trim().toLowerCase() === n.trim().toLowerCase()).reduce((s, p) => s + refundLeft(p), 0);
    return `<div class="page">
      <div class="topbar-row"><button type="button" class="icon-btn glass" id="back" aria-label="Zurück">${svg('back')}</button><h1 class="center">Personen</h1>
        <button type="button" class="icon-btn glass" id="pp-add" aria-label="Person hinzufügen">${svg('plus')}</button></div>
      ${S.people.length ? `<section class="card glass pad-s">${S.people.map((p, i) => { const l = left(p.name); return `<div class="row pers-row" style="--i:${i}">
        <button type="button" class="pers-main" data-pp="${p.id}">${avatarOf(p.name, 42)}<span class="grow"><span class="r-title ell">${esc(p.name)}</span><span class="r-sub">${l ? 'schuldet dir ' + eur(l) : 'nichts offen'}</span></span></button>
        <button type="button" class="icon-btn sm" data-ppu="${i}" aria-label="${esc(p.name)} nach oben" ${i === 0 ? 'disabled' : ''}>${svg('up')}</button>
        <button type="button" class="icon-btn sm" data-ppd="${i}" aria-label="${esc(p.name)} nach unten" ${i === S.people.length - 1 ? 'disabled' : ''}>${svg('down')}</button></div>`; }).join('')}</section>`
    : `<section class="card glass">${emptyHTML('people', 'Noch keine Personen.', '<button type="button" class="btn small-btn" id="pp-add2">Person hinzufügen</button>')}</section>`}
    </div>`;
  },
  mount() {
    $('#back').onclick = () => goBack();
    $('#pp-add').onclick = () => personEditSheet(); if ($('#pp-add2')) $('#pp-add2').onclick = () => personEditSheet();
    $$('[data-pp]').forEach((b) => b.onclick = () => personEditSheet(b.dataset.pp));
    const move = (i, d) => { const j = i + d; if (j < 0 || j >= S.people.length) return; vibrate(6); commit('', () => { const a = S.people; [a[i], a[j]] = [a[j], a[i]]; }, { undo: false }); };
    $$('[data-ppu]').forEach((b) => b.onclick = () => move(+b.dataset.ppu, -1));
    $$('[data-ppd]').forEach((b) => b.onclick = () => move(+b.dataset.ppd, 1));
  }
};
/** Person bearbeiten; ein neuer Name wird auch in offenen Rückzahlungen und Bons übernommen */
function personEditSheet(id) {
  const p = id ? S.people.find((x) => x.id === id) : null;
  const d = { name: p ? p.name : '', ini: p ? (p.ini || '') : '', color: p ? p.color : COLORS[S.people.length % COLORS.length] };
  openSheet('<div id="pe-body"></div>', (el) => {
    const draw = () => {
      const auto = initialsOf(d.name || '?');
      $('#pe-body', el).innerHTML = `<div class="cs-head"><span class="avatar" style="background:${d.color};width:58px;height:58px;font-size:${(d.ini || auto).length > 1 ? 20 : 24}px">${esc(d.ini || (d.name ? auto : '?'))}</span><div class="grow"><h2>${p ? 'Person bearbeiten' : 'Neue Person'}</h2></div></div>
        <label class="field glass">${svg('people')}<span class="sr">Name</span><input id="pe-name" placeholder="Name" value="${esc(d.name)}" maxlength="24" autocomplete="off"></label>
        <label class="field glass">${svg('tag')}<span class="sr">Initialen</span><input id="pe-ini" placeholder="Initialen (z. B. ${esc(d.name ? auto : 'LM')})" value="${esc(d.ini)}" maxlength="3" autocomplete="off"></label>
        <div class="swatches">${COLORS.map((c) => `<button type="button" class="swatch${c === d.color ? ' on' : ''}" data-pec="${c}" style="background:${c}" aria-label="Farbe ${c}"></button>`).join('')}</div>
        <button type="button" class="btn" id="pe-ok">${svg('check')}Speichern</button>
        ${p ? `<button type="button" class="btn danger" id="pe-del">${svg('trash')}Aus der Liste entfernen</button>` : ''}`;
      const keep = () => { d.name = $('#pe-name', el).value; d.ini = $('#pe-ini', el).value.toUpperCase(); };
      $$('[data-pec]', el).forEach((b) => b.onclick = () => { keep(); d.color = b.dataset.pec; draw(); });
      $('#pe-ini', el).addEventListener('input', (e) => { const a = $('.cs-head .avatar', el); if (a) a.textContent = e.target.value.toUpperCase() || initialsOf($('#pe-name', el).value || '?'); });
      $('#pe-ok', el).onclick = () => {
        keep(); const name = d.name.trim();
        if (!name) { $('#pe-name', el).focus(); return; }
        const other = personByName(name);
        if (other && other !== p) { toast(name + ' gibt es schon'); return; }
        closeSheet();
        commit(p ? 'Gespeichert' : name + ' hinzugefügt', () => {
          if (p) {
            const old = p.name.trim().toLowerCase();
            if (old !== name.toLowerCase()) renamePerson(old, name);
            Object.assign(p, { name, ini: d.ini.trim().slice(0, 3), color: d.color });
            if (!p.ini) delete p.ini;
          } else {
            const np = { id: uid(), name, color: d.color }; if (d.ini.trim()) np.ini = d.ini.trim().slice(0, 3);
            S.people.push(np);
          }
        });
      };
      if (p) $('#pe-del', el).onclick = () => { closeSheet(); commit(p.name + ' entfernt', () => { S.people = S.people.filter((x) => x !== p); }); };
    };
    draw();
    if (!p) setTimeout(() => { const i = $('#pe-name', el); if (i) i.focus(); }, 80);
  });
}
function renamePerson(oldLower, name) {
  const is = (n) => String(n || '').trim().toLowerCase() === oldLower;
  S.plans.forEach((p) => { if (p.kind === 'refund' && is(p.payee)) p.payee = name; });
  S.tx.forEach((t) => { if (t.kind === 'refund' && is(t.payee)) t.payee = name; });
  S.tx.concat(S.plans).forEach((o) => {
    (o.backs || []).forEach((b) => { if (is(b.who)) b.who = name; });
    (o.lines || []).forEach((l) => (l.shares || []).forEach((x) => { if (is(x.who)) x.who = name; }));
  });
}
