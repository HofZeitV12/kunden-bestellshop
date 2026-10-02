# Infrastruktur je Kunde

Für jeden Kunden entsteht eine **eigene** Umgebung. Nichts wird geteilt — außer
vielleicht der Server, dann aber mit **getrennten Containern, Ports und `.env`**.

> **Grundsatz:** Jede Aussage über den Zustand braucht einen **ausgeführten Befehl**.
> Werte niemals aus dem Gedächtnis annehmen.

---

## Die Ziel-Architektur (aus der laufenden Vorlage verifiziert)

Die Vorlage zeigt, wie die vier Säulen zusammenwirken. **Dieses Bild zuerst verstehen,
dann nachbauen:**

```
Kunde (Browser)
   │  Bestellung auf www.<kunde>.de
   ▼
┌─ Vercel ──────────────────────────────────────────────┐
│  Next.js (Website, Warenkorb, /api/checkout)          │
│  POST /api/checkout → Order anlegen (status=ausstehend)│
│  → Stripe Checkout Session (Metadaten: order_id)      │
└──────────────┬────────────────────────────────────────┘
               │ Zahlung (Stripe Checkout)
               ▼
        Stripe verarbeitet die Zahlung
               │  checkout.session.completed (signiert)
               ▼
┌─ Hetzner-Server (Docker) ────────────────────────────┐
│  Caddy (HTTPS, Let's Encrypt)                         │
│   webhook.<kunde>.de                                  │
│   leitet NUR durch: /api/webhooks/stripe*             │
│                     /health                           │
│                     /api/status      (Admin-Token)    │
│                     /api/mail-retry  (Admin-Token)    │
│   alles andere → 404                                  │
│        │                                              │
│        ▼                                              │
│  Webhook-Container (Node/Express)                     │
│   1. Signatur prüfen (Webhook-Secret)                 │
│   2. Modus-Wache: event.livemode == STRIPE_EXPECTED_  │
│      MODE, sonst 409 (keine DB-Schreibung)            │
│   3. orders: status=offen, stripe_mode, bezahlt_am    │
│   4. Bestätigungsmail (Resend), Marker:               │
│      bestaetigung_mail_am (NUR dieser Server setzt)   │
└──────────────┬────────────────────────────────────────┘
               │ supabase-js (Service-Role)
               ▼
┌─ Supabase (eigene Instanz pro Kunde) ────────────────┐
│  orders        (Bestellungen, stripe_mode, Mail-       │
│                 Tracking: bestaetigung_mail_*)         │
│  menultems     (Menü — Name historisch gewachsen,      │
│                 NICHT „korrigieren")                   │
│  project_memory (arch.store_config = Stammdaten,       │
│                 Laufzeit-Interface der Website)        │
└──────────────┬────────────────────────────────────────┘
               │ GET /api/export/winorder (Kassen-Key)
               ▼
┌─ Kassen-PC im Restaurant ────────────────────────────┐
│  Bridge (PowerShell, Poll ~15 s)                      │
│   → Hotfolder <KASSEN-BASIS>\EShop\Incoming           │
│   → Kassen-Software parst, druckt Bon (Thermodrucker) │
│   → Bridge quittiert: PATCH status=in_bearbeitung     │
└───────────────────────────────────────────────────────┘
```

**Vier Eigenschaften, die man aus diesem Bild ableiten muss:**

1. **Zwei Stripe-Endpunkte sind bewusst.** Die Vorlage betreibt genau zwei
   Live-Endpunkte: einen auf die Vercel-Domain, einen auf `webhook.<kunde>.de`.
   **Der Mailversand läuft ausschließlich über den Server-Endpunkt** — die
   Vercel-Route verschickt keine Mails. Fällt der Server aus: Bestellung korrekt
   in der DB, **aber keine Mail.**
2. **Der Server ist der einzige Mail-Absender.** Der Mail-Marker
   (`bestaetigung_mail_am`) wird nur vom Server geschrieben. Hängt die Mail an
   `bezahlt_am`, gewinnt die Erfolgsseite das Rennen und die Mail fällt aus
   (Race Condition — in der Vorlage real passiert und behoben).
3. **Der Signatur-Check allein reicht nicht.** Test- und Live-Events sind beide
   gültig signiert — mit verschiedenen Secrets. Die Modus-Wache
   (`STRIPE_EXPECTED_MODE` + `event.livemode`) ist der eigentliche Riegel.
4. **Caddy ist die einzige öffentliche Fläche des Servers.** Vier Pfade, Rest 404.
   Fehlt ein Pfad in dieser Liste, läuft die Diagnose von außen ins Leere.

---

## 1. Repository

- [ ] Neues Repository, privat, Hauptzweig `main`
- [ ] Aus der Vorlage kopiert (**ohne** Git-History der Vorlage — frischer Start)
- [ ] `.gitignore` **zuerst** prüfen: `.env*.local`, `.env`, `*.pem`, `*.key`,
      Zugangsdateien, Datenbankabzüge
