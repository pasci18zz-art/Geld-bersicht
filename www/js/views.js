/* Geld – Hauptseiten */
'use strict';

/* ================= Start ================= */
let homePeriod = 'm';
function demoBanner() {
  return S.demo ? `<section class="card glass demo" aria-label="Beispieldaten">
    <span class="demo-ic">${svg('sparkle')}</span>
    <div class="grow"><div class="b">Das sind Beispieldaten</div><div class="small">So sieht die App gefüllt aus. Wenn du bereit bist, fängst du leer an.</div></div>
    <button type="button" class="chip" id="demo-clear">Leeren</button></section>` : '';
}
function balanceCardHTML() {
  const bal = balance();
  const r = rangeOf(keyFor('m'));
  const st = stats(r.from, r.to);
  if (bal === null) {
    return `<button type="button" class="card glass balance setup" id="bal-setup">
      <span class="cat-ic" style="--c:var(--accent);width:46px;height:46px">${svg('bank')}</span>
      <span class="grow" style="text-align:left"><span class="b" style="display:block">Kontostand einrichten</span><span class="small">Einmal den echten Kontostand eintragen – danach rechnet die App selbst weiter.</span></span>${svg('next')}</button>`;
  }
  const hid = hiddenNow();
  const res = st.income - st.net;
  return `<section class="card glass balance${hid ? ' locked' : ' open'}" id="bal" role="button" tabindex="0" aria-label="${hid ? 'Kontostand anzeigen' : 'Kontostand ' + eur(bal)}">
    <div class="bal-amount${bal < 0 ? ' neg' : ''}">${hid ? '<span class="bal-mask">•••,••&nbsp;€</span>' : `<span data-count="${bal}">${eur(bal)}</span>`}</div>
    <div class="bal-split">${['online', 'bar'].map((a) => { const v = balanceOf(a); const unset = a === 'online' && S.settings.startBalance == null; return `<div class="bal-part">
      <span class="bp-ic">${svg(a === 'bar' ? 'banknote' : 'bank')}</span>
      <span class="bp-txt"><span class="small">${a === 'bar' ? 'Bar' : 'Konto (online)'}</span>${unset ? `<button type="button" class="link bp-set" data-setbal="${a}">Einrichten</button>` : `<span class="b${v < 0 ? ' neg' : ''}">${money(v || 0, { force: true })}</span>`}</span></div>`; }).join('')}</div>
    <div class="bal-row">
      <span class="mini pos">${svg('arrowIn')}${money(st.income, { sign: '+' })}</span>
      <span class="mini neg">${svg('arrowOut')}${money(st.net, { sign: '-' })}</span>
      <span class="mini strong ${res >= 0 ? 'pos' : 'neg'}">${res >= 0 ? 'Plus' : 'Minus'} ${money(res, { sign: res >= 0 ? '+' : '-' })}</span>
    </div>
  </section>`;
}
function homeChartHTML() {
  const key = keyFor(homePeriod); const r = rangeOf(key); const st = stats(r.from, r.to);
  const items = st.outList.filter((x) => x.net > 0).map((x) => ({ cat: x.cat, value: x.net }));
  return `<section class="card glass chart-card" id="chart-card">
    <div class="between"><h2 class="h2">Ausgaben</h2>${segHTML([['w', 'Woche'], ['m', 'Monat'], ['y', 'Jahr']], homePeriod, 'data-hp', 'aria-label="Zeitraum"')}</div>
    <div class="donut-btn" id="open-details" role="button" tabindex="0" aria-label="Alle Details ansehen">
      ${donutHTML(items, { size: 236, label: '', valueHTML: money(st.net), sub: st.refund ? money(st.refund, { sign: '-' }) + ' zurück' : '', emptyText: 'Noch keine Ausgaben', aria: 'Ausgaben nach Kategorie' })}
    </div>
    ${items.length ? `<div class="legend">${items.slice(0, 6).map((x, i) => `<button type="button" class="leg" data-cat="${x.cat.id}" style="--i:${i}">${catIcon(x.cat, 32)}<span class="leg-txt"><span class="ell">${esc(x.cat.name)}</span>${money(x.value)}</span></button>`).join('')}</div>` : ''}
    <button type="button" class="link more" id="more-details">Alles ansehen ${svg('next')}</button>
  </section>`;
}
function bindHomeChart() {
  $$('[data-hp]').forEach((b) => b.onclick = () => {
    if (b.dataset.hp === homePeriod) return;
    segMove(b); homePeriod = b.dataset.hp;
    setTimeout(() => {
      const card = $('#chart-card'); if (!card) return;
      card.outerHTML = homeChartHTML();
      const nc = $('#chart-card'); nc.classList.add('swap');
      bindHomeChart(); animateDonuts(nc);
      if (homeSort !== 'new') { $('#home-tx').innerHTML = homeTxHTML(); bindTxRows($('#home-tx')); }
    }, 160);
  });
  const open = () => go('details/' + keyFor(homePeriod));
  // Mitte → große Übersicht, ein Stück oder Symbol → Buchungen dieser Kategorie im Zeitraum
  $('#open-details').onclick = (e) => { const s = e.target.closest('[data-dcat]'); if (s) { vibrate(8); go('kat/' + s.getAttribute('data-dcat') + '/' + keyFor(homePeriod)); } else open(); };
  $('#open-details').onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
  $('#more-details').onclick = open;
  $$('.leg[data-cat]').forEach((b) => b.onclick = () => go('kat/' + b.dataset.cat + '/' + keyFor(homePeriod)));
}
/** Letzte Buchungen – oder die größten Ausgaben/Einnahmen im gewählten Zeitraum */
let homeSort = 'new';
function homeTxHTML() {
  let list;
  if (homeSort === 'new') list = S.tx.slice().sort((a, b) => b.date.localeCompare(a.date) || (b.ts || 0) - (a.ts || 0) || b.id.localeCompare(a.id));
  else {
    const r = rangeOf(keyFor(homePeriod));
    list = S.tx.filter((t) => t.kind === homeSort && t.date >= r.from && t.date <= r.to).sort((a, b) => b.amount - a.amount);
  }
  list = list.slice(0, 3);
  return list.length ? list.map((t, i) => txRow(t, i)).join('') : emptyHTML('list', homeSort === 'new' ? 'Noch keine Buchungen.<br>Tippe unten auf ＋' : 'In diesem Zeitraum nichts.');
}
function goalRowHTML(g, i) {
  const p = g.target ? clamp(Math.round(g.saved / g.target * 100), 0, 100) : 0;
  return `<button type="button" class="row goal-row" data-goal="${g.id}" style="--i:${i}">${catIcon(g, 44)}
    <span class="grow"><span class="between"><span class="r-title ell">${esc(g.name)}</span><span class="small b">${p} %</span></span>
    <span class="bar"><i style="width:${p}%;background:${g.color}"></i></span>
    <span class="r-sub">${money(g.saved)} von ${money(g.target)}${goalEta(g)}</span></span></button>`;
}
function backupDue() {
  const n = S.settings.backupEvery; if (!n || S.demo) return false;
  const last = S.settings.lastBackup;
  return S.tx.length > 5 && (!last || Date.now() - last > n * 864e5);
}
VIEWS.start = {
  nav: 'start',
  html() {
    const d = new Date(); const h = d.getHours();
    const greet = h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend';
    const upcoming = S.plans.filter((p) => p.date && daysBetween(todayStr(), p.date) <= 14).sort(planOrder).slice(0, 2);
    const hid = hiddenNow();
    return `<div class="page">
      <header class="hero">
        <div class="grow"><div class="sub">${WD_L[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}</div><h1>${greet}</h1></div>
        <div class="hero-actions">
          <button type="button" class="icon-btn glass" id="eye" aria-label="${hid ? 'Beträge anzeigen' : 'Beträge verstecken'}">${svg(hid ? 'eyeOff' : 'eye')}</button>
          <button type="button" class="icon-btn glass" id="to-settings" aria-label="Einstellungen">${svg('gear')}</button>
        </div>
      </header>
      ${demoBanner()}
      ${backupDue() ? `<button type="button" class="card glass demo" id="backup-hint"><span class="demo-ic">${svg('download')}</span><span class="grow" style="text-align:left"><span class="b" style="display:block">Zeit für ein Backup</span><span class="small">${S.settings.lastBackup ? 'Letztes vor ' + Math.floor((Date.now() - S.settings.lastBackup) / 864e5) + ' Tagen' : 'Noch nie gesichert'} – tippen zum Speichern</span></span></button>` : ''}
      ${balanceCardHTML()}
      ${homeChartHTML()}
      ${upcoming.length ? `<section class="card glass pad-s">
        <h2 class="h2">Als Nächstes <button type="button" class="link" id="to-plans">Geplant ${svg('next')}</button></h2>
        ${upcoming.map((p, i) => planRowHTML(p, i, true)).join('')}</section>` : ''}
      ${S.goals.length ? `<section class="card glass pad-s">
        <h2 class="h2">Sparziele <button type="button" class="link" id="to-goals">Alle ${svg('next')}</button></h2>
        ${S.goals.slice(0, 2).map((g, i) => goalRowHTML(g, i)).join('')}</section>` : ''}
      <section class="card glass pad-s">
        <h2 class="h2">Buchungen <button type="button" class="link" id="to-tx">Alle ${svg('next')}</button></h2>
        ${segHTML([['new', 'Neueste'], ['out', 'Top Ausgaben'], ['in', 'Top Einnahmen']], homeSort, 'data-hs', 'aria-label="Sortierung"')}
        <div id="home-tx" style="margin-top:6px">${homeTxHTML()}</div>
      </section>
    </div>`;
  },
  mount() {
    const bal = $('#bal');
    if (bal) {
      bal.onclick = () => { if (hiddenNow()) requestReveal(); else hideAll(); };
      bal.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bal.click(); } };
    }
    if ($('#bal-setup')) $('#bal-setup').onclick = () => balanceSheet();
    $$('[data-setbal]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); balanceSheet(); }));
    $('#eye').onclick = () => { if (hiddenNow()) requestReveal(); else hideAll(); };
    $('#to-settings').onclick = () => go('einstellungen');
    $('#to-tx').onclick = () => tabTo('buchungen');
    if ($('#to-plans')) $('#to-plans').onclick = () => tabTo('geplant');
    if ($('#to-goals')) $('#to-goals').onclick = () => { goalsJump = true; tabTo('auswertung'); };
    if ($('#backup-hint')) $('#backup-hint').onclick = () => exportBackup();
    if ($('#demo-clear')) $('#demo-clear').onclick = () => clearDemo();
    $$('[data-hs]').forEach((b) => b.onclick = () => {
      if (b.dataset.hs === homeSort) return;
      segMove(b); homeSort = b.dataset.hs;
      setTimeout(() => { const c = $('#home-tx'); c.innerHTML = homeTxHTML(); c.classList.remove('swap'); void c.offsetWidth; c.classList.add('swap'); bindTxRows(c); }, 120);
    });
    $$('[data-goal]').forEach((b) => b.onclick = () => goalSheet(b.dataset.goal));
    bindHomeChart();
    bindPlanRows();
    bindTxRows($('#view'));
  }
};
/* Verstecken / Anzeigen (Aufdecken in der App mit Fingerabdruck) */
let bioBusy = false; let bioEnd = 0;
/** Fingerabdruck (oder mit pin=true / ohne Fingerabdruck: Handy-PIN). Ohne Sperre am Handy → nie aussperren. */
async function bioAuth(reason, pin) {
  const B = isNative() ? plugin('NativeBiometric') : null;
  if (!B) return true;
  bioBusy = true;
  try {
    const a = await B.isAvailable({ useFallback: true }).catch(() => null);
    if (!a || !a.isAvailable) return true;
    const usePin = pin || !a.biometryType || a.biometryType === 7;
    const o = { reason, title: 'Geld', subtitle: reason, maxAttempts: 5 };
    if (usePin) o.allowedBiometryTypes = [7]; else o.negativeButtonText = 'Abbrechen';
    await B.verifyIdentity(o);
    return true;
  } catch (e) { return false; } finally { bioBusy = false; bioEnd = Date.now(); }
}
function requestReveal() {
  if (S.settings.revealBio !== false && isNative()) bioAuth('Beträge anzeigen').then((ok) => { if (ok) revealAll(); });
  else revealAll();
}
function revealAll() {
  revealed = true; manualHide = false;
  render(false);
  const el = $('#bal [data-count]');
  if (el) countUp(el, +el.dataset.count, 800);
}
function hideAll() { revealed = false; manualHide = true; render(false); }
document.addEventListener('click', (e) => {
  const t = e.target.closest && e.target.closest('[data-reveal]');
  // Versteckter Betrag in einem Knopf (Diagramm, Zeile): der Knopf macht seine normale Aktion
  if (t && !t.parentElement.closest('button, a, [role="button"]')) { e.preventDefault(); e.stopPropagation(); requestReveal(); }
}, true);

