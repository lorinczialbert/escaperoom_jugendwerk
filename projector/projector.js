const RH = CONFIG.rowHeightScale || 1.3;
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const byId = (id) => GAME.ITEMS.find((i) => i.id === id);
const color = (bg) => (CONFIG.softColors && CONFIG.colorMap[bg]) || bg;

let unlocked = [];
let fresh = null;           // item id that was just unlocked (animate once)
let phase = 'blackout';
let timerEndsAt = null;
let timerInterval = null;

function cellKey(r, c) { return r + ':' + c; }

function render() {
  const set = new Set(unlocked);
  const cells = new Map(SCHEDULE.cells.map((c) => [cellKey(c.r, c.c), c]));
  const covered = new Set();
  const freshCells = [];

  const table = document.createElement('table');
  table.className = 'waffle';

  const cg = document.createElement('colgroup');
  if (CONFIG.showSheetChrome) cg.appendChild(col(42));
  cg.appendChild(col(SCHEDULE.timeColWidth));
  for (let i = 0; i < 7; i++) cg.appendChild(col(SCHEDULE.dayColWidth));
  table.appendChild(cg);

  if (CONFIG.showSheetChrome) {
    const tr = document.createElement('tr');
    tr.style.height = '20px';
    tr.appendChild(el('td', 'rownum', ''));
    LETTERS.forEach((l) => tr.appendChild(el('td', 'colletter', l)));
    table.appendChild(tr);
  }

  SCHEDULE.rows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.style.height = Math.round(row.h * RH) + 'px';
    if (CONFIG.showSheetChrome) tr.appendChild(el('td', 'rownum', String(row.r)));

    for (let c = 0; c < 8; c++) {
      if (covered.has(cellKey(row.r, c))) continue;
      const cell = cells.get(cellKey(row.r, c));
      if (!cell) { tr.appendChild(el('td', '', '')); continue; }
      for (let k = 1; k < cell.rs; k++) covered.add(cellKey(row.r + k, c));

      const td = document.createElement('td');
      td.rowSpan = cell.rs;
      const cls = [];
      if (cell.br === 2) cls.push('br2');
      if (cell.bb === 2) cls.push('bb2');
      if (c === 0) cls.push('time');

      const locked = cell.item && !set.has(cell.item);
      if (locked) {
        cls.push('locked');
      } else {
        if (cell.align === 'c') cls.push('c');
        if (cell.bold) cls.push('b');
        if (cell.italic) cls.push('i');
        td.style.background = color(cell.bg);
        const inner = el('span', 'cellinner', cell.text);
        td.appendChild(inner);
        if (cell.item && cell.item === fresh) { cls.push('fresh'); freshCells.push(td); }
      }
      td.className = cls.join(' ');
      tr.appendChild(td);
    }
    table.appendChild(tr);
  });

  const sheet = document.getElementById('sheet');
  sheet.innerHTML = '';
  sheet.appendChild(table);
  fitToScreen(sheet);
  animate(freshCells);
  drawProgress(set);
}

function animate(tds) {
  if (!tds.length) return;
  const item = byId(fresh);
  const stagger = item && item.reveal === 'wave' ? CONFIG.staggerMs : 0;
  tds.forEach((td, i) => {
    const d = i * stagger;
    td.classList.add('ring');
    td.style.animationDelay = d + 'ms';
    const inner = td.querySelector('.cellinner');
    if (inner) { inner.style.animationDelay = d + CONFIG.highlightMs + 'ms'; inner.style.opacity = '0'; }
  });
  if (item) showBanner(item.label.toUpperCase() + ' FREIGESCHALTET');
  fresh = null;
}

function showBanner(text) {
  const b = document.getElementById('banner');
  b.textContent = text;
  b.classList.add('show');
  clearTimeout(showBanner._t);
  showBanner._t = setTimeout(() => b.classList.remove('show'), CONFIG.bannerMs);
}

