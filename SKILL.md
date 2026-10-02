---
name: kunden-bestellshop
description: Eine bestehende Online-Bestell-Website (Menü, Warenkorb, Lieferung/Abholung, Online-Zahlung, Kassen-Bon) als Vorlage nehmen und fÃ¼r einen NEUEN Kunden aufsetzen â€” eigenes Branding (Logo, Farben, Stammdaten, Rechtstexte), eigene Infrastruktur (Supabase, Vercel, Stripe, Hetzner-Container), eigene Kasse und eigener Bon-Druck. Use when a new restaurant customer needs its own ordering website based on the Leckerbissen template (https://www.leckerbissen.online/website/speisekarte), when cloning or duplicating the template for another restaurant, when onboarding a second restaurant onto the same concept with a new logo/branding, when rebranding an existing fork, or when asked "wie setze ich das gleiche System fÃ¼r einen neuen Restaurant-Kunden auf". Also use before any schema change to the template and when a customer project must stay cleanly separated from the template project.
---

# Kunden-Bestellshop aus Vorlage aufsetzen

Ein **erprobtes Bestellsystem** (Online-Bestell-Website mit Lieferung/Abholung:
Website â†’ Zahlung â†’ Bon auf der Kasse) wird zur **Vorlage**. Pro Kunde entsteht
daraus ein **eigenes Projekt** mit eigenem Logo, eigener Infrastruktur und eigener
Kasse â€” **gleiches Konzept, nicht gleiche Umgebung**.

Diese Anleitung ist **konkret in den Fakten**: sie stammt aus einem real betriebenen
System mit nachweislich funktionierender Kette. Projektkennungen, Tokens und
Serverwerte stehen **nicht** hier â€” nur **wo** sie liegen und **wie** man sie
ermittelt.

---

## Das Referenzsystem (die Vorlage)

**Vorlage ist das Leckerbissen-Projekt.** Die laufende Bestell-Website:

**ðŸ”— <https://www.leckerbissen.online/website/speisekarte>**

PrÃ¼fe dieses System **zuerst** gegen die Wirklichkeit. Es ist der Beweis, dass der
Bestellweg funktioniert:

| Baustein | Was es ist | PrÃ¼fen mit |
|---|---|---|
| **Website** | Bestellseite `/website/speisekarte` â€” MenÃ¼, Warenkorb, Lieferung/Abholung | Seite + MenÃ¼-Endpunkt â†’ HTTP 200 |
| **Datenbank** | Supabase (geteilte Instanz, EU-Region) | MenÃ¼-Endpunkt liefert die Artikelzahl; `orders` nimmt Bestellungen auf |
| **Server** | Hetzner-Container (KVM, 8 Cores/16 GB, Ubuntu 24.04): Zahlungs-Webhook, BestÃ¤tigungsmail, KÃ¼chenwÃ¤chter | `GET /health` â†’ `status: ok` |
| **Kasse** | Kassen-Software im Restaurant, Bon auf Thermodrucker (mPOP o. Ã¤.) | Export **ohne** Key â†’ HTTP 401 |

**Der Kernbeweis:** Eine Online-Bestellung lÃ¤uft **ohne manuelles Kopieren** durch
bis zum Bon â€” Website â†’ Zahlung â†’ Datenbank â†’ Bridge â†’ Hotfolder â†’ Kasse â†’ Bon.

---

## Wie die vier SÃ¤ulen zusammenwirken

Das ist die Architektur, die man fÃ¼r einen neuen Kunden **nachbaut** (ausfÃ¼hrlich
mit Datenfluss: `references/infrastruktur.md`):

```
Browser â†’ Vercel (Next.js, Checkout) â†’ Stripe (Zahlung)
   â†’ Hetzner-Webhook (Signatur + Modus-Wache + Mail) â†’ Supabase (orders)
   â†’ Kassen-PC (Bridge) â†’ Hotfolder â†’ Kasse â†’ Bon
```

| SÃ¤ule | Technik | MCP-PrÃ¼fbefehl |
|---|---|---|
| **Vercel** (Hosting) | Next.js 15 App Router, Team-Konto, Git-Integration = Deploy-Pfad | `list_projects(teamId)` â†’ Projekt existiert, `get_project_env()` fÃ¼r Env-PrÃ¼fung |
| **Supabase** (DB) | PostgreSQL in EU-Region (eu-west-1), geteilte Instanz oder eigene | `get_project(projectId)` fÃ¼r Health + Advisors, `execute_sql(select from orders)` |
| **Stripe** (Zahlung) | Redirect-Checkout, zwei Webhook-Endpunkte (Hosting + Mail-Server) | Dashboard â†’ Webhooks: `livemode`, `url`, `status` je Endpunkt prÃ¼fen, Keys via Dashboard |
| **Hetzner** (Server) | KVM-VPS (cx43), Ubuntu 24.04, Docker-Compose hinter Caddy | `list_servers()` â†’ Status `running`, `get_server()` fÃ¼r IP + Firewall |
| **GitHub** (Code) | Privates Repo, Git-Author muss im Vercel-Team sein | `search_repositories()`, `get_file_contents()`, `git config user.name` setzen |
| **Export-API** (BrÃ¼cke) | `GET /api/export/winorder` auf dem Hosting, Header `x-api-key` | `curl` ohne Key â†’ HTTP 401; mit Key â†’ JSON-Array |

---

## Die eine Regel, die alles andere entscheidet

**Ein Kunde = ein eigenes Projekt.** Eigene Datenbank, eigenes Vercel-Projekt,
eigene Domain, eigene Zahlungsumgebung, eigener Kassen-Anschluss.

**Niemals** zwei Restaurants auf **derselben** Datenbank betreiben, solange die
Kerntabellen keinen Kunden-SchlÃ¼ssel tragen. Die geteilte Datenbank ist die
teuerste Falle dieses Systems (siehe `references/template-haerten.md`).

---

## Der Ablauf

```
0.  Vorlage prÃ¼fen              Leckerbissen-Website live kontrollieren (URL oben)
1.  Kunde befragen              Stammdaten, Zonen, Zeiten, Kasse, Domain â†’ references/intake.md
2.  Projekt anlegen             neues Repo, Supabase, Vercel, Stripe, Hetzner
                                â†’ references/infrastruktur.md
3.  Entbranden                  Logo, Farben, Texte, Kennungen â†’ references/entbranden.md
4.  Daten fÃ¼llen                MenÃ¼-Seed, Store-Config, Lieferzonen, Ã–ffnungszeiten
5.  Kasse anbinden              Artikelmap, Bridge, Hotfolder
                                â†’ references/winorder-kasse.md
6.  Verifizieren                E2E: Bestellung â†’ Zahlung â†’ Mail â†’ Bon
                                â†’ references/verifikation.md
7.  Dokumentieren               docs/START.md, PROJEKT.md, Entscheidungen, Runbook
                                â†’ Ã¼ber Skill `project-blueprint`
```

**Jede Phase endet mit einer Meldung:** was entstanden ist, womit es geprÃ¼ft wurde,
was offen blieb. Jede PrÃ¼fung nutzt **einen ausgefiihrten MCP-Befehl** â€” nicht
â€žmÃ¼sste laufenâ€œ, sondern den tatsÃ¤chlichen Antworttext.

---

## MCP-Diagnose: den Zustand jedes Bausteins prÃ¼fen

Verfiigbare MCPs (Cursor/KI-Tool-Set) erlauben Live-PrÃ¼fungen, ohne selbst
netzwerkfähig zu sein. Rufe **vor Schritt 1** diese Diagnose auf und dokumentiere
die Ergebnisse:

| MCP | Baustein | PrÃ¼fung | Erwartet |
|---|---|---|---|
| **Supabase MCP** | Datenbank | `get_advisors(projectId)` | keine kritischen Warnungen |
| | | `execute_sql(select count(*) from orders)` | Zahl â‰¥ 0 |
| | | `list_tables(projectId)` | `orders`, `menultems`, `project_memory` vorhanden |
| **Vercel MCP** | Hosting | `list_projects(teamId)` | Kunden-Projekt ist aufgelistet |
| | | `get_project_env(projectId)` | Stripe-Soll-Modus + Keys gesetzt |
| **GitHub MCP** | Code | `list_branches(owner, repo)` | `main` existiert |
| | | `get_file_contents(path='.env.example')` | nur Platzhalter, keine echten Werte |
| **Hetzner MCP** | Server | `list_servers()` | `status = running` |
| | | `get_server(serverId)` | Firewall aktiv, Public-IP bekannt |

> **Wichtig:** Nicht alle MCPs sind in jeder Umgebung verfÃ¼gbar (z.â€‰B. Stripe-MCP je
d nach Konfiguration). Fehlt ein MCP-Tool, prÃ¼fe alternativ Ã¼ber HTTP(S)-Aufrufe.
> Siehe `references/verifikation.md` fÃ¼r die vollstÃ¤ndige PrÃ¼ftabelle.

---

## Entscheidungsbaum: welchen Weg fÃ¼r den neuen Kunden?

```
Soll der Kunde dauerhaft auf der geteilten Vorlage-DB laufen?
â”œâ”€ JA  â†’ âš ï¸� NICHT ohne Kunden-SchlÃ¼ssel auf den Kerntabellen.
â”‚        Erst template-haerten.md abarbeiten. (Noch nicht empfohlen.)
â””â”€ NEIN â†’ Eigene Supabase-Instanz pro Kunde. â†� Standardweg
          â†’ references/infrastruktur.md, Abschnitt â€žEigene Datenbankâ€œ
```

**Kassen-Typ (entscheidet Ã¼ber den Bestellweg):**

```
Kasse = WinOrder?
â”œâ”€ JA  â†’ Hotfolder-Bridge + Artikelmap â†’ references/winorder-kasse.md
â””â”€ NEIN â†’ anderen Adapter bauen; der Rest der Kette (Zahlung, DB, Mail) bleibt gleich.
```

---

## Die fÃ¼nf KritikalitÃ¤ten beim Nachbau (mustergÃ¼ltig aus der Vorlage)

### 1. Zwei Stripe-Endpunkte pro Kunde

Ein Endpunkt auf der Vercel-Domain (Status + Kundendaten), einer auf
`webhook.<kunde>.de` (Status + **BestÃ¤tigungsmail**). Nur der Server-Endpunkt
verschickt Mails. Der Mail-Marker (`bestaetigung_mail_am`) wird **ausschlieÃŸlich**
vom Mail-Server geschrieben â€” nicht an `bezahlt_am` hÃ¤ngen (Race Condition,
in der Vorlage real passiert).

### 2. Modus-Wache statt Signatur-Vertrauen

Test- und Live-Events sind **beide** korrekt signiert. Der Riegel ist die Kombination
aus `STRIPE_EXPECTED_MODE` (Soll) + `event.livemode` (Ist). Bei Konflikt â†’ **409**,
keine DB-Schreibung. Der SchlÃ¼ssel allein (PrÃ¤fix `sk_test_`/`sk_live_`) genÃ¼gt nicht.

### 3. Caddy-Reverse-Proxy: vier Pfade, Rest 404

Der Hetzner-Server lÃ¤sst nur diese Pfade durch:
`/api/webhooks/stripe*`, `/health`, `/api/status`, `/api/mail-retry`.
Fehlt einer, ist die Diagnose von auÃŸen tot.

### 4. Export-Endpunkt gehÃ¶rt aufs Hosting, nicht auf den Server

Der Kassen-Export (`/api/export/winorder`) lÃ¤uft auf dem Vercel-Projekt,
nicht auf dem Hetzner-Container. Die Bridge auf dem Kassen-PC ruft ihn mit
einem **eigenen** API-Key auf. Ein Aufruf **ohne** Key muss **401** liefern.

### 5. Git-Autor = Vercel-Teammitglied

Vercel-Hobby-Teams brechen den Deploy ab, wenn der Git-Autor kein Teammitglied ist
(â€žnot a memberâ€œ). Autor vor dem ersten Commit setzen:

```bash
git config user.name  <erlaubter-autor>
git config user.email <erlaubter-autor@users.noreply.github.com>
```

---

## Was ein Kunde **immer** braucht (Mindest-Antworten)

Ohne diese sechs Angaben ist jede Struktur geraten. Volle Liste:
`references/intake.md`.

1. **Marke** â€” Name, Logo-Datei, PrimÃ¤rfarbe(n), Slogan, Sprache
2. **Stammdaten** â€” Adresse, Telefon, E-Mail, Ã–ffnungszeiten, Zubereitungszeit
3. **Liefergebiet** â€” PLZ-Liste, Mindestbestellwert, LiefergebÃ¼hr je Zone
4. **Domain** â€” welche Domain, wer besitzt sie, DNS-Zugang
5. **Kasse** â€” welches System, wie heiÃŸt der Artikelstamm, wie kommen Bestellungen an
6. **Zahlung** â€” eigenes Konto oder geteiltes? Test- oder Live-Start?

**Erst fragen, dann bauen.** Nichts erfinden, was der Kunde beantworten kann.

---

## Die Rebranding-BerÃ¼hrungspunkte (Kurzfassung)

Marke und Kunde stecken **verteilt** im Code, nicht an einer Stelle. Die
vollstÃ¤ndige Abhakliste steht in `references/entbranden.md`. Die Bereiche:

| Bereich | Typische Datei(en) |
|---|---|
| Farben/Theme | `tailwind.config.js` (Design-Tokens) |
| Logo/Bilder | Header-Komponente, Hero, `lib/hero-images.ts`, `public/` |
| Stammdaten | `app/api/store/route.ts` + Wissensspeicher-Key `arch.store_config` |
| Liefergebiet | Lieferzonen-Modul (PLZ, Mindestwert, GebÃ¼hr, Fehlertext) |
| Ã–ffnungszeiten/Wunschzeit | Ã–ffnungszeiten-Modul |
| Rechtstexte | Impressum, Datenschutz, AGB |
| Kassen-Artikelmap | `lib/â€¦/articles.ts` **und** `tools/â€¦-articles.json` |
| Kassen-Formattexte | Format-Modul (Absendername, Referer, Order-PrÃ¤fix) |
| Kundenmail | Webhook-Server: E-Mail-Vorlagen |
| App/PWA | `manifest`, Service Worker, Icon-Generator, Capacitor |
| Kennungen im Code | `RESTAURANT`-Konstante, hartcodierte Namen, Middleware-Realm |

---

## Referenzen

| Datei | Inhalt |
|---|---|
| `references/intake.md` | Fragebogen + Ergebnisform |
| `references/entbranden.md` | VollstÃ¤ndige Rebranding-Map als Abhakliste |
| `references/template-haerten.md` | Vorlage mandantenfÃ¤hig machen (Kunden-SchlÃ¼ssel, RLS, Config) |
| `references/infrastruktur.md` | Gesamtarchitektur + Supabase, Vercel, Stripe, Hetzner je Kunde |
| `references/winorder-kasse.md` | Artikelmap, Bridge, Hotfolder, Bon-Druck |
| `references/verifikation.md` | E2E-Abnahme + PrÃ¼ftabelle |
| `references/regeln-und-fallen.md` | Harte Regeln und teuer gelernte Fehler |

---

## Dokumentation gehÃ¶rt zum Ergebnis

Ein Kundenprojekt ohne Doku gilt als **nicht fertig**. Nach dem Aufsetzen:
`docs/START.md` (Einstieg), `docs/PROJEKT.md` (Zweck + â€žwas nichtâ€œ),
`docs/entscheidungen/` (warum), `docs/RUNBOOK.md` (StÃ¶rfall). Vorlage und Ablauf:
Skill **`project-blueprint`**.

---

## Verwandte Skills

- `project-blueprint` (Projektaufbau + Doku-Struktur)
- `frontend-design` (Branding-OberflÃ¤che)
- `supabase-postgres-best-practices` (Schema, RLS, Migrationen)
- `devops` (CI/CD, Docker, Deployment-Automation)
- `web-app-launch` (Go-Live-Checkliste: Domain, Stripe Live, erste Bestellung)