/* ================= Buchungen ================= */
let bKey = keyFor('m'); let bFilter = 'all'; let bQuery = ''; let bSort = 'new';
const SORT_L = { new: 'Neueste', big: 'Größte', small: 'Kleinste' };
function txListHTML() {
  const q = bQuery.trim().toLowerCase(); const r = rangeOf(bKey);
  const list = S.tx.filter((t) => t.date >= r.from && t.date <= r.to && (bFilter === 'all' || t.kind === bFilter))
    .filter((t) => !q || [t.title, t.payee, catById(t.cat).name, centsToInput(t.amount)].join(' ').toLowerCase().includes(q));
  if (!list.length) return `<section class="card glass">${emptyHTML('search', q ? 'Nichts gefunden.' : 'Keine Buchungen in diesem Zeitraum.')}</section>`;
  if (bSort !== 'new') {
    list.sort((a, b) => (bSort === 'big' ? b.amount - a.amount : a.amount - b.amount) || b.date.localeCompare(a.date));
    return `<section class="card glass pad-s">${list.map((t, i) => txRow(t, i)).join('')}</section>`;
  }
  list.sort((a, b) => b.date.localeCompare(a.date) || (b.ts || 0) - (a.ts || 0) || b.id.localeCompare(a.id));
  const groups = [];
  list.forEach((t) => { const g = groups[groups.length - 1]; if (g && g.date === t.date) g.items.push(t); else groups.push({ date: t.date, items: [t] }); });
  let i = 0;
  return groups.map((g) => {
    const net = g.items.reduce((s, t) => s + (t.kind === 'transfer' ? 0 : t.kind === 'out' ? -t.amount : t.amount), 0);
    return `<section class="card glass pad-s day-card"><h2 class="h2 day-h">${dateLabel(g.date)}<span class="small b ${net >= 0 ? 'pos' : 'neg'}">${money(net, { sign: net >= 0 ? '+' : '-' })}</span></h2>${g.items.map((t) => txRow(t, i++)).join('')}</section>`;
  }).join('');
}
function refreshTxList() { const c = $('#tx-list'); c.innerHTML = txListHTML(); c.classList.remove('swap'); void c.offsetWidth; c.classList.add('swap'); bindTxRows(c); }
VIEWS.buchungen = {
  nav: 'buchungen',
  html() {
    const r = rangeOf(bKey); const st = stats(r.from, r.to);
    const isCur = bKey >= keyFor(bKey[0]);
    return `<div class="page">
      <header class="hero"><div class="grow"><div class="sub">Einnahmen & Ausgaben</div><h1>Buchungen</h1></div>
        <div class="hero-actions"><button type="button" class="icon-btn glass" id="b-import" aria-label="Kontoauszug importieren">${svg('bank')}</button></div></header>
      ${segHTML([['w', 'Woche'], ['m', 'Monat'], ['y', 'Jahr']], bKey[0], 'data-bp', 'aria-label="Zeitraum"')}
      <div class="month-nav">
        <button type="button" class="icon-btn sm" id="b-prev" aria-label="Zurück">${svg('back')}</button>
        <span class="b">${r.label || r.name}</span>
        <button type="button" class="icon-btn sm" id="b-next" aria-label="Weiter" ${isCur ? 'disabled' : ''}>${svg('next')}</button>
      </div>
      <section class="card glass stat3">
        <div><span class="small">Einnahmen</span><span class="pos b">${money(st.income, { sign: '+' })}</span></div>
        <div><span class="small">Ausgaben</span><span class="neg b">${money(st.gross, { sign: '-' })}</span></div>
        <div><span class="small">Zurück</span><span class="pos b">${money(st.refund, { sign: '+' })}</span></div>
      </section>
      ${segHTML([['all', 'Alle'], ['out', 'Ausgaben'], ['in', 'Einnahmen'], ['refund', 'Zurück']], bFilter, 'data-bf', 'aria-label="Filter"')}
      <div class="sort-row">
        <label class="field glass search"><span class="sr">Suchen</span>${svg('search')}<input id="b-q" type="search" placeholder="Suchen …" value="${esc(bQuery)}" autocomplete="off"></label>
        <button type="button" class="sort-btn glass" id="b-sort" aria-label="Sortierung ändern">${svg('sort')}<span>${SORT_L[bSort]}</span></button>
      </div>
      <div id="tx-list" class="stack">${txListHTML()}</div>
    </div>`;
  },
  mount() {
    $('#b-prev').onclick = () => { bKey = shiftKey(bKey, -1); render(false); };
    $('#b-next').onclick = () => { if (bKey < keyFor(bKey[0])) { bKey = shiftKey(bKey, 1); render(false); } };
    $('#b-import').onclick = () => go('import');
    $$('[data-bp]').forEach((b) => b.onclick = () => { if (b.dataset.bp === bKey[0]) return; segMove(b); setTimeout(() => { bKey = keyFor(b.dataset.bp); render(false); }, 160); });
    $$('[data-bf]').forEach((b) => b.onclick = () => { segMove(b); bFilter = b.dataset.bf; setTimeout(refreshTxList, 120); });
    $('#b-sort').onclick = () => {
      bSort = { new: 'big', big: 'small', small: 'new' }[bSort];
      $('#b-sort span').textContent = SORT_L[bSort];
      vibrate(8); refreshTxList();
    };
    $('#b-q').addEventListener('input', (e) => { bQuery = e.target.value; $('#tx-list').innerHTML = txListHTML(); bindTxRows($('#tx-list')); });
    bindTxRows($('#view'));
  }
};

/* ================= Details (großes Diagramm) ================= */
VIEWS.details = {
  nav: null,
  title: () => 'Übersicht',
  html(arg) {
    const [key, mode = 'out'] = arg.split('~');
    const r = rangeOf(key); const st = stats(r.from, r.to);
    const isIn = mode === 'in';
    const list = isIn ? st.inList : st.outList.filter((x) => x.gross > 0 || x.refund > 0);
    const items = list.filter((x) => x.net > 0).map((x) => ({ cat: x.cat, value: x.net }));
    const total = isIn ? st.income : st.net;
    const maxNet = Math.max(1, ...list.map((x) => Math.max(0, x.net)));
    const nextDisabled = shiftKey(key, 1) > keyFor(key[0]);
    return `<div class="page">
      <div class="topbar-row"><button type="button" class="icon-btn glass" id="back" aria-label="Zurück">${svg('back')}</button><h1 class="center">${isIn ? 'Einnahmen' : 'Ausgaben'}</h1><span class="spacer"></span></div>
      ${segHTML([['w', 'Woche'], ['m', 'Monat'], ['y', 'Jahr']], key[0], 'data-dt')}
      <div class="month-nav">
        <button type="button" class="icon-btn sm" id="d-prev" aria-label="Früher">${svg('back')}</button>
        <span class="b">${esc(r.label)}</span>
        <button type="button" class="icon-btn sm" id="d-next" aria-label="Später" ${nextDisabled ? 'disabled' : ''}>${svg('next')}</button>
      </div>
      <section class="card glass big-chart">
        ${donutHTML(items, { size: 268, stroke: 28, label: isIn ? 'Einnahmen' : 'Netto', valueHTML: money(total), sub: !isIn && st.refund ? money(st.gross) + ' − ' + money(st.refund) + ' zurück' : '', emptyText: isIn ? 'Keine Einnahmen' : 'Keine Ausgaben' })}
        ${segHTML([['out', 'Ausgaben'], ['in', 'Einnahmen']], mode, 'data-dm')}
      </section>
      <section class="card glass pad-s">
        ${list.length ? list.map((x, i) => {
    const c = x.cat; const budget = !isIn && key[0] === 'm' && c.budget ? c.budget : 0;
    const share = total > 0 ? Math.round(Math.max(0, x.net) / total * 100) : 0;
    return `<button type="button" class="row cat-row" data-cat="${c.id}" style="--i:${i}">
            ${catIcon(c, 44)}
            <span class="grow">
              <span class="between"><span class="r-title ell">${esc(c.name)}</span><span class="b">${money(x.net)}</span></span>
              <span class="bar"><i style="width:${budget ? clamp(Math.round(x.net / budget * 100), 0, 100) : Math.round(Math.max(0, x.net) / maxNet * 100)}%;background:${budget && x.net > budget ? 'var(--neg)' : c.color}"></i></span>
              <span class="r-sub">${isIn ? share + ' %' : (x.refund ? `${money(x.gross)} bezahlt · ${money(x.refund)} zurück` : share + ' % deiner Ausgaben')}${budget ? ` · Budget ${money(budget)}` : ''}</span>
            </span></button>`;
  }).join('') : emptyHTML('chart', 'In diesem Zeitraum gibt es nichts.')}
      </section>
    </div>`;
  },
  mount(arg) {
    const [key, mode = 'out'] = arg.split('~');
    const to = (k, m) => replaceTo('details/' + k + (m === 'in' ? '~in' : ''), 'fade');
    $('#back').onclick = () => goBack();
    $('#d-prev').onclick = () => to(shiftKey(key, -1), mode);
    $('#d-next').onclick = () => { const k = shiftKey(key, 1); if (k <= keyFor(key[0])) to(k, mode); };
    $$('[data-dt]').forEach((b) => b.onclick = () => { segMove(b); setTimeout(() => to(keyFor(b.dataset.dt, rangeOf(key).from), mode), 140); });
    $$('[data-dm]').forEach((b) => b.onclick = () => { segMove(b); setTimeout(() => to(key, b.dataset.dm), 140); });
    $$('.cat-row[data-cat]').forEach((b) => b.onclick = () => go('kat/' + b.dataset.cat + '/' + key));
  }
};

