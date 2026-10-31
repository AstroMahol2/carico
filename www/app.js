'use strict';

/* ============ storage: UserDefaults via Capacitor Preferences, localStorage nel browser ============ */
const KEY = 'beasttrack.v1';
const Cap = window.Capacitor;
const native = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
const Plugins = native ? {
  Preferences: Cap.registerPlugin('Preferences'),
  Haptics: Cap.registerPlugin('Haptics'),
  StatusBar: Cap.registerPlugin('StatusBar'),
} : {};
const Prefs = Plugins.Preferences;

let db;
let saveTimer = null;

async function load() {
  let raw = null;
  if (Prefs) { try { raw = (await Prefs.get({ key: KEY })).value; } catch (e) {} }
  if (!raw) { try { raw = localStorage.getItem(KEY); } catch (e) {} }
  try { db = raw ? JSON.parse(raw) : null; } catch (e) { db = null; }
  if (!db || !Array.isArray(db.exercises)) db = { v: 1, exercises: seedExercises(), routines: [], sessions: [], active: null };
}

function save(now) {
  clearTimeout(saveTimer);
  const write = () => {
    const raw = JSON.stringify(db);
    if (Prefs) Prefs.set({ key: KEY, value: raw }).catch(() => {});
    try { localStorage.setItem(KEY, raw); } catch (e) {}
  };
  if (now) write(); else saveTimer = setTimeout(write, 250);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) save(true); });

function haptic(style) {
  try {
    if (Plugins.Haptics) Plugins.Haptics.impact({ style: style || 'LIGHT' }).catch(() => {});
    else if (navigator.vibrate) navigator.vibrate(8);
  } catch (e) {}
}

/* ============ helpers ============ */
const $ = (s, r = document) => r.querySelector(s);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => (n == null || n === '' ? '' : (Math.round(n * 100) / 100).toLocaleString('it-IT', { maximumFractionDigits: 2 }));
const num = (s) => { if (s == null) return null; const v = parseFloat(String(s).replace(',', '.')); return isFinite(v) ? v : null; };
const groupName = (id) => (GROUPS.find((g) => g.id === id) || {}).name || id;
const exById = (id) => db.exercises.find((e) => e.id === id) || { id, name: 'Esercizio rimosso', group: '', kind: 'bar', inc: 2.5 };
const KINDS = [['bar', 'Bilanciere'], ['db', 'Manubri'], ['machine', 'Macchina'], ['cable', 'Cavi'], ['bw', 'Corpo libero']];

const DAY = 86400000;
const dFmt = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
const mFmt = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' });
const shortFmt = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' });
function ago(t) {
  const d = Math.floor((startOfDay(Date.now()) - startOfDay(t)) / DAY);
  return d <= 0 ? 'oggi' : d === 1 ? 'ieri' : d < 7 ? `${d} giorni fa` : dFmt.format(t);
}
function startOfDay(t) { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }
function weekStart(t) { const d = new Date(startOfDay(t)); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); }
function duration(ms) { const m = Math.round(ms / 60000); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`; }
function clock(ms) { const s = Math.floor(ms / 1000); const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const x = String(s % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`; }
const volume = (entries) => entries.reduce((a, e) => a + e.sets.reduce((b, s) => b + (s.done !== false ? (s.w || 0) * (s.r || 0) : 0), 0), 0);
const e1rm = (w, r) => w * (1 + r / 30); // Epley
const setText = (s) => (s.w ? `${fmt(s.w)} × ${s.r}` : `${s.r} reps`);

const ICONS = {
  dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r=".6"/><circle cx="4" cy="12" r=".6"/><circle cx="4" cy="18" r=".6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
  back: '<path d="M15 4.5L7.5 12l7.5 7.5"/>',
  down: '<path d="M5 9l7 7 7-7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  same: '<path d="M5 12h11M13 8l4 4-4 4"/>',
  deload: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="2.5"/>',
  more: '<circle cx="5.5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18.5" cy="12" r="1"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  share: '<path d="M12 15V4M8 8l4-4 4 4M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/>',
};
const icon = (n, cls = '') => `<span class="ico ${cls}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg></span>`;

/* ============ progressione: doppia progressione ============
   - Tutte le serie pianificate al massimo del range con lo stesso carico → +incremento, si riparte dal minimo
     (ACSM 2009: +2–10% quando superi le reps target; NSCA "2-for-2": +1–2,5 kg sopra, +2,5–5 kg gambe)
   - Due sedute di fila sotto il minimo allo stesso carico → scarico di circa il 10%
   - Altrimenti stesso carico, +1 rep per serie fino al massimo del range                                  */
function exHistory(exId) {
  const out = [];
  for (let i = db.sessions.length - 1; i >= 0; i--) {
    const s = db.sessions[i];
    const e = s.entries.find((x) => x.exId === exId && x.sets.length);
    if (e) out.push({ session: s, entry: e });
  }
  return out;
}

