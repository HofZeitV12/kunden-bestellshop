# COPY-PASTE — fertige Textbausteine

Immer **einen** Block wählen und in den neuen Chat einfügen. Kein Ersatz für die
Antworten auf die Intake-Fragen — der Agent fragt danach ohnehin.

---

## Weg A — mit Netzzugriff (empfohlen)

```
Lade https://raw.githubusercontent.com/HofZeitV12/kunden-bestellshop/main/SKILL.md
und arbeite den Skill vollständig ab. Lies die references/*.md erst, wenn du an der
jeweiligen Stelle bist.

Neuer Kunde: <Name des Restaurants>
Vorlage: <welches Projekt ist die Basis, z. B. die Leckerbissen-Bestell-Website>
Ziel: derselbe Bestellweg (Website → Zahlung → Bon auf der Kasse), eigenes Branding,
eigene Infrastruktur.

Beginne mit Schritt 1 (Intake) und stelle erst die Fragen, bevor du baust.
```

---

    20|## Weg B — Skill liegt lokal im Workspace

```
Nutze den Skill /kunden-bestellshop (Ordner .cursor/skills/kunden-bestellshop).

Neuer Kunde: <Name>
Vorlage: <Basisprojekt>
Ziel: gleicher Bestellweg, neue Marke, eigene Infrastruktur.

Erst fragen (references/intake.md), dann bauen. Warte auf meine Antworten.
```

---

## Weg C — kein Netzzugriff, Skill-Dateien ins Projekt kopieren

```
Lies SKILL.md im Projektstamm und arbeite ihn vollständig ab. Die Vertiefungen stehen
    30|unter references/ — lies sie erst, wenn du an der Stelle bist.

Neuer Kunde: <Name>
Vorlage: <Basisprojekt>
Beginne mit Schritt 1 (Intake) und warte auf meine Antworten.
```

---

## Weg D — nur den Plan, noch kein Code

```
Lade https://raw.githubusercontent.com/HofZeitV12/kunden-bestellshop/main/SKILL.md

Erstelle mir NUR einen Plan (kein Code): welche Schritte, welche Dateien, welche
Entscheidungen sind für den Kunden <Name> nötig, ausgehend von der Vorlage
<Basisprojekt>? Nenne offene Fragen getrennt.
```

---

    50|## Weg E — Bestehenden Fork auf eine neue Marke umstellen

```
Lade https://raw.githubusercontent.com/HofZeitV12/kunden-bestellshop/main/SKILL.md

Es gibt bereits einen Fork im Ordner <Pfad>. Er soll auf die Marke <Name> umgestellt
werden. Arbeite references/entbranden.md als Abhakliste ab und zeige mir nach jedem
Abschnitt, was geändert wurde. Am Ende die Abschluss-Suche nach Altmarken.
```

---

## Weg F — Vorlage härten (bevor ein zweiter Kunde dazukommt)

```
    60|Lade https://raw.githubusercontent.com/HofZeitV12/kunden-bestellshop/main/SKILL.md
und arbeite references/template-haerten.md ab.

Ziel: die Vorlage so umbauen, dass alle kundenspezifischen Werte aus EINER Config
(config/kunde.ts) plus Umgebungsvariablen kommen, und die Kerntabellen einen
Kunden-Schlüssel + RLS bekommen.

Zeige mir zuerst den Plan und die betroffenen Stellen, dann bauen.
```

---

## Kurz-Prompt (wenn es schnell gehen soll)

```
/kunden-bestellshop  Neuer Kunde: <Name>. Vorlage: <Basisprojekt>.
Erst fragen, dann bauen.
```