/* ================= Kategorie im Zeitraum ================= */
VIEWS.kat = {
  nav: null,
  html(arg) {
    const [catId, key] = arg.split('/');
    const c = catById(catId); const r = rangeOf(key || keyFor('m'));
    const list = S.tx.filter((t) => t.cat === catId).filter((t) => { const d = effDate(t); return d >= r.from && d <= r.to; })
      .sort((a, b) => b.date.localeCompare(a.date) || (b.ts || 0) - (a.ts || 0));
    const gross = list.filter((t) => t.kind !== 'refund').reduce((s, t) => s + t.amount, 0);
    const back = list.filter((t) => t.kind === 'refund').reduce((s, t) => s + t.amount, 0);
    const budget = c.kind === 'out' && r.type === 'm' ? c.budget : 0;
    const openBacks = S.plans.filter((p) => p.kind === 'refund' && p.cat === catId && refundLeft(p) > 0);
    return `<div class="page">
      <div class="topbar-row"><button type="button" class="icon-btn glass" id="back" aria-label="Zurück">${svg('back')}</button><span class="grow"></span>
        <button type="button" class="icon-btn glass" id="k-edit" aria-label="Kategorie bearbeiten">${svg('edit')}</button></div>
      <section class="card glass kat-hero" style="--c:${c.color}">
        ${catIcon(c, 64)}
        <h1>${esc(c.name)}</h1>
        <div class="small">${esc(r.label)}</div>
        <div class="kat-total">${money(gross - back)}</div>
        ${c.kind === 'out' ? `<div class="stat3 inner">
          <div><span class="small">Bezahlt</span><span class="b">${money(gross)}</span></div>
          <div><span class="small">Zurück</span><span class="b pos">${money(back)}</span></div>
          <div><span class="small">Budget</span><span class="b">${budget ? money(budget) : '–'}</span></div></div>` : ''}
        ${budget ? `<div class="bar big"><i style="width:${clamp(Math.round((gross - back) / budget * 100), 0, 100)}%;background:${gross - back > budget ? 'var(--neg)' : c.color}"></i></div>` : ''}
      </section>
      ${openBacks.length ? `<section class="card glass pad-s"><h2 class="h2">Kommt noch zurück</h2>${openBacks.map((p, i) => refundItemHTML(p, i)).join('')}</section>` : ''}
      <section class="card glass pad-s">${list.length ? list.map((t, i) => txRow(t, i)).join('') : emptyHTML(c.icon, 'Hier ist noch nichts.')}</section>
    </div>`;
  },
  mount(arg) {
    const [catId] = arg.split('/');
    $('#back').onclick = () => goBack();
    $('#k-edit').onclick = () => catSheet(catId);
    $$('[data-ofp]').forEach((b) => b.onclick = () => { const p = S.plans.find((x) => x.id === b.dataset.ofp); if (p) receiveSheet(p.payee || 'Ohne Namen', [p]); });
    bindTxRows($('#view'));
  }
};

/* ================= Auswertung (Jahr) ================= */
let aYear = +todayStr().slice(0, 4); let goalsJump = false;
VIEWS.auswertung = {
  nav: 'auswertung',
  html() {
    const y = String(aYear);
    const months = []; let maxV = 0;
    for (let i = 1; i <= 12; i++) {
      const m = `${y}-${pad(i)}`; const r = rangeOf('m' + m); const st = stats(r.from, r.to);
      months.push({ key: m, in: st.income, out: st.net, label: monthName(m), cur: m === curMonth() });
      maxV = Math.max(maxV, st.income, st.net);
    }
    const yr = rangeOf('y' + y); const ys = stats(yr.from, yr.to);
    const result = ys.income - ys.net;
    const items = ys.outList.filter((x) => x.net > 0).map((x) => ({ cat: x.cat, value: x.net }));
    const cm = rangeOf(keyFor('m')); const cs = stats(cm.from, cm.to);
    const budgets = catsOf('out').filter((c) => c.budget > 0).map((c) => ({ c, used: Math.max(0, ((cs.outList.find((x) => x.cat.id === c.id) || {}).net) || 0) }));
    const isCurYear = y === todayStr().slice(0, 4);
    return `<div class="page">
      <header class="hero"><div class="grow"><div class="sub">Dein Jahr in Zahlen</div><h1>Auswertung</h1></div></header>
      <div class="month-nav">
        <button type="button" class="icon-btn sm" id="y-prev" aria-label="Voriges Jahr">${svg('back')}</button>
        <span class="b">${y}</span>
        <button type="button" class="icon-btn sm" id="y-next" aria-label="Nächstes Jahr" ${isCurYear ? 'disabled' : ''}>${svg('next')}</button>
      </div>
      <section class="card glass stat3">
        <div><span class="small">Einnahmen</span><span class="pos b">${money(ys.income, { sign: '+' })}</span></div>
        <div><span class="small">Ausgaben</span><span class="neg b">${money(ys.net, { sign: '-' })}</span></div>
        <div><span class="small">${result >= 0 ? 'Gespart' : 'Mehr ausgegeben'}</span><span class="b ${result >= 0 ? 'pos' : 'neg'}">${money(result, { sign: result >= 0 ? '+' : '-' })}</span></div>
      </section>
      <section class="card glass pad">
        <h2 class="h2">Monate <span class="legend-mini"><i class="dot-in"></i>Einnahmen <i class="dot-out"></i>Ausgaben</span></h2>
        ${barsHTML(months, maxV)}
      </section>
      <section class="card glass pad year-donut">
        <h2 class="h2">Ausgaben ${y} <button type="button" class="link" id="y-details">Details ${svg('next')}</button></h2>
        <button type="button" class="donut-btn" id="y-open">${donutHTML(items, { size: 220, label: 'Netto', valueHTML: money(ys.net), sub: ys.refund ? money(ys.refund, { sign: '-' }) + ' zurück' : '', emptyText: 'Noch keine Ausgaben' })}</button>
      </section>
      <section class="card glass pad-s">
        <h2 class="h2">Einnahmen ${y} <button type="button" class="link" id="y-in">Details ${svg('next')}</button></h2>
        ${ys.inList.length ? ys.inList.map((x, i) => `<button type="button" class="row cat-row" data-icat="${x.cat.id}" style="--i:${i}">${catIcon(x.cat, 42)}<span class="grow"><span class="between"><span class="r-title ell">${esc(x.cat.name)}</span><span class="b pos">${money(x.net, { sign: '+' })}</span></span>
          <span class="bar"><i style="width:${Math.round(x.net / Math.max(1, ys.inList[0].net) * 100)}%;background:${x.cat.color}"></i></span></span></button>`).join('') : emptyHTML('coins', 'Noch keine Einnahmen in diesem Jahr.')}
      </section>
      <section class="card glass pad-s" id="goals">
        <h2 class="h2">Sparziele <button type="button" class="link" id="g-add">${svg('plus')}Neu</button></h2>
        ${S.goals.length ? S.goals.map((g, i) => goalRowHTML(g, i)).join('') : emptyHTML('flag', 'Spar auf etwas hin – z. B. Führerschein oder ein neues Handy.', '<button type="button" class="btn small-btn" id="g-add2">Sparziel anlegen</button>')}
      </section>
      <section class="card glass pad-s">
        <h2 class="h2">Budgets ·${MONTHS[+curMonth().slice(5) - 1]} <button type="button" class="link" id="y-budgets">Ändern ${svg('next')}</button></h2>
        ${budgets.length ? budgets.map((b, i) => {
    const p = Math.round(b.used / b.c.budget * 100); const over = b.used > b.c.budget;
    return `<div class="row budget-row" style="--i:${i}">${catIcon(b.c, 40)}<span class="grow">
            <span class="between"><span class="r-title">${esc(b.c.name)}</span><span class="small b ${over ? 'neg' : ''}">${money(b.used)} von ${money(b.c.budget)}</span></span>
            <span class="bar"><i style="width:${clamp(p, 0, 100)}%;background:${over ? 'var(--neg)' : b.c.color}"></i></span>
            <span class="r-sub ${over ? 'neg' : ''}">${over ? money(b.used - b.c.budget) + ' drüber' : 'noch ' + money(b.c.budget - b.used) + ' frei'}</span></span></div>`;
  }).join('') : emptyHTML('target', 'Noch keine Budgets. Lege fest, wie viel du pro Monat für eine Kategorie ausgeben willst.', '<button type="button" class="btn small-btn" id="y-budgets2">Budget festlegen</button>')}
      </section>
    </div>`;
  },
  mount() {
    $('#y-prev').onclick = () => { aYear--; render(true); };
    $('#y-next').onclick = () => { if (String(aYear) < todayStr().slice(0, 4)) { aYear++; render(true); } };
    const yk = 'y' + aYear;
    $('#y-details').onclick = () => go('details/' + yk);
    $('#y-open').onclick = () => go('details/' + yk);
    $('#y-in').onclick = () => go('details/' + yk + '~in');
    $$('[data-icat]').forEach((b) => b.onclick = () => go('kat/' + b.dataset.icat + '/' + yk));
    $$('.bar-col').forEach((b) => b.onclick = () => go('details/m' + b.dataset.month));
    const tb = () => go('kategorien/out');
    $('#y-budgets').onclick = tb; if ($('#y-budgets2')) $('#y-budgets2').onclick = tb;
    $('#g-add').onclick = () => goalSheet(); if ($('#g-add2')) $('#g-add2').onclick = () => goalSheet();
    $$('[data-goal]').forEach((b) => b.onclick = () => goalSheet(b.dataset.goal));
    if (goalsJump) { goalsJump = false; const g = $('#goals'); if (g) setTimeout(() => g.scrollIntoView({ behavior: motionOn() ? 'smooth' : 'auto', block: 'start' }), 260); }
  }
};

