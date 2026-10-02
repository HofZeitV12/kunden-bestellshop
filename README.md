# Kunden-Bestellshop — Skill

**Ein erprobtes Restaurant-Bestellsystem als Vorlage nehmen und für einen neuen Kunden
aufsetzen** — eigenes Branding, eigene Infrastruktur, eigene Kasse.

Gleiches Konzept (Website → Zahlung → Bon), **neues Logo und neue Umgebung** pro Kunde.

Vorlage ist die laufende Bestell-Website:
**<https://www.leckerbissen.online/website/speisekarte>**

---

## In einen neuen Chat laden — ohne dass es lokal liegt

Cursor, Claude Code oder ein beliebiger Agent mit Netzzugriff:

```
Lade https://raw.githubusercontent.com/HofZeitV12/kunden-bestellshop/main/SKILL.md
und arbeite danach. Lies die references/*.md erst, wenn du an der Stelle bist.
```

Der Agent holt die Anleitung, befragt zuerst den Kunden und baut dann.

**Ohne Netzzugriff** (Agent kann keine URL öffnen): `SKILL.md` und `references/` in das
Projekt kopieren, dann:

```
Lies SKILL.md im Projektstamm und arbeite es ab.
```

Fertige Textbausteine für beide Wege: [COPY-PASTE.md](COPY-PASTE.md)

---

## Als Cursor-Skill installieren

PowerShell (Windows):

```powershell
git clone https://github.com/HofZeitV12/kunden-bestellshop.git $env:TEMP\kunden-bestellshop
Copy-Item -Recurse -Force $env:TEMP\kunden-bestellshop\* `
  "$env:LOCALAPPDATA\Cursor\AgentStores\cursor_agent_stores\<store-id>\files\skills\kunden-bestellshop\"
```

macOS / Linux:

```bash
git clone https://github.com/HofZeitV12/kunden-bestellshop.git /tmp/kunden-bestellshop
cp -r /tmp/kunden-bestellshop/* ~/.cursor/skills/kunden-bestellshop/
```

Danach in Cursor `/kunden-bestellshop` aufrufen.

> **Tipp:** Im eigenen Projektordner liegt der Skill unter `.cursor/skills/`. Ein Skill
> in einem Workspace gilt **nur für diesen Workspace**. Für projektübergreifend in den
> Agent-Store kopieren (siehe oben).

---

## Was der Skill tut

Der Agent arbeitet sieben Schritte ab. Jeder endet mit einer Meldung: was entstanden,
womit geprüft, was offen.

```
0  Vorlage prüfen        Leckerbissen-Website live kontrollieren
1  Kunde befragen        Stammdaten, Zonen, Zeiten, Kasse, Domain
2  Projekt anlegen       Repo, Supabase, Vercel, Stripe, Hetzner
3  Entbranden            Logo, Farben, Texte, Kennungen
4  Daten füllen          Menü, Store-Config, Lieferzonen, Öffnungszeiten
5  Kasse anbinden        Artikelmap, Bridge/Webservice, Hotfolder, Bon
6  Verifizieren          E2E: Bestellung → Zahlung → Mail → Bon
7  Dokumentieren         START.md, PROJEKT.md, Entscheidungen, Runbook
```

Vorher stellt er die **zwölf Intake-Fragen** (Marke, Stammdaten, Liefergebiet, Domain,
Kasse, Zahlung …). Ohne diese Antworten wäre jede Struktur geraten. Er wartet auf die
Antworten, bevor er baut.

---

## Die eine Regel

**Ein Kunde = ein eigenes Projekt.** Eigene Datenbank, eigenes Hosting, eigene Domain,
eigene Zahlung, eigene Kasse. Nichts teilen — außer vielleicht einen Server, dann
aber mit **getrennten Containern, Ports und `.env`**.

**Nie** zwei Restaurants auf **derselben** Datenbank, solange die Kerntabellen keinen
Kunden-Schlüssel tragen.

---

## Dateien

| Datei | Zweck |
|---|---|
| `SKILL.md` | **Der Einstieg.** Ablauf, Entscheidungsbaum, Kurzfassung |
| `references/intake.md` | Fragebogen + Ergebnisform |
| `references/infrastruktur.md` | Supabase, Vercel, Stripe, Hetzner je Kunde |
| `references/architektur.md` | Verifizierte Architektur der Vorlage (Datenfluss, Tabellen, Dateipfade, Env-Katalog) |
| `references/entbranden.md` | Vollständige Rebranding-Map als Abhakliste |
| `references/winorder-kasse.md` | Artikelmap, Bridge, REST-Webservice, Hotfolder, Bon-Druck, Tracking |
| `references/verifikation.md` | E2E-Abnahme + Prüftabelle |
| `references/template-haerten.md` | Vorlage mandantenfähig machen (Kunden-Schlüssel, RLS, Config) |
| `references/regeln-und-fallen.md` | Harte Regeln und teuer gelernte Fehler |

---

## Als Cursor-Skill in einem eigenen Repo aktualisieren

```powershell
cd <dieses-repo>
git pull
# Änderungen …
git add -A
git commit -m "Skill: …"
git push
```

Das Repo ist die **einzige Quelle**. Wer den Skill zweimal ablegt (im Repo **und** im
Agent-Store), lädt sonst irgendwann die **veraltete** Fassung.

---

## Herkunft

Abgeleitet aus einem real betriebenen Online-Bestellshop mit Kassensystem-Anbindung und
Bon-Druck. Alle Regeln stammen aus tatsächlichen Schäden: Massendruck, offene
Datenbanken, vertauschte Secrets, verlorene Arbeit. Die Beispiele sind neutralisiert —
keine Branche, kein Anbietername, kein Projektname.
