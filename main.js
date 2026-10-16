const { app, BrowserWindow, ipcMain, screen, globalShortcut, powerSaveBlocker } = require('electron');
const path = require('path');
const fs = require('fs');

const GAME = require('./core/game.js');
const CONFIG = require('./data/config.js');

let laptopWin = null;
let projectorWin = null;
let swapped = false;
let statePath = null;

// phase: 'blackout' -> 'story' -> 'playing' -> 'lost'
let state = { unlocked: [], phase: 'blackout', timerEndsAt: null, timerTotalMs: null };

/* ---------- state ---------- */
function loadState() {
  try { state = JSON.parse(fs.readFileSync(statePath, 'utf8')); } catch { state = {}; }
  if (!Array.isArray(state.unlocked)) state.unlocked = [];
  // Migration: older saves have no phase field. If they already had
  // progress, assume they were mid-game rather than resetting to blackout.
  if (!state.phase) state.phase = state.unlocked.length ? 'playing' : 'blackout';
  if (typeof state.timerEndsAt !== 'number') state.timerEndsAt = null;
  if (typeof state.timerTotalMs !== 'number') state.timerTotalMs = null;
}
function saveState() {
  try { fs.writeFileSync(statePath, JSON.stringify(state)); } catch (e) { console.error('save failed', e); }
}
function publicState(extra = {}) {
  return {
    unlocked: state.unlocked,
    total: GAME.total,
    phase: state.phase,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    ...extra,
  };
}
function broadcast(extra = {}) {
  const payload = publicState(extra);
  [laptopWin, projectorWin].forEach((w) => w && !w.isDestroyed() && w.webContents.send('state', payload));
}

function startTimer() {
  state.timerTotalMs = CONFIG.timerMinutes * 60000;
  state.timerEndsAt = Date.now() + state.timerTotalMs;
}

// Used by GM item toggles: if we're still in the intro, jump straight into
// play-testing mode (with a fresh timer) so the effect is visible immediately.
function ensurePlayingWithTimer() {
  if (state.phase === 'blackout' || state.phase === 'story') {
    if (!state.unlocked.includes('anmeldung')) state.unlocked.push('anmeldung');
    state.phase = 'playing';
  }
  if (state.phase === 'playing' && !state.timerEndsAt) startTimer();
}

/* ---------- windows ---------- */
function createWindows() {
  const displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  const secondary = displays.find((d) => d.id !== primary.id) || primary;

  const base = {
    fullscreen: displays.length > 1,
    backgroundColor: '#111111',
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true },
  };

  laptopWin = new BrowserWindow({ ...base, ...bounds(primary), title: 'Code' });
  laptopWin.loadFile('laptop/index.html');

  projectorWin = new BrowserWindow({ ...base, ...bounds(secondary), title: 'Tagesplan' });
  projectorWin.loadFile('projector/index.html');

  // Safety net: never let the game die on a stray Alt+F4 / Ctrl+W.
  [laptopWin, projectorWin].forEach((w) => {
    w.on('close', (e) => { if (!app.isQuitting) e.preventDefault(); });
  });
}
const bounds = (d) => ({ x: d.bounds.x, y: d.bounds.y, width: d.bounds.width, height: d.bounds.height });

function swapDisplays() {
  const displays = screen.getAllDisplays();
  if (displays.length < 2 || !laptopWin || !projectorWin) return;
  swapped = !swapped;
  const [a, b] = swapped ? [displays[1], displays[0]] : [displays[0], displays[1]];
  [[laptopWin, a], [projectorWin, b]].forEach(([w, d]) => {
    w.setFullScreen(false);
    w.setBounds(bounds(d));
    w.setFullScreen(true);
  });
}

