/* Geld – Einstellungen, Kategorien, Kontostand, Import, Backup, Schulden (optional) */
'use strict';

/* ================= Einstellungen ================= */
VIEWS.einstellungen = {
  nav: null,
  html() {
    const st = S.settings; const bal = balance();
    const lb = st.lastBackup ? new Date(st.lastBackup).toLocaleDateString('de-DE') : 'noch nie';
    const tog = (id, on, icon, label, sub) => `<button type="button" class="toggle-row" id="${id}" aria-pressed="${!!on}">${svg(icon)}<span class="grow">${label}${sub ? `<span class="small block">${sub}</span>` : ''}</span><span class="switch"></span></button>`;
    return `<div class="page">
      <div class="topbar-row"><button type="button" class="icon-btn glass" id="back" aria-label="Zurück">${svg('back')}</button><h1 class="center">Einstellungen</h1><span class="spacer"></span></div>

      <section class="card glass pad-s">
        <h2 class="h2">Aussehen</h2>
        ${segHTML([['auto', 'Wie Handy'], ['light', 'Hell'], ['dark', 'Dunkel']], st.theme, 'data-theme-pick', 'aria-label="Hell oder dunkel"')}
        ${tog('s-glass', st.glass !== false, 'sparkle', 'Glas-Effekt', 'Milchglas hinter den Karten. Ausschalten, falls es auf dem Handy ruckelt.')}
        ${tog('s-motion', st.motion !== false, 'bolt', 'Animationen')}
      </section>

      <section class="card glass pad-s">
        <h2 class="h2">Verstecken</h2>
        ${tog('s-priv', st.privacy, 'eyeOff', 'Zu bestimmten Zeiten verstecken', 'In den Zeitfenstern sind Kontostand und große Beträge versteckt (z. B. in der Schule). Sonst ist alles sichtbar. Das Auge oben versteckt jederzeit von Hand.')}
        ${st.privacy ? `<div class="label">Beträge verstecken</div>
        <div class="chips" style="padding:2px 2px 6px">${[2000, 5000, 10000, 0].map((v) => `<button type="button" class="chip${st.privacyLimit === v ? ' on' : ''}" data-plim="${v}">${v ? 'über ' + v / 100 + ' €' : 'alle Beträge'}</button>`).join('')}</div>
        <div class="label">Zeitfenster</div>
        <div class="hw-list">${[1, 2, 3, 4, 5, 6, 0].map((wd) => { const wins = st.hideWin[wd] || []; return `<div class="hw-day${wins.length ? '' : ' off'}">
          <span class="hw-name">${WD_L[wd].slice(0, 2)}</span>
          <span class="hw-wins">${wins.length ? wins.map((w, i) => `<span class="hw-win"><input type="time" value="${esc(w[0])}" data-hw="${wd}:${i}:0" aria-label="${WD_L[wd]} von"><span>–</span><input type="time" value="${esc(w[1])}" data-hw="${wd}:${i}:1" aria-label="${WD_L[wd]} bis"><button type="button" class="hw-x" data-hwdel="${wd}:${i}" aria-label="Zeitfenster löschen">${svg('close')}</button></span>`).join('') : '<span class="small">immer sichtbar</span>'}</span>
          <button type="button" class="hw-add" data-hwadd="${wd}" aria-label="Zeitfenster für ${WD_L[wd]} hinzufügen">${svg('plus')}</button>
        </div>`; }).join('')}</div>
        <p class="small" style="margin:6px 2px 2px">${inHideWindow() ? 'Gerade ist ein Zeitfenster aktiv.' : 'Gerade ist kein Zeitfenster aktiv.'}</p>` : ''}
      </section>

      <section class="card glass pad-s">
        <h2 class="h2">Sicherheit</h2>
        ${tog('s-lock', st.lock, 'lock', 'App-Sperre mit Fingerabdruck', 'Beim Öffnen fragt die App nach Fingerabdruck (oder Handy-PIN).')}
        ${st.lock ? `<div class="chips" style="padding:2px 2px 8px">${[[0, 'Sofort'], [60, 'nach 1 Min'], [300, 'nach 5 Min']].map(([v, l]) => `<button type="button" class="chip${st.lockDelay === v ? ' on' : ''}" data-ldel="${v}">${l}</button>`).join('')}</div>` : ''}
        ${tog('s-rbio', st.revealBio !== false, 'finger', 'Aufdecken mit Fingerabdruck', 'Versteckte Beträge zeigen sich erst nach dem Fingerabdruck.')}
        ${isNative() ? '' : '<p class="small" style="margin:4px 2px">Fingerabdruck gibt es nur in der installierten App.</p>'}
      </section>

      <section class="card glass pad-s">
        <h2 class="h2">Erinnerungen</h2>
        ${tog('s-remind', st.remind, 'bell', 'Bei Fälligkeit erinnern', 'Mitteilung, wenn eine geplante Buchung fällig ist – mit „Bezahlt“-Knopf.')}
        ${st.remind ? `<label class="field glass time-field"><span class="grow">Uhrzeit</span><input type="time" id="s-rtime" value="${esc(st.remindTime || '09:00')}"></label>` : ''}
        ${isNative() ? '' : '<p class="small" style="margin:4px 2px">Mitteilungen gibt es nur in der installierten App.</p>'}
      </section>

      <section class="card glass pad-s">
        <h2 class="h2">Kontostand</h2>
        <button type="button" class="row" id="s-bal">${catIcon({ color: 'var(--accent)', icon: 'bank' }, 42)}<span class="grow"><span class="r-title">${bal === null ? 'Noch nicht eingerichtet' : 'Kontostand korrigieren'}</span><span class="r-sub">${bal === null ? 'Einmal den echten Kontostand eintragen' : 'Aktuell ' + money(bal, { force: true })}</span></span>${svg('next')}</button>
        <button type="button" class="row" id="s-import">${catIcon({ color: '#2F6FD6', icon: 'upload' }, 42)}<span class="grow"><span class="r-title">Kontoauszug importieren</span><span class="r-sub">CSV aus dem VR-Banking – schon Eingetragenes wird erkannt</span></span>${svg('next')}</button>
      </section>

      <section class="card glass pad-s">
        <h2 class="h2">Kategorien</h2>
        <button type="button" class="row" id="s-cat-out">${catIcon({ color: '#E8902E', icon: 'cart' }, 42)}<span class="grow"><span class="r-title">Ausgaben-Kategorien & Budgets</span><span class="r-sub">${catsOf('out').length} Kategorien</span></span>${svg('next')}</button>
        <button type="button" class="row" id="s-cat-in">${catIcon({ color: '#3E8E5E', icon: 'piggy' }, 42)}<span class="grow"><span class="r-title">Einnahme-Quellen</span><span class="r-sub">${catsOf('in').length} Quellen</span></span>${svg('next')}</button>
        <button type="button" class="row" id="s-snacks">${catIcon({ color: '#C99A1E', icon: 'croissant' }, 42)}<span class="grow"><span class="r-title">Snacks & Preise</span><span class="r-sub">Für „Snacks antippen“ bei Lidl</span></span>${svg('next')}</button>
      </section>

      <section class="card glass pad-s">
        <h2 class="h2">Extras</h2>
        ${tog('s-debts', st.debts, 'people', 'Schulden & Mitbringen', 'Zusätzlicher Tab: wer dir was schuldet, Mitgebrachtes und Zahlungen von Freunden.')}
        ${tog('s-jump', st.jumpHome !== false, 'home', 'Nach einer Pause zur Startseite', 'Öffnest du die App nach mehr als 2 Minuten wieder, landest du auf Start.')}
      </section>

      <section class="card glass pad-s stack-btns">
        <h2 class="h2">Daten</h2>
        <p class="small" style="margin:0 2px">Alles bleibt nur auf diesem Gerät. Letztes Backup: <b>${lb}</b></p>
        <div class="label">Automatisch ans Backup erinnern</div>
        <div class="chips" style="padding:2px 2px 6px">${[[0, 'Aus'], [7, 'Wöchentlich'], [30, 'Monatlich']].map(([v, l]) => `<button type="button" class="chip${(st.backupEvery || 0) === v ? ' on' : ''}" data-bkp="${v}">${l}</button>`).join('')}</div>
        <button type="button" class="btn ghost" id="s-export">${svg('download')}Backup speichern</button>
        <label class="btn ghost" style="cursor:pointer">${svg('upload')}Backup laden<input type="file" id="s-import-file" accept=".json,application/json" class="sr"></label>
        ${S.demo ? `<button type="button" class="btn ghost" id="s-demo">${svg('sparkle')}Beispieldaten löschen</button>` : ''}
        <button type="button" class="btn danger" id="s-wipe">${svg('trash')}Alle Daten löschen</button>
      </section>
      <p class="small center-txt">Geld · Version 3.0${window.BUILD && window.BUILD !== 'dev' ? ' · Build ' + esc(window.BUILD) : ''} · offline</p>
    </div>`;
  },
  mount() {
    const st = S.settings;
    const set = (k, v) => { st[k] = v; save(); render(false); };
    $('#back').onclick = () => goBack();
    $$('[data-theme-pick]').forEach((b) => b.onclick = () => { segMove(b); setTimeout(() => set('theme', b.dataset.themePick), 160); });
    $('#s-glass').onclick = () => set('glass', st.glass === false);
    $('#s-motion').onclick = () => set('motion', st.motion === false);
    $('#s-priv').onclick = () => set('privacy', !st.privacy);
    $$('[data-plim]').forEach((b) => b.onclick = () => set('privacyLimit', +b.dataset.plim));
    const hw = () => { st.hideWin = Object.assign({}, st.hideWin); return st.hideWin; };
    $$('[data-hw]').forEach((inp) => inp.addEventListener('change', () => {
      const [wd, i, k] = inp.dataset.hw.split(':').map(Number);
      if (!inp.value) return;
      hw()[wd][i][k] = inp.value; save();
    }));
    $$('[data-hwdel]').forEach((b) => b.onclick = () => { const [wd, i] = b.dataset.hwdel.split(':').map(Number); hw()[wd] = (st.hideWin[wd] || []).filter((_, j) => j !== i); save(); render(false); });
    $$('[data-hwadd]').forEach((b) => b.onclick = () => { const wd = +b.dataset.hwadd; const l = (st.hideWin[wd] || []).slice(); l.push(l.length ? ['14:00', '16:00'] : ['07:45', '13:15']); hw()[wd] = l; save(); render(false); });
    $('#s-lock').onclick = async () => {
      if (!st.lock && isNative()) {
        const B = plugin('NativeBiometric');
        const a = B ? await B.isAvailable({ useFallback: true }).catch(() => null) : null;
        if (!a || !a.isAvailable) { toast('Am Handy ist keine Bildschirmsperre / kein Fingerabdruck eingerichtet'); return; }
        if (!(await bioAuth('App-Sperre einschalten'))) return;
      }
      set('lock', !st.lock);
    };
    $$('[data-ldel]').forEach((b) => b.onclick = () => set('lockDelay', +b.dataset.ldel));
    $('#s-rbio').onclick = () => set('revealBio', st.revealBio === false);
    $('#s-remind').onclick = async () => {
      const on = !st.remind;
      if (on && !(await notifPermission(true))) toast('Mitteilungen sind für Geld ausgeschaltet');
      set('remind', on); syncNotifications();
    };
    if ($('#s-rtime')) $('#s-rtime').addEventListener('change', (e) => { if (e.target.value) { st.remindTime = e.target.value; save(); syncNotifications(); } });
    $$('[data-bkp]').forEach((b) => b.onclick = () => { set('backupEvery', +b.dataset.bkp); syncNotifications(); });
    $('#s-bal').onclick = () => balanceSheet();
    $('#s-import').onclick = () => go('import');
    $('#s-cat-out').onclick = () => go('kategorien/out');
    $('#s-cat-in').onclick = () => go('kategorien/in');
    $('#s-snacks').onclick = () => go('snacks');
    $('#s-debts').onclick = () => set('debts', !st.debts);
    $('#s-jump').onclick = () => set('jumpHome', st.jumpHome === false);
    $('#s-export').onclick = exportBackup;
    $('#s-import-file').addEventListener('change', (e) => importBackup(e.target.files[0]));
    if ($('#s-demo')) $('#s-demo').onclick = () => clearDemo();
    $('#s-wipe').onclick = () => confirmSheet('Wirklich alles löschen?', 'Alle Buchungen, Pläne, Kategorien und Personen werden gelöscht. Mach vorher besser ein Backup.', 'Alles löschen',
      () => commit('Alles gelöscht', () => { S = defaults(); }, { after: () => tabTo('start') }));
  }
};
function clearDemo() {
  confirmSheet('Beispieldaten löschen?', 'Alle Beispiel-Buchungen, -Pläne und -Personen werden entfernt.', 'Leeren', () => {
    commit('Leer – los geht’s!', () => {
      const keep = S.settings; S = defaults(); S.settings = Object.assign(keep, { startBalance: null, startDate: null, startTs: 0, debts: false }); S.demo = false;
    }, { undo: false, after: () => tabTo('start') });
  });
}

