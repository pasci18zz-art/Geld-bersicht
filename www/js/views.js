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
    <button type="button" class="donut-btn" id="open-details" aria-label="Alle Details ansehen">
      ${donutHTML(items, { size: 236, label: '', valueHTML: money(st.net), sub: st.refund ? money(st.refund, { sign: '-' }) + ' zurück' : '', emptyText: 'Noch keine Ausgaben', aria: 'Ausgaben nach Kategorie' })}
    </button>
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
  $('#open-details').onclick = open; $('#more-details').onclick = open;
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
    const upcoming = S.plans.slice().sort((a, b) => a.date.localeCompare(b.date)).filter((p) => daysBetween(todayStr(), p.date) <= 14).slice(0, 2);
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
    return `<div class="page">
      <div class="topbar-row"><button type="button" class="icon-btn glass" id="back" aria-label="Zurück">${svg('back')}</button><span class="spacer"></span>
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
      <section class="card glass pad-s">${list.length ? list.map((t, i) => txRow(t, i)).join('') : emptyHTML(c.icon, 'Hier ist noch nichts.')}</section>
    </div>`;
  },
  mount(arg) {
    const [catId] = arg.split('/');
    $('#back').onclick = () => goBack();
    $('#k-edit').onclick = () => catSheet(catId);
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
  const c = catById(p.cat); const isIn = p.kind === 'in';
  const n = daysBetween(todayStr(), p.date);
  return `<div class="plan${compact ? ' compact' : ' card glass'}${n < 0 ? ' late' : ''}" data-plan="${p.id}" style="--i:${i}">
    ${catIcon(c, 42)}
    <div class="grow">
      <div class="r-title ell">${esc(p.title || c.name)}</div>
      <div class="r-sub">${p.payee ? (isIn ? 'von ' : 'an ') + esc(p.payee) + ' · ' : ''}<span class="due">${dueLabel(p.date)}</span>${p.repeat === 'monthly' ? ` · <span class="tag-mini">${svg('repeat')}monatlich</span>` : ''}</div>
    </div>
    <div class="plan-side">
      <span class="r-amt ${isIn ? 'pos' : 'neg'}">${money(p.amount, { sign: isIn ? '+' : '-' })}</span>
      <div class="plan-btns">
        ${compact ? '' : `<button type="button" class="pbtn more" data-pmore="${p.id}" aria-label="Mehr">${svg('dots')}</button>`}
        <button type="button" class="pbtn ok" data-pok="${p.id}" aria-label="${esc(p.title || c.name)} bestätigen">${svg('check')}<span>${isIn ? 'Erhalten' : 'Bezahlt'}</span></button>
      </div>
    </div>
  </div>`;
}
/** Geplante Buchung jetzt buchen (innerhalb von commit aufrufen) */
function bookPlan(p) {
  S.tx.push({ id: uid(), kind: p.kind, amount: p.amount, cat: p.cat, title: p.title, payee: p.payee || '', date: todayStr(), ts: Date.now(), planId: p.id, acct: p.acct || 'online', planDue: p.date, planSnap: planSnap(p) });
  if (p.repeat === 'monthly') { p.date = nextMonthDate(p.date); while (p.date <= todayStr()) p.date = nextMonthDate(p.date); }
  else S.plans = S.plans.filter((x) => x.id !== p.id);
}
function confirmPlan(id, btn) {
  const p = S.plans.find((x) => x.id === id); if (!p) return;
  const card = btn.closest('[data-plan]');
  const r = btn.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, p.kind === 'in' ? ['var(--pos)', '#F2C14E', '#2F6FD6'] : undefined);
  vibrate(20);
  if (card) card.classList.add('done');
  setTimeout(() => {
    commit(`Gebucht: ${p.title || catById(p.cat).name} ${p.kind === 'in' ? '+' : '−'}${eur(p.amount).replace('−', '')}`, () => bookPlan(p));
  }, motionOn() ? 420 : 0);
}
function planMoreSheet(id) {
  const p = S.plans.find((x) => x.id === id); if (!p) return;
  openSheet(`<h2>${esc(p.title || catById(p.cat).name)}</h2>
    <p class="muted" style="margin:0">${dueLabel(p.date)} · ${eur(p.amount)}</p>
    <button type="button" class="btn ghost" id="pm-edit">${svg('edit')}Bearbeiten</button>
    <button type="button" class="btn ghost" id="pm-later">${svg('clock')}Eine Woche später</button>
    ${p.repeat === 'monthly' ? `<button type="button" class="btn ghost" id="pm-skip">${svg('next')}Diesmal überspringen</button>` : ''}
    <button type="button" class="btn danger" id="pm-del">${svg('trash')}${p.repeat === 'monthly' ? 'Ganz löschen' : 'Fällt weg – löschen'}</button>`,
  (el) => {
    $('#pm-edit', el).onclick = () => go('neu/p' + id);
    $('#pm-later', el).onclick = () => { closeSheet(); commit('Um eine Woche verschoben', () => { p.date = addDays(p.date, 7); }); };
    if ($('#pm-skip', el)) $('#pm-skip', el).onclick = () => { closeSheet(); commit('Diesmal übersprungen', () => { p.date = nextMonthDate(p.date); }); };
    $('#pm-del', el).onclick = () => { closeSheet(); commit('Geplante Buchung gelöscht', () => { S.plans = S.plans.filter((x) => x.id !== id); }); };
  });
}
function bindPlanRows(root = document) {
  $$('[data-pok]', root).forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); confirmPlan(b.dataset.pok, b); }));
  $$('[data-pmore]', root).forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); planMoreSheet(b.dataset.pmore); }));
  $$('[data-plan]', root).forEach((c) => c.addEventListener('click', () => go('neu/p' + c.dataset.plan)));
}
VIEWS.geplant = {
  nav: 'geplant',
  html() {
    const list = S.plans.slice().sort((a, b) => a.date.localeCompare(b.date));
    const bal = balance(); const sum = planSum();
    const done = doneList();
    return `<div class="page">
      <header class="hero"><div class="grow"><div class="sub">Kommt noch</div><h1>Geplant</h1></div>
        <div class="hero-actions"><button type="button" class="icon-btn glass primary" id="p-add" aria-label="Neue geplante Buchung">${svg('plus')}</button></div></header>
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
  const c = catById(t.cat); const isIn = t.kind === 'in';
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
    const due = t.planDue || t.date;
    const p = S.plans.find((x) => x.id === t.planId);
    // Automatische Monatsbuchung: nur dieses Mal als einmalige, manuelle Buchung zurücklegen
    if (p && !(p.auto && p.repeat === 'monthly')) { if (due < p.date) p.date = due; return; }
    const sn = t.planSnap || { kind: t.kind, amount: t.amount, cat: t.cat, title: t.title, payee: t.payee, acct: acctOf(t), repeat: 'none' };
    S.plans.push(Object.assign({ id: p ? uid() : t.planId, date: due }, sn, p ? { repeat: 'none' } : {}, { auto: false }));
  });
}
/* ================= Eintragen (Ausgabe · Einnahme · Rückzahlung · Geplant) ================= */
let F = null;
const KIND_TITLES = { out: 'Ausgabe', in: 'Einnahme', refund: 'Rückzahlung', transfer: 'Umbuchung' };
const fSign = () => (F.kind === 'out' ? { s: '−', c: 'neg' } : F.kind === 'transfer' ? { s: '', c: 'zero' } : { s: '+', c: 'pos' });
VIEWS.neu = {
  nav: null,
  init(arg) {
    const t = todayStr();
    F = { mode: 'tx', editId: null, kind: 'out', amt: '', cat: null, payee: '', title: '', date: t, month: curMonth(), plan: false, repeat: false, acct: 'online', acctSet: false };
    if (arg[0] === 'e') {
      const x = S.tx.find((q) => q.id === arg.slice(1));
      if (x) Object.assign(F, { editId: x.id, kind: x.kind, amt: centsToInput(x.amount), cat: x.cat, payee: x.payee || '', title: x.title || '', date: x.date, month: x.month || monthOf(x.date), acct: acctOf(x), acctSet: true });
    } else if (arg[0] === 'p' && arg.indexOf('plan-') !== 0) {
      const p = S.plans.find((q) => q.id === arg.slice(1));
      if (p) Object.assign(F, { mode: 'plan', editId: p.id, kind: p.kind, amt: centsToInput(p.amount), cat: p.cat, payee: p.payee || '', title: p.title || '', date: p.date, repeat: p.repeat === 'monthly', acct: p.acct || 'online', acctSet: true });
    } else if (arg.indexOf('plan-') === 0) {
      Object.assign(F, { mode: 'plan', kind: arg.slice(5) === 'in' ? 'in' : 'out', date: addDays(t, 7) });
    } else if (arg === 'lidl') {
      F.kind = 'out'; F.cat = 'c_lidl';
    } else if (KIND_TITLES[arg]) F.kind = arg;
    if (!F.editId && F.kind === 'refund') F.acct = 'bar'; // Geld zurück kommt meistens bar
    if (!F.cat || !S.cats.some((c) => c.id === F.cat)) F.cat = defaultCatOf(F.kind);
  },
  html() {
    const isPlan = F.mode === 'plan' || F.plan;
    const editing = !!F.editId;
    const title = (editing ? '' : 'Neue ') + (isPlan ? 'geplante ' : '') + KIND_TITLES[F.kind] + (editing ? ' bearbeiten' : '');
    const cats = catsOf(F.kind);
    const payees = Array.from(new Set(S.tx.filter((t) => t.kind === F.kind && t.payee).map((t) => t.payee).concat(F.kind === 'refund' ? S.people.map((p) => p.name) : []))).slice(0, 40);
    const showSnacks = F.kind === 'out' && F.cat === 'c_lidl' && !isPlan;
    return `<div class="page form-page">
      <div class="topbar-row">
        <button type="button" class="icon-btn glass" id="f-close" aria-label="Schließen">${svg('close')}</button>
        <h1 class="center">${title.charAt(0).toUpperCase() + title.slice(1)}</h1>
        ${editing ? `<button type="button" class="icon-btn glass danger-ic" id="f-del" aria-label="Löschen">${svg('trash')}</button>` : '<span class="spacer"></span>'}
      </div>
      ${editing ? '' : segHTML(F.mode === 'plan' ? [['out', 'Ausgabe'], ['in', 'Einnahme']] : [['out', 'Ausgabe'], ['in', 'Einnahme'], ['refund', 'Zurück'], ['transfer', 'Umbuchen']], F.kind, 'data-fk', 'aria-label="Art"')}
      <div class="amount-wrap">
        <div class="amount ${fSign().c}" id="f-amount" aria-live="polite">${fSign().s}${esc(F.amt || '0')}<span class="cur">€</span></div>
        <div class="hint" id="f-hint">${formHint()}</div>
      </div>
      ${F.kind === 'transfer' ? '' : `<div class="hscroll cat-pick no-swipe" role="radiogroup" aria-label="Kategorie">${cats.map((c) => `<button type="button" class="cat-chip${c.id === F.cat ? ' on' : ''}" data-fc="${c.id}" role="radio" aria-checked="${c.id === F.cat}" style="--c:${c.color}">${catIcon(c, 46)}<span>${esc(c.name)}</span></button>`).join('')}
        <button type="button" class="cat-chip add" id="f-newcat"><span class="cat-ic" style="--c:var(--sub);width:46px;height:46px">${svg('plus')}</span><span>Neu</span></button></div>`}
      ${showSnacks ? `<button type="button" class="link snack-link" id="f-snacks">${svg('croissant')}Snacks antippen</button>` : ''}
      <div class="fields">
        ${segHTML(F.kind === 'transfer' ? [['online', 'Konto → Bar'], ['bar', 'Bar → Konto']] : [['online', 'Online'], ['bar', 'Bar']], F.acct, 'data-fa', 'aria-label="Online oder bar"')}
        ${F.kind === 'transfer' ? '' : `<label class="field glass">${svg(F.kind === 'out' ? 'send' : 'people')}<span class="sr">${F.kind === 'out' ? 'An wen' : 'Von wem'}</span>
          <input id="f-payee" list="f-payees" placeholder="${F.kind === 'out' ? 'An wen? (Empfänger)' : F.kind === 'refund' ? 'Von wem? (z. B. Lena)' : 'Von wem? (z. B. Eltern)'}" value="${esc(F.payee)}" maxlength="60" autocomplete="off"></label>
        <datalist id="f-payees">${payees.map((p) => `<option value="${esc(p)}"></option>`).join('')}</datalist>`}
        ${F.kind === 'refund' ? '' : `<label class="field glass">${svg('tag')}<span class="sr">Bezeichnung</span><input id="f-title" placeholder="${F.kind === 'transfer' ? 'Bezeichnung (z. B. Abgehoben)' : 'Bezeichnung (z. B. Wocheneinkauf)'}" value="${esc(F.title)}" maxlength="60" autocomplete="off"></label>`}
        <div class="field-row">
          ${F.kind === 'refund' ? `<div class="field glass month-field" aria-label="Zählt für Monat">
            <button type="button" class="icon-btn sm plain" id="f-mprev" aria-label="Monat früher">${svg('back')}</button>
            <span class="grow center-txt"><span class="small">zählt für</span><span class="b">${monthName(F.month)}</span></span>
            <button type="button" class="icon-btn sm plain" id="f-mnext" aria-label="Monat später" ${F.month >= curMonth() ? 'disabled' : ''}>${svg('next')}</button></div>` : ''}
          <label class="field glass date-field">${svg('calendar')}<span class="sr">${isPlan ? 'Fällig am' : 'Datum'}</span><input id="f-date" type="date" value="${F.date}" ${isPlan ? '' : `max="${todayStr()}"`}></label>
        </div>
        ${!editing && F.mode !== 'plan' && F.kind !== 'refund' && F.kind !== 'transfer' ? `<button type="button" class="toggle-row glass" id="f-plan" aria-pressed="${F.plan}">${svg('calendar')}<span class="grow">Erst planen<span class="small block">Noch nicht bezahlt/bekommen – kommt in „Geplant“</span></span><span class="switch"></span></button>` : ''}
        ${isPlan ? `<button type="button" class="toggle-row glass" id="f-repeat" aria-pressed="${F.repeat}">${svg('repeat')}<span class="grow">Jeden Monat wiederholen</span><span class="switch"></span></button>` : ''}
      </div>
    </div>
    <div class="dock glass" id="dock">
      ${keypadHTML()}
      <button type="button" class="btn save" id="f-save" ${parseEur(F.amt) > 0 ? '' : 'disabled'}>${svg('check')}${isPlan ? 'Planen' : 'Speichern'}</button>
    </div>`;
  },
  mount() {
    const upd = () => {
      const a = $('#f-amount');
      a.innerHTML = `${fSign().s}${esc(F.amt || '0')}<span class="cur">€</span>`;
      a.classList.remove('bump'); void a.offsetWidth; a.classList.add('bump');
      $('#f-hint').innerHTML = formHint();
      $('#f-save').disabled = !(parseEur(F.amt) > 0);
    };
    $('#f-close').onclick = () => goBack();
    $$('.key').forEach((k) => k.onclick = () => { F.amt = pressKey(F.amt, k.dataset.key); upd(); });
    $$('[data-fk]').forEach((b) => b.onclick = () => {
      if (b.dataset.fk === F.kind) return;
      segMove(b);
      const old = F.kind; F.kind = b.dataset.fk;
      if ((old === 'in') !== (F.kind === 'in')) F.cat = defaultCatOf(F.kind);
      if (F.kind === 'refund' || F.kind === 'transfer') F.plan = false;
      if (!F.acctSet) F.acct = F.kind === 'refund' ? 'bar' : 'online';
      setTimeout(() => render(false), 150);
    });
    $$('[data-fa]').forEach((b) => b.onclick = () => { segMove(b); F.acct = b.dataset.fa; F.acctSet = true; $('#f-hint').innerHTML = formHint(); });
    $$('[data-fc]').forEach((b) => b.onclick = () => {
      F.cat = b.dataset.fc;
      $$('[data-fc]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
      $('#f-hint').innerHTML = formHint();
      if ((F.cat === 'c_lidl') !== !!$('#f-snacks')) render(false);
    });
    if ($('#f-newcat')) $('#f-newcat').onclick = () => catSheet(null, F.kind === 'in' ? 'in' : 'out', (id) => { F.cat = id; render(false); });
    if ($('#f-snacks')) $('#f-snacks').onclick = () => snackPicker((cents, names) => {
      F.amt = centsToInput(parseEur(F.amt) + cents);
      if (!F.title) F.title = names; else F.title += ', ' + names;
      render(false);
    });
    const p = $('#f-payee') || document.createElement('input');
    p.addEventListener('input', () => { F.payee = p.value; });
    p.addEventListener('change', () => {
      const rule = S.rules[F.payee.trim().toLowerCase()];
      if (rule && S.cats.some((c) => c.id === rule && c.kind === (F.kind === 'in' ? 'in' : 'out')) && rule !== F.cat) { F.cat = rule; render(false); }
    });
    if ($('#f-title')) $('#f-title').addEventListener('input', (e) => { F.title = e.target.value; });
    $('#f-date').addEventListener('change', (e) => { if (e.target.value) F.date = e.target.value; });
    if ($('#f-mprev')) {
      $('#f-mprev').onclick = () => { F.month = addMonth(F.month, -1); render(false); };
      $('#f-mnext').onclick = () => { if (F.month < curMonth()) { F.month = addMonth(F.month, 1); render(false); } };
    }
    if ($('#f-plan')) $('#f-plan').onclick = () => { F.plan = !F.plan; if (F.plan && F.date <= todayStr()) F.date = addDays(todayStr(), 7); if (!F.plan && F.date > todayStr()) F.date = todayStr(); render(false); };
    if ($('#f-repeat')) $('#f-repeat').onclick = () => { F.repeat = !F.repeat; render(false); };
    // Beim Tippen in Textfelder das Zahlenfeld ausblenden (die Tastatur braucht den Platz)
    bindDockAway();
    if ($('#f-del')) $('#f-del').onclick = () => deleteEntry();
    $('#f-save').onclick = (e) => saveEntry(e.currentTarget);
  }
};
function formHint() {
  const c = catById(F.cat); const amt = parseEur(F.amt);
  if (F.kind === 'transfer') return F.acct === 'online' ? 'Abheben: vom Konto ins Portemonnaie – zählt nicht als Ausgabe' : 'Einzahlen: vom Portemonnaie aufs Konto – zählt nicht als Einnahme';
  if (F.kind === 'refund') return `Wird von <b>${esc(c.name)}</b> im ${MONTHS[+F.month.slice(5) - 1]} abgezogen – zählt nicht als Einnahme`;
  if (F.kind === 'in') return F.mode === 'plan' || F.plan ? 'Kommt in „Geplant“, bis du es bestätigst' : 'Kommt zu deinem Kontostand dazu';
  if (F.mode === 'plan' || F.plan) return 'Kommt in „Geplant“, bis du es bestätigst';
  if (c.budget) {
    const r = rangeOf('m' + monthOf(F.date)); const st = stats(r.from, r.to);
    const used = ((st.outList.find((x) => x.cat.id === c.id) || {}).net || 0) - (F.editId ? ((S.tx.find((t) => t.id === F.editId) || {}).amount || 0) : 0);
    const rest = c.budget - used - amt;
    return `${esc(c.name)}: ${rest < 0 ? `<span class="neg">${money(-rest)} über dem Budget</span>` : `noch ${money(rest)} im Budget`}`;
  }
  return `Kategorie: <b>${esc(c.name)}</b>`;
}
function saveEntry(btn) {
  const amount = parseEur(F.amt);
  if (amount <= 0) return;
  const isPlan = F.mode === 'plan' || F.plan;
  const payee = F.payee.trim(); const title = (F.title || '').trim();
  const r = btn.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, F.kind === 'out' ? undefined : ['var(--pos)', '#F2C14E', '#2F6FD6']);
  vibrate(15);
  const c = catById(F.cat);
  let msg;
  if (isPlan) msg = F.editId ? 'Geplante Buchung gespeichert' : `Geplant: ${title || c.name}`;
  else if (F.kind === 'refund') msg = `${eur(amount)} von ${c.name} (${MONTHS[+F.month.slice(5) - 1]}) abgezogen`;
  else if (F.kind === 'transfer') msg = F.acct === 'online' ? `${eur(amount)} abgehoben` : `${eur(amount)} eingezahlt`;
  else msg = F.editId ? 'Gespeichert' : `${F.kind === 'in' ? '+' : '−'}${eur(amount)} eingetragen`;
  commit(msg, () => {
    if (payee && F.kind !== 'refund' && F.kind !== 'transfer') S.rules[payee.toLowerCase()] = F.cat;
    if (isPlan) {
      const data = { kind: F.kind === 'in' ? 'in' : 'out', amount, cat: F.cat, title, payee, date: F.date, repeat: F.repeat ? 'monthly' : 'none', acct: F.acct };
      if (F.mode === 'plan' && F.editId) Object.assign(S.plans.find((p) => p.id === F.editId), data);
      else S.plans.push(Object.assign({ id: uid(), auto: false }, data));
    } else {
      const data = F.kind === 'transfer'
        ? { kind: 'transfer', amount, cat: null, title: title || (F.acct === 'online' ? 'Abgehoben' : 'Eingezahlt'), payee: '', date: F.date, acct: F.acct, to: F.acct === 'online' ? 'bar' : 'online' }
        : { kind: F.kind, amount, cat: F.cat, title: F.kind === 'refund' ? (title || 'Rückzahlung') : title, payee, date: F.date, acct: F.acct };
      if (F.kind === 'refund') data.month = F.month;
      if (F.editId) { const t = S.tx.find((x) => x.id === F.editId); Object.assign(t, data); if (F.kind !== 'refund') delete t.month; if (F.kind !== 'transfer') delete t.to; }
      else S.tx.push(Object.assign({ id: uid(), ts: Date.now() }, data));
    }
  }, { after: () => { if (!isPlan) bKey = keyFor(bKey[0], F.date); goBack(); } });
}
function deleteEntry() {
  const isPlan = F.mode === 'plan';
  confirmSheet(isPlan ? 'Geplante Buchung löschen?' : 'Buchung löschen?', 'Das kannst du danach noch rückgängig machen.', 'Löschen', () => {
    commit('Gelöscht', () => {
      if (isPlan) S.plans = S.plans.filter((p) => p.id !== F.editId);
      else S.tx = S.tx.filter((t) => t.id !== F.editId);
    }, { after: () => goBack() });
  });
}
/** Zahlenfeld weg, solange getippt wird – zurück, sobald die Tastatur zugeht oder Enter gedrückt wird */
let vvHandler = null;
function bindDockAway() {
  const dock = $('#dock'); if (!dock) return;
  const show = () => { const d = $('#dock'); if (d) d.classList.remove('away'); };
  $$('.fields input:not([type="date"])').forEach((inp) => {
    inp.setAttribute('enterkeyhint', 'done');
    inp.addEventListener('focus', () => dock.classList.add('away'));
    inp.addEventListener('blur', () => setTimeout(() => { const a = document.activeElement; if (!a || !a.closest || !a.closest('.fields')) show(); }, 60));
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); show(); } });
  });
  if (window.visualViewport) {
    if (vvHandler) window.visualViewport.removeEventListener('resize', vvHandler);
    let maxH = window.visualViewport.height;
    vvHandler = () => {
      const h = window.visualViewport.height; maxH = Math.max(maxH, h);
      if (h > maxH * 0.85) { const a = document.activeElement; if (a && a.closest && a.closest('.fields')) a.blur(); show(); }
    };
    window.visualViewport.addEventListener('resize', vvHandler);
  }
}

/** Snacks antippen → Betrag und Bezeichnung */
function snackPicker(onDone) {
  const cart = {};
  const prods = S.products.slice().sort((a, b) => (b.fav ? 1 : 0) - (a.fav ? 1 : 0));
  openSheet('<h2>Snacks antippen</h2><div id="sn-body"></div>', (el) => {
    const draw = () => {
      let sum = 0; const names = [];
      prods.forEach((p) => { const q = cart[p.id] || 0; if (q) { sum += q * p.price; names.push((q > 1 ? q + '× ' : '') + p.name); } });
      $('#sn-body', el).innerHTML = `<div class="grid3">${prods.map((p) => { const q = cart[p.id] || 0; return `<div class="tile"><button type="button" class="tile-main${q ? ' on' : ''}" data-sn="${p.id}">
        <span class="tile-img">${p.photo ? `<img src="${p.photo}" alt="">` : svg(p.icon || 'snack')}</span><span class="tile-name">${esc(p.name)}</span><span class="tile-price">${eur(p.price)}</span></button>
        ${q ? `<span class="qty">${q}×</span><button type="button" class="less" data-snl="${p.id}" aria-label="Eins weniger">−</button>` : ''}</div>`; }).join('')}</div>
        <button type="button" class="btn" id="sn-ok" style="margin-top:12px" ${sum ? '' : 'disabled'}>${svg('check')}${sum ? eur(sum) + ' übernehmen' : 'Übernehmen'}</button>`;
      $$('[data-sn]', el).forEach((b) => b.onclick = () => { cart[b.dataset.sn] = (cart[b.dataset.sn] || 0) + 1; draw(); });
      $$('[data-snl]', el).forEach((b) => b.onclick = () => { cart[b.dataset.snl] = Math.max(0, (cart[b.dataset.snl] || 0) - 1); draw(); });
      $('#sn-ok', el).onclick = () => { closeSheet(); onDone(sum, names.join(', ')); };
    };
    draw();
  });
}