/* ---------- ipc ---------- */
ipcMain.handle('submit-code', (_e, raw) => {
  if (state.phase === 'lost') return { status: 'lost' };

  // Blackout: nothing on the projector yet. Only the flashlight/Anmeldung
  // code does anything - anything else is just wrong.
  if (state.phase === 'blackout') {
    const result = GAME.checkCode(raw, state.unlocked);
    if (result.status === 'ok' && result.item.id === 'anmeldung') {
      state.unlocked.push('anmeldung');
      state.phase = 'story';
      saveState();
      broadcast({ justUnlocked: 'anmeldung' });
      return { status: 'ok' };
    }
    return { status: 'wrong' };
  }

  // Story: projector shows the narrative. Only the start code moves on.
  if (state.phase === 'story') {
    if (GAME.normalize(raw) === GAME.normalize(CONFIG.startCode)) {
      state.phase = 'playing';
      startTimer();
      saveState();
      broadcast();
      return { status: 'ok' };
    }
    return { status: 'wrong' };
  }

  // Playing: normal game, with a time penalty for wrong codes.
  const result = GAME.checkCode(raw, state.unlocked);
  if (result.status === 'ok') {
    state.unlocked.push(result.item.id);
    if (state.unlocked.length >= GAME.total) state.timerEndsAt = null; // solved - freeze the clock
    saveState();
    broadcast({ justUnlocked: result.item.id });
    return { status: 'ok' };
  }
  if (result.status === 'already') return { status: 'already' };

  // Wrong code while the clock is running: dock a minute.
  if (state.timerEndsAt) {
    state.timerEndsAt -= CONFIG.wrongPenaltySeconds * 1000;
    const outOfTime = Date.now() >= state.timerEndsAt;
    if (outOfTime) state.phase = 'lost';
    saveState();
    broadcast({ penalty: true });
    return { status: 'wrong', penalty: true };
  }
  return { status: 'wrong' };
});

ipcMain.handle('gm', (_e, { action, itemId, password }) => {
  if (password !== CONFIG.gmPassword) return { ok: false, error: 'password' };

  if (action === 'reset') {
    state = { unlocked: [], phase: 'blackout', timerEndsAt: null, timerTotalMs: null };
  } else if (action === 'showBlackout') {
    state.phase = 'blackout';
  } else if (action === 'showStory') {
    if (!state.unlocked.includes('anmeldung')) state.unlocked.push('anmeldung');
    state.phase = 'story';
  } else if (action === 'skipIntro') {
    if (!state.unlocked.includes('anmeldung')) state.unlocked.push('anmeldung');
    state.phase = 'playing';
    startTimer();
  } else if (action === 'unlock') {
    ensurePlayingWithTimer();
    if (!state.unlocked.includes(itemId)) state.unlocked.push(itemId);
  } else if (action === 'lock') {
    ensurePlayingWithTimer();
    state.unlocked = state.unlocked.filter((id) => id !== itemId);
  } else if (action === 'unlockAll') {
    state.unlocked = GAME.ITEMS.map((i) => i.id);
    state.phase = 'playing';
    state.timerEndsAt = null;
    state.timerTotalMs = null;
  } else if (action === 'minusMinute') {
    if (state.phase === 'playing' && state.timerEndsAt) {
      state.timerEndsAt -= 60000;
      if (Date.now() >= state.timerEndsAt) state.phase = 'lost';
    }
  } else if (action === 'testLose') {
    if (state.phase === 'playing') state.timerEndsAt = Date.now() + 10000;
  } else if (action === 'swapDisplays') {
    swapDisplays();
  } else if (action === 'quit') {
    app.isQuitting = true;
    app.quit();
  }

  saveState();
  broadcast({ justUnlocked: action === 'unlock' ? itemId : null });
  return { ok: true, unlocked: state.unlocked, phase: state.phase };
});

ipcMain.handle('get-state', () => publicState());

/* ---------- lifecycle ---------- */
app.whenReady().then(() => {
  statePath = path.join(app.getPath('userData'), 'state.json');
  loadState();
  powerSaveBlocker.start('prevent-display-sleep');
  createWindows();
  globalShortcut.register('CommandOrControl+Shift+S', swapDisplays);
  globalShortcut.register('CommandOrControl+Shift+Q', () => { app.isQuitting = true; app.quit(); });

  // Auto-lose the moment time runs out, even if nobody typed a code.
  setInterval(() => {
    if (state.phase === 'playing' && state.timerEndsAt && Date.now() >= state.timerEndsAt) {
      state.phase = 'lost';
      saveState();
      broadcast();
    }
  }, 500);
});

app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => globalShortcut.unregisterAll());