/* ================= Kontostand ================= */
function balanceSheet() {
  const on = balanceOf('online'); const bar = balanceOf('bar');
  const cur = balance();
  openSheet(`<h2>${cur === null ? 'Kontostand einrichten' : 'Kontostand korrigieren'}</h2>
    <p class="muted" style="margin:0">Trag ein, was <b>jetzt</b> auf dem Konto und im Portemonnaie ist. Ab dann rechnet die App alles Neue dazu oder ab. Leer lassen = nicht ändern.</p>
    <div class="label">Konto (online)</div>
    <label class="field glass"><span class="sr">Kontostand online in Euro</span>${svg('bank')}<input id="b-amt" inputmode="decimal" placeholder="z. B. 523,40" value="${on === null ? '' : centsToInput(on)}"><span class="unit">€</span></label>
    <div class="label">Bargeld</div>
    <label class="field glass"><span class="sr">Bargeld in Euro</span>${svg('banknote')}<input id="b-cash" inputmode="decimal" placeholder="z. B. 35" value="${bar === null ? '' : centsToInput(bar)}"><span class="unit">€</span></label>
    <p class="small" style="margin:0 4px">Bei einem Minus ein „−“ davor schreiben. Was du schon eingetragen hast, bleibt erhalten.</p>
    <button type="button" class="btn" id="b-save">${svg('check')}Speichern</button>`,
  (el) => {
    setTimeout(() => { const i = $(on === null ? '#b-amt' : '#b-cash', el); if (i) i.focus(); }, 80);
    $('#b-save', el).onclick = () => {
      const raw = $('#b-amt', el).value.trim(); const rawC = $('#b-cash', el).value.trim();
      if (!raw && !rawC) { $('#b-amt', el).focus(); return; }
      closeSheet();
      commit('Kontostand gespeichert', () => {
        if (raw && parseEur(raw) !== on) setBalanceAnchor(parseEur(raw));
        if (rawC && parseEur(rawC) !== bar) setCashAnchor(parseEur(rawC));
      });
    };
  });
}

