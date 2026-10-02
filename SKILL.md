---
name: kunden-bestellshop
description: Eine bestehende Online-Bestell-Website (Menue, Warenkorb, Lieferung/Abholung, Online-Zahlung, Kassen-Bon) als Vorlage nehmen und fuer einen NEUEN Kunden aufsetzen - eigenes Branding (Logo, Farben, Stammdaten, Rechtstexte), eigene Infrastruktur (Supabase, Vercel, Stripe, Hetzner-Container), eigene Kasse und eigener Bon-Druck. Use when a new restaurant customer needs its own ordering website based on the Leckerbissen template (https://www.leckerbissen.online/website/speisekarte), when cloning or duplicating the template for another restaurant, when onboarding a second restaurant onto the same concept with a new logo/branding, when rebranding an existing fork, or when asked "wie setze ich das gleiche System fuer einen neuen Restaurant-Kunden auf". Also use before any schema change to the template and when a customer project must stay cleanly separated from the template project.
---

# Kunden-Bestellshop aus Vorlage aufsetzen

Ein **erprobtes Bestellsystem** (Online-Bestell-Website mit Lieferung/Abholung:
Website -> Zahlung -> Bon auf der Kasse) wird zur **Vorlage**. Pro Kunde entsteht
daraus ein **eigenes Projekt** mit eigenem Logo, eigener Infrastruktur und eigener
Kasse - **gleiches Konzept, nicht gleiche Umgebung**.

Diese Anleitung ist **konkret in den Fakten**: sie stammt aus einem real betriebenen
System mit nachweislich funktionierender Kette. Projektkennungen, Tokens und
Serverwerte stehen **nicht** hier - nur **wo** sie liegen und **wie** man sie
ermittelt.

---

## Das Referenzsystem (die Vorlage)

**Vorlage ist das Leckerbissen-Projekt.** Die laufende Bestell-Website:

**[https://www.leckerbissen.online/website/speisekarte](https://www.leckerbissen.online/website/speisekarte)**

Pruefe dieses System **zuerst** gegen die Wirklichkeit. Es ist der Beweis, dass der
Bestellweg funktioniert:

| Baustein | Was es ist | Pruefen mit |
|---|---|---|
| **Website** | Bestellseite `/website/speisekarte` - Menue, Warenkorb, Lieferung/Abholung | Seite + Menue-Endpunkt -> HTTP 200 |
| **Datenbank** | Supabase (geteilte Instanz, EU-Region) | Menue-Endpunkt liefert die Artikelzahl; `orders` nimmt Bestellungen auf |
| **Server** | Hetzner-Container (KVM, 8 Cores/16 GB, Ubuntu 24.04): Zahlungs-Webhook, Bestaetigungsmail, Kuechenwaechter | `GET /health` -> `status: ok` |
| **Kasse** | Kassen-Software im Restaurant, Bon auf Thermodrucker (mPOP o.ae.) | Export **ohne** Key -> HTTP 401 |

**Der Kernbeweis:** Eine Online-Bestellung laeuft **ohne manuelles Kopieren** durch
bis zum Bon - Website -> Zahlung -> Datenbank -> Bridge -> Hotfolder -> Kasse -> Bon.

---

## Wie die vier Saeulen zusammenwirken

Das ist die Architektur, die man fuer einen neuen Kunden **nachbaut** (ausfuehrlich
mit Datenfluss: `references/infrastruktur.md`):

```
Browser -> Vercel (Next.js, Checkout) -> Stripe (Zahlung)
   -> Hetzner-Webhook (Signatur + Modus-Wache + Mail) -> Supabase (orders)
   -> Kassen-PC (Bridge) -> Hotfolder -> Kasse -> Bon
```

| Saeule | Technik | MCP-Pruefbefehl |
|---|---|---|
| **Vercel** (Hosting) | Next.js 15 App Router, Team-Konto, Git-Integration = Deploy-Pfad | `list_projects(teamId)` -> Projekt existiert, `get_project_env()` fuer Env-Pruefung |
| **Supabase** (DB) | PostgreSQL in EU-Region (eu-west-1), geteilte Instanz oder eigene | `get_project(projectId)` fuer Health + Advisors, `execute_sql(select from orders)` |
| **Stripe** (Zahlung) | Redirect-Checkout, zwei Webhook-Endpunkte (Hosting + Mail-Server) | Dashboard -> Webhooks: `livemode`, `url`, `status` je Endpunkt pruefen, Keys via Dashboard |
| **Hetzner** (Server) | KVM-VPS (cx43), Ubuntu 24.04, Docker-Compose hinter Caddy | `list_servers()` -> Status `running`, `get_server()` fuer IP + Firewall |
| **GitHub** (Code) | Privates Repo, Git-Author muss im Vercel-Team sein | `search_repositories()`, `get_file_contents()`, `git config user.name` setzen |
| **Export-API** (Bruecke) | `GET /api/export/winorder` auf dem Hosting, Header `x-api-key` | `curl` ohne Key -> HTTP 401; mit Key -> JSON-Array |

---

## Die eine Regel, die alles andere entscheidet

**Ein Kunde = ein eigenes Projekt.** Eigene Datenbank, eigenes Vercel-Projekt,
eigene Domain, eigene Zahlungsumgebung, eigener Kassen-Anschluss.

**Niemals** zwei Restaurants auf **derselben** Datenbank betreiben, solange die
Kerntabellen keinen Kunden-Schluessel tragen. Die geteilte Datenbank ist die
teuerste Falle dieses Systems (siehe `references/template-haerten.md`).

---

## Der Ablauf

```
0.  Vorlage pruefen              Leckerbissen-Website live kontrollieren (URL oben)
1.  Kunde befragen              Stammdaten, Zonen, Zeiten, Kasse, Domain -> references/intake.md
2.  Projekt anlegen             neues Repo, Supabase, Vercel, Stripe, Hetzner
                                -> references/infrastruktur.md
3.  Entbranden                  Logo, Farben, Texte, Kennungen -> references/entbranden.md
4.  Daten fuellen               Menue-Seed, Store-Config, Lieferzonen, Oeffnungszeiten
5.  Kasse anbinden              Artikelmap, Bridge, Hotfolder
                                -> references/winorder-kasse.md
6.  Verifizieren                E2E: Bestellung -> Zahlung -> Mail -> Bon
                                -> references/verifikation.md
7.  Dokumentieren               docs/START.md, PROJEKT.md, Entscheidungen, Runbook
                                -> ueber Skill `project-blueprint`
```

**Jede Phase endet mit einer Meldung:** was entstanden ist, womit es geprueft wurde,
was offen blieb. Jede Pruefung nutzt **einen ausgeführten MCP-Befehl** - nicht
"muesste laufen", sondern den tatsaechlichen Antworttext.

---

## MCP-Diagnose: den Zustand jedes Bausteins pruefen

Verfuegbare MCPs (Cursor/KI-Tool-Set) erlauben Live-Pruefungen, ohne selbst
netzwerkfaehig zu sein. Rufe **vor Schritt 1** diese Diagnose auf und dokumentiere
die Ergebnisse:

| MCP | Baustein | Pruefung | Erwartet |
|---|---|---|---|
| **Supabase MCP** | Datenbank | `get_advisors(projectId)` | keine kritischen Warnungen |
| | | `execute_sql(select count(*) from orders)` | Zahl >= 0 |
| | | `list_tables(projectId)` | `orders`, `menultems`, `project_memory` vorhanden |
| **Vercel MCP** | Hosting | `list_projects(teamId)` | Kunden-Projekt ist aufgelistet |
| | | `get_project_env(projectId)` | Stripe-Soll-Modus + Keys gesetzt |
| **GitHub MCP** | Code | `list_branches(owner, repo)` | `main` existiert |
| | | `get_file_contents(path='.env.example')` | nur Platzhalter, keine echten Werte |
| **Hetzner MCP** | Server | `list_servers()` | `status = running` |
| | | `get_server(serverId)` | Firewall aktiv, Public-IP bekannt |

> **Wichtig:** Nicht alle MCPs sind in jeder Umgebung verfuegbar (z.B. Stripe-MCP je
> nach Konfiguration). Fehlt ein MCP-Tool, pruefe alternativ ueber HTTP(S)-Aufrufe.
> Siehe `references/verifikation.md` fuer die vollstaendige Prueftabelle.

---

## Entscheidungsbaum: welchen Weg fuer den neuen Kunden?

```
Soll der Kunde dauerhaft auf der geteilten Vorlage-DB laufen?
+-- JA  --> WARNUNG: NICHT ohne Kunden-Schluessel auf den Kerntabellen.
|         Erst template-haerten.md abarbeiten. (Noch nicht empfohlen.)n-- NEIN --> Eigene Supabase-Instanz pro Kunde. <-- Standardweg
           --> references/infrastruktur.md, Abschnitt "Eigene Datenbank"
```

**Kassen-Typ (entscheidet ueber den Bestellweg):**

```
Kasse = WinOrder?
+-- JA  --> Hotfolder-Bridge + Artikelmap --> references/winorder-kasse.md
n-- NEIN --> anderen Adapter bauen; der Rest der Kette (Zahlung, DB, Mail) bleibt gleich.
```

---

## Die fuenf Kritikalitaeten beim Nachbau (mustergueltig aus der Vorlage)

### 1. Zwei Stripe-Endpunkte pro Kunde

Ein Endpunkt auf der Vercel-Domain (Status + Kundendaten), einer auf
`webhook.<kunde>.de` (Status + **Bestaetigungsmail**). Nur der Server-Endpunkt
verschickt Mails. Der Mail-Marker (`bestaetigung_mail_am`) wird **ausschliesslich**
vom Mail-Server geschrieben - nicht an `bezahlt_am` haengen (Race Condition,
in der Vorlage real passiert).

### 2. Modus-Wache statt Signatur-Vertrauen

Test- und Live-Events sind **beide** korrekt signiert. Der Riegel ist die Kombination
aus `STRIPE_EXPECTED_MODE` (Soll) + `event.livemode` (Ist). Bei Konflikt -> **409**,
keine DB-Schreibung. Der Schluessel allein (Prefix `sk_test_`/`sk_live_`) genuegt nicht.

### 3. Caddy-Reverse-Proxy: vier Pfade, Rest 404

Der Hetzner-Server laesst nur diese Pfade durch:
`/api/webhooks/stripe*`, `/health`, `/api/status`, `/api/mail-retry`.
Fehlt einer, ist die Diagnose von aussen tot.

### 4. Export-Endpunkt gehoert aufs Hosting, nicht auf den Server

Der Kassen-Export (`/api/export/winorder`) laeuft auf dem Vercel-Projekt,
nicht auf dem Hetzner-Container. Die Bridge auf dem Kassen-PC ruft ihn mit
einem **eigenen** API-Key auf. Ein Aufruf **ohne** Key muss **401** liefern.

### 5. Git-Autor = Vercel-Teammitglied

Vercel-Hobby-Teams brechen den Deploy ab, wenn der Git-Autor kein Teammitglied ist
("not a member"). Autor vor dem ersten Commit setzen:

```bash
git config user.name  <erlaubter-autor>
git config user.email <erlaubter-autor@users.noreply.github.com>
```

---

## Was ein Kunde **immer** braucht (Mindest-Antworten)

Ohne diese sechs Angaben ist jede Struktur geraten. Volle Liste:
`references/intake.md`.

1. **Marke** - Name, Logo-Datei, Primaerfarbe(n), Slogan, Sprache
2. **Stammdaten** - Adresse, Telefon, E-Mail, Oeffnungszeiten, Zubereitungszeit
3. **Liefergebiet** - PLZ-Liste, Mindestbestellwert, Liefergebuehr je Zone
4. **Domain** - welche Domain, wer besitzt sie, DNS-Zugang
5. **Kasse** - welches System, wie heisst der Artikelstamm, wie kommen Bestellungen an
6. **Zahlung** - eigenes Konto oder geteiltes? Test- oder Live-Start?

**Erst fragen, dann bauen.** Nichts erfinden, was der Kunde beantworten kann.

---

## Die Rebranding-Beruehrungspunkte (Kurzfassung)

| Bereich | Typische Datei(en) |
|---|---|
| Farben/Theme | `tailwind.config.js` (Design-Tokens) |
| Logo/Bilder | Header-Komponente, Hero, `lib/hero-images.ts`, `public/` |
| Stammdaten | `app/api/store/route.ts` + Wissensspeicher-Key `arch.store_config` |
| Liefergebiet | Lieferzonen-Modul (PLZ, Mindestwert, Gebuehr, Fehlertext) |
| Oeffnungszeiten/Wunschzeit | Oeffnungszeiten-Modul |
| Rechtstexte | Impressum, Datenschutz, AGB |
| Kassen-Artikelmap | `lib/../articles.ts` **und** `tools/../-articles.json` |
| Kassen-Formattexte | Format-Modul (Absendername, Referer, Order-Praefix) |
| Kundenmail | Webhook-Server: E-Mail-Vorlagen |
| App/PWA | `manifest`, Service Worker, Icon-Generator, Capacitor |
| Kennungen im Code | `RESTAURANT`-Konstante, hartcodierte Namen, Middleware-Realm |

Vollstaendige Abhakliste: `references/entbranden.md`.

---

## Referenzen

| Datei | Inhalt |
|---|---|
| `references/intake.md` | Fragebogen + Ergebnisform |
| `references/entbranden.md` | Vollstaendige Rebranding-Map als Abhakliste |
| `references/template-haerten.md` | Vorlage mandantenfaehig machen (Kunden-Schluessel, RLS, Config) |
| `references/infrastruktur.md` | Gesamtarchitektur + Supabase, Vercel, Stripe, Hetzner je Kunde |
| `references/winorder-kasse.md` | Artikelmap, Bridge, Hotfolder, Bon-Druck |
| `references/verifikation.md` | E2E-Abnahme + Prueftabelle |
| `references/regeln-und-fallen.md` | Harte Regeln und teuer gelernte Fehler |

---

## Dokumentation gehoert zum Ergebnis

Ein Kundenprojekt ohne Doku gilt als **nicht fertig**. Nach dem Aufsetzen:
`docs/START.md` (Einstieg), `docs/PROJEKT.md` (Zweck + "was nicht"),
`docs/entscheidungen/` (warum), `docs/RUNBOOK.md` (Stoerfall). Vorlage und Ablauf:
Skill **`project-blueprint`**.

---

## Verwandte Skills

- `project-blueprint` (Projektaufbau + Doku-Struktur)
- `frontend-design` (Branding-Oberflaeche)
- `supabase-postgres-best-practices` (Schema, RLS, Migrationen)
- `devops` (CI/CD, Docker, Deployment-Automation)
- `web-app-launch` (Go-Live-Checkliste: Domain, Stripe Live, erste Bestellung)