/* ================= Geplant ================= */
function planRowHTML(p, i, compact) {
  const c = catById(p.cat); const isIn = p.kind !== 'out';
  const n = p.date ? daysBetween(todayStr(), p.date) : 0;
  return `<div class="plan${compact ? ' compact' : ' card glass'}${n < 0 ? ' late' : ''}" data-plan="${p.id}" style="--i:${i}">
    ${catIcon(c, 42)}
    <div class="grow">
      <div class="r-title ell">${p.kind === 'refund' ? (p.payee ? esc(p.payee) : 'Rückzahlung') : esc(p.title || c.name)}</div>
      <div class="r-sub">${p.kind === 'refund' ? `${svg('undo')} ${esc(c.name)} · ` : p.payee ? (isIn ? 'von ' : 'an ') + esc(p.payee) + ' · ' : ''}<span class="due">${dueLabel(p.date)}</span>${p.repeat === 'monthly' ? ` · <span class="tag-mini">${svg('repeat')}monatlich</span>` : ''}</div>
    </div>
    <div class="plan-side">
      <span class="r-amt ${isIn ? 'pos' : 'neg'}">${money(p.kind === 'refund' ? refundLeft(p) : p.amount, { sign: isIn ? '+' : '-' })}</span>
      <div class="plan-btns">
        ${compact ? '' : `<button type="button" class="pbtn more" data-pmore="${p.id}" aria-label="Mehr">${svg('dots')}</button>`}
        <button type="button" class="pbtn ok" data-pok="${p.id}" aria-label="${esc(p.title || c.name)} bestätigen">${svg('check')}<span>${isIn ? 'Erhalten' : 'Bezahlt'}</span></button>
      </div>
    </div>
  </div>`;
}
/** Geplante Buchung jetzt buchen (innerhalb von commit aufrufen) */
function bookPlan(p) {
  const t = { id: uid(), kind: p.kind, amount: p.kind === 'refund' ? refundLeft(p) : p.amount, cat: p.cat, title: p.title || (p.kind === 'refund' ? 'Rückzahlung' : ''), payee: p.payee || '', date: todayStr(), ts: Date.now(), planId: p.id, acct: p.acct || (p.kind === 'refund' ? 'bar' : 'online'), planDue: p.date || null, planSnap: planSnap(p) };
  if (p.kind === 'refund') t.month = p.month || curMonth();
  if (p.lines) t.lines = p.lines;
  if (p.backs) { t.backs = p.backs; S.plans.forEach((x) => { if (x.fromId === p.id) x.fromId = t.id; }); }
  S.tx.push(t);
  if (p.repeat === 'monthly') { p.date = nextMonthDate(p.date); while (p.date <= todayStr()) p.date = nextMonthDate(p.date); }
  else S.plans = S.plans.filter((x) => x.id !== p.id);
}
function confirmPlan(id, btn) {
  const p = S.plans.find((x) => x.id === id); if (!p) return;
  const card = btn.closest('[data-plan]');
  const r = btn.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, p.kind !== 'out' ? ['var(--pos)', '#F2C14E', '#2F6FD6'] : undefined);
  vibrate(20);
  if (card) card.classList.add('done');
  setTimeout(() => {
    commit(`Gebucht: ${p.title || catById(p.cat).name} ${p.kind === 'out' ? '−' : '+'}${eur(p.amount).replace('−', '')}`, () => bookPlan(p));
  }, motionOn() ? 420 : 0);
}
function planMoreSheet(id) {
  const p = S.plans.find((x) => x.id === id); if (!p) return;
  openSheet(`<h2>${esc(p.title || catById(p.cat).name)}</h2>
    <p class="muted" style="margin:0">${dueLabel(p.date)} · ${eur(p.amount)}</p>
    <button type="button" class="btn ghost" id="pm-edit">${svg('edit')}Bearbeiten</button>
    ${p.date ? `<button type="button" class="btn ghost" id="pm-later">${svg('clock')}Eine Woche später</button>` : ''}
    ${p.repeat === 'monthly' ? `<button type="button" class="btn ghost" id="pm-skip">${svg('next')}Diesmal überspringen</button>` : ''}
    <button type="button" class="btn danger" id="pm-del">${svg('trash')}${p.repeat === 'monthly' ? 'Ganz löschen' : 'Fällt weg – löschen'}</button>`,
  (el) => {
    $('#pm-edit', el).onclick = () => go('neu/p' + id);
    if ($('#pm-later', el)) $('#pm-later', el).onclick = () => { closeSheet(); commit('Um eine Woche verschoben', () => { p.date = addDays(p.date, 7); }); };
    if ($('#pm-skip', el)) $('#pm-skip', el).onclick = () => { closeSheet(); commit('Diesmal übersprungen', () => { p.date = nextMonthDate(p.date); }); };
    $('#pm-del', el).onclick = () => { closeSheet(); commit('Geplante Buchung gelöscht', () => { S.plans = S.plans.filter((x) => x.id !== id); }); };
  });
}
function bindPlanRows(root = document) {
  $$('[data-pok]', root).forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); confirmPlan(b.dataset.pok, b); }));
  $$('[data-pmore]', root).forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); planMoreSheet(b.dataset.pmore); }));
  $$('[data-plan]', root).forEach((c) => c.addEventListener('click', () => {
    const p = S.plans.find((x) => x.id === c.dataset.plan);
    if (p && p.kind === 'refund') receiveSheet(p.payee || 'Ohne Namen', [p]); // Rückzahlung: auch Teilbeträge
    else go('neu/p' + c.dataset.plan);
  }));
}
VIEWS.geplant = {
  nav: 'geplant',
  html() {
    const list = S.plans.filter((p) => p.kind !== 'refund' || refundLeft(p) > 0).sort(planOrder);
    const bal = balance(); const sum = planSum();
    const done = doneList();
    return `<div class="page">
      <header class="hero"><div class="grow"><div class="sub">Kommt noch</div><h1>Geplant</h1></div>
        <div class="hero-actions"><button type="button" class="icon-btn glass primary" id="p-add" aria-label="Neue geplante Buchung">${svg('plus')}</button></div></header>
      ${gpSegHTML('geplant')}
      <section class="card glass forecast">
        <div class="fc-col"><span class="small">Jetzt</span><span class="b">${bal === null ? '–' : money(bal, { force: true })}</span></div>
        <span class="fc-arrow">${svg('next')}</span>
        <div class="fc-col"><span class="small">Wenn alles gebucht ist</span><span class="b ${bal !== null && bal + sum < 0 ? 'neg' : ''}">${bal === null ? money(sum, { sign: sum >= 0 ? '+' : '-' }) : money(bal + sum, { force: true })}</span></div>
      </section>
      ${list.length ? `<div class="stack plan-list">${list.map((p, i) => planRowHTML(p, i, false)).join('')}</div>`
    : `<section class="card glass">${emptyHTML('calendar', 'Nichts geplant.<br>Trag ein, was noch kommt – zum Beispiel Geld vom Förderkurs.', '<button type="button" class="btn small-btn" id="p-add2">Geplante Buchung anlegen</button>')}</section>`}
      ${done.length ? `<section class="card glass pad-s done-box${doneOpen ? ' open' : ''}" id="done-box">
        <button type="button" class="done-head" id="done-toggle" aria-expanded="${doneOpen}">${svg('check')}<span class="grow">Erledigt <span class="small">· letzte 7 Tage</span></span><span class="count">${done.length}</span><span class="chev">${svg('next')}</span></button>
        <div class="done-body"><div>${done.map((t, i) => doneRowHTML(t, i)).join('')}</div></div>
      </section>` : ''}
    </div>`;
  },
  mount() {
    bindGpSeg();
    const add = () => go('neu/plan-out');
    $('#p-add').onclick = add; if ($('#p-add2')) $('#p-add2').onclick = add;
    if ($('#done-toggle')) $('#done-toggle').onclick = () => { doneOpen = !doneOpen; $('#done-box').classList.toggle('open', doneOpen); $('#done-toggle').setAttribute('aria-expanded', doneOpen); };
    $$('[data-undo]').forEach((b) => b.onclick = () => restorePlan(b.dataset.undo));
    $$('[data-dhide]').forEach((b) => b.onclick = () => { const row = b.closest('.done-row'); row.classList.add('gone'); setTimeout(() => commit('Aus der Liste entfernt', () => { const t = S.tx.find((x) => x.id === b.dataset.dhide); if (t) t.doneHidden = true; }), motionOn() ? 260 : 0); });
    bindPlanRows($('#view'));
  }
};
/* Erledigt (letzte 7 Tage): bestätigte geplante Buchungen – zurück auf geplant oder ausblenden */
let doneOpen = false;
function doneList() {
  const from = addDays(todayStr(), -7);
  return S.tx.filter((t) => t.planId && !t.doneHidden && t.date >= from).sort((a, b) => (b.ts || 0) - (a.ts || 0));
}
function doneRowHTML(t, i) {
  const c = catById(t.cat); const isIn = t.kind !== 'out';
  return `<div class="done-row" style="--i:${i}">${catIcon(c, 36)}
    <span class="grow"><span class="r-title ell">${esc(t.title || c.name)}</span><span class="r-sub">${isIn ? 'Erhalten' : 'Bezahlt'} ${dateLabel(t.date).toLowerCase()} · ${money(t.amount, { sign: isIn ? '+' : '-' })}</span></span>
    <button type="button" class="pbtn" data-undo="${t.id}" aria-label="Zurück auf geplant">${svg('undo')}<span>Zurück</span></button>
    <button type="button" class="pbtn more" data-dhide="${t.id}" aria-label="Aus der Liste entfernen">${svg('close')}</button>
  </div>`;
}
function restorePlan(txId) {
  const t = S.tx.find((x) => x.id === txId); if (!t) return;
  commit('Wieder auf geplant', () => {
    S.tx = S.tx.filter((x) => x.id !== txId);
    const due = t.planDue !== undefined ? t.planDue : t.date;
    const p = S.plans.find((x) => x.id === t.planId);
    // Automatische Monatsbuchung: nur dieses Mal als einmalige, manuelle Buchung zurücklegen
    if (p && t.kind === 'refund') { p.paid = Math.max(0, (p.paid || 0) - t.amount); return; }
    if (p && !(p.auto && p.repeat === 'monthly')) { if (due && due < p.date) p.date = due; return; }
    const sn = t.planSnap || { kind: t.kind, amount: t.amount, cat: t.cat, title: t.title, payee: t.payee, acct: acctOf(t), repeat: 'none' };
    S.plans.push(Object.assign({ id: p ? uid() : t.planId, date: due }, sn, p ? { repeat: 'none' } : {}, { auto: false }));
  });
}
/* ================= Eintragen (Ausgabe · Einnahme · Rückzahlung · Umbuchen · Geplant) ================= */
/* Ausgabe = Kassenzettel mit Taschenrechner in jeder Zeile (+ und ×).
   Oben: was ich bezahlt habe. Unten: was ich zurückbekomme (landet als offene Rückzahlung in Geplant). */