/* ================= Kategorien ================= */
VIEWS.kategorien = {
  nav: null,
  html(kind) {
    const isIn = kind === 'in';
    const list = catsOf(isIn ? 'in' : 'out');
    const r = rangeOf(keyFor('m')); const st = stats(r.from, r.to);
    return `<div class="page">
      <div class="topbar-row"><button type="button" class="icon-btn glass" id="back" aria-label="Zurück">${svg('back')}</button><h1 class="center">${isIn ? 'Einnahme-Quellen' : 'Kategorien'}</h1>
        <button type="button" class="icon-btn glass primary" id="c-add" aria-label="Neu">${svg('plus')}</button></div>
      <p class="small" style="margin:0 6px">${isIn ? 'Woher dein Geld kommt. Rückzahlungen von Freunden zählen hier nicht.' : 'Tippe eine Kategorie an, um Name, Symbol, Farbe oder das Monats-Budget zu ändern.'}</p>
      <section class="card glass pad-s">
        ${list.map((c, i) => {
    const used = isIn ? 0 : Math.max(0, ((st.outList.find((x) => x.cat.id === c.id) || {}).net) || 0);
    return `<button type="button" class="row cat-row" data-ce="${c.id}" style="--i:${i}">${catIcon(c, 44)}<span class="grow"><span class="r-title">${esc(c.name)}</span>
            <span class="r-sub">${isIn ? 'Einnahme-Quelle' : c.budget ? `Budget ${money(c.budget)} · diesen Monat ${money(used)}` : 'kein Budget'}</span>
            ${!isIn && c.budget ? `<span class="bar"><i style="width:${clamp(Math.round(used / c.budget * 100), 0, 100)}%;background:${used > c.budget ? 'var(--neg)' : c.color}"></i></span>` : ''}</span>${svg('next')}</button>`;
  }).join('')}
      </section>
    </div>`;
  },
  mount(kind) {
    $('#back').onclick = () => goBack();
    $('#c-add').onclick = () => catSheet(null, kind === 'in' ? 'in' : 'out');
    $$('[data-ce]').forEach((b) => b.onclick = () => catSheet(b.dataset.ce));
  }
};
/** Kategorie anlegen/bearbeiten: Name, Symbol, Farbe, Budget */
function catSheet(id, kind, onCreated) {
  const c = id ? S.cats.find((x) => x.id === id) : null;
  const k = c ? c.kind : (kind || 'out');
  const d = { name: c ? c.name : '', icon: c ? c.icon : (k === 'in' ? 'coins' : 'tag'), color: c ? c.color : COLORS[S.cats.length % COLORS.length], photo: c ? c.photo || '' : '', budget: c ? centsToInput(c.budget || 0) : '' };
  const used = S.tx.filter((t) => t.cat === id).length + S.plans.filter((p) => p.cat === id).length;
  openSheet(`<div id="cs-body"></div>`, (el) => {
    const draw = () => {
      $('#cs-body', el).innerHTML = `
        <div class="cs-head">${catIcon({ color: d.color, icon: d.icon, photo: d.photo }, 58, 'id="cs-prev"')}<div class="grow"><h2>${c ? 'Kategorie bearbeiten' : k === 'in' ? 'Neue Einnahme-Quelle' : 'Neue Kategorie'}</h2><span class="small">${k === 'in' ? 'Einnahme' : 'Ausgabe'}</span></div></div>
        <label class="field glass"><span class="sr">Name</span>${svg('tag')}<input id="cs-name" placeholder="Name, z. B. Monster" value="${esc(d.name)}" maxlength="24" autocomplete="off"></label>
        <div class="label">Eigenes Bild</div>
        <div class="photo-btns">
          <label class="btn ghost">${svg('camera')}Kamera<input type="file" accept="image/*" capture="environment" class="sr" data-cphoto></label>
          <label class="btn ghost">${svg('image')}Galerie<input type="file" accept="image/*" class="sr" data-cphoto></label>
          ${d.photo ? `<button type="button" class="btn ghost icon-only" id="cs-nophoto" aria-label="Bild entfernen">${svg('trash')}</button>` : ''}
        </div>
        <div class="label">Symbol${d.photo ? ' <span class="small">(statt Bild)</span>' : ''}</div>
        <div class="icon-grid">${PICK_ICONS.map((ic) => `<button type="button" class="ig${ic === d.icon ? ' on' : ''}" data-ic="${ic}" aria-label="Symbol ${ic}" style="--c:${d.color}">${svg(ic)}</button>`).join('')}</div>
        <div class="label">Farbe</div>
        <div class="swatches">${COLORS.map((col) => `<button type="button" class="swatch${col === d.color ? ' on' : ''}" data-col="${col}" style="background:${col}" aria-label="Farbe ${col}"></button>`).join('')}</div>
        ${k === 'out' ? `<label class="field glass"><span class="sr">Budget pro Monat</span>${svg('target')}<input id="cs-budget" inputmode="decimal" placeholder="Budget pro Monat (leer = keins)" value="${esc(d.budget)}"><span class="unit">€ / Monat</span></label>` : ''}
        <button type="button" class="btn" id="cs-save">${svg('check')}Speichern</button>
        ${c ? `<button type="button" class="btn danger" id="cs-del">${svg('trash')}Löschen${used ? ` (${used} Einträge → Sonstiges)` : ''}</button>` : ''}`;
      const keep = () => { d.name = $('#cs-name', el).value; if ($('#cs-budget', el)) d.budget = $('#cs-budget', el).value; };
      $$('[data-ic]', el).forEach((b) => b.onclick = () => { keep(); d.icon = b.dataset.ic; draw(); });
      $$('[data-col]', el).forEach((b) => b.onclick = () => { keep(); d.color = b.dataset.col; draw(); });
      $$('[data-cphoto]', el).forEach((inp) => inp.addEventListener('change', async () => {
        const f = inp.files && inp.files[0]; if (!f) return;
        keep();
        try { d.photo = await resizeImage(f, 160); draw(); } catch (e) { toast('Bild konnte nicht geladen werden'); }
      }));
      if ($('#cs-nophoto', el)) $('#cs-nophoto', el).onclick = () => { keep(); d.photo = ''; draw(); };
      $('#cs-save', el).onclick = () => {
        keep();
        const name = d.name.trim();
        if (!name) { $('#cs-name', el).focus(); return; }
        const budget = k === 'out' ? parseEur(d.budget) : 0;
        closeSheet();
        let newId = null;
        commit(c ? 'Kategorie gespeichert' : name + ' angelegt', () => {
          if (c) { Object.assign(c, { name, icon: d.icon, color: d.color, budget }); if (d.photo) c.photo = d.photo; else delete c.photo; }
          else {
            newId = (k === 'in' ? 'i_' : 'c_') + uid();
            const at = S.cats.findIndex((x) => x.kind === k && /^(c|i)_sonst$/.test(x.id));
            const cat = { id: newId, kind: k, name, icon: d.icon, color: d.color, budget }; if (d.photo) cat.photo = d.photo;
            if (at >= 0) S.cats.splice(at, 0, cat); else S.cats.push(cat);
          }
        }, { after: () => { if (newId && onCreated) onCreated(newId); else render(false); } });
      };
      if (c) $('#cs-del', el).onclick = () => {
        if (catsOf(k).length <= 1) { toast('Die letzte Kategorie kann nicht gelöscht werden'); return; }
        closeSheet();
        commit(c.name + ' gelöscht', () => {
          let target = S.cats.find((x) => x.kind === k && x.id !== c.id && /^(c|i)_sonst$/.test(x.id));
          if (!target) target = S.cats.find((x) => x.kind === k && x.id !== c.id);
          S.tx.forEach((t) => { if (t.cat === c.id) t.cat = target.id; });
          S.plans.forEach((p) => { if (p.cat === c.id) p.cat = target.id; });
          Object.keys(S.rules).forEach((key) => { if (S.rules[key] === c.id) delete S.rules[key]; });
          S.cats = S.cats.filter((x) => x.id !== c.id);
        }, { after: () => { if (route().name === 'kat') goBack(); else render(false); } });
      };
    };
    draw();
  });
}

/* ================= Snacks & Preise ================= */
VIEWS.snacks = {
  nav: null,
  html() {
    return `<div class="page">
      <div class="topbar-row"><button type="button" class="icon-btn glass" id="back" aria-label="Zurück">${svg('back')}</button><h1 class="center">Snacks & Preise</h1>
        <button type="button" class="icon-btn glass primary" id="sn-add" aria-label="Neuer Snack">${svg('plus')}</button></div>
      <section class="card glass pad-s">${S.products.map((p, i) => `<button type="button" class="row" data-prod="${p.id}" style="--i:${i}">
        <span class="thumb">${p.photo ? `<img src="${p.photo}" alt="">` : svg(p.icon || 'snack')}</span>
        <span class="grow"><span class="r-title ell">${esc(p.name)}${p.fav ? ' ' + svg('star', 'class="star-mini"') : ''}</span></span><span class="b">${eur(p.price)}</span></button>`).join('')}</section>
    </div>`;
  },
  mount() {
    $('#back').onclick = () => goBack();
    $('#sn-add').onclick = () => productSheet(null);
    $$('[data-prod]').forEach((b) => b.onclick = () => productSheet(b.dataset.prod));
  }
};
function productSheet(id) {
  const p = id ? S.products.find((x) => x.id === id) : null;
  const d = { name: p ? p.name : '', price: p ? centsToInput(p.price) : '', icon: p ? p.icon : 'snack', photo: p ? p.photo || null : null, fav: p ? !!p.fav : false };
  openSheet('<div id="ps-body"></div>', (el) => {
    const draw = () => {
      $('#ps-body', el).innerHTML = `<h2>${p ? 'Snack bearbeiten' : 'Neuer Snack'}</h2>
        <div style="display:flex;gap:12px;align-items:center">
          <span class="tile-img" style="width:72px;height:72px;border-radius:22px">${d.photo ? `<img src="${d.photo}" alt="">` : svg(d.icon, 'style="width:44px;height:44px"')}</span>
          <div class="grow" style="display:flex;flex-direction:column;gap:8px">
            <label class="btn ghost" style="min-height:44px;cursor:pointer">${svg('camera')}Foto machen<input type="file" accept="image/*" capture="environment" class="sr" data-photo></label>
            <label class="btn ghost" style="min-height:44px;cursor:pointer">${svg('image')}Aus Galerie<input type="file" accept="image/*" class="sr" data-photo></label>
          </div>
        </div>
        ${d.photo ? '<button type="button" class="link" id="ps-nophoto">Foto entfernen</button>' : `<div class="icon-grid small-grid">${PRODUCT_ICONS.map((ic) => `<button type="button" class="ig${d.icon === ic ? ' on' : ''}" data-pi="${ic}" style="--c:#C99A1E" aria-label="Symbol ${ic}">${svg(ic)}</button>`).join('')}</div>`}
        <label class="field glass"><span class="sr">Name</span><input id="ps-name" placeholder="Name" value="${esc(d.name)}" maxlength="40"></label>
        <label class="field glass"><span class="sr">Preis</span><input id="ps-price" inputmode="decimal" placeholder="Preis" value="${esc(d.price)}"><span class="unit">€</span></label>
        <button type="button" class="toggle-row glass" id="ps-fav" aria-pressed="${d.fav}">${svg('star')}<span class="grow">Favorit (steht ganz vorne)</span><span class="switch"></span></button>
        <button type="button" class="btn" id="ps-save">${svg('check')}Speichern</button>
        ${p ? `<button type="button" class="btn danger" id="ps-del">${svg('trash')}Snack löschen</button>` : ''}`;
      const keep = () => { d.name = $('#ps-name', el).value; d.price = $('#ps-price', el).value; };
      $$('[data-photo]', el).forEach((inp) => inp.addEventListener('change', async () => {
        const f = inp.files[0]; if (!f) return; keep();
        try { d.photo = await resizeImage(f, 192); } catch (e) { toast('Foto konnte nicht geladen werden'); }
        draw();
      }));
      if ($('#ps-nophoto', el)) $('#ps-nophoto', el).onclick = () => { keep(); d.photo = null; draw(); };
      $$('[data-pi]', el).forEach((b) => b.onclick = () => { keep(); d.icon = b.dataset.pi; draw(); });
      $('#ps-fav', el).onclick = () => { keep(); d.fav = !d.fav; draw(); };
      $('#ps-save', el).onclick = () => {
        keep(); const name = d.name.trim(); if (!name) { $('#ps-name', el).focus(); return; }
        closeSheet();
        commit('Snack gespeichert', () => {
          const data = { name, price: parseEur(d.price), icon: d.icon, photo: d.photo || undefined, fav: d.fav };
          if (p) Object.assign(p, data); else S.products.push(Object.assign({ id: uid() }, data));
        });
      };
      if (p) $('#ps-del', el).onclick = () => { closeSheet(); commit('Snack gelöscht', () => { S.products = S.products.filter((x) => x.id !== p.id); }); };
    };
    draw();
  });
}
function resizeImage(file, size) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas'); cv.width = size; cv.height = size;
      const s = Math.min(img.naturalWidth, img.naturalHeight);
      cv.getContext('2d').drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url); resolve(cv.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Bild')); };
    img.src = url;
  });
}