function suggest(exId, plan) {
  const ex = exById(exId);
  const { sets, min, max } = plan;
  const hist = exHistory(exId);
  if (!hist.length) {
    return { kind: 'new', icon: 'spark', what: 'Prima volta', why: `Scegli un carico con cui arrivi a ${min}–${max} reps lasciando 1–2 ripetizioni in riserva. Dalla prossima seduta il peso lo suggerisco io.`, targets: [] };
  }
  const last = hist[0].entry.sets;
  const topW = Math.max(...last.map((s) => s.w || 0));
  const top = last.filter((s) => (s.w || 0) === topW);
  const fill = (w, r) => Array.from({ length: sets }, () => ({ w, r }));

  if (top.length >= sets && top.every((s) => s.r >= max)) {
    if (!ex.inc || !topW) {
      return { kind: 'up', icon: 'up', what: `${max + 1} reps o zavorra`, why: `Hai chiuso ${top.length}×${max} a corpo libero: aggiungi una ripetizione o un po' di zavorra.`, targets: fill(topW, max) };
    }
    const w = topW + ex.inc;
    const pct = Math.round((ex.inc / topW) * 100);
    const note = pct > 10 ? ' È il salto minimo disponibile: se cali troppo di reps, resta in fondo al range qualche seduta.' : '';
    return { kind: 'up', icon: 'up', what: `${fmt(w)} kg × ${min}`, why: `${top.length}×${max} chiuse a ${fmt(topW)} kg: +${fmt(ex.inc)} kg (+${pct}%) e riparti da ${min} reps.${note}`, targets: fill(w, min) };
  }

  if (topW && top.some((s) => s.r < min) && hist[1]) {
    const p = hist[1].entry.sets;
    const pTop = Math.max(...p.map((s) => s.w || 0));
    if (pTop === topW && p.some((s) => s.w === topW && s.r < min)) {
      const step = ex.inc ? Math.min(ex.inc, 2.5) : 1;
      const w = Math.max(step, Math.round((topW * 0.9) / step) * step);
      return { kind: 'down', icon: 'deload', what: `${fmt(w)} kg × ${min}–${max}`, why: `Due sedute sotto le ${min} reps a ${fmt(topW)} kg: scendi del 10% circa e ricostruisci verso ${max}.`, targets: fill(w, min) };
    }
  }

  const targets = Array.from({ length: sets }, (_, i) => {
    const s = last[i];
    const r = s ? Math.min(max, Math.max(min, s.r + ((s.w || 0) === topW ? 1 : 0))) : min;
    return { w: topW, r };
  });
  const what = topW ? `${fmt(topW)} kg × ${targets.map((t) => t.r).join(' · ')}` : `${targets.map((t) => t.r).join(' · ')} reps`;
  return { kind: 'hold', icon: 'same', what, why: `Stesso carico, una ripetizione in più per serie. A ${sets}×${max} sale il peso.`, targets };
}

/* ============ router ============ */
const state = {
  tab: 'workout',
  stacks: { workout: [{ v: 'home' }], library: [{ v: 'groups' }], history: [{ v: 'list' }] },
  q: '',
};
const stack = () => state.stacks[state.tab];
const route = () => stack()[stack().length - 1];

function push(r) { stack().push(r); render('push'); }
function pop() { if (stack().length > 1) { stack().pop(); render('pop'); } }
function setTab(t) {
  if (t === state.tab) { if (stack().length > 1) { state.stacks[t] = [stack()[0]]; render('pop'); } else { const p = $('.page'); p && p.scrollTo({ top: 0, behavior: 'smooth' }); } return; }
  state.tab = t; render();
}

function render(anim) {
  const r = route();
  const v = VIEWS[r.v](r);
  r.title = v.title;
  const prev = stack()[stack().length - 2];
  const left = v.left ?? (prev ? `<button class="navbtn back" data-act="back">${icon('back')}<span>${esc(prev.title || 'Indietro')}</span></button>` : '');
  const page = document.createElement('div');
  page.className = 'page' + (anim === 'push' ? ' push-in' : anim === 'pop' ? ' pop-in' : '');
  page.innerHTML = `
    <header class="navbar ${v.large ? 'has-large' : 'solid'}"><div class="l">${left}</div><div class="t">${esc(v.title)}</div><div class="r">${v.right || ''}</div></header>
    ${v.large ? `<h1 class="large">${esc(v.title)}</h1>` : '<div style="height:12px"></div>'}
    ${v.body}`;
  const view = $('#view');
  const old = view.querySelector('.page');
  if (old && r.scroll == null && anim !== 'pop') r.scroll = 0;
  view.replaceChildren(page);
  page.scrollTop = r.scroll || 0;
  const nav = page.querySelector('.navbar');
  // la navbar resta fissa sopra lo scroll: la spostiamo fuori dal contenuto scorrevole
  view.appendChild(nav);
  if (v.large) {
    const onScroll = () => { nav.classList.toggle('solid', page.scrollTop > 34); r.scroll = page.scrollTop; };
    page.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  } else page.addEventListener('scroll', () => { r.scroll = page.scrollTop; }, { passive: true });
  v.mount && v.mount(page);
  document.querySelectorAll('.tabbar button').forEach((b) => b.setAttribute('aria-current', b.dataset.tab === state.tab ? 'page' : 'false'));
  renderResume();
}

/* edge-swipe back */
(() => {
  let sx = null, sy = 0;
  document.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    sx = t.clientX < 24 && stack().length > 1 && $('#session').hidden && !$('.sheet') ? t.clientX : null; sy = t.clientY;
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (sx == null) return;
    const t = e.changedTouches[0];
    if (t.clientX - sx > 70 && Math.abs(t.clientY - sy) < 60) ACTIONS.back();
    sx = null;
  }, { passive: true });
})();

/* ============ views ============ */
const VIEWS = {};

VIEWS.home = () => {
  const ws = weekStart(Date.now());
  const thisWeek = db.sessions.filter((s) => s.start >= ws).length;
  const routines = db.routines;
  let body = `<p class="subhead">${thisWeek ? `${thisWeek} ${thisWeek === 1 ? 'allenamento' : 'allenamenti'} questa settimana` : 'Nessun allenamento questa settimana'}</p>`;
  if (!routines.length) {
    body += `<div class="empty">${icon('dumbbell')}<h3>Crea la tua prima scheda</h3>
      <p>Scegli gli esercizi per gruppo muscolare, quante serie e il range di ripetizioni. Ogni volta ti mostro cosa hai fatto e quanto caricare.</p></div>
      <div class="pad"><button class="btn" data-act="new-routine">Nuova scheda</button>
      <button class="btn secondary" data-act="start-free">Allenamento libero</button></div>`;
  } else {
    body += `<div class="sec"><div class="sec-h"><span>Le mie schede</span><button data-act="new-routine">Nuova</button></div><div class="group">
      ${routines.map((r) => {
        const groups = [...new Set(r.items.map((i) => groupName(exById(i.exId).group)))].slice(0, 3).join(', ');
        const lastS = [...db.sessions].reverse().find((s) => s.routineId === r.id);
        return `<div class="row tap" data-act="open-routine" data-id="${r.id}" role="button">
          <div class="main"><div class="title">${esc(r.name)}</div><div class="sub">${r.items.length} esercizi${groups ? ' · ' + esc(groups) : ''}${lastS ? ' · ' + ago(lastS.start) : ''}</div></div>
          <button class="pill" data-act="start" data-id="${r.id}">Inizia</button></div>`;
      }).join('')}</div></div>
      <div class="pad"><button class="btn secondary" data-act="start-free">Allenamento libero</button></div>`;
  }
  return { title: 'Allenamento', large: true, body };
};

