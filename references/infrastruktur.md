# Infrastruktur je Kunde

Für jeden Kunden entsteht eine **eigene** Umgebung. Nichts wird geteilt — außer
vielleicht der Server, dann aber mit **getrennten Containern, Ports und `.env`**.

> **Grundsatz:** Jede Aussage über den Zustand braucht einen **ausgeführten Befehl**.
> Werte niemals aus dem Gedächtnis annehmen.

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

---

## 4. Zahlung (Stripe)

**Zuerst die Frage: eigenes Konto oder geteilt?**

| Fall | Konsequenz |
|---|---|
| **Eigenes Stripe-Konto des Kunden** | sauberste Trennung, Auszahlung direkt an den Kunden |
| Geteiltes Konto | nur mit getrennten Endpunkten und sehr sauberer Buchhaltung — **nicht empfohlen** |

- [ ] Keys je Modus (Test zuerst!)
- [ ] **Eigener Webhook-Endpunkt** auf die Kunden-Domain (nicht der des Vorbilds)
- [ ] Webhook-Secret in die Server-`.env` **und** ins Hosting
- [ ] Betriebsmodus-Wache (`STRIPE_EXPECTED_MODE` o. ä.) auf `test` beim Start
- [ ] Testzahlung durchspielen **bevor** auf `live` gestellt wird

**Reihenfolge beim Umschalten test → live (wichtig):**
1. Erst die **Wache** auf `live` (sonst ein Fenster mit abgewiesener echter Zahlung)
2. Dann die **Keys** tauschen
3. Dann **Redeploy** / Container neu
4. Danach eine echte Zahlung mit kleiner Summe

> ⚠️ **Zwei Empfänger desselben Zahlungsereignisses.** Ein Webhook läuft typischerweise
> auf dem **Hosting** (Status + Kundendaten), ein zweiter auf dem **Server**
> (Status + **Bestätigungsmail**). Beide brauchen das **richtige** Secret. Ein
> vertauschtes Secret: Zahlung landet in der DB, **Mail fällt stumm aus.**

Details zum Modus: Skill `stripe-…` des Vorlagenprojekts.

---

## 5. Server (Hetzner) — Webhook, Mail, Wächter

**Möglichkeit A: eigener Server pro Kunde.** Sauberste Trennung.
**Möglichkeit B: derselbe Server, getrennte Container.** Zulässig — mit harten Regeln.

- [ ] **Eigene Container** je Kunde (eigene Namen, eigenen Port)
- [ ] **Eigene `.env`** je Kunde (`/opt/<kunde>-webhook/.env`, chmod 600)
- [ ] **Eigene Domain** für den Webhook (Reverse-Proxy-Block je Kunde)
- [ ] Reverse-Proxy leitet **nur** die nötigen Pfade durch — typisch:
      Webhook-Pfad, `/health`, Diagnose, Mail-Retry. **Alles andere → 404.**
- [ ] **Eigener** Mail-Absender + **verifizierte Domain** (Resend o. ä.)
- [ ] Küchenwächter (Timer), der hängende bezahlte Bestellungen meldet
- [ ] Firewall: nur die nötigen Ports; wenn möglich an feste IP binden

```bash
ssh -i <key> root@<server> "docker ps --format '{{.Names}}\t{{.Ports}}'"
ssh -i <key> root@<server> "docker logs <container> --tail 50"
```

> ⚠️ **Server-`.env` ändern ≠ Deploy.** Nur Env geändert → `docker compose up -d`
> genügt. Neuer Code (`server.mjs`) → **Rebuild** nötig.

> ⚠️ **Ein Kunde darf den anderen nicht sehen.** Geteilte Container, geteilte `.env`
> oder ein gemeinsamer Mail-Absender sind eine **Fehlkonfiguration**.

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
- [ ] Hotfolder-Pfad **je Kasse** (Pfad und WinOrder-Version können abweichen!)
- [ ] Bridge als Dauerbetrieb (Autostart + Aufpasser), ohne Adminrechte wenn möglich
- [ ] Artikelmap **kundenspezifisch** aus echten Bonzeilen

---

## Abschluss Infrastruktur

- [ ] Repo, DB, Hosting, Zahlung, Server, Kasse — **je eine eigene Umgebung**
- [ ] Kein Schlüssel, kein Endpunkt, keine Tabelle zwischen zwei Kunden geteilt
- [ ] Weiter mit `references/entbranden.md`
