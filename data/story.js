// Shown full-screen on the projector once "Anmeldung" (the flashlight puzzle)
// is solved, before the Tagesplan game starts. Replace the placeholder text
// below with your own camp narrative - keep paragraphs short (2-4 sentences)
// so they stay legible from the back of the room. Do NOT add the final
// "enter this code" line here - the projector appends it automatically using
// CONFIG.startCode, so the two can never fall out of sync.
const STORY = {
  title: 'Bevor es losgeht ...',
  paragraphs: [
    Ihr fragt euch wahrscheinlich, warum ihr hier seid.

Die Antwort ist einfach.

Das Camp ist in Gefahr.

Ich bin AȘCHIE.

Leiter des Organisationsteams.

Seit Monaten bereiten wir das Camp vor. Spiele wurden geplant. Geschichten geschrieben. Geistliche Einheiten vorbereitet. Material gesammelt. Pläne erstellt.

Wir waren fast fertig.

FAST.

Dann ist etwas passiert.

Microsoft sagte - System Update. 

Die Dateien sind verschlüsselt.

Einige der wichtigsten Informationen für das Camp sind verschwunden.

Eure Aufgabe ist es, das Camp zu retten.

Findet die verlorenen Informationen. Entschlüsselt die Systeme. Löst die Aufgaben.

Stellt die Vorbereitung wieder her.
  ],
};

if (typeof module !== 'undefined') module.exports = STORY;
else window.STORY = STORY;
