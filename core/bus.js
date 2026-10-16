// Gives both windows the same API whether we run inside Electron or in two
// plain browser windows (fallback if the packaged app ever misbehaves).
// Mirrors main.js's phase/timer state machine so the fallback behaves
// identically to the Electron build.
(function () {
  if (window.api && window.api.electron) { window.BUS = window.api; return; }

  const KEY = 'tagesplan.state';
  const ch = new BroadcastChannel('tagesplan');
  const listeners = [];

  const defaultState = () => ({ unlocked: [], phase: 'blackout', timerEndsAt: null, timerTotalMs: null });
  const load = () => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY)) || defaultState();
      if (!Array.isArray(s.unlocked)) s.unlocked = [];
      if (!s.phase) s.phase = 'blackout';
      if (typeof s.timerEndsAt !== 'number') s.timerEndsAt = null;
      if (typeof s.timerTotalMs !== 'number') s.timerTotalMs = null;
      return s;
    } catch { return defaultState(); }
  };
  const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };
  const startTimer = (s) => { s.timerTotalMs = CONFIG.timerMinutes * 60000; s.timerEndsAt = Date.now() + s.timerTotalMs; };
  const ensurePlaying = (s) => {
    if (s.phase === 'blackout' || s.phase === 'story') {
      if (!s.unlocked.includes('anmeldung')) s.unlocked.push('anmeldung');
      s.phase = 'playing';
    }
    if (s.phase === 'playing' && !s.timerEndsAt) startTimer(s);
  };

  function publicState(s, extra = {}) {
    return {
      unlocked: s.unlocked, total: GAME.total, phase: s.phase,
      timerEndsAt: s.timerEndsAt, timerTotalMs: s.timerTotalMs, ...extra,
    };
  }
  function publish(extra = {}) {
    const payload = publicState(load(), extra);
    ch.postMessage(payload);
    listeners.forEach((f) => f(payload));
  }
  ch.onmessage = (e) => listeners.forEach((f) => f(e.data));

  // Auto-lose watchdog, same as main.js's setInterval.
  setInterval(() => {
    const s = load();
    if (s.phase === 'playing' && s.timerEndsAt && Date.now() >= s.timerEndsAt) {
      s.phase = 'lost';
      save(s);
      publish();
    }
  }, 500);

  window.BUS = {
    electron: false,
    getState: async () => publicState(load()),
    onState: (cb) => listeners.push(cb),

    submitCode: async (raw) => {
      const s = load();
      if (s.phase === 'lost') return { status: 'lost' };

      if (s.phase === 'blackout') {
        const r = GAME.checkCode(raw, s.unlocked);
        if (r.status === 'ok' && r.item.id === 'anmeldung') {
          s.unlocked.push('anmeldung');
          s.phase = 'story';
          save(s); publish({ justUnlocked: 'anmeldung' });
          return { status: 'ok' };
        }
        return { status: 'wrong' };
      }

      if (s.phase === 'story') {
        if (GAME.normalize(raw) === GAME.normalize(CONFIG.startCode)) {
          s.phase = 'playing';
          startTimer(s);
          save(s); publish();
          return { status: 'ok' };
        }
        return { status: 'wrong' };
      }

      const r = GAME.checkCode(raw, s.unlocked);
      if (r.status === 'ok') {
        s.unlocked.push(r.item.id);
        if (s.unlocked.length >= GAME.total) s.timerEndsAt = null;
        save(s); publish({ justUnlocked: r.item.id });
        return { status: 'ok' };
      }
      if (r.status === 'already') return { status: 'already' };

      if (s.timerEndsAt) {
        s.timerEndsAt -= CONFIG.wrongPenaltySeconds * 1000;
        if (Date.now() >= s.timerEndsAt) s.phase = 'lost';
        save(s); publish({ penalty: true });
        return { status: 'wrong', penalty: true };
      }
      return { status: 'wrong' };
    },

    gm: async ({ action, itemId, password }) => {
      if (password !== CONFIG.gmPassword) return { ok: false, error: 'password' };
      const s = load();
      if (action === 'reset') Object.assign(s, defaultState());
      else if (action === 'showBlackout') s.phase = 'blackout';
      else if (action === 'showStory') { if (!s.unlocked.includes('anmeldung')) s.unlocked.push('anmeldung'); s.phase = 'story'; }
      else if (action === 'skipIntro') { if (!s.unlocked.includes('anmeldung')) s.unlocked.push('anmeldung'); s.phase = 'playing'; startTimer(s); }
      else if (action === 'unlock') { ensurePlaying(s); if (!s.unlocked.includes(itemId)) s.unlocked.push(itemId); }
      else if (action === 'lock') { ensurePlaying(s); s.unlocked = s.unlocked.filter((i) => i !== itemId); }
      else if (action === 'unlockAll') { s.unlocked = GAME.ITEMS.map((i) => i.id); s.phase = 'playing'; s.timerEndsAt = null; s.timerTotalMs = null; }
      else if (action === 'minusMinute') { if (s.phase === 'playing' && s.timerEndsAt) { s.timerEndsAt -= 60000; if (Date.now() >= s.timerEndsAt) s.phase = 'lost'; } }
      else if (action === 'testLose') { if (s.phase === 'playing') s.timerEndsAt = Date.now() + 10000; }

      save(s);
      publish({ justUnlocked: action === 'unlock' ? itemId : null });
      return { ok: true, unlocked: s.unlocked, phase: s.phase };
    },
  };
})();