function drawProgress(set) {
  const p = document.getElementById('progress');
  if (!CONFIG.showProgress) { p.style.display = 'none'; return; }
  document.getElementById('ptext').textContent =
    `${set.size} / ${GAME.total} Programmpunkte gefunden`;
  const dots = document.getElementById('dots');
  dots.innerHTML = '';
  GAME.ITEMS.forEach((i) => dots.appendChild(el('div', 'dot' + (set.has(i.id) ? ' on' : ''), '')));
  const fin = document.getElementById('finale');
  if (set.size === GAME.total) setTimeout(() => fin.classList.add('show'), 1800);
  else fin.classList.remove('show');
}

function fitToScreen(sheet) {
  if (!CONFIG.fitToScreen) return;
  sheet.style.transform = 'none';
  const topGap = 60;   // clearance for the progress bar
  const pad = 6;
  const availW = innerWidth - pad * 2;
  const availH = innerHeight - topGap - pad;
  const s = Math.min(availW / sheet.offsetWidth, availH / sheet.offsetHeight);
  const scaledW = sheet.offsetWidth * s;
  sheet.style.transform = `scale(${s.toFixed(3)})`;
  sheet.style.left = Math.round((innerWidth - scaledW) / 2) + 'px';
  sheet.style.top = topGap + 'px';
}

const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; e.textContent = txt; return e; };
const col = (w) => { const c = document.createElement('col'); c.style.width = w + 'px'; return c; };

/* ---------------- phase screens (blackout / story / playing / lost) ---------------- */

function renderStory() {
  document.getElementById('storyTitle').textContent = STORY.title;
  document.getElementById('storyText').innerHTML = STORY.paragraphs.map((p) => `<p>${p}</p>`).join('');
  document.getElementById('storyInstruction').innerHTML =
    `Gib den Code <code>${CONFIG.startCode}</code> in den Laptop ein, um zu beginnen.`;
}
renderStory();

function updatePhaseView() {
  document.getElementById('blackout').style.display = phase === 'blackout' ? 'block' : 'none';
  document.getElementById('story').classList.toggle('show', phase === 'story');
  document.getElementById('lost').classList.toggle('show', phase === 'lost');

  const playing = phase === 'playing';
  document.getElementById('stage').style.display = playing ? '' : 'none';
  document.getElementById('progress').style.display = playing ? '' : 'none';
  if (!playing) {
    document.getElementById('finale').classList.remove('show');
    document.getElementById('timer').style.display = 'none';
    document.getElementById('penaltyFlash').classList.remove('show');
  }

  if (playing) { render(); startTimerLoop(); } else { stopTimerLoop(); }
}

function startTimerLoop() {
  stopTimerLoop();
  tickTimer();
  timerInterval = setInterval(tickTimer, 250);
}
function stopTimerLoop() { clearInterval(timerInterval); timerInterval = null; }

function tickTimer() {
  const t = document.getElementById('timer');
  if (!timerEndsAt) { t.style.display = 'none'; return; }
  const remaining = timerEndsAt - Date.now();
  t.style.display = 'flex';
  t.textContent = GAME.formatTime(remaining);
  t.classList.toggle('warn', remaining <= CONFIG.timerWarnSeconds * 1000 && remaining > CONFIG.timerCriticalSeconds * 1000);
  t.classList.toggle('critical', remaining <= CONFIG.timerCriticalSeconds * 1000);
}

function flashPenalty() {
  const f = document.getElementById('penaltyFlash');
  f.classList.add('show');
  clearTimeout(flashPenalty._t);
  flashPenalty._t = setTimeout(() => f.classList.remove('show'), 1400);
}

BUS.onState((s) => {
  unlocked = s.unlocked;
  fresh = s.justUnlocked || null;
  phase = s.phase;
  timerEndsAt = s.timerEndsAt;
  updatePhaseView();
  if (s.penalty) flashPenalty();
});
BUS.getState().then((s) => {
  unlocked = s.unlocked;
  phase = s.phase;
  timerEndsAt = s.timerEndsAt;
  updatePhaseView();
});
addEventListener('resize', () => { if (phase === 'playing') fitToScreen(document.getElementById('sheet')); });