let F = null;
const KIND_TITLES = { out: 'Ausgabe', in: 'Einnahme', refund: 'Rückzahlung', transfer: 'Umbuchung' };
const fSign = () => (F.kind === 'out' ? { s: '−', c: 'neg' } : F.kind === 'transfer' ? { s: '', c: 'zero' } : { s: '+', c: 'pos' });
const fIsPlan = () => F.mode === 'plan' || F.plan;
const fItems = () => F.lines.reduce((s, l) => s + calcExpr(l.expr), 0);
const fBacks = () => F.backs.reduce((s, b) => s + (b.got ? b.c : calcExpr(b.expr)), 0);
const fAmount = () => (F.kind === 'out' ? fItems() : parseEur(F.amt));
const fLine = () => (F.act.sec === 'back' ? F.backs : F.lines)[F.act.i];
const exprShow = (e) => esc(e).replace(/×/g, ' × ').replace(/\+/g, ' + ');
const hasOp = (e) => /[+×]/.test(e || '');
/** Kassenzettel aus einer gespeicherten Buchung/Planung laden */
function loadSlip(x) {
  F.lines = x.lines && x.lines.length
    ? x.lines.map((l) => Object.assign({ name: l.name || '', expr: l.expr || (l.qty > 1 ? `${l.qty}×${centsToInput(l.c)}` : centsToInput(l.c)) }, l.shares ? { shares: l.shares.map((s) => Object.assign({}, s)) } : {}))
    : [{ name: '', expr: centsToInput(x.amount) }];
  F.backs = (x.backs || []).map((b) => {
    const open = b.planId && S.plans.some((p) => p.id === b.planId);
    const got = !open && b.planId && S.tx.some((t) => t.planId === b.planId);
    return open || got ? { who: b.who || '', expr: b.expr || centsToInput(b.c), c: b.c, planId: b.planId, got: !!got, auto: !!b.auto } : null;
  }).filter(Boolean);
  F.act = { sec: 'item', i: F.lines.length - 1 };
}
function slipKey(k) {
  // Keine Zeile aktiv (z. B. nach dem Bon): Zahl tippen beginnt einen neuen Posten
  if (!fLine() && k !== 'back') { if (!/^[\d,]$/.test(k)) return; F.lines.push({ name: '', expr: '' }); F.act = { sec: 'item', i: F.lines.length - 1 }; }
  const L = fLine();
  if (k !== 'back' && (!L || L.got)) return;
  const e = L.expr; const last = e.slice(-1); const cur = e.split(/[+×]/).pop();
  if (/^\d$/.test(k)) { const n = (cur === '0' ? '' : cur) + k; const [i, d] = n.split(','); if (i.length > 6 || (d && d.length > 2)) return; L.expr = (cur === '0' ? e.slice(0, -1) : e) + k; }
  else if (k === ',') { if (cur.includes(',')) return; L.expr = e + (cur === '' ? '0,' : ','); }
  else if (k === '+' || k === 'x') { const op = k === 'x' ? '×' : '+'; if (!e) return; L.expr = /[+×]$/.test(e) ? e.slice(0, -1) + op : e + op; }
  else if (k === 'del') {
    if (e) { L.expr = e.slice(0, -1); return; }
    const list = F.act.sec === 'back' ? F.backs : F.lines;
    if (F.act.sec === 'item' && F.lines.length <= 1) return;
    list.splice(F.act.i, 1);
    if (F.act.sec === 'back' && !F.backs.some((b) => !b.got)) F.act = { sec: 'item', i: F.lines.length - 1 };
    else F.act.i = Math.max(0, F.act.i - 1);
    if (F.act.sec === 'back' && F.backs[F.act.i] && F.backs[F.act.i].got) F.act = { sec: 'item', i: F.lines.length - 1 };
  } else if (k === 'line') {
    if (!calcExpr(e)) return;
    const list = F.act.sec === 'back' ? F.backs : F.lines;
    list.splice(F.act.i + 1, 0, F.act.sec === 'back' ? { who: '', expr: '' } : { name: '', expr: '' });
    F.act.i++;
  } else if (k === 'back') {
    if (F.act.sec === 'back') { F.act = { sec: 'item', i: F.lines.length - 1 }; return; }
    let i = F.backs.findIndex((b) => !b.got && !b.expr);
    if (i < 0) { F.backs.push({ who: '', expr: '' }); i = F.backs.length - 1; }
    F.act = { sec: 'back', i };
  }
}
/** Leere Zeilen weg (außer der ersten), bevor gespeichert oder umgeschaltet wird */
function tidySlip() {
  F.lines = F.lines.filter((l, i) => i === 0 || calcExpr(l.expr) !== 0 || l.name.trim());
  F.backs = F.backs.filter((b) => b.got || calcExpr(b.expr) > 0);
}
/** Namen vorschlagen: zuletzt benutzte zuerst, passend zu den getippten Buchstaben, höchstens 4 */
function nameSuggest(pool, val, exclude = []) {
  const v = (val || '').trim().toLowerCase(); const seen = new Set(); const out = [];
  pool.forEach((n) => { n = (n || '').trim(); const k = n.toLowerCase(); if (!n || seen.has(k)) return; seen.add(k); out.push(n); });
  return out.filter((n) => !exclude.includes(n) && n.toLowerCase() !== v && (!v || n.toLowerCase().includes(v)))
    .sort((a, b) => (b.toLowerCase().startsWith(v) ? 1 : 0) - (a.toLowerCase().startsWith(v) ? 1 : 0)).slice(0, 4);
}
const recentTx = () => S.tx.slice().sort((a, b) => b.date.localeCompare(a.date) || (b.ts || 0) - (a.ts || 0));
const personPool = () => S.people.map((p) => p.name).concat(recentTx().filter((t) => t.kind === 'refund').map((t) => t.payee))
  .concat(recentTx().flatMap((t) => (t.backs || []).map((b) => b.who)), S.plans.filter((p) => p.kind === 'refund').map((p) => p.payee));
const payeePool = () => (F.kind === 'refund' ? personPool() : recentTx().filter((t) => t.kind === F.kind).map((t) => t.payee));
const suggHTML = (list, attr) => list.map((n) => `<button type="button" class="sg" ${attr}="${esc(n)}">${esc(n)}</button>`).join('');

