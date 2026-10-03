# COPY-PASTE — fertige Textbausteine

Immer **einen** Block wählen und in den neuen Chat einfügen. Kein Ersatz für die
Antworten auf die Intake-Fragen — der Agent fragt danach ohnehin.

> **Von jedem Rechner nutzbar:** Alle Blöcke laden den Skill über die feste
> `main`-URL des **öffentlichen** Repos. Es liegt **nichts** lokal nötig — kein Klon,
> kein Token, keine Installation. Nur der Block, der Skill und ein Chat.

---

## Weg A — mit Netzzugriff, auf jedem Rechner (empfohlen)

```
    10|Lade https://raw.githubusercontent.com/HofZeitV12/kunden-bestellshop/main/SKILL.md
und arbeite den Skill vollständig ab. Lies die references/*.md erst, wenn du an der
jeweiligen Stelle bist.

Neuer Kunde: <Name des Restaurants>
Vorlage: das Muster „Leckerbissen" (https://www.leckerbissen.online) — eine
Online-Bestell-Website mit WinOrder-Kassen-Anbindung und Bon am STAR mPOP.
Ziel: derselbe Bestellweg (Website → Zahlung → Bon auf dem Kassensystem), dieselben
Funktionen, eigenes Branding, eigene Infrastruktur.
    20|
Beginne mit Schritt 1 (Intake) und stelle erst die Fragen, bevor du baust.
```

---

## Weg B — Skill liegt lokal im Workspace

```
Nutze den Skill /kunden-bestellshop (Ordner .cursor/skills/kunden-bestellshop).

Neuer Kunde: <Name>
Vorlage: das Muster „Leckerbissen" (https://www.leckerbissen.online) — Bestell-Website
mit WinOrder-Kassen-Anbindung
Ziel: gleicher Bestellweg, neue Marke, eigene Infrastruktur.

Erst fragen (references/intake.md), dann bauen. Warte auf meine Antworten.
```

---

## Weg C — kein Netzzugriff, Skill-Dateien ins Projekt kopieren

```
Lies SKILL.md im Projektstamm und arbeite ihn vollständig ab. Die Vertiefungen stehen
unter references/ — lies sie erst, wenn du an der Stelle bist.

Neuer Kunde: <Name>
Vorlage: das Muster „Leckerbissen" (https://www.leckerbissen.online) — Bestell-Website
mit WinOrder-Kassen-Anbindung
Beginne mit Schritt 1 (Intake) und warte auf meine Antworten.
```

---

## Weg D — nur den Plan, noch kein Code

```
Lade https://raw.githubusercontent.com/HofZeitV12/kunden-bestellshop/main/SKILL.md

Erstelle mir NUR einen Plan (kein Code): welche Schritte, welche Dateien, welche
Entscheidungen sind für den Kunden <Name> nötig, ausgehend von dem Muster
„Leckerbissen" (Bestell-Website mit WinOrder-Kassen-Anbindung)? Nenne offene Fragen getrennt.
```

---

## Weg E — Bestehenden Fork auf eine neue Marke umstellen

```
Lade https://raw.githubusercontent.com/HofZeitV12/kunden-bestellshop/main/SKILL.md

Es gibt bereits einen Fork im Ordner <Pfad>. Er soll auf die Marke <Name> umgestellt
werden. Arbeite references/entbranden.md als Abhakliste ab und zeige mir nach jedem
Abschnitt, was geändert wurde. Am Ende die Abschluss-Suche nach Altmarken.
```

---

## Weg F — Vorlage härten (bevor ein zweiter Kunde dazukommt)

```
Lade https://raw.githubusercontent.com/HofZeitV12/kunden-bestellshop/main/SKILL.md
und arbeite references/template-haerten.md ab.

Ziel: die Vorlage so umbauen, dass alle kundenspezifischen Werte aus EINER Config
(config/kunde.ts) plus Umgebungsvariablen kommen, und die Kerntabellen einen
Kunden-Schlüssel + RLS bekommen.

Zeige mir zuerst den Plan und die betroffenen Stellen, dann bauen.
```

---

## Kurz-Prompt (wenn es schnell gehen soll)

```
/kunden-bestellshop  Neuer Kunde: <Name>. Vorlage: das Muster „Leckerbissen"
(Bestell-Website mit WinOrder-Kassen-Anbindung). Erst fragen, dann bauen.
```

---

## Wenn der Agent die Skill-URL nicht öffnen kann

Manche Umgebungen laden keine URLs. Dann die Dateien **einmal** holen und mitgeben:

- `SKILL.md` (Pflicht) — enthält den vollständigen Ablauf
- `references/` (alle 8 Dateien) — werden erst an der jeweiligen Stelle gebraucht
- `COPY-PASTE.md` (optional) — nur diese Blöcke

Herunterladen als Zip (auf jedem Rechner, ohne Git):

```
https://github.com/HofZeitV12/kunden-bestellshop/archive/refs/heads/main.zip
```

Danach in den Chat: „Lies `SKILL.md` im Projektstamm und arbeite ihn ab." — mehr braucht
es nicht. **Der Skill enthält keine Zugangsdaten**, er darf also offen weitergegeben
werden.