/* ================= Backup ================= */
const plugin = (n) => (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[n]) || null;
async function exportBackup() {
  S.settings.lastBackup = Date.now(); save();
  const json = JSON.stringify(S, null, 1);
  const name = `geld-backup-${todayStr()}.json`;
  if (isNative() && plugin('Filesystem') && plugin('Share')) {
    try {
      const res = await plugin('Filesystem').writeFile({ path: name, data: json, directory: 'CACHE', encoding: 'utf8' });
      await plugin('Share').share({ title: 'Geld-Backup', files: [res.uri], dialogTitle: 'Backup speichern unter …' });
      toast('Backup erstellt'); render(false); return;
    } catch (e) { if (/cancel/i.test(String(e && e.message))) return; }
  }
  // Browser/Artefakt: Datei versuchen und den Text zum Kopieren anbieten
  try {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  } catch (e) { /* im Artefakt gesperrt */ }
  openSheet(`<h2>Backup</h2><p class="muted" style="margin:0">Falls kein Download gestartet ist: Text kopieren und z. B. in einer Notiz speichern.</p>
    <textarea id="bk-text" readonly>${esc(json)}</textarea><button type="button" class="btn" id="bk-copy">${svg('copy')}Text kopieren</button>`,
  (el) => { $('#bk-copy', el).onclick = async () => { try { await navigator.clipboard.writeText(json); toast('Kopiert'); } catch (e) { $('#bk-text', el).select(); toast('Markiert – jetzt kopieren'); } }; });
  render(false);
}
function importBackup(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    let data;
    try { data = JSON.parse(r.result); } catch (e) { toast('Das ist keine Backup-Datei'); return; }
    if (!data || !(data.v === 2 || (data.v === 1 && Array.isArray(data.accounts)))) { toast('Das ist keine Backup-Datei'); return; }
    confirmSheet('Backup laden?', 'Alles, was gerade in der App ist, wird durch das Backup ersetzt.', 'Laden',
      () => commit('Backup geladen', () => { S = data.v === 2 ? normalize(data) : migrateV1(data); }, { after: () => tabTo('start') }));
  };
  r.readAsText(file);
}

/* ================= Kontoauszug-Import (CSV) ================= */
let imp = null; // { rows, saldo, useSaldo }
VIEWS.import = {
  nav: null,
  html() {
    if (!imp) {
      return `<div class="page">
        <div class="topbar-row"><button type="button" class="icon-btn glass" id="back" aria-label="Zurück">${svg('back')}</button><h1 class="center">Kontoauszug</h1><span class="spacer"></span></div>
        <section class="card glass pad stack">
          <div class="b">So geht's</div>
          <ol class="small steps"><li>Im Online-Banking der VR-Bank die Umsätze öffnen.</li><li>Zeitraum wählen und als <b>CSV</b> exportieren.</li><li>Die Datei hier auswählen – sie wird nur auf dem Gerät gelesen.</li></ol>
          <label class="btn" style="cursor:pointer">${svg('upload')}CSV-Datei wählen<input type="file" id="csv" accept=".csv,text/csv,text/plain" class="sr"></label>
          <p class="small" style="margin:0">Schon eingetragene Buchungen (gleicher Betrag, ähnliches Datum) werden erkannt und nur verknüpft – nichts zählt doppelt. Passende geplante Buchungen werden automatisch bestätigt.</p>
        </section></div>`;
    }
    const rows = imp.rows; const n = rows.filter((r) => r.on).length;
    const opt = (kind, sel) => catsOf(kind).map((c) => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
    return `<div class="page withbar">
      <div class="topbar-row"><button type="button" class="icon-btn glass" id="back" aria-label="Zurück">${svg('back')}</button><h1 class="center">Kontoauszug</h1><span class="spacer"></span></div>
      ${imp.saldo ? `<button type="button" class="toggle-row glass" id="use-saldo" aria-pressed="${imp.useSaldo}">${svg('bank')}<span class="grow">Kontostand übernehmen: <b>${eur(imp.saldo.amount)}</b><span class="small block">laut Auszug am ${dateLabel(imp.saldo.date)} – dann stimmt die App mit der Bank überein</span></span><span class="switch"></span></button>` : ''}
      <section class="card glass pad-s">
        <h2 class="h2">${rows.length} Buchungen</h2>
        ${rows.map((r, i) => `<div class="imp-row${r.match || r.dup ? ' linked' : ''}">
          <input type="checkbox" class="check" data-i="${i}" ${r.on ? 'checked' : ''} aria-label="${esc(r.name)} übernehmen" ${r.dup ? 'disabled' : ''}>
          <div class="grow">
            <div class="between"><span class="b ell">${esc(r.name || 'Unbekannt')}</span><span class="b ${r.type === 'out' ? 'neg' : 'pos'}" style="white-space:nowrap">${r.type === 'out' ? '−' : '+'}${eur(r.amount)}</span></div>
            <div class="small ell">${dateLabel(r.date)}${r.purpose ? ' · ' + esc(r.purpose) : ''}</div>
            ${r.dup ? '<span class="pill soft">Schon importiert</span>' : r.match ? `<span class="pill soft">${svg('check')}Schon eingetragen: ${esc(r.match.label)}</span>` : r.plan ? `<span class="pill soft">${svg('calendar')}Bestätigt Geplant: ${esc(r.plan.title || '')}</span>` : `
            <div class="imp-ctrl">
              ${r.type !== 'out' ? `<select data-kind-i="${i}" aria-label="Art"><option value="in" ${r.kind === 'in' ? 'selected' : ''}>Einnahme</option><option value="refund" ${r.kind === 'refund' ? 'selected' : ''}>Rückzahlung</option><option value="transfer" ${r.kind === 'transfer' ? 'selected' : ''}>Bar eingezahlt</option></select>`
    : `<select data-kind-i="${i}" aria-label="Art"><option value="out" ${r.kind === 'out' ? 'selected' : ''}>Ausgabe</option><option value="transfer" ${r.kind === 'transfer' ? 'selected' : ''}>Abgehoben → Bar</option></select>`}
              ${r.kind === 'transfer' ? '' : `<select data-cat-i="${i}" aria-label="Kategorie">${opt(r.kind === 'in' ? 'in' : 'out', r.cat)}</select>`}</div>`}
          </div></div>`).join('')}
      </section>
    </div>
    <div class="bottombar glass"><div class="grow"><div class="small b">${n} neu</div></div>
      <button type="button" class="link" id="imp-reset">Andere Datei</button><button type="button" class="btn" id="imp-go" ${n || (imp.saldo && imp.useSaldo) ? '' : 'disabled'}>Importieren</button></div>`;
  },
  mount() {
    $('#back').onclick = () => { imp = null; goBack(); };
    const f = $('#csv'); if (f) f.addEventListener('change', () => readCSV(f.files[0]));
    if (!imp) return;
    if ($('#use-saldo')) $('#use-saldo').onclick = () => { imp.useSaldo = !imp.useSaldo; render(false); };
    $$('[data-i]').forEach((c) => c.addEventListener('change', () => { imp.rows[+c.dataset.i].on = c.checked; render(false); }));
    $$('[data-cat-i]').forEach((s) => s.addEventListener('change', () => { imp.rows[+s.dataset.catI].cat = s.value; }));
    $$('[data-kind-i]').forEach((s) => s.addEventListener('change', () => { const r = imp.rows[+s.dataset.kindI]; r.kind = s.value; r.cat = r.kind === 'in' ? guessIncomeCat(r.name + ' ' + r.purpose) : r.kind === 'out' ? guessOutCat(r.name + ' ' + r.purpose) : 'c_lidl'; render(false); }));
    $('#imp-reset').onclick = () => { imp = null; render(false); };
    $('#imp-go').onclick = () => {
      const sel = imp.rows.filter((r) => r.on);
      commit(`${sel.length} Buchungen übernommen`, () => {
        sel.forEach((r) => {
          if (r.match) { const t = S.tx.find((x) => x.id === r.match.id); if (t) { t.importKey = r.key; } return; }
          if (r.plan) {
            const p = S.plans.find((x) => x.id === r.plan.id);
            S.tx.push({ id: uid(), kind: r.type === 'out' ? 'out' : 'in', amount: r.amount, cat: r.plan.cat, title: r.plan.title, payee: r.plan.payee || r.name, date: r.date, ts: 0, importKey: r.key, planId: r.plan.id, acct: 'online' });
            if (p) { if (p.repeat === 'monthly') { p.date = nextMonthDate(p.date); } else S.plans = S.plans.filter((x) => x.id !== p.id); }
            return;
          }
          // Alles aus dem Kontoauszug ist online. Abhebung = vom Konto ins Bargeld, Bareinzahlung = umgekehrt.
          const t = r.kind === 'transfer'
            ? { id: uid(), kind: 'transfer', amount: r.amount, cat: null, title: r.type === 'out' ? 'Abgehoben' : 'Eingezahlt', payee: r.name, date: r.date, ts: 0, importKey: r.key, acct: r.type === 'out' ? 'online' : 'bar', to: r.type === 'out' ? 'bar' : 'online' }
            : { id: uid(), kind: r.kind, amount: r.amount, cat: r.cat, title: r.purpose ? r.purpose.slice(0, 40) : '', payee: r.name, date: r.date, ts: 0, importKey: r.key, acct: 'online' };
          if (t.kind === 'refund') t.month = monthOf(r.date);
          S.tx.push(t);
          if (r.name && t.kind !== 'refund' && t.kind !== 'transfer') S.rules[r.name.toLowerCase()] = r.cat;
        });
        if (imp.saldo && imp.useSaldo) setBalanceAnchor(imp.saldo.amount, imp.saldo.date);
      }, { after: () => { imp = null; goBack(); } });
    };
  }
};
function readCSV(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    let text;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(r.result); } catch (e) { text = new TextDecoder('windows-1252').decode(r.result); }
    const res = parseBankCSV(text);
    if (!res) { toast('Format nicht erkannt – ist das eine CSV der Bank?'); return; }
    if (!res.rows.length) { toast('Keine Buchungen gefunden'); return; }
    imp = { rows: res.rows, saldo: res.saldo, useSaldo: !!res.saldo };
    render(false);
  };
  r.readAsArrayBuffer(file);
}
function splitCSV(text) {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim()) || '';
  const sep = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = []; let cell = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === sep) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
