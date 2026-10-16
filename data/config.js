const CONFIG = {
  // --- Projector look -------------------------------------------------
  showSheetChrome: true,   // column letters A,B,C... and row numbers
  softColors: true,        // tone down the eye-searing sheet colours
  showProgress: true,      // "4 / 10 Programmpunkte gefunden" bar
  fitToScreen: true,       // scale the whole table to fill the display
  rowHeightScale: 1.3,     // stretch sheet row heights for projector legibility

  // Original sheet colour -> projector colour (only used if softColors)
  colorMap: {
    '#00ff00': '#8fd98f',  // Programm / Aktionen
    '#ffff00': '#ffe066',  // Anreise-Tag
    '#ff9900': '#f2b46b',  // Mitarbeiter
    '#cc99ff': '#cfa9f0',  // Essen
    '#00ccff': '#7fd4f0',  // Bibelarbeit / Andacht
    '#ccffff': '#d6f2f2',  // Singen
    '#fff2cc': '#fff2cc',
    '#f4cccc': '#f4cccc',
    '#ffe599': '#ffe599',
  },

  // --- Animation ------------------------------------------------------
  highlightMs: 450,        // pulsing ring before the block appears
  staggerMs: 90,           // delay between cells of a multi-cell item
  bannerMs: 2600,          // "FREIGESCHALTET" banner on the projector

  // --- Code entry -----------------------------------------------------
  wrongAttemptsBeforeCooldown: 3,
  cooldownSeconds: 3,
  sounds: true,

  // --- Game master ----------------------------------------------------
  gmHotkey: 'Ctrl+Shift+G',
  gmPassword: 'lager2026',

  // --- Intro / timer ----------------------------------------------------
  // Flow: blackout (projector black, only the flashlight/Anmeldung code
  // does anything) -> story (projector shows data/story.js, laptop only
  // accepts `startCode`) -> playing (normal game, timer counting down) -> lost.
  startCode: 'VERSTANDEN',   // code that leaves the story screen and starts the clock
  timerMinutes: 40,          // countdown once startCode is entered
  wrongPenaltySeconds: 60,   // subtracted from the timer for every wrong code while playing
  timerWarnSeconds: 300,     // timer turns amber at/below this many seconds left
  timerCriticalSeconds: 60,  // timer turns red and pulses at/below this many seconds left
};

if (typeof module !== 'undefined') module.exports = CONFIG;
else window.CONFIG = CONFIG;
