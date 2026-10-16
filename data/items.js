// The 10 unlockable Programmpunkte.
// `id` must match the ids used in tools/convert-sheet.py (ITEM_CELLS).
// Codes are case-insensitive; spaces and dashes are ignored on input.
// Ambiguous characters (0/O, 1/I) are deliberately avoided.
const ITEMS = [
  // Flashlight puzzle. Solving this is special: it's the only code that does
  // anything during the blackout screen, and solving it moves the projector
  // on to the story screen (see main.js / data/story.js / data/config.js).
  { id: 'anmeldung',      code: '48351', label: 'Anmeldung',       reveal: 'grow' },
  { id: 'bibelarbeit',    code: '4914', label: 'Bibelarbeit',     reveal: 'wave' },
  { id: 'ma_besprechung', code: 'TEAMER', label: 'MA Besprechung',  reveal: 'wave' },
  { id: 'singen',         code: 'LIEDDD', label: 'Singen',          reveal: 'wave' },
  { id: 'wasserspiele',   code: 'QUELLE', label: 'Wasserspiele',    reveal: 'grow' },
  { id: 'gelaendespiel',  code: 'PDFROSENAU', label: 'Geländespiel',    reveal: 'grow' },
  { id: 'wanderung',      code: 'BERGWANDERER', label: 'Wanderung',       reveal: 'wave' },
  { id: 'essen',          code: '527', label: 'Essen',           reveal: 'wave' },
  { id: 'stockbrot',      code: 'STBRT', label: 'Stockbrot',       reveal: 'grow' },
  { id: 'lagerfeuer',     code: 'HOLZ', label: 'Lagerfeuer',      reveal: 'wave' },
];

if (typeof module !== 'undefined') module.exports = ITEMS;
else window.ITEMS = ITEMS;
