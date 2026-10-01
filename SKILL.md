---
name: kunden-bestellshop
description: Ein bestehendes Restaurant-Bestellsystem als Vorlage nehmen und für einen NEUEN Kunden aufsetzen — eigenes Branding (Logo, Farben, Stammdaten, Rechtstexte), eigene Infrastruktur (Supabase, Vercel, Stripe, Hetzner-Container), eigene WinOrder-Kasse und eigener Bon-Druck. Use when cloning/duplicating the Leckerbissen or HofZeit order shop for another restaurant, when a new customer needs a Lieferando-like ordering website with the same concept but a new logo/branding, when onboarding a second restaurant onto the same template, when rebranding an existing fork, or when asked "wie setze ich das gleiche System für Kunde X auf". Also use before any tenant/schema change to the shared template and when a customer project must stay cleanly separated from the template project.
---

# Kunden-Bestellshop aus Vorlage aufsetzen

Ein **erprobtes Bestellsystem** (Lieferando-artig: Website → Zahlung → Bon auf der
Kasse) wird zur **Vorlage**. Pro Kunde entsteht daraus ein **eigenes Projekt** mit
eigenem Logo, eigener Infrastruktur und eigener Kasse — **gleiches Konzept, nicht
gleiche Umgebung**.

Diese Anleitung ist **Branche-neutral im Ablauf**, aber **konkret in den Fakten**:
sie stammt aus einem real betriebenen System. Projektkennungen, Tokens und
Serverwerte stehen **nicht** hier — nur **wo** sie liegen und **wie** man sie
ermittelt.

    20|## Die eine Regel, die alles andere entscheidet

**Ein Kunde = ein eigenes Projekt.** Eigene Datenbank, eigenes Vercel-Projekt,
eigene Domain, eigene Stripe-Umgebung, eigener Kassen-Anschluss.

**Niemals** zwei Restaurants auf **derselben** Datenbank betreiben, solange die
Kerntabellen keinen Kunden-Schlüssel tragen. Die geteilte Datenbank ist die
teuerste Falle dieses Systems (siehe `references/template-haerten.md`).

---

## Der Ablauf

```
    40|0.  Vorlage verstehen          welches Projekt ist die Basis? → references/intake.md
1.  Kunde befragen              Stammdaten, Zonen, Zeiten, Kasse, Domain → references/intake.md
2.  Projekt anlegen             neues Repo, Supabase, Vercel, Stripe, Hetzner
                                → references/infrastruktur.md
3.  Entbranden                  Logo, Farben, Texte, Kennungen → references/entbranden.md
4.  Daten füllen                Menü-Seed, Store-Config, Lieferzonen, Öffnungszeiten
5.  Kasse anbinden              WinOrder-Artikelmap, Bridge, Hotfolder
                                → references/winorder-kasse.md
6.  Verifizieren                E2E: Bestellung → Zahlung → Mail → Bon
                                → references/verifikation.md
7.  Dokumentieren               docs/START.md, PROJEKT.md, Entscheidungen, Runbook
                                → über Skill `project-blueprint`
```

**Jede Phase endet mit einer Meldung:** was entstanden ist, womit es geprüft wurde,
was offen blieb. „Müsste laufen" ist keine Aussage — nur ein ausgeführter Befehl
zählt.

---

## Entscheidungsbaum: welchen Weg für den neuen Kunden?

    70|```
Soll der Kunde dauerhaft auf der geteilten Vorlage-DB laufen?
├─ JA  → ⚠️ NICHT ohne Kunden-Schlüssel auf menultems + project_memory.
│        Erst template-haerten.md abarbeiten. (Noch nicht empfohlen.)
└─ NEIN → Eigene Supabase-Instanz pro Kunde. ← Standardweg
          → references/infrastruktur.md, Abschnitt „Eigene Datenbank"
```

**Kassen-Typ (entscheidet über den Bestellweg):**

```
    80|Kasse = WinOrder?
├─ JA  → Hotfolder-Bridge + Artikelmap → references/winorder-kasse.md
└─ NEIN → anderen Adapter bauen; der Rest der Kette (Zahlung, DB, Mail) bleibt gleich.
```

**Basis-Vorlage wählen:**

| Vorlage | Charakter | Wann |
|---|---|---|
| **Lieferando-Shop** (Lieferung/Abholung, WinOrder, Stripe) | reifer Bestellweg, Bon auf Kasse bewiesen | Standard für Restaurants mit Lieferung |
| **QR-Tisch-System** (Tischbestellung + Web-Store + Admin) | Tischbestellung, eigenes Admin-UI | wenn der Kunde Tisch- statt Lieferbetrieb will |

---