VIEWS.routine = (r) => {
  const rt = db.routines.find((x) => x.id === r.id);
  if (!rt) return { title: 'Scheda', body: '' };
  const items = rt.items.map((it, i) => {
    const ex = exById(it.exId);
    return `<div class="row" style="flex-direction:column;align-items:stretch;gap:10px">
      <div style="display:flex;align-items:center;gap:8px"><div class="main"><div class="title">${esc(ex.name)}</div><div class="sub">${esc(groupName(ex.group))}</div></div>
        <button class="navbtn" style="color:var(--label3);margin:-8px -12px -8px 0" data-act="rt-remove" data-i="${i}" aria-label="Rimuovi ${esc(ex.name)}">${icon('x')}</button></div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
        <span style="display:inline-flex;align-items:center;gap:8px;color:var(--label2)">Serie
          <span class="stepper"><button data-act="rt-sets" data-i="${i}" data-d="-1" aria-label="Meno serie">${icon('minus')}</button><span class="num">${it.sets}</span><button data-act="rt-sets" data-i="${i}" data-d="1" aria-label="Più serie">${icon('plus')}</button></span></span>
        <span class="range">Reps <input class="num" inputmode="numeric" pattern="[0-9]*" value="${it.min}" data-in="rt-min" data-i="${i}" aria-label="Reps minime">–<input class="num" inputmode="numeric" pattern="[0-9]*" value="${it.max}" data-in="rt-max" data-i="${i}" aria-label="Reps massime"></span>
      </div></div>`;
  }).join('');
  return {
    title: rt.name || 'Nuova scheda',
    right: rt.items.length ? `<button class="navbtn strong" data-act="start" data-id="${rt.id}">Inizia</button>` : '',
    body: `<div class="sec"><div class="sec-h"><span>Nome</span></div><div class="group"><div class="field"><input class="left" data-in="rt-name" value="${esc(rt.name)}" placeholder="Es. Push, Gambe, Upper A" enterkeyhint="done"></div></div></div>
      <div class="sec"><div class="sec-h"><span>Esercizi</span></div><div class="group">${items}
        <button class="row action" data-act="rt-add">${icon('plus')}<span>Aggiungi esercizi</span></button></div>
        <div class="sec-f">Quando chiudi tutte le serie al massimo del range, il peso suggerito sale e riparti dal minimo.</div></div>
      <div class="sec"><div class="group"><button class="row danger" data-act="rt-delete">Elimina scheda</button></div></div>`,
  };
};

VIEWS.groups = () => {
  const q = state.q.trim().toLowerCase();
  let list;
  if (q) {
    const hits = db.exercises.filter((e) => e.name.toLowerCase().includes(q));
    list = hits.length ? `<div class="sec"><div class="group">${hits.map(exRow).join('')}</div></div>`
      : `<div class="empty"><p>Nessun esercizio con “${esc(state.q)}”.</p><button class="btn secondary" style="max-width:260px;margin:auto" data-act="new-ex">Crea “${esc(state.q)}”</button></div>`;
  } else {
    list = `<div class="sec"><div class="group">${GROUPS.map((g) => {
      const n = db.exercises.filter((e) => e.group === g.id).length;
      return `<button class="row" data-act="open-group" data-id="${g.id}"><div class="main"><div class="title">${g.name}</div></div><span class="val num">${n}</span>${icon('chev', 'chev')}</button>`;
    }).join('')}</div></div>`;
  }
  return {
    title: 'Esercizi', large: true,
    right: `<button class="navbtn" data-act="new-ex" aria-label="Nuovo esercizio">${icon('plus')}</button>`,
    body: `<label class="search">${icon('search')}<input type="search" data-in="q" value="${esc(state.q)}" placeholder="Cerca esercizio" enterkeyhint="search"></label><div id="glist">${list}</div>`,
  };
};

function exRow(e) {
  const h = exHistory(e.id)[0];
  const sub = h ? `${setText(bestSet(h.entry.sets))} · ${ago(h.session.start)}` : 'Mai eseguito';
  return `<button class="row" data-act="open-ex" data-id="${e.id}"><div class="main"><div class="title">${esc(e.name)}</div><div class="sub">${sub}</div></div>${icon('chev', 'chev')}</button>`;
}
const bestSet = (sets) => sets.reduce((b, s) => (e1rm(s.w || 0, s.r) > e1rm(b.w || 0, b.r) ? s : b), sets[0]);

VIEWS.group = (r) => {
  const list = db.exercises.filter((e) => e.group === r.id);
  return { title: groupName(r.id), body: `<div class="sec"><div class="group">${list.map(exRow).join('')}</div></div>` };
};