function toISODate(s) {
  const m = String(s || '').trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (m) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; return `${y}-${pad(m[2])}-${pad(m[1])}`; }
  const iso = String(s || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? `${iso[1]}-${iso[2]}-${iso[3]}` : null;
}
function guessOutCat(t) {
  t = t.toLowerCase();
  const rules = [[/monster/, 'c_monster'], [/lidl/, 'c_lidl'], [/amazon|amzn/, 'c_amazon'],
    [/aral|shell|esso|jet |total|tankstelle|agip|avia|orlen/, 'c_tanken'],
    [/vodafone|telekom|o2|telefonica|congstar|spotify|netflix|disney|apple\.com|google|prime/, 'c_abos'],
    [/h&m|zara|primark|zalando|about you|c&a|deichmann|snipes/, 'c_kleidung'],
    [/kino|cinema|cinestar|cinemaxx|steam|playstation|xbox|eventim|ticket/, 'c_freizeit']];
  for (const [re, id] of rules) if (re.test(t) && S.cats.some((c) => c.id === id)) return id;
  return (S.cats.find((c) => c.id === 'c_sonst') || catsOf('out')[0]).id;
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
  const known = new Set(S.tx.filter((t) => t.importKey).map((t) => t.importKey));
  const usedTx = new Set(); const usedPlan = new Set();
  const peopleNames = S.people.map((p) => p.name.toLowerCase());
  const refundNames = new Set(S.tx.filter((t) => t.kind === 'refund' && t.payee).map((t) => t.payee.toLowerCase()));
  const out = []; const withSaldo = [];
  rows.slice(hi + 1).forEach((r) => {
    if (r.length < h.length / 2) return;
    const date = toISODate(r[iDate]); if (!date) return;
    let c = parseEur(r[iAmt]);
    if (iSH >= 0) { const sh = (r[iSH] || '').trim().toUpperCase(); if (sh === 'S') c = -Math.abs(c); else if (sh === 'H') c = Math.abs(c); }
    if (iSaldo >= 0 && String(r[iSaldo] || '').trim()) { let sa = parseEur(r[iSaldo]); if (/(^|\s)(s|soll)$/i.test(String(r[iSaldo]).trim())) sa = -Math.abs(sa); withSaldo.push({ date, amount: sa }); }
    if (c === 0) return;
    const type = c < 0 ? 'out' : 'in';
    const name = (iName >= 0 ? r[iName] : '').trim().replace(/\s+/g, ' ');
    const purpose = (iPurpose >= 0 ? r[iPurpose] : '').trim().replace(/\s+/g, ' ').slice(0, 80);
    const amount = Math.abs(c);
    const key = (type === 'in' ? 'in|' : '') + date + '|' + amount + '|' + name.toLowerCase();
    const dup = known.has(key);
    // Schon von Hand eingetragen? (gleicher Betrag, gleiche Richtung, Datum ±4 Tage, noch nicht verknüpft)
    let match = null;
    if (!dup) {
      // Nur Online-Buchungen können im Kontoauszug stehen (Abhebung zählt als Abgang vom Konto)
      const isOutOnline = (t) => t.kind === 'out' || (t.kind === 'transfer' && acctOf(t) === 'online');
      const cand = S.tx.find((t) => !t.importKey && !usedTx.has(t.id) && t.amount === amount && (t.kind === 'transfer' || acctOf(t) === 'online')
        && (type === 'out' ? isOutOnline(t) : (t.kind === 'in' || t.kind === 'refund' || (t.kind === 'transfer' && t.to === 'online'))) && Math.abs(daysBetween(t.date, date)) <= 4);
      if (cand) { usedTx.add(cand.id); match = { id: cand.id, label: cand.title || cand.payee || catById(cand.cat).name }; }
    }
    // Passt zu einer geplanten Buchung?
    let plan = null;
    if (!dup && !match) {
      const p = S.plans.find((q) => !usedPlan.has(q.id) && q.amount === amount && ((type === 'out') === (q.kind === 'out')) && Math.abs(daysBetween(q.date, date)) <= 7);
      if (p) { usedPlan.add(p.id); plan = p; }
    }
    const lname = name.toLowerCase();
    const looksRefund = type === 'in' && (refundNames.has(lname) || peopleNames.some((n) => n && lname.includes(n)));
    const atm = /geldautomat|bargeld|auszahlung|\bga\b|atm|cash/i.test(name + ' ' + purpose);
    const kind = atm ? 'transfer' : type === 'out' ? 'out' : looksRefund ? 'refund' : 'in';
    const rule = S.rules[lname];
    const cat = kind === 'in' ? (rule && catById(rule).kind === 'in' ? rule : guessIncomeCat(name + ' ' + purpose))
      : kind === 'refund' ? 'c_lidl' : (rule && catById(rule).kind === 'out' ? rule : guessOutCat(name + ' ' + purpose));
    out.push({ type, kind, date, amount, name: name || purpose.slice(0, 30), purpose, key, dup, match, plan, cat, on: !dup });
  });
  out.sort((a, b) => b.date.localeCompare(a.date));
  let saldo = null;
  if (withSaldo.length) { const desc = withSaldo[0].date >= withSaldo[withSaldo.length - 1].date; saldo = desc ? withSaldo[0] : withSaldo[withSaldo.length - 1]; }
  return { rows: out, saldo };
}