## Was ein Kunde **immer** braucht (Mindest-Antworten)

Ohne diese sechs Angaben ist jede Struktur geraten. Volle Liste:
`references/intake.md`.

    100|1. **Marke** — Name, Logo-Datei, Primärfarbe(n), Slogan, Sprache
2. **Stammdaten** — Adresse, Telefon, E-Mail, Öffnungszeiten, Zubereitungszeit
3. **Liefergebiet** — PLZ-Liste, Mindestbestellwert, Liefergebühr je Zone
4. **Domain** — welche Domain, wer besitzt sie, DNS-Zugang
5. **Kasse** — welches System, wie heißt der Artikelstamm, wie kommen Bestellungen an
6. **Zahlung** — Stripe eigenes Konto oder geteiltes? Test- oder Live-Start?

**Erst fragen, dann bauen.** Nichts erfinden, was der Kunde beantworten kann.

---

## Die Rebranding-Berührungspunkte (Kurzfassung)

    120|Marke und Kunde stecken **verteilt** im Code, nicht an einer Stelle. Die
vollständige Abhakliste steht in `references/entbranden.md`. Die Bereiche:

| Bereich | Typische Datei(en) |
|---|---|
| Farben/Theme | `tailwind.config.js` (Design-Tokens) |
| Logo/Bilder | Header-Komponente, Hero, `lib/hero-images.ts`, `public/` |
| Stammdaten | `app/api/store/route.ts` + Wissensspeicher-Key `arch.store_config` |
| Liefergebiet | Lieferzonen-Modul (PLZ, Mindestwert, Gebühr, Fehlertext) |
| Öffnungszeiten/Wunschzeit | Öffnungszeiten-Modul |
| Rechtstexte | Impressum, Datenschutz, AGB |
| Kassen-Artikelmap | `lib/…/articles.ts` **und** `tools/…-articles.json` |
| Kassen-Formattexte | Format-Modul (Absendername, Referer, Order-Präfix) |
| Kundenmail | Webhook-Server: E-Mail-Vorlagen |
| App/PWA | `manifest`, Service Worker, Icon-Generator, Capacitor |
| Kennungen im Code | `RESTAURANT`-Konstante, hartcodierte Namen, Middleware-Realm |

   140|> ⚠️ **Markenreste in Klassennamen.** Ein Fork kopiert historisch gewachsene
> Farbnamen mit (z. B. ein altes `hof-…` in 20+ Dateien). Beim Entbranden **alle**
> Stellen prüfen — nicht nur die `-primary`-Tokens.

---

## Was den Kunden vom Nachbarn trennt (Trennung erzwingen)

| Ebene | Trennung |
|---|---|
| Repository | eigenes Repo, eigener Name |
| Datenbank | eigene Supabase-Instanz (Standardweg) |
| Hosting | eigenes Vercel-Projekt + eigene Domain |
| Zahlung | eigene Stripe-Keys + eigene Webhook-Endpunkte |
| Server | eigene Container/Ports auf dem Server, eigene Server-.env |
| E-Mail | eigener Absender + verifizierte Domain |
| Kasse | eigener Hotfolder-Pfad + eigene Artikelmap |

**Faustregel:** Wenn zwei Kunden irgendwo denselben Schlüssel, dieselbe Tabelle
oder denselben Endpunkt teilen, ist die Trennung nicht vollständig.

---

## Dokumentation gehört zum Ergebnis

    160|Ein Kundenprojekt ohne Doku gilt als **nicht fertig**. Nach dem Aufsetzen:
`docs/START.md` (Einstieg), `docs/PROJEKT.md` (Zweck + „was nicht"),
`docs/entscheidungen/` (warum), `docs/RUNBOOK.md` (Störfall). Vorlage und Ablauf:
Skill **`project-blueprint`**.

---

## Referenzen

| Datei | Inhalt |
|---|---|
| `references/intake.md` | Fragebogen + Ergebnisform |
| `references/entbranden.md` | Vollständige Rebranding-Map als Abhakliste |
| `references/template-haerten.md` | Vorlage mandantenfähig machen (Tenant-Key, RLS, Config) |
| `references/infrastruktur.md` | Supabase, Vercel, Stripe, Hetzner je Kunde |
| `references/winorder-kasse.md` | Artikelmap, Bridge, Hotfolder, Bon-Druck |
| `references/verifikation.md` | E2E-Abnahme + Prüftabelle |
| `references/regeln-und-fallen.md` | Harte Regeln und teuer gelernte Fehler |

**Verwandte Skills:** `project-blueprint` (Aufbau + Doku), `winorder-…` (Kasse im
    180|Detail), `stripe-…` (Zahlungsmodus), `frontend-design` (Branding-Oberfläche).
