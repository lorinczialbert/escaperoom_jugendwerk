const input = document.getElementById('code');
const msg = document.getElementById('msg');
const enter = document.getElementById('enter');
let wrongStreak = 0;
let locked = false;
let unlocked = [];
let phase = 'blackout';
let timerEndsAt = null;
let timerInterval = null;

const beep = (ok) => {
  if (!CONFIG.sounds) return;
  try {
    const ctx = beep.ctx || (beep.ctx = new AudioContext());
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = ok ? 880 : 180;
    g.gain.setValueAtTime(.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + (ok ? .3 : .22));
    o.start(); o.stop(ctx.currentTime + .32);
  } catch {}
};

function show(text, kind) {
  msg.textContent = text;
  msg.className = kind;
  input.className = kind === 'good' ? 'good' : kind === 'bad' ? 'bad' : '';
  clearTimeout(show._t);
  show._t = setTimeout(() => { msg.textContent = ''; msg.className = ''; input.className = ''; }, 2200);
}

async function submit() {
  if (locked || phase === 'lost') return;
  const raw = input.value;
  if (!GAME.normalize(raw)) return;
  const { status, penalty } = await BUS.submitCode(raw);
  input.value = '';
  if (status === 'ok') { wrongStreak = 0; show('RICHTIG!', 'good'); beep(true); }
  else if (status === 'already') { show('SCHON GEFUNDEN', 'info'); beep(true); }
  else if (status === 'lost') { /* the state broadcast already switched to the lost screen */ }
  else {
    wrongStreak++;
    show(penalty ? 'FALSCH  \u22121 MINUTE' : 'FALSCH', 'bad');
    beep(false);
    cooldownIfNeeded();
  }
  input.focus();
}

function cooldownIfNeeded() {
  if (wrongStreak < CONFIG.wrongAttemptsBeforeCooldown) return;
  wrongStreak = 0;
  locked = true;
  let left = CONFIG.cooldownSeconds;
  enter.disabled = true;
  const tick = () => {
    if (left <= 0) {
      locked = false;
      enter.disabled = phase === 'lost';
      msg.textContent = '';
      input.focus();
      return;
    }
    show(`BITTE WARTEN … ${left}`, 'info');
    left--; setTimeout(tick, 1000);
  };
  tick();
}

enter.addEventListener('click', submit);
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
document.addEventListener('click', () => { if (phase !== 'lost') input.focus(); });
addEventListener('blur', () => setTimeout(() => { if (phase !== 'lost') input.focus(); }, 50));
input.focus();

BUS.onState((s) => {
  unlocked = s.unlocked; phase = s.phase; timerEndsAt = s.timerEndsAt;
  paint(s);
  applyPhase();
});
BUS.getState().then((s) => {
  unlocked = s.unlocked; phase = s.phase; timerEndsAt = s.timerEndsAt;
  paint(s);
  applyPhase();
});

function paint(s) {
  document.getElementById('count').textContent = `${s.unlocked.length} / ${s.total} gefunden`;
  if (document.getElementById('gm').classList.contains('show')) gmList();
}

function applyPhase() {
  const lost = phase === 'lost';
  document.getElementById('lostScreen').classList.toggle('show', lost);
  document.getElementById('wrap').style.display = lost ? 'none' : '';
  enter.disabled = lost || locked;
  input.disabled = lost;
  if (lost) { stopTimerLoop(); return; }
  startTimerLoop();
}

function startTimerLoop() {
  stopTimerLoop();
  tickTimer();
  timerInterval = setInterval(tickTimer, 500);
}
function stopTimerLoop() { clearInterval(timerInterval); timerInterval = null; }

function tickTimer() {
  const t = document.getElementById('timer');
  if (!timerEndsAt) { t.textContent = ''; return; }
  const remaining = timerEndsAt - Date.now();
  t.textContent = GAME.formatTime(remaining);
  t.classList.toggle('warn', remaining <= CONFIG.timerWarnSeconds * 1000 && remaining > CONFIG.timerCriticalSeconds * 1000);
  t.classList.toggle('critical', remaining <= CONFIG.timerCriticalSeconds * 1000);
}

/* ---------------- game master ---------------- */
addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'g') {
    const gm = document.getElementById('gm');
    if (gm.classList.contains('show')) { closeGm(); return; }
    gm.classList.add('show');
    document.getElementById('gmgate').style.display = 'block';
    document.getElementById('gmbody').style.display = 'none';
    document.getElementById('gmerr').textContent = '';
    const pw = document.getElementById('gmpw');
    pw.value = '';
    setTimeout(() => pw.focus(), 30);
  }
  if (e.key === 'Escape') closeGm();
});

function closeGm() {
  document.getElementById('gm').classList.remove('show');
  if (phase !== 'lost') input.focus();
}

document.getElementById('gmpw').addEventListener('keydown', (e) => {
  e.stopPropagation();
  if (e.key !== 'Enter') return;
  if (e.target.value === CONFIG.gmPassword) {
    document.getElementById('gmgate').style.display = 'none';
    document.getElementById('gmbody').style.display = 'block';
    gmList();
  } else {
    document.getElementById('gmerr').textContent = 'Falsches Passwort';
    e.target.value = '';
  }
});

const gmDo = async (action, itemId) => { await BUS.gm({ action, itemId, password: CONFIG.gmPassword }); gmList(); };

function gmList() {
  const list = document.getElementById('gmlist');
  list.innerHTML = '';
  GAME.ITEMS.forEach((i) => {
    const on = unlocked.includes(i.id);
    const row = document.createElement('div');
    row.className = 'gmrow';
    row.innerHTML = `<span>${i.label}<br><span class="code">${i.code}</span></span>`;
    const b = document.createElement('button');
    b.className = on ? 'on' : 'off';
    b.textContent = on ? 'OFFEN' : 'ZU';
    b.onclick = () => gmDo(on ? 'lock' : 'unlock', i.id);
    row.appendChild(b);
    list.appendChild(row);
  });
}

document.getElementById('gmbar').addEventListener('click', (e) => {
  const a = e.target.dataset.action;
  if (!a) return;
  if (a === 'reset' && !confirm('Spiel wirklich zurücksetzen? (Intro, Story und Timer werden zurückgesetzt)')) return;
  gmDo(a);
});
