# Vorlage härten — bevor ein zweiter Kunde dazukommt

Diese Datei behandelt **genau eine** Situation: die Vorlage soll **mehrere Kunden**
aufnehmen, **ohne** für jeden Kunden ein komplett eigenes Projekt zu bauen.

> **Standardweg bleibt: eigene Datenbank pro Kunde.** Das ist einfacher, sicherer und
> in `references/infrastruktur.md` beschrieben. Diese Datei ist für den **anderen**
> Weg — eine gemeinsame Datenbank — und für das Aufräumen der Vorlage selbst.

---

## Warum das nötig ist (der Befund)

Die Vorlage ist gewachsen und trägt eine gewachsene Schuld. Bevor ein zweiter Kunde
dazukommt, sind drei Dinge zu klären:

### 1. Kerntabellen haben keinen Kunden-Schlüssel

| Tabelle | Inhalt | Kunden-Schlüssel? |
|---|---|---|
| Bestellungen | alle Bestellungen | **ja** (Kundenspalte vorhanden, in Filtern hartcodiert) |
| **Speisekarte** | Menü-Artikel | **NEIN** — jede Zeile gilt für alle |
| **Wissensspeicher/Config** | Store-Stammdaten (Key `arch.store_config`) | **NEIN** — ein globaler Key |

**Folge:** Auf **einer** Datenbank würden Menü und Stammdaten **aller** Kunden
kollidieren. Kunde B sieht das Menü von Kunde A.

→ **Vor** dem Teilen: `restaurant`-Spalte (oder Kunden-`id`) **in `menultems` und
`project_memory`** ergänzen und in **allen** Lesestellen filtern. Das ist eine
Schema-Änderung an **allen** Lesepfaden — eigener Plan, nicht „nebenbei".

### 2. Zugriffsregeln (RLS) sind aus

Supabase meldet das als **kritisch**: mehrere Tabellen ohne RLS sind über den
öffentlichen Schlüssel **les- und änderbar**. Auf einer **geteilten** Instanz trifft
das auch fremde Projekte.

> ⚠️ **RLS einfach einschalten blockiert jeden Zugriff.** Ohne Policies kommt danach
> **kein** Lesen/Schreiben mehr durch. Reihenfolge: **erst Policies definieren, dann
> aktivieren, dann testen.**

**Der gefährlichste Einzelwert:** die Spalte, die Test- von Live-Bestellungen trennt
(im Vorlagenprojekt `stripe_mode`). Ist sie per Anon-Key schreibbar, kann jemand eine
**unbezahlte** Testbestellung in die Küche schmuggeln. Diese Spalte gehört hinter eine
Policy.

Vorgehen: Skill `supabase-postgres-best-practices`. Prüfen:
- Wer darf `menultems` lesen? (öffentlich: ja, aber nur `verfuegbar=true`)
- Wer darf `orders` lesen/schreiben? (**nur Server**)
- Wer darf `stripe_mode` ändern? (**nur Server**)

### 3. Rechtstexte und Komponenten sind auf einen Kunden geeicht

→ `references/entbranden.md`. Solange Stammdaten in Code **und** in `project_memory`
liegen, gibt es **zwei** Wahrheiten. Eine davon wird beim nächsten Kunden vergessen.

---

## Zielstruktur: eine Konfiguration pro Kunde

Statt Markenwerte über 20 Dateien zu verteilen, soll **jede** kundenspezifische
Angabe aus **einer** Quelle kommen.

```
config/kunde.ts            ← EINE Datei: Name, Farben, Domain, Zonen, Zeiten, Kasse
  ├─ wird importiert von: Theme, Header, Store-Route, Lieferzonen, Format-Modul
  └─ .env.local           ← Werte, die geheim/NICHT ins Repo dürfen (Keys, Tokens)
```

| Was | Bleibt im Code/Config | Geht in die Umgebung (env) |
|---|---|---|
| Marke, Farben, Logo-Pfade | ✅ `config/kunde.ts` | – |
| Lieferzonen, Öffnungszeiten | ✅ `config/kunde.ts` | – |
| Kundenspalte/`RESTAURANT` | ✅ `config/kunde.ts` | – |
| Domain | ✅ (Default) | ✅ `SITE_URL` |
| Datenbank, Stripe, Mail, Export-Keys | – | ✅ `.env.local` / Hosting-Env |

> **Regel:** Ein Wert steht **einmal**. Andere Stellen **lesen** daraus. Die Doku
> **verweist**, statt Zahlen zu wiederholen.

**Der Test:** Wer eine neue Filiale mit gleicher Marke aufsetzt, ändert **genau eine
Datei** (`config/kunde.ts`) plus die Umgebung — und nichts sonst.

---

## Vor dem zweiten Kunden: Prüfliste

- [ ] `config/kunde.ts` existiert und ist die einzige Markenquelle
- [ ] `menultems` / `project_memory` haben einen Kunden-Schlüssel **und** alle
      Lesestellen filtern darauf
- [ ] RLS-Policies **definiert**, **aktiviert** und **getestet** (öffentlich schreiben
      muss **fehlschlagen**)
- [ ] `stripe_mode` ist per Anon-Key **nicht** änderbar
- [ ] Stammdaten existieren **nur** an einer Stelle (Route liest aus Config/DB, nicht
      aus doppelt gepflegtem Fallback)
- [ ] Abschluss-Suche nach Altmarken: kein Treffer

**Erst wenn diese Liste steht**, ist eine geteilte Datenbank vertretbar. Vorher:
**eine Instanz pro Kunde.**

---

## Migrations-Disziplin

- **Ein** Migrationsordner pro Projekt (`supabase/migrations/`).
- Dateiname `JJJJMMTTHHMMSS_kurz_slug.sql`, **rein additiv**
  (`if not exists`, `or replace`), eindeutige Zeitstempel.
- Namen einmal festlegen, dann überall gleich. Ein historischer Tippfehler (z. B.
  `menultems`) bleibt, **wird aber ausdrücklich dokumentiert**, damit ihn niemand
  „korrigiert" und damit alles bricht.

Details: Skill `supabase-postgres-best-practices` und `project-blueprint` →
`references/datenmodell.md`.
