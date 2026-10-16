# Tagesplan Escape Room

Laptop = Code-Eingabe. Beamer = Tagesplan. Ein gemeinsamer Spielstand.

## Ablauf (Phasen)

1. **Blackout** – Beamer ist schwarz. Nur der Anmeldung-Code (Taschenlampen-Rätsel) tut etwas.
2. **Story** – Nach Anmeldung erscheint die Geschichte auf dem Beamer (Text in `data/story.js`). Nur der Code aus `CONFIG.startCode` (Standard: `VERSTANDEN`) geht weiter.
3. **Playing** – Der 40-Minuten-Countdown startet, das normale Spiel läuft. Jeder falsche Code zieht eine Minute ab (`CONFIG.wrongPenaltySeconds`).
4. **Lost** – Läuft die Zeit ab (auch ohne Code-Eingabe), zeigen beide Bildschirme „Verloren".

Sobald alle 10 Punkte gefunden sind, friert die Uhr ein (kein weiterer Druck nötig).

## Starten

```bash
npm install
npm start          # Electron, beide Fenster, Vollbild auf zwei Displays
```

Fallback ohne Electron (zwei Chrome-Fenster):

```bash
npm run browser    # startet http://localhost:5050
```
dann `…/laptop/` und `…/projector/` in zwei Fenstern öffnen, je F11.

Windows-EXE: `npm run build:win` → `dist/`.

## Hotkeys

| Taste | Wirkung |
|---|---|
| `Ctrl+Shift+G` | Game-Master-Panel (Passwort in `data/config.js`) |
| `Ctrl+Shift+S` | Laptop- und Beamerfenster tauschen |
| `Ctrl+Shift+Q` | App beenden (Alt+F4 ist absichtlich blockiert) |
| `Esc` | GM-Panel schließen |

Im GM-Panel (zusätzlich zu den Item-Schaltern):

| Knopf | Wirkung |
|---|---|
| Introbildschirm zeigen | Beamer zurück auf Blackout (zum Testen) |
| Story-Bildschirm zeigen | Beamer zeigt die Geschichte (zum Korrekturlesen) |
| Intro überspringen (Timer starten) | Anmeldung gilt als gelöst, Spiel startet sofort mit vollem Timer |
| −1 Minute (Test) | Zieht manuell eine Minute ab, um die Verloren-Logik zu testen |
| Fast vorbei (10 Sek, Test) | Setzt den Timer auf 10 Sekunden, um den Verloren-Bildschirm sofort zu sehen |
| Spiel zurücksetzen | Kompletter Reset: zurück auf Blackout, Timer weg, alles gesperrt |

## Codes

| Programmpunkt | Code |
|---|---|
| Anmeldung | 3KR7V |
| Bibelarbeit (BA1–BA5) | 9TQM4 |
| MA Besprechung | 5XNP8 |
| Singen | 7BHD2 |
| Wasserspiele | 4WGZ6 |
| Geländespiel | 8FRJ5 |
| Wanderung | 2MVT9 |
| Essen | 6PLC3 |
| Stockbrot | 5DYQ7 |
| Lagerfeuer | 9HKB4 |

Eingabe ist nicht case-sensitiv, Leerzeichen/Bindestriche werden ignoriert.

## Was wo geändert wird

| Ich will ändern … | Datei |
|---|---|
| Codes, Namen, Animationsart | `data/items.js` |
| Farben, Tempo, Passwort, Cooldown, Gitter-Chrome | `data/config.js` |
| Geschichte auf dem Beamer | `data/story.js` (aktuell Lorem-Ipsum-Platzhalter) |
| Start-Code, Timer-Länge, Strafzeit pro Fehlversuch | `data/config.js` → `startCode`, `timerMinutes`, `wrongPenaltySeconds` |
| Ab wann die Uhr gelb/rot wird | `data/config.js` → `timerWarnSeconds`, `timerCriticalSeconds` |
| Texte/Zeiten/Struktur des Plans | Google Sheet neu exportieren, dann `python3 tools/convert-sheet.py Tagesplan.html data/schedule.js` |
| Welche Zellen zu welchem Code gehören | `ITEM_CELLS` in `tools/convert-sheet.py`, dann Converter neu laufen lassen |
| Aussehen (Schrift, Rahmen, Platzhalter) | `projector/sheet.css` |

`data/schedule.js` ist generiert – nie von Hand bearbeiten.

## Spielstand

Wird nach jeder Freischaltung in `state.json` im Electron-userData-Ordner
gespeichert. Absturz oder Neustart verliert nichts. Vor der nächsten Gruppe:
GM-Panel → „Spiel zurücksetzen".

## Checkliste vor dem Spiel

1. Beamer anschließen, Windows auf „Erweitern" stellen, **dann** App starten.
2. Liegt der Tagesplan auf dem Laptop statt auf dem Beamer? `Ctrl+Shift+S`.
3. GM-Panel → „Alles freischalten" → Optik prüfen → „Spiel zurücksetzen".
4. Testcode eingeben, dann wieder zurücksetzen.
5. Laptop an den Strom, Energiesparmodus ist bereits softwareseitig blockiert.
