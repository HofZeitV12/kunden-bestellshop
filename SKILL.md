---
name: kunden-bestellshop
description: Eine bestehende Online-Bestell-Website (Menü, Warenkorb, Lieferung/Abholung, Online-Zahlung, Kassen-Bon) als Vorlage nehmen und für einen NEUEN Kunden aufsetzen — eigenes Branding (Logo, Farben, Stammdaten, Rechtstexte), eigene Infrastruktur (Supabase, Vercel, Stripe, Hetzner-Container), eigene Kasse und eigener Bon-Druck. Use when a new restaurant customer needs its own ordering website based on the Leckerbissen template (https://www.leckerbissen.online/website/speisekarte), when cloning or duplicating the template for another restaurant, when onboarding a second restaurant onto the same concept with a new logo/branding, when rebranding an existing fork, or when asked "wie setze ich das gleiche System für einen neuen Restaurant-Kunden auf". Also use before any schema change to the template and when a customer project must stay cleanly separated from the template project.
---

# Kunden-Bestellshop aus Vorlage aufsetzen

Ein **erprobtes Bestellsystem** (Online-Bestell-Website mit Lieferung/Abholung:
Website → Zahlung → Bon auf der Kasse) wird zur **Vorlage**. Pro Kunde entsteht
daraus ein **eigenes Projekt** mit eigenem Logo, eigener Infrastruktur und eigener
Kasse — **gleiches Konzept, nicht gleiche Umgebung**.

Diese Anleitung ist **konkret in den Fakten**: sie stammt aus einem real betriebenen
System. Projektkennungen, Tokens und Serverwerte stehen **nicht** hier — nur **wo**
sie liegen und **wie** man sie ermittelt.

---

## Das Referenzsystem (die Vorlage)

**Vorlage ist das Leckerbissen-Projekt.** Die laufende Bestell-Website:

**🔗 <https://www.leckerbissen.online/website/speisekarte>**

Prüfe dieses System **zuerst** gegen die Wirklichkeit. Es ist der Beweis, dass der
Bestellweg funktioniert:

| Baustein | Was es ist | Prüfen mit |
|---|---|---|
| **Website** | Bestellseite `/website/speisekarte` — Menü, Warenkorb, Lieferung/Abholung | Seite + Menü-Endpunkt → HTTP 200 |
| **Datenbank** | Supabase (geteilte Instanz, oft „Üben" genannt) | Menü-Endpunkt liefert die Artikelzahl; `orders` nimmt Bestellungen auf |
| **Server** | Hetzner-Container: Zahlungs-Webhook, Bestätigungsmail, Küchenwächter | `GET /health` → `status: ok` |
| **Kasse** | Kassen-Software im Restaurant, Bon auf Thermodrucker | Export **ohne** Key → HTTP 401 |

**Der Kernbeweis:** Eine Online-Bestellung läuft **ohne manuelles Kopieren** durch
bis zum Bon — Website → Zahlung → Datenbank → Bridge → Hotfolder → Kasse → Bon.

> **Das Referenzsystem ist die Vorlage, nicht der Bauplan für den Kunden.** Die
> Vorlage-DB ist geteilt und (Stand heute) ohne RLS. Das ist **kein** Muster zum
> Nachbauen — für einen Kunden gilt: **eigene** Instanz
> (`references/infrastruktur.md`) und **eigene** Trennung.

---

## Wie die vier Säulen zusammenwirken

Das ist die Architektur, die man für einen neuen Kunden **nachbaut** (ausführlich
mit Datenfluss: `references/infrastruktur.md`):

```
Browser → Vercel (Next.js, Checkout) → Stripe (Zahlung)
   → Hetzner-Webhook (Signatur + Modus-Wache + Mail) → Supabase (orders)
   → Kassen-PC (Bridge) → Hotfolder → Kasse → Bon
```

- **Vercel** hostet Website und Checkout. Nach der Zahlung setzt die
  Erfolgsseite `bezahlt_am` — **schneller als jeder Webhook.**
- **Stripe** meldet `checkout.session.completed` an **zwei** Endpunkte: einen auf
  dem Hosting (Status/Kundendaten), einen auf `webhook.<kunde>.de` (Status +
  **Bestätigungsmail**). Nur der Server schickt Mails.
- **Hetzner** trägt den Webhook-Container hinter Caddy: vier Pfade durchgelassen,
  Rest 404. Modus-Wache (`STRIPE_EXPECTED_MODE` + `livemode`) ist der Riegel —
  die Signatur allein beweist den Modus nicht.
- **Supabase** hält `orders`, `menultems` (Name historisch, nicht korrigieren) und
  `project_memory.arch.store_config` (Stammdaten — ein Laufzeit-Interface, jedes
  Zusatzfeld wird öffentlich sichtbar).
- **Kasse** holt Bestellungen über den Export-Endpunkt **auf dem Hosting**
  (`/api/export/winorder`, eigener Kassen-Key; ohne Key → 401).

---

## Die eine Regel, die alles andere entscheidet

**Ein Kunde = ein eigenes Projekt.** Eigene Datenbank, eigenes Vercel-Projekt,
eigene Domain, eigene Zahlungsumgebung, eigener Kassen-Anschluss.

**Niemals** zwei Restaurants auf **derselben** Datenbank betreiben, solange die
Kerntabellen keinen Kunden-Schlüssel tragen. Die geteilte Datenbank ist die
teuerste Falle dieses Systems (siehe `references/template-haerten.md`).

---

## Der Ablauf

```
0.  Vorlage prüfen              Leckerbissen-Website live kontrollieren (URL oben)
1.  Kunde befragen              Stammdaten, Zonen, Zeiten, Kasse, Domain → references/intake.md
2.  Projekt anlegen             neues Repo, Supabase, Vercel, Stripe, Hetzner
                                → references/infrastruktur.md
3.  Entbranden                  Logo, Farben, Texte, Kennungen → references/entbranden.md
4.  Daten füllen                Menü-Seed, Store-Config, Lieferzonen, Öffnungszeiten
5.  Kasse anbinden              Artikelmap, Bridge, Hotfolder
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

```
Soll der Kunde dauerhaft auf der geteilten Vorlage-DB laufen?
├─ JA  → ⚠️ NICHT ohne Kunden-Schlüssel auf den Kerntabellen.
│        Erst template-haerten.md abarbeiten. (Noch nicht empfohlen.)
└─ NEIN → Eigene Supabase-Instanz pro Kunde. ← Standardweg
          → references/infrastruktur.md, Abschnitt „Eigene Datenbank"
```

**Kassen-Typ (entscheidet über den Bestellweg):**

```
Kasse = WinOrder?
├─ JA  → Hotfolder-Bridge + Artikelmap → references/winorder-kasse.md
└─ NEIN → anderen Adapter bauen; der Rest der Kette (Zahlung, DB, Mail) bleibt gleich.
```

**Basis ist immer die Leckerbissen-Vorlage** — dieselbe Bestell-Website, nur mit
neuer Marke und neuer Umgebung:

| Vorlage | Charakter | Wofür |
|---|---|---|
| **Bestell-Website** (Lieferung/Abholung, Kasse, Zahlung) | reifer Bestellweg, Bon auf Kasse bewiesen | Standard für jedes Restaurant mit Lieferung/Abholung |

---

## Was ein Kunde **immer** braucht (Mindest-Antworten)

Ohne diese sechs Angaben ist jede Struktur geraten. Volle Liste:
`references/intake.md`.

1. **Marke** — Name, Logo-Datei, Primärfarbe(n), Slogan, Sprache
2. **Stammdaten** — Adresse, Telefon, E-Mail, Öffnungszeiten, Zubereitungszeit
3. **Liefergebiet** — PLZ-Liste, Mindestbestellwert, Liefergebühr je Zone
4. **Domain** — welche Domain, wer besitzt sie, DNS-Zugang
5. **Kasse** — welches System, wie heißt der Artikelstamm, wie kommen Bestellungen an
6. **Zahlung** — eigenes Konto oder geteiltes? Test- oder Live-Start?

**Erst fragen, dann bauen.** Nichts erfinden, was der Kunde beantworten kann.

---

## Die Rebranding-Berührungspunkte (Kurzfassung)

Marke und Kunde stecken **verteilt** im Code, nicht an einer Stelle. Die
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

> ⚠️ **Markenreste in Klassennamen.** Ein Fork kopiert historisch gewachsene
> Farbnamen mit (in der Vorlage 20+ Dateien). Beim Entbranden **alle** Stellen
> prüfen — nicht nur die `-primary`-Tokens. Die Abschluss-Suche in
> `references/entbranden.md` findet sie.

---

## Was den Kunden vom Nachbarn trennt (Trennung erzwingen)

| Ebene | Trennung |
|---|---|
| Repository | eigenes Repo, eigener Name |
| Datenbank | eigene Supabase-Instanz (Standardweg) |
| Hosting | eigenes Vercel-Projekt + eigene Domain |
| Zahlung | eigene Keys + eigene Webhook-Endpunkte |
| Server | eigene Container/Ports auf dem Server, eigene Server-.env |
| E-Mail | eigener Absender + verifizierte Domain |
| Kasse | eigener Hotfolder-Pfad + eigene Artikelmap |

**Faustregel:** Wenn zwei Kunden irgendwo denselben Schlüssel, dieselbe Tabelle
oder denselben Endpunkt teilen, ist die Trennung nicht vollständig.

---

## Dokumentation gehört zum Ergebnis

Ein Kundenprojekt ohne Doku gilt als **nicht fertig**. Nach dem Aufsetzen:
`docs/START.md` (Einstieg), `docs/PROJEKT.md` (Zweck + „was nicht"),
`docs/entscheidungen/` (warum), `docs/RUNBOOK.md` (Störfall). Vorlage und Ablauf:
Skill **`project-blueprint`**.

---

## Referenzen

| Datei | Inhalt |
|---|---|
| `references/intake.md` | Fragebogen + Ergebnisform |
| `references/entbranden.md` | Vollständige Rebranding-Map als Abhakliste |
| `references/template-haerten.md` | Vorlage mandantenfähig machen (Kunden-Schlüssel, RLS, Config) |
| `references/infrastruktur.md` | Gesamtarchitektur + Supabase, Vercel, Stripe, Hetzner je Kunde |
| `references/winorder-kasse.md` | Artikelmap, Bridge, Hotfolder, Bon-Druck |
| `references/verifikation.md` | E2E-Abnahme + Prüftabelle |
| `references/regeln-und-fallen.md` | Harte Regeln und teuer gelernte Fehler |

**Verwandte Skills:** `project-blueprint` (Aufbau + Doku), `frontend-design`
(Branding-Oberfläche).
