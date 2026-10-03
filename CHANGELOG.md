# Changelog — Änderungen am Skill

Kurz und chronologisch. **Diese Datei ist die Notiz für jeden Agenten**, der den Skill
auf einem anderen Rechner lädt: hier steht, was zuletzt geändert wurde, in welchem
Commit — und was beim Weiterarbeiten zu beachten ist.

Immer **neueste Einträge oben**. Nach jeder Änderung am Skill **im selben Vorgang**
ergänzen und mit `git push` veröffentlichen (siehe `README.md` → „Aktualisieren").

---

## 2026-10-03 (abends) — Skill als GitHub-Quelle sichtbar gemacht

**Ziel:** Der Skill soll **auf GitHub sichtbar** sein — **nicht** auf einem lokalen
Rechner. Ein fremder Agent lädt ihn über die Roh-URL, ohne Klon.

| Commit | Inhalt |
|---|---|
| `f030c06` | `CHANGELOG.md` angelegt (diese Datei) + Verweise in `README.md`/`SKILL.md` |
| danach | Hinweis „liegt auf GitHub, nicht lokal" oben in `SKILL.md` und `README.md` |

**Für den Agenten:** die einzige Quelle ist das **öffentliche** Repo
`HofZeitV12/kunden-bestellshop`, Branch `main` → `SKILL.md`. `CHANGELOG.md` zuerst
lesen, damit kein veralteter Stand benutzt wird.

---

## 2026-10-03 (abends) — Audit gegen das laufende Muster „Leckerbissen"

**Geprüft:** der Skill (16 Dateien), das Vorlage-Repo `HofZeitV12/leckerbissen-speisekarte`
(lokal **und** remote), Webhook-Server (`/health`, `/api/status`, `/api/webhooks/stripe`),
Datenbank-Zugriff und die MCPs (GitHub, Resend, Vercel, Supabase, Hetzner).

**Belege:** die vollständige Analyse liegt als Canvas `skill-audit-kunden-bestellshop`
im Cursor-Projekt `c-Users-lecke-Downloads-WinOrder` (Dateiliste, Abweichungstabelle,
MCP-Stand, Live-Nachweis).

**Commits in diesem Repo (Branch `main`):**

| Commit | Inhalt |
|---|---|
| `4a32b1b` | Muster „Leckerbissen" konkret verankert (`references/referenz-leckerbissen.md`) |
| `6201433` | MCP-Stand 03.10. korrigiert; **neuer Abschnitt 8.1** „Vorlage nicht eingefroren"; **Falle 14** (Fork von altem Stand); erfundene Tabelle `project_memory_history` entfernt |
| `0aa4321` | Nutzung von jedem Rechner dokumentiert (public/`main`, Klon, ZIP-Fallback) |
| `499866b` | README-Abschnitt „Aktualisieren" entdoppelt |

**Was der andere Agent wissen muss:**

- Der Skill ist **öffentlich** unter `HofZeitV12/kunden-bestellshop`, Branch `main`.
  Laden: `https://raw.githubusercontent.com/HofZeitV12/kunden-bestellshop/main/SKILL.md`
- **Vor jedem Fork aktualisieren:** `git fetch` + `git rev-list --count HEAD..origin/main`
  muss **0** sein. Die Vorlage war am 03.10. **8 Commits hinter `main`** — ein alter
  lokaler Stand hat `check`/`types`/`suche` **nicht** (Skripte hängen am **Stand**, nicht
  am Projekt). Details: `references/referenz-leckerbissen.md`, Abschnitt 8.1.
- **MCP-Stand 03.10.2026:** GitHub, Resend und Vercel **OK** (Vercel antwortet wieder —
  war vormittags noch `403`). **Supabase-MCP** hat **keinen Zugriff** auf die geteilte
  „Üben"-Instanz (nur HTTP-API als Ersatzweg). **Hetzner-MCP** nicht erreichbar — Port
  `11436` von diesem Rechner zu, **SSH-Tunnel** über Port 22 als Weg.
- **Keine Zugangsdaten im Repo.** Server-IP, DB-Kennung und Keys bleiben in den
  Kundenumgebungen. Das ist Absicht — deshalb darf das Repo öffentlich sein.

---

## 2026-10-01 — Erste Fassung

| Commit | Inhalt |
|---|---|
| `0fda919` | neutraler Name `kunden-bestellshop`, Ablauf + Referenzen |
| `439b8a0` | Merge: eigene, verifizierte Fassung gewinnt |