VIEWS.neu = {
  nav: null,
  init(arg) {
    const t = todayStr();
    F = { mode: 'tx', editId: null, kind: 'out', amt: '', cat: null, payee: '', title: '', date: t, month: curMonth(), plan: false, repeat: false, acct: 'online', acctSet: false,
      open: null, lines: [{ name: '', expr: '' }], backs: [], act: { sec: 'item', i: 0 } };
    if (arg[0] === 'e') {
      const x = S.tx.find((q) => q.id === arg.slice(1));
      if (x) { Object.assign(F, { editId: x.id, kind: x.kind, amt: centsToInput(x.amount), cat: x.cat, payee: x.payee || '', title: x.title || '', date: x.date, month: x.month || monthOf(x.date), acct: acctOf(x), acctSet: true }); if (x.kind === 'out') loadSlip(x); }
    } else if (arg[0] === 'p' && arg.indexOf('plan-') !== 0) {
      const p = S.plans.find((q) => q.id === arg.slice(1));
      if (p) { Object.assign(F, { mode: 'plan', editId: p.id, kind: p.kind, amt: centsToInput(p.amount), cat: p.cat, payee: p.payee || '', title: p.title || '', date: p.date || null, month: p.month || curMonth(), repeat: p.repeat === 'monthly', acct: p.acct || 'online', acctSet: true }); if (p.kind === 'out') loadSlip(p); }
    } else if (arg.indexOf('plan-') === 0) {
      Object.assign(F, { mode: 'plan', kind: arg.slice(5) === 'in' ? 'in' : 'out', date: addDays(t, 7) });
    } else if (arg === 'lidl') {
      F.kind = 'out'; F.cat = 'c_lidl';
    } else if (KIND_TITLES[arg]) F.kind = arg;
    if (!F.editId && F.kind === 'refund') F.acct = 'bar'; // Geld zurück kommt meistens bar
    if (!F.cat || !S.cats.some((c) => c.id === F.cat)) F.cat = defaultCatOf(F.kind);
  },
  html() {
    const isPlan = fIsPlan(); const editing = !!F.editId;
    const title = (editing ? '' : 'Neue ') + (isPlan ? 'geplante ' : '') + KIND_TITLES[F.kind] + (editing ? ' bearbeiten' : '');
    const cats = catsOf(F.kind);
    const canPlan = !editing && F.mode !== 'plan' && (F.kind === 'out' || F.kind === 'in');
    return `<div class="page form-page">
      <div class="topbar-row">
        <button type="button" class="icon-btn glass" id="f-close" aria-label="Schließen">${svg('close')}</button>
        <h1 class="center">${title.charAt(0).toUpperCase() + title.slice(1)}</h1>
        ${editing ? `<button type="button" class="icon-btn glass danger-ic" id="f-del" aria-label="Löschen">${svg('trash')}</button>`
    : canPlan ? `<button type="button" class="plan-btn glass${F.plan ? ' on' : ''}" id="f-plan" aria-pressed="${F.plan}" aria-label="Erst planen">${svg('calendar')}<span>Planen</span></button>` : '<span class="spacer"></span>'}
      </div>
      ${editing ? '' : segHTML(F.mode === 'plan' ? [['out', 'Ausgabe'], ['in', 'Einnahme']] : [['out', 'Ausgabe'], ['in', 'Einnahme'], ['refund', 'Zurück'], ['transfer', 'Umbuchen']], F.kind, 'data-fk', 'aria-label="Art"')}
      <div id="f-area">${areaHTML()}</div>
      ${F.kind === 'transfer' ? '' : `<div class="hscroll cat-pick no-swipe" role="radiogroup" aria-label="Kategorie">${cats.map((c) => `<button type="button" class="cat-chip${c.id === F.cat ? ' on' : ''}" data-fc="${c.id}" role="radio" aria-checked="${c.id === F.cat}" style="--c:${c.color}">${catIcon(c, 46)}<span>${esc(c.name)}</span></button>`).join('')}
        <button type="button" class="cat-chip add" id="f-newcat"><span class="cat-ic" style="--c:var(--sub);width:46px;height:46px">${svg('plus')}</span><span>Neu</span></button></div>`}
      <div class="fields" id="f-meta">${metaHTML()}</div>
    </div>
    <div class="dock glass" id="dock">${dockHTML()}</div>`;
  },
  mount() {
    $('#f-close').onclick = () => goBack();
    if ($('#f-del')) $('#f-del').onclick = () => deleteEntry();
    if ($('#f-plan')) $('#f-plan').onclick = () => {
      F.plan = !F.plan; vibrate(8);
      if (F.plan && F.date <= todayStr()) F.date = addDays(todayStr(), 7);
      if (!F.plan) { F.repeat = false; if (F.date > todayStr()) F.date = todayStr(); }
      render(false);
    };
    $$('[data-fk]').forEach((b) => b.onclick = () => {
      if (b.dataset.fk === F.kind) return;
      segMove(b);
      const amt = fAmount(); const old = F.kind; F.kind = b.dataset.fk;
      if (F.kind === 'out') { F.lines = [{ name: '', expr: centsToInput(amt) }]; F.backs = []; F.act = { sec: 'item', i: 0 }; } else F.amt = centsToInput(amt);
      if ((old === 'in') !== (F.kind === 'in')) F.cat = defaultCatOf(F.kind);
      if (F.kind === 'refund' || F.kind === 'transfer') { F.plan = false; if (F.date > todayStr()) F.date = todayStr(); }
      if (!F.acctSet) F.acct = F.kind === 'refund' ? 'bar' : 'online';
      F.open = null;
      setTimeout(() => render(false), 150);
    });
    $$('[data-fc]').forEach((b) => b.onclick = () => {
      F.cat = b.dataset.fc;
      $$('[data-fc]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
    });
    if ($('#f-newcat')) $('#f-newcat').onclick = () => catSheet(null, F.kind === 'in' ? 'in' : 'out', (id) => { F.cat = id; render(false); });
    bindArea(); bindMeta(); bindDock();
    bindDockAway();
  }
};

/* ---------- Betrag / Kassenzettel ---------- */
function areaHTML() {
  if (F.kind !== 'out') {
    return `<div class="amount-wrap"><div class="amount ${fSign().c}" id="f-amount" aria-live="polite">${fSign().s}${esc(F.amt || '0')}<span class="cur">€</span></div></div>`;
  }
  const isAct = (sec, i) => F.act.sec === sec && F.act.i === i;
  const amtHTML = (expr, sec, i, sign) => {
    const act = isAct(sec, i); const v = calcExpr(expr); const caret = act ? '<i class="caret"></i>' : '';
    const open = `<button type="button" class="ln-amt${sign === '+' ? ' pos' : ''}" data-act="${sec}:${i}" aria-label="Betrag bearbeiten">`;
    if (hasOp(expr)) return `${open}<small>${exprShow(expr)}${caret} =</small>${sign}${eur(v)}</button>`;
    if (act) return `${open}${sign}${expr ? esc(expr) : '0'}${caret} €</button>`;
    return `${open}${sign}${eur(v)}</button>`;
  };
  const single = F.lines.length === 1 && !F.backs.length && F.act.sec === 'item' && !F.bon;
  const showWho = !single;
  const pool = personPool(); const used = F.backs.map((b) => b.who);
  const t = fItems(); const net = t - fBacks();
  const bonOk = F.bon && F.bon.total != null ? F.bon.total === t : null;
  const backRows = F.backs.map((b, i) => b.auto && !b.got
    ? `<div class="back-row"><div class="ln auto"><span class="nm">${esc(b.who)}</span><span class="dots"></span><span class="ln-amt pos">${hasOp(b.expr) ? `<small>${exprShow(b.expr)} =</small>` : ''}+${eur(calcExpr(b.expr))}</span><button type="button" class="ln-x" data-bauto="${esc(b.who)}" aria-label="${esc(b.who)} entfernen">${svg('close')}</button></div></div>`
    : b.got
    ? `<div class="back-row"><div class="ln got"><span class="nm">${esc(b.who || 'Rückzahlung')}</span><span class="dots"></span><span class="ln-amt pos">+${eur(b.c)}</span><span class="ln-x" title="Erhalten">${svg('check')}</span></div></div>`
    : `<div class="back-row"><div class="ln${isAct('back', i) ? ' live' : ''}"><input class="nm" data-bwho="${i}" placeholder="Von wem?" value="${esc(b.who)}" maxlength="30" autocomplete="off" aria-label="Von wem"><span class="dots"></span>${amtHTML(b.expr, 'back', i, '+')}<button type="button" class="ln-x" data-bdel="${i}" aria-label="Zeile löschen">${svg('close')}</button></div><div class="sugg">${b.who ? '' : suggHTML(nameSuggest(pool, '', used), `data-bpick="${i}" data-name`)}</div></div>`).join('');
  return `<div class="slipwrap"><section class="slip${single ? ' single' : ''}" aria-label="Kassenzettel">
    ${!F.editId && !F.bon ? `<div class="slip-top"><button type="button" class="bon-btn" id="f-bon">${svg('receipt')}Bon</button></div>` : ''}
    ${F.bon ? `<div class="slip-top"><span class="bon-stat${bonOk === false ? ' bad' : ''}">${svg(bonOk === false ? 'receipt' : 'check')}${esc(F.bon.store || 'Bon')}${F.bon.total != null ? ' · ' + eur(F.bon.total) : ''}</span><button type="button" class="bon-btn" id="f-bon" aria-label="Anderen Bon lesen">${svg('receipt')}</button></div>` : ''}
    ${F.lines.map((l, i) => `<div class="ln item${isAct('item', i) ? ' live' : ''}"><input class="nm" data-lname="${i}" placeholder="${single ? 'Was?' : 'Posten ' + (i + 1)}" value="${esc(l.name)}" maxlength="30" autocomplete="off" aria-label="Name von Posten ${i + 1}"><span class="dots"></span>${amtHTML(l.expr, 'item', i, '')}${F.lines.length > 1 ? `<button type="button" class="ln-x" data-ldel="${i}" aria-label="Posten löschen">${svg('close')}</button>` : '<span class="ln-x"></span>'}</div>${showWho ? `<div class="ln-who"><button type="button" class="who-chip${(l.shares || []).some((x) => x.who) ? ' on' : ''}" data-who="${i}" aria-label="Für wen: ${esc(shareLabel(l))}">${svg('people')}${esc(shareLabel(l))}</button></div>` : ''}`).join('')}
    <div class="sum"><span>Summe</span><span class="ln-amt big">${eur(t)}</span></div>
    <button type="button" class="perf" data-key="back" aria-label="Bekomme ich zurück">${svg('scissors')}Bekomme ich zurück${F.backs.length ? '' : `<span class="perf-add">${svg('plus')}</span>`}</button>
    ${backRows}
    ${F.backs.length ? `<div class="split">${[2, 3, 4].map((n) => `<button type="button" data-split="${n}" aria-label="Gleich teilen durch ${n}">÷ ${n}</button>`).join('')}</div>
    <div class="net"><span>Bleibt bei mir</span><span class="ln-amt big${net < 0 ? ' neg' : ''}">${eur(net)}</span></div>` : ''}
  </section></div>`;
}
function refreshArea() {
  const a = $('#f-area'); if (!a) return;
  a.innerHTML = areaHTML(); bindArea();
  const s = $('#f-save'); if (s) s.disabled = !(fAmount() > 0);
  const bk = $('#dock [data-key="back"]');
  if (bk) { bk.outerHTML = backKeyHTML(); bindDockKeys(); }
}
function bindArea() {
  const a = $('#f-area'); if (!a) return;
  $$('[data-lname]', a).forEach((inp) => inp.addEventListener('input', () => { F.lines[+inp.dataset.lname].name = inp.value; }));
  $$('[data-act]', a).forEach((b) => b.onclick = () => { const [sec, i] = b.dataset.act.split(':'); F.act = { sec, i: +i }; vibrate(6); refreshArea(); });
  if ($('#f-bon', a)) $('#f-bon', a).onclick = () => pickBon();
  $$('[data-who]', a).forEach((b) => b.onclick = () => assignSheet(+b.dataset.who));
  $$('[data-bauto]', a).forEach((b) => b.onclick = () => { const n = b.dataset.bauto.toLowerCase(); F.lines.forEach((l) => { if (l.shares) { l.shares = l.shares.filter((x) => x.who.toLowerCase() !== n); if (!l.shares.length || (l.shares.length === 1 && !l.shares[0].who)) delete l.shares; } }); rebuildAutoBacks(); vibrate(8); refreshArea(); });
  $$('[data-ldel]', a).forEach((b) => b.onclick = () => { const i = +b.dataset.ldel; F.lines.splice(i, 1); rebuildAutoBacks(); F.act = { sec: 'item', i: Math.min(F.act.sec === 'item' ? F.act.i : 0, F.lines.length - 1) }; vibrate(8); refreshArea(); });
  $$('[data-bdel]', a).forEach((b) => b.onclick = () => { F.backs.splice(+b.dataset.bdel, 1); if (F.act.sec === 'back') F.act = { sec: 'item', i: F.lines.length - 1 }; vibrate(8); refreshArea(); });
  $$('.perf[data-key]', a).forEach((b) => b.onclick = () => { slipKey('back'); vibrate(6); refreshArea(); });
  $$('[data-bwho]', a).forEach((inp) => {
    const i = +inp.dataset.bwho; const box = inp.closest('.back-row').querySelector('.sugg');
    const fill = () => { box.innerHTML = suggHTML(nameSuggest(personPool(), inp.value, F.backs.map((b, j) => (j === i ? '' : b.who))), `data-bpick="${i}" data-name`); bindPicks(box); };
    inp.addEventListener('input', () => { F.backs[i].who = inp.value; fill(); });
    inp.addEventListener('focus', fill);
    inp.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== inp && F.backs[i] && F.backs[i].who) box.innerHTML = ''; }, 120));
  });
  bindPicks(a);
  $$('[data-split]', a).forEach((b) => b.onclick = () => {
    const n = +b.dataset.split; const share = Math.round(fItems() / n);
    const got = F.backs.filter((x) => x.got); const open = F.backs.filter((x) => !x.got);
    const want = Math.max(0, n - 1 - got.length);
    F.backs = got.concat(Array.from({ length: want }, (_, i) => ({ who: open[i] ? open[i].who : '', expr: centsToInput(share), planId: open[i] && open[i].planId })));
    F.act = { sec: 'item', i: F.lines.length - 1 }; vibrate(10); refreshArea();
  });
}
function bindPicks(root) {
  $$('[data-bpick]', root).forEach((b) => {
    b.onpointerdown = (e) => e.preventDefault();
    b.onclick = () => { const i = +b.dataset.bpick; if (F.backs[i]) F.backs[i].who = b.dataset.name; const f = document.activeElement; if (f && f.blur) f.blur(); refreshArea(); };
  });
}