VIEWS.exercise = (r) => {
  const ex = exById(r.id);
  const hist = exHistory(ex.id);
  let body = '';
  if (hist.length) {
    const all = hist.flatMap((h) => h.entry.sets);
    const best = bestSet(all);
    const est = Math.max(...all.map((s) => e1rm(s.w || 0, s.r)));
    body += `<div class="stats"><div><b class="num">${setText(best)}</b><small>Miglior serie</small></div>
      <div><b class="num">${ex.kind === 'bw' && !best.w ? '—' : fmt(Math.round(est * 2) / 2) + ' kg'}</b><small>1RM stimato</small></div>
      <div><b class="num">${hist.length}</b><small>Sedute</small></div></div>`;
    body += `<div class="sec"><div class="sec-h"><span>Carico massimo per seduta</span></div>${chart(hist.slice(0, 16).reverse().map((h) => ({ t: h.session.start, y: Math.max(...h.entry.sets.map((s) => (s.w || 0) || s.r)) })))}</div>`;
  } else {
    body += `<div class="empty">${icon('dumbbell')}<h3>Ancora nessuna serie</h3><p>Aggiungilo a una scheda o a un allenamento libero: qui vedrai record e andamento.</p></div>`;
  }
  body += `<div class="sec"><div class="sec-h"><span>Impostazioni</span></div><div class="group">
    <div class="row"><div class="main">Gruppo</div><span class="val">${esc(groupName(ex.group))}</span></div>
    <div class="row"><div class="main"><div>Incremento</div><div class="sub">Quanto sale il carico suggerito</div></div>
      <span class="stepper"><button data-act="inc" data-d="-0.5" aria-label="Diminuisci incremento">${icon('minus')}</button><span class="num" style="min-width:58px">${fmt(ex.inc)} kg</span><button data-act="inc" data-d="0.5" aria-label="Aumenta incremento">${icon('plus')}</button></span></div>
    </div><div class="sec-f">Riferimento NSCA/ACSM: 1–2,5 kg per la parte superiore, 2,5–5 kg per le gambe. Con i manubri è il salto tra un paio e il successivo.</div></div>`;
  if (hist.length) {
    body += `<div class="sec"><div class="sec-h"><span>Storico</span></div><div class="group">${hist.slice(0, 30).map((h) => `
      <button class="row" data-act="open-session" data-id="${h.session.id}"><div class="main"><div class="title">${dFmt.format(h.session.start)}</div>
      <div class="setlist num">${h.entry.sets.map((s) => `<span><b>${fmt(s.w)}</b>${s.w ? ' kg' : ''} × ${s.r}</span>`).join('')}</div></div>${icon('chev', 'chev')}</button>`).join('')}</div></div>`;
  }
  if (ex.custom) body += `<div class="sec"><div class="group"><button class="row danger" data-act="ex-delete">Elimina esercizio</button></div></div>`;
  return { title: ex.name, body };
};

function chart(pts) {
  if (pts.length < 2) return `<div class="chart" style="color:var(--label2);font-size:.85rem;padding:16px">Il grafico compare dalla seconda seduta.</div>`;
  const W = 320, H = 160, pl = 30, pr = 8, pt = 10, pb = 22;
  const ys = pts.map((p) => p.y);
  let lo = Math.min(...ys), hi = Math.max(...ys);
  if (hi === lo) { hi += 5; lo = Math.max(0, lo - 5); }
  const pad = (hi - lo) * 0.15; lo = Math.max(0, lo - pad); hi += pad;
  const x = (i) => pl + (i / (pts.length - 1)) * (W - pl - pr);
  const y = (v) => pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join('');
  const ticks = [lo, (lo + hi) / 2, hi];
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Andamento del carico">
    ${ticks.map((t) => `<line class="gl" x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}"/><text x="${pl - 6}" y="${y(t) + 3}" text-anchor="end">${fmt(Math.round(t))}</text>`).join('')}
    <path class="ar" d="${d}L${x(pts.length - 1)},${H - pb}L${pl},${H - pb}Z"/><path class="ln" d="${d}"/>
    ${pts.map((p, i) => `<circle class="pt" cx="${x(i)}" cy="${y(p.y)}" r="2.6"/>`).join('')}
    <text x="${pl}" y="${H - 6}">${shortFmt.format(pts[0].t)}</text><text x="${W - pr}" y="${H - 6}" text-anchor="end">${shortFmt.format(pts[pts.length - 1].t)}</text>
  </svg></div>`;
}

VIEWS.list = () => {
  const right = `<button class="navbtn" data-act="backup" aria-label="Backup dati">${icon('share')}</button>`;
  if (!db.sessions.length) {
    return { title: 'Storico', large: true, right, body: `<div class="empty">${icon('clock')}<h3>Nessun allenamento salvato</h3><p>Quando premi Fine, l'allenamento finisce qui con serie, durata e volume.</p></div>` };
  }
  const byMonth = new Map();
  [...db.sessions].reverse().forEach((s) => { const k = mFmt.format(s.start); if (!byMonth.has(k)) byMonth.set(k, []); byMonth.get(k).push(s); });
  let body = '';
  byMonth.forEach((list, k) => {
    body += `<div class="sec"><div class="sec-h"><span>${esc(k)}</span><span class="num">${list.length}</span></div><div class="group">${list.map((s) => `
      <button class="row" data-act="open-session" data-id="${s.id}"><div class="main"><div class="title">${esc(s.name)}</div>
      <div class="sub num">${dFmt.format(s.start)} · ${duration(s.end - s.start)} · ${fmt(Math.round(volume(s.entries)))} kg</div></div>${icon('chev', 'chev')}</button>`).join('')}</div></div>`;
  });
  return { title: 'Storico', large: true, right, body };
};

VIEWS.session = (r) => {
  const s = db.sessions.find((x) => x.id === r.id);
  if (!s) return { title: 'Allenamento', body: '' };
  let body = `<div class="stats"><div><b class="num">${duration(s.end - s.start)}</b><small>Durata</small></div>
    <div><b class="num">${s.entries.reduce((a, e) => a + e.sets.length, 0)}</b><small>Serie</small></div>
    <div><b class="num">${fmt(Math.round(volume(s.entries)))}</b><small>Volume kg</small></div></div>`;
  body += s.entries.map((e) => {
    const ex = exById(e.exId);
    return `<div class="sec"><div class="sec-h"><span>${esc(ex.name)}</span></div><div class="group">${e.sets.map((x, i) => `
      <div class="row"><span class="val num" style="width:22px">${i + 1}</span><div class="main num">${x.w ? `<b>${fmt(x.w)}</b> kg × ` : ''}<b>${x.r}</b> reps</div></div>`).join('')}</div></div>`;
  }).join('');
  body += `<div class="sec"><div class="group"><button class="row danger" data-act="session-delete" data-id="${s.id}">Elimina allenamento</button></div></div>`;
  return { title: s.name, body: `<p class="subhead" style="margin-top:0">${dFmt.format(s.start)}</p>` + body };
};

/* ============ sessione attiva ============ */
let tick = null;