/* ================= Schulden & Mitbringen (optional) ================= */
const person = (id) => S.people.find((p) => p.id === id);
const pSaldo = (pid) => S.debts.filter((d) => d.personId === pid).reduce((s, d) => s + (d.type === 'pay' ? d.amount : -d.amount), 0);
function pLook(c) {
  if (c < 0) return { cls: 'neg', status: 'im Minus', long: 'schuldet dir ' + eur(-c) };
  if (c > 0) return { cls: 'pos', status: 'im Plus', long: 'hat ' + eur(c) + ' Guthaben' };
  return { cls: 'zero', status: 'ausgeglichen', long: 'alles ausgeglichen' };
}
const avatar = (p, size = 40) => `<span class="avatar" style="background:${p.color};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.42)}px" aria-hidden="true">${esc(p.name.charAt(0).toUpperCase())}</span>`;
let tapTimer = null; let tapId = null; let suppressClickUntil = 0;
document.addEventListener('click', (e) => { if (Date.now() < suppressClickUntil) { e.stopPropagation(); e.preventDefault(); } }, true);
function bindPersonGestures(el) {
  const id = el.dataset.person;
  let lt = null; let long = false; let sx = 0; let sy = 0;
  const cancel = () => { clearTimeout(lt); el.classList.remove('pressing'); };
  el.addEventListener('pointerdown', (e) => {
    long = false; sx = e.clientX; sy = e.clientY; el.classList.add('pressing'); clearTimeout(lt);
    lt = setTimeout(() => { long = true; el.classList.remove('pressing'); clearTimeout(tapTimer); tapTimer = null; vibrate(25); suppressClickUntil = Date.now() + 500; go('person/' + id); }, 500);
  });
  el.addEventListener('pointermove', (e) => { if (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10) cancel(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => el.addEventListener(t, cancel));
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  el.addEventListener('click', () => {
    if (long) { long = false; return; }
    if (tapTimer && tapId === id) { clearTimeout(tapTimer); tapTimer = null; go('zahlung/' + id); return; }
    clearTimeout(tapTimer); tapId = id;
    tapTimer = setTimeout(() => { tapTimer = null; go('mitbringen/' + id); }, 280);
  });
}
function personSheet(id) {
  const p = id ? person(id) : null;
  let color = p ? p.color : COLORS[S.people.length % COLORS.length];
  openSheet(`<h2>${p ? 'Person bearbeiten' : 'Neue Person'}</h2>
    <label class="field glass"><span class="sr">Name</span>${svg('people')}<input id="p-name" placeholder="Name" value="${esc(p ? p.name : '')}" maxlength="24"></label>
    <div class="label">Farbe</div><div class="swatches">${COLORS.map((c) => `<button type="button" class="swatch${c === color ? ' on' : ''}" data-col="${c}" style="background:${c}" aria-label="Farbe ${c}"></button>`).join('')}</div>
    <button type="button" class="btn" id="p-save">${svg('check')}Speichern</button>
    ${p ? `<button type="button" class="btn danger" id="p-del">${svg('trash')}Person löschen</button>` : ''}`,
  (el) => {
    $$('[data-col]', el).forEach((b) => b.onclick = () => { $$('[data-col]', el).forEach((x) => x.classList.remove('on')); b.classList.add('on'); color = b.dataset.col; });
    if (!p) setTimeout(() => $('#p-name', el).focus(), 80);
    $('#p-save', el).onclick = () => {
      const name = $('#p-name', el).value.trim(); if (!name) { $('#p-name', el).focus(); return; }
      closeSheet();
      commit(p ? 'Gespeichert' : name + ' angelegt', () => { if (p) Object.assign(p, { name, color }); else S.people.push({ id: uid(), name, color }); });
    };
    if (p) $('#p-del', el).onclick = () => confirmSheet(`${p.name} löschen?`, 'Die Person und ihr Verlauf bei den Schulden werden gelöscht. Deine Buchungen bleiben.', 'Löschen',
      () => commit(p.name + ' gelöscht', () => { S.people = S.people.filter((x) => x.id !== p.id); S.debts = S.debts.filter((x) => x.personId !== p.id); }, { after: () => tabTo('schulden') }));
  });
}
VIEWS.schulden = {
  nav: 'schulden', needsDebts: true,
  html() {
    let owed = 0; let credit = 0;
    const cards = S.people.map((p, i) => {
      const s = pSaldo(p.id); if (s < 0) owed += -s; else credit += s;
      const l = pLook(s);
      return `<button type="button" class="pcard glass" data-person="${p.id}" style="--i:${i}" aria-label="${esc(p.name)}, ${l.status}. Tippen: mitgebracht, doppelt: Zahlung, halten: Übersicht">
        <span class="pc-top">${avatar(p, 40)}<span class="pname ell">${esc(p.name)}</span></span>
        <span class="psaldo ${l.cls}">${money(s, { sign: s > 0 ? '+' : s < 0 ? '-' : '' })}</span>
        <span class="pill ${l.cls}">${l.status}</span></button>`;
    }).join('');
    return `<div class="page">
      <header class="hero"><div class="grow"><div class="sub">Wer schuldet dir was?</div><h1>Schulden</h1></div>
        <div class="hero-actions"><button type="button" class="icon-btn glass primary" id="add-person" aria-label="Person hinzufügen">${svg('plus')}</button></div></header>
      <section class="card glass pad stack">
        <div class="between" style="align-items:flex-end">
          <div><div class="eyebrow neg">Dir wird geschuldet</div><div class="big">${money(owed)}</div></div>
          <div class="right"><div class="eyebrow pos">Guthaben</div><div class="b" style="font-size:20px">${money(credit)}</div></div>
        </div>
        <div class="chips"><span class="hint"><b>Tippen</b> mitgebracht</span><span class="hint"><b>2× tippen</b> Zahlung</span><span class="hint"><b>Halten</b> Übersicht</span></div>
      </section>
      ${S.people.length ? `<div class="grid2">${cards}<button type="button" class="pcard add glass" id="add-person-2">${svg('plus')}Person</button></div>`
    : `<section class="card glass">${emptyHTML('people', 'Noch niemand hier.', '<button type="button" class="btn small-btn" id="add-person-2">Erste Person anlegen</button>')}</section>`}
    </div>`;
  },
  mount() {
    $('#add-person').onclick = () => personSheet(null);
    $('#add-person-2').onclick = () => personSheet(null);
    $$('[data-person]').forEach(bindPersonGestures);
  }
};
VIEWS.schnell = {
  nav: null, needsDebts: true,
  html(kind) {
    const pay = kind === 'zahlung';
    return `<div class="page">
      <div class="topbar-row"><button type="button" class="icon-btn glass" id="back" aria-label="Zurück">${svg('back')}</button><h1 class="center">${pay ? 'Wer hat bezahlt?' : 'Wer hat etwas bekommen?'}</h1><span class="spacer"></span></div>
      ${S.people.length ? `<div class="grid2">${S.people.map((p, i) => { const s = pSaldo(p.id); const l = pLook(s); return `<button type="button" class="pcard glass" data-pick="${p.id}" style="--i:${i}">
        <span class="pc-top">${avatar(p, 40)}<span class="pname ell">${esc(p.name)}</span></span><span class="psaldo ${l.cls}">${money(s)}</span></button>`; }).join('')}</div>`
    : `<section class="card glass">${emptyHTML('people', 'Noch niemand hier.', '<button type="button" class="btn small-btn" id="add-first">Erste Person anlegen</button>')}</section>`}
    </div>`;
  },
  mount(kind) {
    $('#back').onclick = () => goBack();
    if ($('#add-first')) $('#add-first').onclick = () => personSheet(null);
    $$('[data-pick]').forEach((b) => b.onclick = () => replaceTo((kind === 'zahlung' ? 'zahlung/' : 'mitbringen/') + b.dataset.pick, 'fwd'));
  }
};
let mb = null;
VIEWS.mitbringen = {
  nav: null, needsDebts: true,
  init() { mb = { cart: {}, extra: '', note: '' }; },
  html(id) {
    const p = person(id); if (!p) return notFoundHTML();
    const l = pLook(pSaldo(p.id));
    const prods = S.products.slice().sort((a, b) => (b.fav ? 1 : 0) - (a.fav ? 1 : 0));
    let sum = 0; let count = 0;
    prods.forEach((pr) => { const q = mb.cart[pr.id] || 0; sum += q * pr.price; count += q; });
    sum += parseEur(mb.extra);
    return `<div class="page withbar">
      <div class="topbar-row"><button type="button" class="icon-btn glass" id="back" aria-label="Zurück">${svg('back')}</button>${avatar(p, 40)}
        <div class="grow"><h1 class="ell" style="font-size:20px;margin:0">${esc(p.name)} hat bekommen</h1><div class="small b ${l.cls}">${l.long}</div></div></div>
      <p class="small" style="margin:0 2px">Tippe alles an, was du mitgebracht hast. Das wird nur als Schuld vermerkt – deine Lidl-Ausgabe trägst du über ＋ ein.</p>
      <div class="grid3">${prods.map((pr) => { const q = mb.cart[pr.id] || 0; return `<div class="tile"><button type="button" class="tile-main glass${q ? ' on' : ''}" data-add="${pr.id}">
        <span class="tile-img">${pr.photo ? `<img src="${pr.photo}" alt="">` : svg(pr.icon || 'snack')}</span><span class="tile-name">${esc(pr.name)}</span><span class="tile-price">${eur(pr.price)}</span></button>
        ${pr.fav ? svg('star', 'class="fav"') : ''}${q ? `<span class="qty">${q}×</span><button type="button" class="less" data-less="${pr.id}" aria-label="Eins weniger">−</button>` : ''}</div>`; }).join('')}</div>
      <div class="field-row">
        <label class="field glass" style="flex:0 0 120px"><span class="sr">Anderer Betrag</span><input id="mb-extra" size="4" inputmode="decimal" placeholder="Betrag" value="${esc(mb.extra)}"><span class="unit">€</span></label>
        <label class="field glass grow"><span class="sr">Wofür</span><input id="mb-note" size="8" placeholder="Wofür? (optional)" value="${esc(mb.note)}" maxlength="60"></label>
      </div>
    </div>
    <div class="bottombar glass"><div class="grow"><div class="small b">${count ? count + (count === 1 ? ' Teil' : ' Teile') : 'Noch nichts'}</div><div class="b" style="font-size:20px">${eur(sum)}</div></div>
      <button type="button" class="link" id="mb-clear">Leeren</button><button type="button" class="btn" id="mb-save" ${sum > 0 ? '' : 'disabled'}>Eintragen</button></div>`;
  },
  mount(id) {
    const p = person(id); if (!p) return;
    $('#back').onclick = () => goBack();
    $$('[data-add]').forEach((b) => b.onclick = () => { mb.cart[b.dataset.add] = (mb.cart[b.dataset.add] || 0) + 1; render(false); });
    $$('[data-less]').forEach((b) => b.onclick = () => { const k = b.dataset.less; mb.cart[k] = Math.max(0, (mb.cart[k] || 0) - 1); render(false); });
    const ex = $('#mb-extra'); ex.addEventListener('input', () => { mb.extra = ex.value; }); ex.addEventListener('change', () => render(false));
    $('#mb-note').addEventListener('input', (e) => { mb.note = e.target.value; });
    $('#mb-clear').onclick = () => { mb = { cart: {}, extra: '', note: '' }; render(false); };
    $('#mb-save').onclick = (e) => {
      let sum = 0; const parts = [];
      S.products.forEach((pr) => { const q = mb.cart[pr.id] || 0; if (q) { sum += q * pr.price; parts.push((q > 1 ? q + '× ' : '') + pr.name); } });
      const extra = parseEur(mb.extra); const note = mb.note.trim();
      if (extra) { sum += extra; parts.push(note || 'Betrag'); } else if (note) parts.push(note);
      if (sum <= 0) return;
      const r = e.currentTarget.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2);
      commit(`${p.name}: ${eur(sum)} vermerkt`, () => { S.debts.push({ id: uid(), personId: p.id, type: 'buy', amount: sum, text: parts.join(', '), date: todayStr(), ts: Date.now() }); }, { after: () => goBack() });
    };
  }
};
let zp = null;
VIEWS.zahlung = {
  nav: null, needsDebts: true,
  init() { zp = { amt: '', cat: 'c_lidl', month: curMonth() }; if (!S.cats.some((c) => c.id === zp.cat)) zp.cat = defaultCatOf('out'); },
  html(id) {
    const p = person(id); if (!p) return notFoundHTML();
    const s = pSaldo(p.id); const pay = parseEur(zp.amt);
    const before = pLook(s); const after = pLook(s + pay);
    const quick = (s < 0 ? [[-s, 'Alles: ' + eur(-s)]] : []).concat([[500, '5 €'], [1000, '10 €'], [2000, '20 €']]);
    return `<div class="page form-page">
      <div class="topbar-row"><button type="button" class="icon-btn glass" id="back" aria-label="Zurück">${svg('back')}</button>${avatar(p, 40)}<h1 class="ell" style="font-size:20px;margin:0;flex:1">${esc(p.name)} hat bezahlt</h1></div>
      <section class="card glass forecast">
        <div class="fc-col"><span class="small">Vorher</span><span class="b ${before.cls}">${eur(s)}</span></div><span class="fc-arrow">${svg('next')}</span>
        <div class="fc-col"><span class="small">Danach</span><span class="b ${after.cls}">${eur(s + pay)}</span></div>
      </section>
      <div class="amount-wrap"><div class="amount pos" id="z-amount">+${esc(zp.amt || '0')}<span class="cur">€</span></div>
        <div class="hint">Wird als Rückzahlung von <b>${esc(catById(zp.cat).name)}</b> im ${MONTHS[+zp.month.slice(5) - 1]} abgezogen</div></div>
      <div class="chips center">${quick.map(([v, t]) => `<button type="button" class="chip" data-quick="${v}">${t}</button>`).join('')}</div>
      <div class="hscroll cat-pick no-swipe" aria-label="Abziehen von">${catsOf('out').map((c) => `<button type="button" class="cat-chip${c.id === zp.cat ? ' on' : ''}" data-zc="${c.id}" style="--c:${c.color}">${catIcon(c, 40)}<span>${esc(c.name)}</span></button>`).join('')}</div>
    </div>
    <div class="dock glass">${keypadHTML()}<button type="button" class="btn save" id="z-save" ${pay > 0 ? '' : 'disabled'}>${svg('check')}Zahlung eintragen</button></div>`;
  },
  mount(id) {
    const p = person(id); if (!p) return;
    $('#back').onclick = () => goBack();
    $$('.key').forEach((k) => k.onclick = () => { zp.amt = pressKey(zp.amt, k.dataset.key); render(false); });
    $$('[data-quick]').forEach((b) => b.onclick = () => { zp.amt = centsToInput(+b.dataset.quick); render(false); });
    $$('[data-zc]').forEach((b) => b.onclick = () => { zp.cat = b.dataset.zc; render(false); });
    $('#z-save').onclick = (e) => {
      const amount = parseEur(zp.amt); if (amount <= 0) return;
      const r = e.currentTarget.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, ['var(--pos)', '#F2C14E']);
      commit(`${p.name} hat ${eur(amount)} gezahlt`, () => {
        S.debts.push({ id: uid(), personId: p.id, type: 'pay', amount, text: 'Zahlung', date: todayStr(), ts: Date.now() });
        S.tx.push({ id: uid(), kind: 'refund', amount, cat: zp.cat, title: 'Rückzahlung', payee: p.name, date: todayStr(), ts: Date.now(), month: zp.month, acct: 'bar' });
      }, { after: () => goBack() });
    };
  }
};
VIEWS.person = {
  nav: 'schulden', needsDebts: true,
  html(id) {
    const p = person(id); if (!p) return notFoundHTML();
    const s = pSaldo(p.id); const l = pLook(s);
    const list = S.debts.filter((d) => d.personId === p.id).sort((a, b) => b.date.localeCompare(a.date) || (b.ts || 0) - (a.ts || 0));
    let buy = 0; let pay = 0; list.forEach((d) => { if (d.type === 'pay') pay += d.amount; else buy += d.amount; });
    return `<div class="page">
      <div class="topbar-row"><button type="button" class="icon-btn glass" id="back" aria-label="Zurück">${svg('back')}</button><span class="spacer"></span>
        <button type="button" class="icon-btn glass" id="p-share" aria-label="Stand teilen">${svg('share')}</button><button type="button" class="icon-btn glass" id="p-edit" aria-label="Bearbeiten">${svg('edit')}</button></div>
      <section class="card glass kat-hero">${avatar(p, 64)}<h1>${esc(p.name)}</h1><div class="kat-total ${l.cls}">${eur(s)}</div><span class="pill ${l.cls}">${l.long}</span>
        <div class="stat3 inner"><div><span class="small">Mitgebracht</span><span class="b">${eur(buy)}</span></div><div><span class="small">Bezahlt</span><span class="b">${eur(pay)}</span></div><div><span class="small">Einträge</span><span class="b">${list.length}</span></div></div></section>
      <div class="grid2"><button type="button" class="btn ghost glass" id="p-mb">${svg('plus')}Mitgebracht</button><button type="button" class="btn" id="p-pay">${svg('refund')}Zahlung</button></div>
      <section class="card glass pad-s"><h2 class="h2">Verlauf</h2>
        ${list.length ? list.map((d, i) => `<button type="button" class="row" data-debt="${d.id}" style="--i:${i}"><span class="badge-ic ${d.type === 'pay' ? 'pos' : 'neg'}">${d.type === 'pay' ? '+' : '−'}</span>
          <span class="grow"><span class="r-title ell">${esc(d.text)}</span><span class="r-sub">${dateLabel(d.date)}</span></span><span class="b ${d.type === 'pay' ? 'pos' : 'neg'}">${d.type === 'pay' ? '+' : '−'}${eur(d.amount)}</span></button>`).join('') : emptyHTML('list', 'Noch keine Einträge.')}
      </section></div>`;
  },
  mount(id) {
    const p = person(id); if (!p) return;
    $('#back').onclick = () => goBack();
    $('#p-edit').onclick = () => personSheet(p.id);
    $('#p-share').onclick = () => shareStatus(p);
    $('#p-mb').onclick = () => go('mitbringen/' + p.id);
    $('#p-pay').onclick = () => go('zahlung/' + p.id);
    $$('[data-debt]').forEach((b) => b.onclick = () => {
      const d = S.debts.find((x) => x.id === b.dataset.debt);
      openSheet(`<h2>${esc(d.text)}</h2><p class="muted" style="margin:0">${dateLabel(d.date)} · ${eur(d.amount)}</p>
        <button type="button" class="btn danger" id="d-del">${svg('trash')}Eintrag löschen</button><button type="button" class="btn ghost" data-close>Abbrechen</button>`,
      (el) => { $('#d-del', el).onclick = () => { closeSheet(); commit('Eintrag gelöscht', () => { S.debts = S.debts.filter((x) => x.id !== d.id); }); }; });
    });
  }
};
function shareStatus(p) {
  const s = pSaldo(p.id);
  const entries = S.debts.filter((d) => d.personId === p.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  let text = `Hey ${p.name}, kleiner Zwischenstand: ` + (s < 0 ? `Du hast bei mir noch ${eur(-s)} offen.` : s > 0 ? `Du hast bei mir noch ${eur(s)} Guthaben.` : 'Wir sind quitt.');
  if (entries.length) text += '\n\nZuletzt:\n' + entries.map((d) => `• ${d.type === 'pay' ? 'Zahlung' : d.text} – ${d.type === 'pay' ? '+' : ''}${eur(d.amount)} (${dateLabel(d.date)})`).join('\n');
  const share = isNative() ? plugin('Share') : null;
  if (share) { share.share({ text, dialogTitle: 'Stand teilen' }).catch(() => {}); return; }
  openSheet(`<h2>Stand teilen</h2><textarea id="sh-text" readonly>${esc(text)}</textarea><button type="button" class="btn" id="sh-copy">${svg('copy')}Text kopieren</button>`,
    (el) => { $('#sh-copy', el).onclick = async () => { try { await navigator.clipboard.writeText(text); toast('Text kopiert'); closeSheet(); } catch (e) { $('#sh-text', el).select(); toast('Markiert – jetzt kopieren'); } }; });
}
const notFoundHTML = () => `<div class="page"><section class="card glass">${emptyHTML('search', 'Nicht gefunden.', '<button type="button" class="btn small-btn" onclick="tabTo(\'start\')">Zur Startseite</button>')}</section></div>`;

/* ================= Sparziele ================= */
/** Durchschnittliches Monats-Plus der letzten 3 vollen Monate */
function avgMonthResult() {
  let sum = 0; let n = 0;
  for (let i = 1; i <= 3; i++) {
    const m = addMonth(curMonth(), -i); const r = rangeOf('m' + m); const st = stats(r.from, r.to);
    if (!st.income && !st.net) continue;
    sum += st.income - st.net; n++;
  }
  return n ? sum / n : 0;
}
function goalEta(g) {
  if (g.saved >= g.target) return ' · geschafft!';
  const avg = avgMonthResult();
  if (avg <= 0) return '';
  const m = Math.ceil((g.target - g.saved) / avg);
  return m > 60 ? '' : ` · ca. ${m} ${m === 1 ? 'Monat' : 'Monate'}`;
}
const GOAL_ICONS = ['target', 'flag', 'car', 'phone', 'gift', 'plane', 'shirt', 'music', 'bike', 'piggy', 'star', 'home', 'ticket'];
function goalSheet(id) {
  const g = id ? S.goals.find((x) => x.id === id) : null;
  const d = { name: g ? g.name : '', icon: g ? g.icon : 'target', color: g ? g.color : COLORS[(S.goals.length + 3) % COLORS.length], target: g ? centsToInput(g.target) : '' };
  const icons = GOAL_ICONS.filter((ic) => I[ic]);
  openSheet('<div id="gs-body"></div>', (el) => {
    const draw = () => {
      const p = g && g.target ? clamp(Math.round(g.saved / g.target * 100), 0, 100) : 0;
      $('#gs-body', el).innerHTML = `
        <div class="cs-head">${catIcon({ color: d.color, icon: d.icon }, 58)}<div class="grow"><h2>${g ? esc(g.name) : 'Neues Sparziel'}</h2><span class="small">${g ? money(g.saved, { force: true }) + ' von ' + money(g.target, { force: true }) + goalEta(g) : 'Wofür sparst du?'}</span></div></div>
        ${g ? `<div class="bar big"><i style="width:${p}%;background:${g.color}"></i></div>
        <label class="field glass"><span class="sr">Betrag</span>${svg('coins')}<input id="gs-amt" inputmode="decimal" placeholder="Betrag" autocomplete="off"><span class="unit">€</span></label>
        <div class="two-btns"><button type="button" class="btn" id="gs-in">${svg('plus')}Einzahlen</button><button type="button" class="btn ghost" id="gs-out">${svg('minus')}Entnehmen</button></div>
        <p class="small" style="margin:0 2px">Zählt nur für dein Ziel – der Kontostand bleibt gleich.</p>
        <div class="label">Bearbeiten</div>` : ''}
        <label class="field glass"><span class="sr">Name</span>${svg('tag')}<input id="gs-name" placeholder="Name, z. B. Führerschein" value="${esc(d.name)}" maxlength="24" autocomplete="off"></label>
        <label class="field glass"><span class="sr">Ziel</span>${svg('target')}<input id="gs-target" inputmode="decimal" placeholder="Zielbetrag" value="${esc(d.target)}" autocomplete="off"><span class="unit">€</span></label>
        <div class="icon-grid">${icons.map((ic) => `<button type="button" class="ig${ic === d.icon ? ' on' : ''}" data-gic="${ic}" aria-label="Symbol ${ic}" style="--c:${d.color}">${svg(ic)}</button>`).join('')}</div>
        <div class="swatches">${COLORS.map((col) => `<button type="button" class="swatch${col === d.color ? ' on' : ''}" data-gcol="${col}" style="background:${col}" aria-label="Farbe ${col}"></button>`).join('')}</div>
        <button type="button" class="btn${g ? ' ghost' : ''}" id="gs-save">${svg('check')}${g ? 'Änderungen speichern' : 'Ziel anlegen'}</button>
        ${g ? `<button type="button" class="btn danger" id="gs-del">${svg('trash')}Ziel löschen</button>` : ''}`;
      const keep = () => { d.name = $('#gs-name', el).value; d.target = $('#gs-target', el).value; };
      $$('[data-gic]', el).forEach((b) => b.onclick = () => { keep(); d.icon = b.dataset.gic; draw(); });
      $$('[data-gcol]', el).forEach((b) => b.onclick = () => { keep(); d.color = b.dataset.gcol; draw(); });
      $('#gs-save', el).onclick = () => {
        keep();
        const name = d.name.trim(); const target = parseEur(d.target);
        if (!name) { $('#gs-name', el).focus(); return; }
        if (!target) { $('#gs-target', el).focus(); return; }
        closeSheet();
        commit(g ? 'Sparziel gespeichert' : name + ' angelegt', () => {
          if (g) Object.assign(g, { name, icon: d.icon, color: d.color, target });
          else S.goals.push({ id: uid(), name, icon: d.icon, color: d.color, target, saved: 0 });
        });
      };
      if (g) {
        const move = (sign) => {
          const a = parseEur($('#gs-amt', el).value);
          if (!a) { $('#gs-amt', el).focus(); return; }
          const before = g.saved;
          closeSheet();
          commit(sign > 0 ? `${eur(a)} für ${g.name} zurückgelegt` : `${eur(a)} aus ${g.name} genommen`, () => { g.saved = Math.max(0, g.saved + sign * a); }, {
            after: () => { render(false); if (sign > 0 && before < g.target && g.saved >= g.target) { burst(innerWidth / 2, innerHeight / 3); toast(g.name + ' geschafft!'); } }
          });
        };
        $('#gs-in', el).onclick = () => move(1);
        $('#gs-out', el).onclick = () => move(-1);
        $('#gs-del', el).onclick = () => { closeSheet(); commit(g.name + ' gelöscht', () => { S.goals = S.goals.filter((x) => x.id !== g.id); }); };
      }
    };
    draw();
  });
}