- [ ] **Commits nur unter dem Autor, den das Hosting akzeptiert.** Manche
      Vercel-Hobby-Teams brechen den Deploy ab, wenn der Git-Autor kein Mitglied ist
      („not a member"). Autor vor dem ersten Commit setzen.

```bash
git config user.name  <erlaubter-autor>
git config user.email <erlaubter-autor@users.noreply.github.com>
```

---

## 2. Datenbank (Standardweg: eigene Instanz)

- [ ] Neue Supabase-Instanz anlegen (Region passend zum Kunden — EU, wenn EU-Kunde)
- [ ] Als **MCP** verbinden, um Schema und Inhalte zu prüfen
- [ ] Migrationen aus der Vorlage **in der richtigen Reihenfolge** anwenden
      (der Vorlage-Migrationsordner ist die Quelle)
- [ ] Menü-Seed einspielen (Kunden-Menü, nicht das des Vorbilds)
- [ ] `project_memory` → `arch.store_config` mit den **Kunden**-Stammdaten füllen
- [ ] Sicherheits- und Leistungshinweise der Instanz abrufen und **abarbeiten**
      (vor allem RLS — siehe `references/template-haerten.md`)

```sql
-- Zustand prüfen, nicht annehmen
select count(*) from public.menultems;
select content from public.project_memory where key = 'arch.store_config';
```

- [ ] Typen generieren und committen (`npm run gen-types` o. ä.)

> ⚠️ **Kundenkennung konsequent setzen.** Wenn die Bestelltabelle eine Kundenspalte
> hat, muss **jede** Bestellung und **jeder** Filter sie benutzen. Sonst liefert der
> Export ans Kassensystem **nichts**.

---

## 3. Hosting (Vercel)

- [ ] Neues Projekt, aus dem **neuen** Repo (Git-Integration = Deploy-Pfad)
- [ ] Umgebungsvariablen **je Umgebung vollständig** setzen (Production/Preview):

| Variable | Zweck | Modus-Hinweis |
|---|---|---|
| `SITE_URL`, `NEXT_PUBLIC_SITE_URL` | Kunden-Domain | – |
| Supabase URL + Anon-Key | Client | öffentlich, RLS-geschützt |
| Supabase Service-Role | Server (Admin) | **nur serverseitig** |
| Stripe Secret | Zahlung | **Präfix test/live beachten** |
| Stripe Webhook-Secret | Signatur | gehört zum **richtigen** Endpunkt |
| Stripe Publishable | Client | passend zum Secret |
| Stripe Soll-Modus | Betriebsmodus-Wache | `test` \| `live` |
| Export-/Kassen-Key | Kassen-Auth | Betriebsschlüssel |
| Admin-Zugang | Admin-UI | Betriebsschlüssel |

- [ ] Domain verbinden (DNS beim Kunden/Registrar), `www`-Redirect prüfen
- [ ] **Deploy nach dem Setzen der Variablen** — geänderte Env wirkt erst nach Redeploy
- [ ] Health: Startseite und Menü-Endpunkt antworten

> ⚠️ `vercel env pull` liefert für **sensitive** Variablen oft Platzhalter. `.env.local`
> lokal **manuell** pflegen — nicht blind auf den Pull verlassen.

> ⚠️ **`SITE_URL` steht im Checkout-Code als Fallback.** Wird sie nicht sauber
> gesetzt, zeigen `success_url`/`cancel_url` auf die falsche Domain und der Kunde
> landet nach der Zahlung auf einer fremden Seite.

---

## 4. Zahlung (Stripe)

**Zuerst die Frage: eigenes Konto oder geteilt?**

| Fall | Konsequenz |
|---|---|
| **Eigenes Stripe-Konto des Kunden** | sauberste Trennung, Auszahlung direkt an den Kunden |
| Geteiltes Konto | nur mit getrennten Endpunkten und sehr sauberer Buchhaltung — **nicht empfohlen** |

- [ ] Keys je Modus (Test zuerst!)
- [ ] **Zwei Webhook-Endpunkte** auf die Kunden-Domains: einer auf die
      Hosting-Domain (Status/Kundendaten), einer auf `webhook.<kunde>.de` (Status +
      **Bestätigungsmail**). Nicht die Endpunkt-IDs des Vorbilds wiederverwenden.
- [ ] Webhook-Secret in die Server-`.env` **und** ins Hosting
- [ ] Betriebsmodus-Wache (`STRIPE_EXPECTED_MODE` o. ä.) auf `test` beim Start
- [ ] Testzahlung durchspielen **bevor** auf `live` gestellt wird

**Reihenfolge beim Umschalten test → live (wichtig):**
1. Erst die **Wache** auf `live` (sonst ein Fenster mit abgewiesener echter Zahlung)
2. Dann die **Keys** tauschen
3. Dann **Redeploy** / Container neu
4. Danach eine echte Zahlung mit kleiner Summe

> ⚠️ **Webhook-Secrets sind nur beim Anlegen sichtbar.** Die Stripe-API liefert das
> Secret später nicht mehr aus. Wer es nicht kopiert hat, muss den Endpunkt neu
> anlegen — und dann **alle** Stellen aktualisieren, die das alte Secret kannten.

> ⚠️ **Eingeschänkter Schlüssel (`rk_`) statt Vollschlüssel (`sk_`).** Die Vorlage
> läuft produktiv mit einem Restricted Key — das ist der sicherere Weg und reicht für
> Session anlegen/lesen. Aber: die Modus-Erkennung im Server muss den `rk_`-Präfix
> kennen (Regex `^(sk|rk|pk)_`), sonst meldet sie den Modus falsch.

---

## 5. Server (Hetzner) — Webhook, Mail, Wächter

**Möglichkeit A: eigener Server pro Kunde.** Sauberste Trennung.
**Möglichkeit B: derselbe Server, getrennte Container.** Zulässig — mit harten Regeln.

- [ ] **Eigene Container** je Kunde (eigene Namen, eigener Port)
- [ ] **Eigene `.env`** je Kunde (`/opt/<kunde>-webhook/.env`, chmod 600)
- [ ] **Eigene Domain** für den Webhook (Reverse-Proxy-Block je Kunde)
- [ ] Reverse-Proxy leitet **nur** die nötigen Pfade durch — typisch:
      Webhook-Pfad, `/health`, Diagnose (`/api/status`), Mail-Retry
      (`/api/mail-retry`). **Alles andere → 404.** Der Export ans Kassensystem
      gehört **nicht** hierher — er läuft auf dem Hosting (siehe Abschnitt 7).
- [ ] **Eigener** Mail-Absender + **verifizierte Domain** (Resend o. ä.)
- [ ] Küchenwächter (Timer), der hängende bezahlte Bestellungen meldet
- [ ] Firewall: nur die nötigen Ports; wenn möglich an feste IP binden

```bash
ssh -i <key> root@<server> "docker ps --format '{{.Names}}\t{{.Ports}}'"
ssh -i <key> root@<server> "docker logs <container> --tail 50"
```

> ⚠️ **Server-`.env` ändern ≠ Deploy.** Nur Env geändert → `docker compose up -d`
> genügt. Neuer Code (`server.mjs`) → **Rebuild** nötig. Ein Rebuild friert die
> Umgebung ein — also immer **erst** die `.env` ziehen, dann bauen.

> ⚠️ **Ein Kunde darf den anderen nicht sehen.** Geteilte Container, geteilte `.env`
> oder ein gemeinsamer Mail-Absender sind eine **Fehlkonfiguration**.

> ⚠️ **Mail-Nachversand von außen prüfbar machen.** Diagnose- und Retry-Pfade
> (`/api/status`, `/api/mail-retry`) sind durch ein Admin-Token geschützt — aber nur
> erreichbar, wenn der Reverse-Proxy sie durchlässt. Der Status-Endpunkt muss
> `mail_fehlgeschlagen = 0` zeigen. Wichtig: ein Retry findet nur Mails mit Status
> `failed`/`pending` — ist der Marker leer (Webhook kam nie an), wird die Bestellung
> still übersprungen. Vorher auf `pending` setzen.

---

## 6. Umgebungen und Geheimnisse (Disziplin)

| Ebene | Ort | Im Repo? | Inhalt |
|---|---|---|---|
| Maschinell | `.env.local` | **nein** | echte Werte |
| Vorlage | `.env.example` | **ja** | **nur Platzhalter** + Fundort je Wert |
| Laufzeit | Hosting-/Server-Env | – | je Umgebung vollständig |

- [ ] **Kein echter Wert in einer getrackten Datei** — nicht in Vorlagen, nicht in
      Skripten, nicht in Kommentaren
- [ ] Zugangsregister führen: **nur Fundorte**, nie Werte
- [ ] Ignorierliste greift (Testdatei anlegen → wird nicht angezeigt)

> ⚠️ **Entfernen ist keine Bereinigung.** Ein Wert, der einmal in der Git-History
> liegt, bleibt lesbar. Nur **Rotation in der Quelle** macht ihn unbrauchbar.
> Reihenfolge bei einem Fund: **melden → rotieren → entfernen.**

---

## 7. Kasse (Kurz)

Vollständig in `references/winorder-kasse.md`. Kernpunkte für die Infrastruktur:

- [ ] Kassen-Rechner ist ein **physischer PC im Restaurant** — nicht der Server, nicht
      die Cloud
- [ ] Der **Export-Endpunkt läuft auf dem Hosting** (`/api/export/winorder`), nicht
      auf dem Webhook-Server. Die Bridge ruft ihn mit einem eigenen Kassen-Key auf.
      Ein Aufruf **ohne** Key muss **HTTP 401** liefern — das ist der Live-Test,
      dass die Auth greift.
- [ ] Hotfolder-Pfad **je Kasse** (Pfad und Kassen-Version können abweichen!)
- [ ] Bridge als Dauerbetrieb (Autostart + Aufpasser), ohne Adminrechte wenn möglich
- [ ] Artikelmap **kundenspezifisch** aus echten Bonzeilen

---

## Abschluss Infrastruktur

- [ ] Repo, DB, Hosting, Zahlung, Server, Kasse — **je eine eigene Umgebung**
- [ ] Kein Schlüssel, kein Endpunkt, keine Tabelle zwischen zwei Kunden geteilt
- [ ] Weiter mit `references/entbranden.md`