/* ---------- An wen · Bezeichnung · Datum · Konto (eine Reihe, nur Symbole) ---------- */
function fDateShort() {
  if (!F.date) return 'offen';
  const t = todayStr();
  if (F.date === t) return fIsPlan() ? 'Heute' : '';
  if (F.date === addDays(t, -1)) return 'Gestern';
  if (F.date === addDays(t, 1)) return 'Morgen';
  const d = parseDate(F.date);
  return `${d.getDate()}. ${MONTHS_S[d.getMonth()]}`;
}
function metaHTML() {
  const b = (id, icon, val, label, extra = '') => `<button type="button" class="ib glass${val ? ' filled' : ''}${F.open === id ? ' open' : ''}" data-mo="${id}" aria-label="${label}${val ? ': ' + esc(val) : ''}" ${extra}>${svg(icon)}${val ? `<span>${esc(val)}</span>` : ''}</button>`;
  const btns = [];
  if (F.kind !== 'transfer') btns.push(b('who', F.kind === 'out' ? 'send' : 'people', F.payee, F.kind === 'out' ? 'An wen' : 'Von wem'));
  if (F.kind === 'refund') btns.push(b('month', 'clock', F.month === curMonth() ? '' : MONTHS_S[+F.month.slice(5) - 1], 'Zählt für Monat'));
  else btns.push(b('title', 'tag', F.title, 'Bezeichnung'));
  btns.push(b('date', F.repeat ? 'repeat' : 'calendar', fDateShort(), fIsPlan() ? 'Fällig am' : 'Datum'));
  const acctLabel = F.kind === 'transfer' ? (F.acct === 'online' ? '→ Bar' : '→ Konto') : (F.acct === 'bar' ? 'Bar' : 'Online');
  btns.push(`<button type="button" class="ib glass filled acct" id="f-acct" aria-label="${F.kind === 'transfer' ? (F.acct === 'online' ? 'Vom Konto ins Bargeld' : 'Vom Bargeld aufs Konto') : 'Konto: ' + acctLabel}">${svg(F.acct === 'bar' ? 'banknote' : 'bank')}<span>${acctLabel}</span></button>`);
  let panel = '';
  if (F.open === 'who') panel = `<div class="ipanel"><label class="field glass">${svg(F.kind === 'out' ? 'send' : 'people')}<span class="sr">${F.kind === 'out' ? 'An wen' : 'Von wem'}</span><input id="f-payee" placeholder="${F.kind === 'out' ? 'An wen?' : 'Von wem?'}" value="${esc(F.payee)}" maxlength="60" autocomplete="off"></label><div class="sugg" id="f-psugg"></div></div>`;
  if (F.open === 'title') panel = `<div class="ipanel"><label class="field glass">${svg('tag')}<span class="sr">Bezeichnung</span><input id="f-title" placeholder="Bezeichnung" value="${esc(F.title)}" maxlength="60" autocomplete="off"></label></div>`;
  if (F.open === 'month') panel = `<div class="ipanel"><div class="field glass month-field" aria-label="Zählt für Monat">
      <button type="button" class="icon-btn sm plain" id="f-mprev" aria-label="Monat früher">${svg('back')}</button>
      <span class="grow center-txt"><span class="b">${monthName(F.month)}</span></span>
      <button type="button" class="icon-btn sm plain" id="f-mnext" aria-label="Monat später" ${F.month >= curMonth() ? 'disabled' : ''}>${svg('next')}</button></div></div>`;
  if (F.open === 'date') {
    const t = todayStr(); const isPlan = fIsPlan();
    const opts = F.kind === 'refund' && isPlan ? [['none', 'Kommt noch']]
      : isPlan ? [[addDays(t, 1), 'Morgen'], [addDays(t, 7), 'In 1 Woche'], [nextMonthDate(t), 'In 1 Monat']]
        : [[t, 'Heute'], [addDays(t, -1), 'Gestern'], [addDays(t, -2), 'Vorgestern']];
    panel = `<div class="ipanel"><div class="chips">${opts.map(([v, l]) => `<button type="button" class="chip${(v === 'none' ? !F.date : F.date === v) ? ' on' : ''}" data-fd="${v}">${l}</button>`).join('')}
      <label class="chip pick-date">${svg('calendar')}Anderes<input type="date" id="f-date" value="${F.date || ''}" ${isPlan ? '' : `max="${t}"`} aria-label="Datum wählen"></label>
      ${isPlan && F.kind !== 'refund' ? `<button type="button" class="chip${F.repeat ? ' on' : ''}" id="f-repeat" aria-pressed="${F.repeat}">${svg('repeat')}Jeden Monat</button>` : ''}</div></div>`;
  }
  return `<div class="irow">${btns.join('')}</div>${panel}`;
}
function refreshMeta(focusId) {
  const m = $('#f-meta'); if (!m) return;
  m.innerHTML = metaHTML(); bindMeta();
  if (focusId) { const el = $('#' + focusId); if (el) { el.focus(); try { el.setSelectionRange(el.value.length, el.value.length); } catch (_) { /* egal */ } } }
}
function bindMeta() {
  const m = $('#f-meta'); if (!m) return;
  $$('[data-mo]', m).forEach((b) => b.onclick = () => {
    const id = b.dataset.mo; F.open = F.open === id ? null : id; vibrate(6);
    refreshMeta(F.open === 'who' ? 'f-payee' : F.open === 'title' ? 'f-title' : null);
  });
  $('#f-acct').onclick = () => { F.acct = F.acct === 'bar' ? 'online' : 'bar'; F.acctSet = true; vibrate(8); refreshMeta(); };
  const close = () => { F.open = null; refreshMeta(); };
  const p = $('#f-payee');
  if (p) {
    const box = $('#f-psugg');
    const fill = () => {
      box.innerHTML = suggHTML(nameSuggest(payeePool(), p.value), 'data-ppick');
      $$('[data-ppick]', box).forEach((c) => { c.onpointerdown = (e) => e.preventDefault(); c.onclick = () => { F.payee = c.dataset.ppick; applyRule(); p.blur(); close(); }; });
    };
    p.addEventListener('input', () => { F.payee = p.value; fill(); });
    p.addEventListener('blur', () => setTimeout(() => { if (F.open === 'who' && document.activeElement !== p) { applyRule(); close(); } }, 150));
    fill();
  }
  const ti = $('#f-title');
  if (ti) {
    ti.addEventListener('input', () => { F.title = ti.value; });
    ti.addEventListener('blur', () => setTimeout(() => { if (F.open === 'title' && document.activeElement !== ti) close(); }, 150));
  }
  if ($('#f-mprev')) {
    $('#f-mprev').onclick = () => { F.month = addMonth(F.month, -1); refreshMeta(); };
    $('#f-mnext').onclick = () => { if (F.month < curMonth()) { F.month = addMonth(F.month, 1); refreshMeta(); } };
  }
  $$('[data-fd]', m).forEach((b) => b.onclick = () => { F.date = b.dataset.fd === 'none' ? null : b.dataset.fd; close(); });
  if ($('#f-date')) $('#f-date').addEventListener('change', (e) => { if (e.target.value) { F.date = e.target.value; close(); } });
  if ($('#f-repeat')) $('#f-repeat').onclick = () => { F.repeat = !F.repeat; vibrate(8); refreshMeta(); };
}
/** Empfänger schon bekannt → Kategorie von damals vorschlagen */
function applyRule() {
  const rule = S.rules[F.payee.trim().toLowerCase()];
  if (rule && rule !== F.cat && S.cats.some((c) => c.id === rule && c.kind === (F.kind === 'in' ? 'in' : 'out'))) {
    F.cat = rule;
    $$('[data-fc]').forEach((x) => { const on = x.dataset.fc === rule; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); });
  }
}