function startSession(routine) {
  if (db.active) { openSession(); toast('Hai già un allenamento in corso'); return; }
  db.active = {
    id: uid(), routineId: routine ? routine.id : null, name: routine ? routine.name : 'Allenamento libero', start: Date.now(),
    entries: routine ? routine.items.map((it) => newEntry(it.exId, it)) : [],
  };
  save();
  openSession();
}
function newEntry(exId, plan) {
  const p = { sets: plan.sets || 3, min: plan.min || 8, max: plan.max || 12 };
  return { exId, ...p, sets: Array.from({ length: p.sets }, () => ({ w: null, r: null, done: false })), plan: p };
}

function openSession() {
  const el = $('#session');
  el.hidden = false; el.classList.remove('out');
  renderSession();
  clearInterval(tick);
  tick = setInterval(() => { const t = $('#s-clock'); if (t && db.active) t.textContent = clock(Date.now() - db.active.start); }, 1000);
}
function closeSession() {
  const el = $('#session');
  el.classList.add('out');
  clearInterval(tick);
  setTimeout(() => { el.hidden = true; el.classList.remove('out'); }, 260);
  render();
}

function renderSession() {
  const a = db.active;
  const el = $('#session');
  const scroll = el.querySelector('.cover-body')?.scrollTop || 0;
  const blocks = a.entries.map((e, ei) => {
    const ex = exById(e.exId);
    const sg = suggest(e.exId, { sets: e.sets.length, min: e.plan.min, max: e.plan.max });
    const prev = exHistory(e.exId)[0];
    const rows = e.sets.map((s, si) => {
      const p = prev && prev.entry.sets[si];
      const t = sg.targets[si] || sg.targets[sg.targets.length - 1] || {};
      return `<div class="set${s.done ? ' done' : ''}" data-ei="${ei}" data-si="${si}">
        <span class="n num">${si + 1}</span>
        <span class="prev num ${p ? '' : 'none'}">${p ? setText(p) : '—'}</span>
        <input class="num" inputmode="decimal" data-in="w" value="${fmt(s.w)}" placeholder="${t.w != null && (t.w || ex.kind !== 'bw') ? fmt(t.w) : ex.kind === 'bw' ? '0' : 'kg'}" aria-label="Kg serie ${si + 1}">
        <input class="num" inputmode="numeric" pattern="[0-9]*" data-in="r" value="${s.r ?? ''}" placeholder="${t.r ?? e.plan.min}" aria-label="Reps serie ${si + 1}">
        <button class="ok" data-act="toggle-set" aria-label="Serie ${si + 1} fatta" aria-pressed="${s.done}"><span>${icon('check')}</span></button>
      </div>`;
    }).join('');
    return `<section class="ex">
      <div class="ex-head"><div><h2>${esc(ex.name)}</h2><div class="meta num">${e.sets.length} × ${e.plan.min}–${e.plan.max} · ${esc(groupName(ex.group))}${prev ? ' · ultima ' + ago(prev.session.start) : ''}</div></div>
        <button class="navbtn" data-act="ex-menu" data-ei="${ei}" aria-label="Opzioni esercizio">${icon('more')}</button></div>
      <div class="sugg ${sg.kind}">${icon(sg.icon)}<div><div class="what num">${sg.what}</div><div class="why">${sg.why}</div></div></div>
      <div class="sets"><div class="hdr"><span>#</span><span>Precedente</span><span>Kg</span><span>Reps</span><span></span></div>${rows}</div>
      <div class="set-actions"><button data-act="add-set" data-ei="${ei}">Aggiungi serie</button><button data-act="del-set" data-ei="${ei}" ${e.sets.length < 2 ? 'disabled' : ''}>Togli serie</button></div>
    </section>`;
  }).join('');
  el.innerHTML = `
    <header class="navbar"><div class="l"><button class="navbtn" data-act="minimize" aria-label="Riduci">${icon('down')}</button></div>
      <div class="t">${esc(a.name)}<small id="s-clock" class="num">${clock(Date.now() - a.start)}</small></div>
      <div class="r"><button class="navbtn strong" data-act="finish">Fine</button></div></header>
    <div class="cover-body">
      ${a.entries.length ? blocks : `<div class="empty">${icon('dumbbell')}<h3>Allenamento vuoto</h3><p>Aggiungi gli esercizi che fai oggi. Per ognuno vedrai l'ultima volta e il peso suggerito.</p></div>`}
      <div class="pad"><button class="btn secondary" data-act="s-add">${icon('plus')}Aggiungi esercizio</button></div>
      <div class="sec"><div class="group"><button class="row danger" data-act="discard">Annulla allenamento</button></div></div>
    </div>`;
  el.querySelector('.cover-body').scrollTop = scroll;
}

function toggleSet(btn) {
  const row = btn.closest('.set');
  const e = db.active.entries[+row.dataset.ei];
  const s = e.sets[+row.dataset.si];
  const [wIn, rIn] = row.querySelectorAll('input');
  if (s.done) { s.done = false; row.classList.remove('done'); btn.setAttribute('aria-pressed', 'false'); save(); return; }
  const ex = exById(e.exId);
  if (s.w == null) s.w = num(wIn.placeholder) ?? (ex.kind === 'bw' ? 0 : null);
  if (s.r == null) s.r = num(rIn.placeholder);
  if (s.w == null) { wIn.focus(); return; }
  if (!s.r) { rIn.focus(); return; }
  wIn.value = fmt(s.w); rIn.value = s.r;
  s.done = true; row.classList.add('done'); btn.setAttribute('aria-pressed', 'true');
  haptic('MEDIUM');
  save();
}

async function finishSession() {
  const a = db.active;
  const entries = a.entries.map((e) => ({ exId: e.exId, plan: e.plan, sets: e.sets.filter((s) => s.done).map((s) => ({ w: s.w || 0, r: s.r })) })).filter((e) => e.sets.length);
  const pending = a.entries.reduce((n, e) => n + e.sets.filter((s) => !s.done && (s.w != null || s.r != null)).length, 0);
  if (!entries.length) {
    const ok = await actionSheet({ title: 'Nessuna serie spuntata', text: 'Spunta le serie fatte con ✓ per salvarle. Vuoi chiudere senza salvare?', actions: [{ label: 'Chiudi senza salvare', danger: true, value: true }] });
    if (ok) { db.active = null; save(true); closeSession(); }
    return;
  }
  if (pending) {
    const ok = await actionSheet({ title: `${pending} ${pending === 1 ? 'serie compilata ma non spuntata' : 'serie compilate ma non spuntate'}`, text: 'Le serie senza ✓ non vengono salvate.', actions: [{ label: 'Salva solo quelle spuntate', value: true }] });
    if (!ok) return;
  }
  const s = { id: a.id, routineId: a.routineId, name: a.name, start: a.start, end: Date.now(), entries };
  db.sessions.push(s);
  db.active = null;
  save(true);
  haptic('HEAVY');
  closeSession();
  toast(`Salvato · ${fmt(Math.round(volume(entries)))} kg di volume`);
}

function renderResume() {
  const b = $('#resume');
  if (!db.active || !$('#session').hidden) { b.hidden = true; return; }
  const done = db.active.entries.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  b.hidden = false;
  b.innerHTML = `<span class="dot"></span><span><b>${esc(db.active.name)}</b><small class="num">In corso · ${done} serie fatte</small></span><span class="go">Riprendi</span>`;
}

/* ============ sheets ============ */
function sheet({ small, title, left, right, body, mount }) {
  const root = $('#sheet-root');
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const el = document.createElement('div'); el.className = 'sheet' + (small ? ' small' : '');
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', title || '');
  el.innerHTML = `<div class="grab"></div>${title || left || right ? `<header class="navbar"><div class="l">${left || ''}</div><div class="t">${esc(title || '')}</div><div class="r">${right || ''}</div></header>` : ''}<div class="sheet-body">${body}</div>`;
  root.append(scrim, el);
  const close = () => { el.classList.add('out'); scrim.classList.add('out'); setTimeout(() => { el.remove(); scrim.remove(); }, 240); };
  scrim.addEventListener('click', close);
  // swipe giù sulla maniglia per chiudere
  let sy = null;
  el.addEventListener('touchstart', (e) => { sy = e.target.closest('.grab, .navbar') ? e.touches[0].clientY : null; }, { passive: true });
  el.addEventListener('touchend', (e) => { if (sy != null && e.changedTouches[0].clientY - sy > 80) close(); sy = null; }, { passive: true });
  el._close = close;
  mount && mount(el, close);
  return { el, close };
}

function actionSheet({ title, text, actions }) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    const { el, close } = sheet({
      small: true,
      body: `<div style="padding:8px 16px 4px;text-align:center"><div style="font-weight:600">${esc(title)}</div>${text ? `<div style="color:var(--label2);font-size:.85rem;margin-top:4px;line-height:1.35">${esc(text)}</div>` : ''}</div>
        <div class="pad" style="margin:14px 0 0">${actions.map((a, i) => `<button class="btn ${a.danger ? '' : 'secondary'}" ${a.danger ? 'style="background:var(--prev);color:#fff"' : ''} data-i="${i}">${esc(a.label)}</button>`).join('')}
        <button class="btn secondary" style="color:var(--label)" data-i="-1">Annulla</button></div>`,
    });
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]'); if (!b) return;
      const i = +b.dataset.i; finish(i >= 0 ? actions[i].value : null); close();
    });
    el.previousSibling.addEventListener('click', () => finish(null));
  });
}

function pickExercises(onDone) {
  const sel = [];
  let filter = 'all', q = '';
  const listHtml = () => {
    const items = db.exercises.filter((e) => (filter === 'all' || e.group === filter) && (!q || e.name.toLowerCase().includes(q)));
    const byG = GROUPS.map((g) => [g, items.filter((e) => e.group === g.id)]).filter(([, l]) => l.length);
    if (!byG.length) return `<div class="empty"><p>Nessun risultato.</p></div>`;
    return byG.map(([g, l]) => `<div class="sec"><div class="sec-h"><span>${g.name}</span></div><div class="group">${l.map((e) => `
      <button class="row" data-pick="${e.id}" aria-pressed="${sel.includes(e.id)}"><div class="main"><div class="title">${esc(e.name)}</div></div>${sel.includes(e.id) ? `<span class="check num" style="font-weight:600">${sel.indexOf(e.id) + 1}</span>${icon('check', 'check')}` : ''}</button>`).join('')}</div></div>`).join('');
  };
  const { el, close } = sheet({
    title: 'Aggiungi esercizi',
    left: `<button class="navbtn" data-x="cancel">Annulla</button>`,
    right: `<button class="navbtn strong" data-x="done" disabled>Aggiungi</button>`,
    body: `<label class="search">${icon('search')}<input type="search" data-x="q" placeholder="Cerca" enterkeyhint="search"></label>
      <div class="chips"><button data-g="all" aria-pressed="true">Tutti</button>${GROUPS.map((g) => `<button data-g="${g.id}" aria-pressed="false">${g.name}</button>`).join('')}</div>
      <div class="plist">${listHtml()}</div>`,
  });
  const refresh = () => {
    el.querySelector('.plist').innerHTML = listHtml();
    const d = el.querySelector('[data-x="done"]');
    d.disabled = !sel.length; d.style.opacity = sel.length ? 1 : .35;
    d.textContent = sel.length ? `Aggiungi (${sel.length})` : 'Aggiungi';
  };
  refresh();
  el.addEventListener('click', (e) => {
    const p = e.target.closest('[data-pick]');
    if (p) { const id = p.dataset.pick; const i = sel.indexOf(id); i >= 0 ? sel.splice(i, 1) : sel.push(id); haptic(); refresh(); return; }
    const g = e.target.closest('[data-g]');
    if (g) { filter = g.dataset.g; el.querySelectorAll('[data-g]').forEach((b) => b.setAttribute('aria-pressed', b === g)); refresh(); return; }
    const x = e.target.closest('[data-x]');
    if (x && x.dataset.x === 'cancel') close();
    if (x && x.dataset.x === 'done' && sel.length) { close(); onDone(sel); }
  });
  el.querySelector('[data-x="q"]').addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); refresh(); });
}

function newExerciseSheet(name) {
  let group = route().v === 'group' ? route().id : 'petto', kind = 'bar';
  const chipsG = () => GROUPS.map((g) => `<button data-g="${g.id}" aria-pressed="${g.id === group}">${g.name}</button>`).join('');
  const chipsK = () => KINDS.map(([k, n]) => `<button data-k="${k}" aria-pressed="${k === kind}">${n}</button>`).join('');
  const { el, close } = sheet({
    title: 'Nuovo esercizio',
    left: `<button class="navbtn" data-x="cancel">Annulla</button>`,
    right: `<button class="navbtn strong" data-x="save">Aggiungi</button>`,
    body: `<div class="sec"><div class="group"><div class="field"><input class="left" data-x="name" value="${esc(name || '')}" placeholder="Nome esercizio" autocomplete="off"></div></div></div>
      <div class="sec-h" style="margin:0 20px 8px"><span>Gruppo muscolare</span></div><div class="chips cg" style="flex-wrap:wrap">${chipsG()}</div>
      <div class="sec-h" style="margin:8px 20px 8px"><span>Attrezzo</span></div><div class="chips ck" style="flex-wrap:wrap">${chipsK()}</div>`,
  });
  el.addEventListener('click', (e) => {
    const g = e.target.closest('[data-g]'); if (g) { group = g.dataset.g; el.querySelector('.cg').innerHTML = chipsG(); return; }
    const k = e.target.closest('[data-k]'); if (k) { kind = k.dataset.k; el.querySelector('.ck').innerHTML = chipsK(); return; }
    const x = e.target.closest('[data-x]'); if (!x) return;
    if (x.dataset.x === 'cancel') close();
    if (x.dataset.x === 'save') {
      const n = el.querySelector('[data-x="name"]').value.trim();
      if (!n) { el.querySelector('[data-x="name"]').focus(); return; }
      let id = slug(n) || uid(); if (db.exercises.some((e) => e.id === id)) id += '-' + uid().slice(-4);
      db.exercises.push({ id, name: n, group, kind, inc: defaultIncrement(group, kind), custom: true });
      save(); close(); state.q = ''; render(); toast('Esercizio aggiunto');
    }
  });
}

function backupSheet() {
  const { el, close } = sheet({
    small: true,
    body: `<div style="padding:8px 16px 4px;text-align:center"><div style="font-weight:600">Backup dei dati</div>
      <div style="color:var(--label2);font-size:.85rem;margin-top:4px;line-height:1.35">I dati restano sul telefono. Esporta un backup prima di reinstallare l'app o se la elimini.</div></div>
      <div class="pad" style="margin:14px 0 0"><button class="btn" data-x="export">Esporta backup</button>
      <label class="btn secondary">Importa backup<input type="file" accept="application/json,.json" data-x="import" hidden></label>
      <button class="btn secondary" style="color:var(--label)" data-x="cancel">Chiudi</button></div>`,
  });
  el.addEventListener('click', async (e) => {
    const x = e.target.closest('[data-x]'); if (!x) return;
    if (x.dataset.x === 'cancel') close();
    if (x.dataset.x === 'export') {
      const raw = JSON.stringify(db);
      const name = `beast-track-backup-${new Date().toISOString().slice(0, 10)}.json`;
      try {
        const file = new File([raw], name, { type: 'application/json' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); close(); return; }
      } catch (err) { if (err && err.name === 'AbortError') return; }
      try { await navigator.clipboard.writeText(raw); toast('Backup copiato negli appunti'); close(); } catch (err) {
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([raw], { type: 'application/json' })); a.download = name; a.click(); close();
      }
    }
  });
  el.querySelector('[data-x="import"]').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!Array.isArray(d.exercises) || !Array.isArray(d.sessions)) throw new Error();
      close();
      const ok = await actionSheet({ title: 'Sostituire i dati attuali?', text: `Il backup contiene ${d.sessions.length} allenamenti e ${(d.routines || []).length} schede.`, actions: [{ label: 'Importa e sostituisci', danger: true, value: true }] });
      if (!ok) return;
      db = { v: 1, routines: [], active: null, ...d }; save(true); render(); toast('Backup importato');
    } catch (err) { toast('File non valido: serve un backup di Beast Track'); }
  });
}

let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ============ azioni ============ */
const ACTIONS = {
  back: pop,
  'new-routine': () => {
    const r = { id: uid(), name: '', items: [] };
    db.routines.push(r); save(); push({ v: 'routine', id: r.id });
  },
  'open-routine': (el) => push({ v: 'routine', id: el.dataset.id }),
  start: (el) => startSession(db.routines.find((r) => r.id === el.dataset.id)),
  'start-free': () => startSession(null),
  'rt-add': () => {
    const rt = db.routines.find((x) => x.id === route().id);
    pickExercises((ids) => { ids.forEach((id) => rt.items.push({ exId: id, sets: 3, min: 8, max: 12 })); save(); render(); });
  },
  'rt-remove': (el) => { const rt = db.routines.find((x) => x.id === route().id); rt.items.splice(+el.dataset.i, 1); save(); render(); },
  'rt-sets': (el) => {
    const rt = db.routines.find((x) => x.id === route().id); const it = rt.items[+el.dataset.i];
    it.sets = Math.min(10, Math.max(1, it.sets + +el.dataset.d)); haptic(); save(); el.parentNode.querySelector('span').textContent = it.sets;
  },
  'rt-delete': async () => {
    const rt = db.routines.find((x) => x.id === route().id);
    const ok = await actionSheet({ title: `Eliminare “${rt.name || 'questa scheda'}”?`, text: 'Gli allenamenti già salvati restano nello storico.', actions: [{ label: 'Elimina scheda', danger: true, value: true }] });
    if (!ok) return;
    db.routines = db.routines.filter((x) => x !== rt); save(); stack().pop(); render('pop');
  },
  'open-group': (el) => push({ v: 'group', id: el.dataset.id }),
  'open-ex': (el) => push({ v: 'exercise', id: el.dataset.id }),
  'new-ex': () => newExerciseSheet(state.q.trim()),
  inc: (el) => { const ex = exById(route().id); ex.inc = Math.max(0, Math.min(20, ex.inc + +el.dataset.d)); save(); render(); },
  'ex-delete': async () => {
    const ok = await actionSheet({ title: 'Eliminare questo esercizio?', text: 'Sparisce dalla libreria e dalle schede. Lo storico resta.', actions: [{ label: 'Elimina', danger: true, value: true }] });
    if (!ok) return;
    const id = route().id;
    db.exercises = db.exercises.filter((e) => e.id !== id);
    db.routines.forEach((r) => { r.items = r.items.filter((i) => i.exId !== id); });
    save(); stack().pop(); render('pop');
  },
  'open-session': (el) => push({ v: 'session', id: el.dataset.id }),
  'session-delete': async (el) => {
    const ok = await actionSheet({ title: 'Eliminare questo allenamento?', text: 'Le serie spariscono anche dai suggerimenti futuri.', actions: [{ label: 'Elimina', danger: true, value: true }] });
    if (!ok) return;
    db.sessions = db.sessions.filter((s) => s.id !== el.dataset.id); save(); stack().pop(); render('pop');
  },
  backup: backupSheet,

  minimize: closeSession,
  finish: finishSession,
  discard: async () => {
    const ok = await actionSheet({ title: 'Annullare l\'allenamento?', text: 'Le serie di oggi non verranno salvate.', actions: [{ label: 'Annulla allenamento', danger: true, value: true }] });
    if (ok) { db.active = null; save(true); closeSession(); }
  },
  'toggle-set': toggleSet,
  'add-set': (el) => {
    const e = db.active.entries[+el.dataset.ei]; const l = e.sets[e.sets.length - 1];
    e.sets.push({ w: l ? l.w : null, r: null, done: false }); save(); renderSession();
  },
  'del-set': (el) => { const e = db.active.entries[+el.dataset.ei]; if (e.sets.length > 1) { e.sets.pop(); save(); renderSession(); } },
  's-add': () => pickExercises((ids) => { ids.forEach((id) => db.active.entries.push(newEntry(id, {}))); save(); renderSession(); }),
  'ex-menu': async (el) => {
    const i = +el.dataset.ei; const list = db.active.entries; const ex = exById(list[i].exId);
    const v = await actionSheet({ title: ex.name, actions: [
      ...(i > 0 ? [{ label: 'Sposta su', value: 'up' }] : []),
      ...(i < list.length - 1 ? [{ label: 'Sposta giù', value: 'down' }] : []),
      { label: 'Rimuovi dall\'allenamento', danger: true, value: 'rm' }] });
    if (v === 'rm') list.splice(i, 1);
    if (v === 'up') list.splice(i - 1, 0, list.splice(i, 1)[0]);
    if (v === 'down') list.splice(i + 1, 0, list.splice(i, 1)[0]);
    if (v) { save(); renderSession(); }
  },
};

document.addEventListener('click', (e) => {
  const tab = e.target.closest('.tabbar button');
  if (tab) { setTab(tab.dataset.tab); return; }
  if (e.target.closest('#resume')) { openSession(); renderResume(); return; }
  if (e.target.closest('.sheet')) return;
  const el = e.target.closest('[data-act]');
  if (el && ACTIONS[el.dataset.act]) ACTIONS[el.dataset.act](el, e);
});

document.addEventListener('input', (e) => {
  const el = e.target; const k = el.dataset && el.dataset.in; if (!k) return;
  if (k === 'q') { state.q = el.value; const v = VIEWS.groups(); const tmp = document.createElement('div'); tmp.innerHTML = v.body; $('#glist').replaceWith(tmp.querySelector('#glist')); return; }
  if (k === 'w' || k === 'r') {
    const row = el.closest('.set'); const s = db.active.entries[+row.dataset.ei].sets[+row.dataset.si];
    s[k] = el.value === '' ? null : num(el.value); if (k === 'r' && s.r != null) s.r = Math.round(s.r);
    save(); return;
  }
  const rt = db.routines.find((x) => x.id === route().id); if (!rt) return;
  if (k === 'rt-name') { rt.name = el.value; route().title = el.value || 'Nuova scheda'; const t = $('.navbar .t'); if (t) t.textContent = route().title; }
  if (k === 'rt-min' || k === 'rt-max') {
    const it = rt.items[+el.dataset.i]; const v = parseInt(el.value, 10);
    if (v > 0 && v < 100) it[k === 'rt-min' ? 'min' : 'max'] = v;
  }
  save();
});
// range reps coerente quando esci dal campo
document.addEventListener('change', (e) => {
  const k = e.target.dataset && e.target.dataset.in;
  if (k !== 'rt-min' && k !== 'rt-max') return;
  const rt = db.routines.find((x) => x.id === route().id); const it = rt.items[+e.target.dataset.i];
  if (it.min > it.max) [it.min, it.max] = [it.max, it.min];
  save(); render();
});
// invio sulla tastiera: dal kg passa alle reps
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const el = e.target;
  if (el.dataset.in === 'w') { e.preventDefault(); el.nextElementSibling.focus(); }
  else if (el.dataset.in === 'r') { e.preventDefault(); el.blur(); }
  else if (el.dataset.in === 'rt-name' || el.dataset.in === 'q') el.blur();
});

// uscendo da una scheda vuota e senza nome, la eliminiamo
const _pop = pop;
ACTIONS.back = () => {
  const r = route();
  if (r.v === 'routine') {
    const rt = db.routines.find((x) => x.id === r.id);
    if (rt && !rt.items.length && !rt.name.trim()) { db.routines = db.routines.filter((x) => x !== rt); save(); }
    else if (rt && !rt.name.trim()) { rt.name = `Scheda ${db.routines.indexOf(rt) + 1}`; save(); }
  }
  _pop();
};

/* ============ avvio ============ */
(async () => {
  document.querySelectorAll('[data-icon]').forEach((s) => { s.outerHTML = icon(s.dataset.icon); });
  await load();
  render();
  if (Plugins.StatusBar) Plugins.StatusBar.setStyle({ style: 'DEFAULT' }).catch(() => {});
})();
