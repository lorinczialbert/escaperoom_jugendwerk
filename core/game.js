// Pure game logic. No DOM, no Electron - shared by main process and browser.
(function (root, factory) {
  const ITEMS = typeof require !== 'undefined' ? require('../data/items.js') : root.ITEMS;
  const api = factory(ITEMS);
  if (typeof module !== 'undefined') module.exports = api;
  else root.GAME = api;
})(typeof window !== 'undefined' ? window : globalThis, function (ITEMS) {

  const normalize = (s) => String(s || '').toUpperCase().replace(/[\s\-_.]/g, '');

  function checkCode(raw, unlocked) {
    const code = normalize(raw);
    if (!code) return { status: 'empty' };
    const item = ITEMS.find((i) => normalize(i.code) === code);
    if (!item) return { status: 'wrong' };
    if (unlocked.includes(item.id)) return { status: 'already', item };
    return { status: 'ok', item };
  }

  function formatTime(ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
  }

  return { ITEMS, normalize, checkCode, formatTime, total: ITEMS.length };
});
