# Intake — den neuen Kunden befragen

**Erst fragen, dann bauen.** Frage nichts, was in den Dateien der Vorlage schon steht —
lies die Vorlage, dann frage nur die Lücken.

Diese zwölf Antworten sind die Grundlage jeder Struktur. Ohne sie ist alles geraten.

---

## Die zwölf Fragen

| # | Frage | Wofür |
    10||---|---|
| 1 | Wie heißt das Restaurant, in einem Satz — was ist es? | `README.md`, Projektbild, Stammdaten |
| 2 | Was ist **ausdrücklich nicht** im Umfang? (nur Lieferung? nur Abholung? Tisch?) | verhindert Wildwuchs |
| 3 | Sprache der Oberfläche und der Dokumentation? | Texte, Bezeichner, Volltextsuche |
| 4 | Welche **Marke**? (Logo-Datei, Primärfarbe(n), Slogan, Schrift) | Theme, Header, Hero, Mail |
| 5 | **Stammdaten**: Adresse, Telefon, E-Mail, Öffnungszeiten, Zubereitungszeit | `store_config`, Rechtstexte |
| 6 | **Liefergebiet**: welche PLZ, welcher Mindestbestellwert, welche Liefergebühr | Lieferzonen-Modul |
| 7 | **Domain**: welche, wer besitzt sie, wo liegt DNS? | Vercel-Domain, `SITE_URL` |
| 8 | **Kasse**: welches Kassensystem, wie heißt sein Artikelstamm, physischer Rechner? | WinOrder-Anbindung |
| 9 | **Zahlung**: eigenes Stripe-Konto oder geteilt? Test- oder Live-Start? | Stripe-Keys, Webhooks |
| 10 | **Datenbank**: neue Instanz anlegen? (Standard: ja, eigene) | Projektkennung überall |
| 11 | **E-Mail**: Absenderadresse, wer bekommt Bestätigungen/Alarme? | Webhook-Server, Resend |
    30|| 12 | Woran merkt man, dass es **fertig** ist? (Abnahme in einem Satz) | Abnahmekriterien |

**Pflichtfragen, die Struktur erzwingen:** 5, 6, 10, 12.
Nicht beantwortbare Punkte als **offene Frage mit Datum** festhalten — **nicht raten,
nicht blockieren**.

---

## Ergebnisform (schriftlich festhalten)

Vor Schritt 2 in dieser Form notieren — Zielort später `docs/PROJEKT.md`:

```markdown
## Kunde: <Name>

**Ein Satz:** …
    40|
**Im Umfang:** Lieferung / Abholung / Tisch — welche?
**Nicht im Umfang:** …

**Marke**
- Name: …
- Logo: <Pfad zur Datei>
- Primärfarbe(n): #… / #…
- Slogan: …

**Stammdaten**
- Adresse: …
    50|- Telefon / E-Mail: …
- Öffnungszeiten: <Freitext, z. B. „Täglich 17:00 – 22:00">
- Zubereitungszeit: <Minuten>

**Liefergebiet** (eine Zeile je Zone)
| Zone | PLZ | Mindestbestellwert | Gebühr |
|---|---|---|---|
| … | … | … € | … € |

**Domain:** … (DNS bei …)
**Kasse:** … (Artikelstamm: …, Rechner: …)
    60|**Zahlung:** eigenes Stripe-Konto: ja/nein · Start: test/live
**Datenbank:** eigene Instanz: ja
**E-Mail:** Absender …, Bestätigung an … , Alarm an …
**Fertig, wenn:** …

**Offene Fragen** (mit Datum)
| # | Frage | blockiert? |
|---|---|---|
| … | … | nein |
```

---

    70|## Vor der ersten Zeile Code

- [ ] Vorlage-Repo gelesen (Struktur, Skripte, Treffer für Markennamen)
- [ ] Die zwölf Fragen beantwortet oder als offen dokumentiert
- [ ] Ergebnisform ausgefüllt
- [ ] Erst danach: `references/infrastruktur.md`
