#!/usr/bin/env python3
"""Bundles the projector into one standalone HTML file for previewing /
sharing (no Electron, no server). Not used by the real game."""
import pathlib, sys
root = pathlib.Path(__file__).resolve().parent.parent
read = lambda p: (root / p).read_text(encoding='utf-8')
out = sys.argv[1] if len(sys.argv) > 1 else str(root / 'preview.html')

demo_bus = """
const listeners = []; let U = [];
window.BUS = {
  getState: async () => ({ unlocked: U, total: GAME.total, phase: 'playing', timerEndsAt: null }),
  onState: (cb) => listeners.push(cb),
};
function push(just) { listeners.forEach(f => f({ unlocked: U, total: GAME.total, phase: 'playing', timerEndsAt: null, justUnlocked: just })); }
window.addEventListener('DOMContentLoaded', () => {
  const bar = document.getElementById('demo');
  GAME.ITEMS.forEach(i => {
    const b = document.createElement('button');
    b.textContent = i.label;
    b.onclick = () => {
      if (U.includes(i.id)) { U = U.filter(x => x !== i.id); b.classList.remove('on'); push(null); }
      else { U.push(i.id); b.classList.add('on'); push(i.id); }
    };
    bar.appendChild(b);
  });
  const all = document.createElement('button');
  all.textContent = 'Alles / Reset'; all.className = 'alt';
  all.onclick = () => {
    const full = U.length === GAME.total;
    U = full ? [] : GAME.ITEMS.map(i => i.id);
    document.querySelectorAll('#demo button').forEach(x => x.classList.toggle('on', !full && x.className.indexOf('alt') < 0));
    all.classList.remove('on');
    push(null);
  };
  bar.appendChild(all);
});
"""

html = f"""<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Tagesplan &ndash; Projektor-Vorschau</title>
<style>
{read('projector/sheet.css')}
html, body {{ cursor: auto; }}
#stage {{ height: calc(100% - 74px); }}
#demo {{ position: fixed; bottom: 0; left: 0; right: 0; height: 74px; display: flex;
  gap: 6px; align-items: center; padding: 0 12px; overflow-x: auto;
  background: #22272e; }}
#demo button {{ flex: 0 0 auto; border: 1px solid #454c56; background: #2d333b; color: #cdd9e5;
  border-radius: 999px; padding: 9px 16px; font-size: 13px; cursor: pointer; font-family: inherit; }}
#demo button.on {{ background: #347d39; border-color: #46954a; color: #fff; }}
#demo button.alt {{ background: #444c56; }}
#progress {{ bottom: 86px; }}
</style></head>
<body>
<div id="blackout"></div>
<div id="story"><div class="inner">
  <h1 id="storyTitle"></h1><div id="storyText"></div><div class="instruction" id="storyInstruction"></div>
</div></div>
<div id="stage"><div id="sheet"></div></div>
<div id="banner"></div>
<div id="progress"><span id="ptext"></span><div id="dots"></div></div>
<div id="timer"></div>
<div id="penaltyFlash">&minus;1 MINUTE</div>
<div id="finale">TAGESPLAN KOMPLETT!</div>
<div id="lost"><h1>ZEIT ABGELAUFEN</h1><p>Die Gruppe hat es leider nicht rechtzeitig geschafft.</p></div>
<div id="demo"></div>
<script>{read('data/config.js')}</script>
<script>{read('data/items.js')}</script>
<script>{read('data/schedule.js')}</script>
<script>{read('data/story.js')}</script>
<script>{read('core/game.js')}</script>
<script>{demo_bus}</script>
<script>{read('projector/projector.js')}</script>
</body></html>
"""
pathlib.Path(out).write_text(html, encoding='utf-8')
print('wrote', out, len(html), 'bytes')