/* ---------- Zahlenfeld (einklappbar) ---------- */
let padOpen = true;
const padKey = (k, label, op, sub) => `<button type="button" class="key${op ? ' op' : ''}" data-key="${k}" aria-label="${sub || label}">${label}${op && sub && k !== 'del' ? `<small>${sub}</small>` : ''}</button>`;
const backKeyHTML = () => (F.act.sec === 'back' ? padKey('back', svg('cart'), true, 'Bezahlt') : padKey('back', svg('refund'), true, 'Zurück'));
function dockHTML() {
  const K = padKey;
  const pad = F.kind === 'out'
    ? `<div class="keypad k4">${K('1', '1')}${K('2', '2')}${K('3', '3')}${K('del', svg('bksp'), true, 'Löschen')}${K('4', '4')}${K('5', '5')}${K('6', '6')}${K('x', '×', true, 'Mal')}${K('7', '7')}${K('8', '8')}${K('9', '9')}${K('+', '+', true, 'Plus')}${K(',', ',', false, 'Komma')}${K('0', '0')}${K('line', svg('enter'), true, 'Zeile')}${backKeyHTML()}</div>`
    : keypadHTML();
  return `<button type="button" class="pad-tab" id="f-pad" aria-label="${padOpen ? 'Zahlenfeld ausblenden' : 'Zahlenfeld einblenden'}" aria-expanded="${padOpen}">${svg(padOpen ? 'down' : 'keypad')}</button>
    ${padOpen ? pad : ''}
    <button type="button" class="btn save" id="f-save" ${fAmount() > 0 ? '' : 'disabled'}>${svg('check')}${fIsPlan() ? 'Planen' : 'Speichern'}</button>`;
}
function bindDockKeys() {
  const d = $('#dock'); if (!d) return;
  $$('.key', d).forEach((k) => k.onclick = () => {
    if (F.kind === 'out') { slipKey(k.dataset.key); if (F.act.sec === 'item' && F.lines.some((l) => l.shares)) rebuildAutoBacks(); refreshArea(); }
    else {
      F.amt = pressKey(F.amt, k.dataset.key);
      const a = $('#f-amount'); if (a) { a.innerHTML = `${fSign().s}${esc(F.amt || '0')}<span class="cur">€</span>`; a.classList.remove('bump'); void a.offsetWidth; a.classList.add('bump'); }
    }
    $('#f-save').disabled = !(fAmount() > 0);
  });
}
function bindDock() {
  const d = $('#dock'); if (!d) return;
  bindDockKeys();
  $('#f-pad').onclick = () => { padOpen = !padOpen; vibrate(6); d.innerHTML = dockHTML(); bindDock(); };
  $('#f-save').onclick = (e) => saveEntry(e.currentTarget);
  // Platz unten = Höhe des Docks, damit nichts darunter verschwindet
  if (dockRO) dockRO.disconnect();
  const setH = () => document.documentElement.style.setProperty('--dock-h', d.offsetHeight + 'px');
  setH();
  if (window.ResizeObserver) { dockRO = new ResizeObserver(setH); dockRO.observe(d); }
}
let dockRO = null;

function saveEntry(btn) {
  if (F.kind === 'out') tidySlip();
  const amount = fAmount();
  if (amount <= 0) return;
  const isPlan = fIsPlan();
  const payee = F.payee.trim(); let title = (F.title || '').trim();
  const isOut = F.kind === 'out';
  const named = isOut ? F.lines.map((l) => l.name.trim()).filter(Boolean) : [];
  if (isOut && !title && named.length && !F.bon) title = named.join(', ');
  const lines = isOut && (F.lines.length > 1 || hasOp(F.lines[0].expr) || F.lines[0].name.trim() || F.lines[0].shares) ? F.lines.filter((l) => calcExpr(l.expr) !== 0).map((l) => Object.assign({ name: l.name.trim(), expr: l.expr.replace(/[+×−]$/, ''), c: calcExpr(l.expr) }, l.shares ? { shares: l.shares } : {})) : null;
  const r = btn.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, isOut ? undefined : ['var(--pos)', '#F2C14E', '#2F6FD6']);
  vibrate(15);
  const c = catById(F.cat);
  const newBacks = isOut ? F.backs.filter((b) => !b.got && !b.planId && calcExpr(b.expr) > 0).length : 0;
  let msg;
  if (isPlan) msg = F.editId ? 'Geplante Buchung gespeichert' : `Geplant: ${title || c.name}`;
  else if (F.kind === 'refund') msg = `${eur(amount)} von ${c.name} (${MONTHS[+F.month.slice(5) - 1]}) abgezogen`;
  else if (F.kind === 'transfer') msg = F.acct === 'online' ? `${eur(amount)} abgehoben` : `${eur(amount)} eingezahlt`;
  else msg = F.editId ? 'Gespeichert' : `${F.kind === 'in' ? '+' : '−'}${eur(amount)} eingetragen`;
  if (newBacks) msg += ` · ${newBacks === 1 ? 'Rückzahlung' : newBacks + ' Rückzahlungen'} in Offen`;
  commit(msg, () => {
    if (payee && F.kind !== 'refund' && F.kind !== 'transfer') S.rules[payee.toLowerCase()] = F.cat;
    let owner;
    if (isPlan) {
      const data = { kind: F.kind, amount, cat: F.cat, title, payee, date: F.date, repeat: F.repeat && F.kind !== 'refund' ? 'monthly' : 'none', acct: F.acct };
      if (F.kind === 'refund') data.month = F.month;
      if (lines) data.lines = lines;
      if (F.mode === 'plan' && F.editId) { owner = S.plans.find((x) => x.id === F.editId); Object.assign(owner, data); if (!lines) delete owner.lines; }
      else { owner = Object.assign({ id: uid(), auto: false }, data); S.plans.push(owner); }
    } else {
      const data = F.kind === 'transfer'
        ? { kind: 'transfer', amount, cat: null, title: title || (F.acct === 'online' ? 'Abgehoben' : 'Eingezahlt'), payee: '', date: F.date, acct: F.acct, to: F.acct === 'online' ? 'bar' : 'online' }
        : { kind: F.kind, amount, cat: F.cat, title: F.kind === 'refund' ? (title || 'Rückzahlung') : title, payee, date: F.date, acct: F.acct };
      if (F.kind === 'refund') data.month = F.month;
      if (lines) data.lines = lines;
      if (F.editId) {
        owner = S.tx.find((x) => x.id === F.editId); Object.assign(owner, data);
        if (F.kind !== 'refund') delete owner.month; if (F.kind !== 'transfer') delete owner.to; if (!lines) delete owner.lines;
      } else { owner = Object.assign({ id: uid(), ts: Date.now() }, data); S.tx.push(owner); }
    }
    if (isOut) { syncBacks(owner, F.backs, F.cat, monthOf(F.date || todayStr())); ensurePeople(F.backs.map((b) => b.who)); }
    else if (owner.backs) { syncBacks(owner, [], F.cat, curMonth()); }
  }, { after: () => { if (!isPlan) bKey = keyFor(bKey[0], F.date); goBack(); } });
}
/** „Bekomme ich zurück“ ↔ offene Rückzahlungen in Geplant abgleichen (ohne festes Datum, abhaken sobald das Geld da ist) */
function syncBacks(owner, backs, cat, month) {
  const prev = owner.backs || []; const out = [];
  backs.forEach((b) => {
    if (b.got) { out.push(Object.assign({ who: b.who, expr: b.expr, c: b.c, planId: b.planId }, b.auto ? { auto: true } : {})); return; }
    const c = calcExpr(b.expr); if (c <= 0) return;
    let p = b.planId && S.plans.find((x) => x.id === b.planId);
    if (p) Object.assign(p, { amount: c, payee: b.who.trim(), cat, month });
    else { p = { id: uid(), kind: 'refund', amount: c, cat, title: '', payee: b.who.trim(), date: null, repeat: 'none', acct: 'bar', month, auto: false }; S.plans.push(p); }
    p.fromId = owner.id;
    out.push(Object.assign({ who: b.who.trim(), expr: b.expr.replace(/[+×]$/, ''), c, planId: p.id }, b.auto ? { auto: true } : {}));
  });
  prev.forEach((pb) => { if (pb.planId && !out.some((o) => o.planId === pb.planId)) S.plans = S.plans.filter((x) => x.id !== pb.planId); });
  if (out.length) owner.backs = out; else delete owner.backs;
}
function deleteEntry() {
  const isPlan = F.mode === 'plan';
  confirmSheet(isPlan ? 'Geplante Buchung löschen?' : 'Buchung löschen?', 'Das kannst du danach noch rückgängig machen.', 'Löschen', () => {
    commit('Gelöscht', () => {
      const owner = isPlan ? S.plans.find((p) => p.id === F.editId) : S.tx.find((t) => t.id === F.editId);
      const open = ((owner && owner.backs) || []).map((b) => b.planId).filter(Boolean);
      if (isPlan) S.plans = S.plans.filter((p) => p.id !== F.editId);
      else S.tx = S.tx.filter((t) => t.id !== F.editId);
      if (open.length) S.plans = S.plans.filter((p) => !open.includes(p.id));
    }, { after: () => goBack() });
  });
}
/** Zahlenfeld weg, solange in ein Textfeld getippt wird – zurück, sobald die Tastatur zugeht oder Enter gedrückt wird */
let vvHandler = null;
function bindDockAway() {
  const page = $('.form-page'); if (!page || !$('#dock')) return;
  const isText = (el) => el && el.matches && el.matches('input:not([type="date"])');
  const show = () => { const d = $('#dock'); if (d) d.classList.remove('away'); };
  page.addEventListener('focusin', (e) => { if (isText(e.target)) { e.target.setAttribute('enterkeyhint', 'done'); const d = $('#dock'); if (d) d.classList.add('away'); } });
  page.addEventListener('focusout', () => setTimeout(() => { if (!isText(document.activeElement)) show(); }, 80));
  page.addEventListener('keydown', (e) => { if (e.key === 'Enter' && isText(e.target)) { e.preventDefault(); e.target.blur(); show(); } });
  if (window.visualViewport) {
    if (vvHandler) window.visualViewport.removeEventListener('resize', vvHandler);
    let maxH = window.visualViewport.height;
    vvHandler = () => {
      const h = window.visualViewport.height; maxH = Math.max(maxH, h);
      if (h > maxH * 0.85) { const a = document.activeElement; if (isText(a) && a.closest('.form-page')) a.blur(); show(); }
    };
    window.visualViewport.addEventListener('resize', vvHandler);
  }
}
