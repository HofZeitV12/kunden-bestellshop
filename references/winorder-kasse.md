# Kasse anbinden — Bestellung auf den Bon

Der Weg, der funktioniert, ist eine **Datei-Schnittstelle** (Hotfolder): die Website
legt je bezahlter Bestellung eine Datei ab, die Kasse beobachtet einen Ordner und
druckt den Bon. Der REST-Weg ist bei manchen Kassen **tot** — der Hotfolder ist der
Betriebsweg.

```
Website → Zahlung → DB (status=offen)
   → Bridge (Poll alle N Sekunden)   holt offene Bestellungen
   → Hotfolder                        schreibt Kassen-JSON je Bestellung
   → Kassen-Software                  parst, ordnet dem Shop zu
   → Bon auf dem Thermodrucker
   → Bridge quittiert                 PATCH status=in_bearbeitung
```

**Reihenfolge im Statusmodell:** `ausstehend → offen → in_bearbeitung → bereit → abgeholt`
(auch `storniert`).

> ⚠️ **`ausstehend` ist NICHT bezahlt.** Der Status wird beim Anlegen gesetzt, **bevor**
> der Kunde zahlt. Würde die Bridge ihn im Live-Betrieb abholen, könnte ein
> abgebrochener Checkout einen Bon für eine unbezahlte Bestellung drucken. Nur der
> Zahlungs-Webhook setzt `offen`.
>
> ⚠️ **`in_bearbeitung` darf NICHT mitverarbeitet werden.** Das ist der Status, den die
> Bridge selbst setzt. Stünde er in der Liste, würde **jede** übernommene Bestellung bei
> **jedem** Lauf erneut gedruckt.

---

## 1. Die Artikel-Zuordnung (der teuerste Fehler)

Die Website schickt `Margherita`, die Kasse kennt `Pizza Margherita`. Ohne Übersetzung
findet die Kasse den Artikel nicht und legt ihn als neuen Artikel an **oder** macht
einen Kommentar daraus — **keine Umsätze, doppelte Stämme.**

**Zwei Dateien, identischer Inhalt — beide ändern:**

| Weg | Datei |
|---|---|
| App/Format (TypeScript) | `lib/…/articles.ts` |
| Bridge (PowerShell/JSON) | `tools/…-articles.json` |

**Grundlage sind echte Bonzeilen DIESER Kasse** — nicht geraten, nicht vom Vorbild
übernommen.

- [ ] Beispielbons des Kunden exportieren und Artikelnamen auslesen
- [ ] Namensregeln ableiten (z. B. „Pizza trägt Präfix `Pizza `, Dips nicht")
- [ ] Map für **alle** Menü-Artikel des Kunden füllen
- [ ] Unbekannte Namen **nicht raten** — unverändert durchreichen; die Kasse meldet sie
- [ ] Artikel-Nummern (schlagen den Namen) mitführen, falls vorhanden
- [ ] Log auf `FEHLT`-Einträge prüfen **nach jeder** Bestellung

> ⚠️ **UTF-8-Encoding.** Die JSON-Map **explizit als UTF-8** lesen. Wird sie als ANSI
> gelesen, wird aus „ö" ein „Ã¶" und **kein** Schlüssel mit Umlaut passt mehr.
> Die Kasse hat dann „Pizzabrötchen" nie gefunden.

---

## 2. Der Hotfolder

```
<WINORDER-BASIS>\EShop\Incoming      ← hier ablegen
<WINORDER-BASIS>\EShop\Processed     ← Kasse verschiebt hierhin (geparst)
```

- [ ] **Exakten Basispfad ermitteln** — die Ordner- und Versionsbezeichnung kann
      abweichen (z. B. eine Versionsnummer im Pfad). Ein falscher Pfad schreibt ins Leere.
- [ ] Erlaubte Datei-Endungen kennen (typisch `.json`, `.xml`, `.zlib`)
- [ ] Lebenszyklus beobachten:

| Beobachtung | Bedeutung |
|---|---|
| Datei bleibt in `Incoming` | Hotfolder wird nicht beobachtet |
| `.json` → `Processed\*.xml` | **geparst** (Kassen-Bestätigung) |
| umgewandelt, aber kein Bon | Bestellung keinem Shop zugeordnet |

---

## 3. Die Bridge bedienen

```powershell
.\<bridge>.ps1 -DryRun                 # abholen + formatieren, KEIN Bon   ← sicher zum Üben
.\<bridge>.ps1 -Once                   # ein Durchlauf in den Hotfolder
.\<bridge>.ps1 -Once -OrderId N        # NUR Bestellung N (sonst: alle offenen!)
.\<bridge>.ps1 -IntervalSeconds 15     # Dauerbetrieb
```

- [ ] Einzelinstanz (Mutex), damit zwei Läufe **keinen** doppelten Bon erzeugen
- [ ] Ack (`PATCH in_bearbeitung`) nach erfolgreicher Übergabe
- [ ] Bei abgewiesenem Ack einer Testbestellung: **nicht abbrechen**, aber auch **nicht**
      endlos wiederholen (sonst druckt jeder Lauf erneut)

---

## 4. 🔴 Zwei Regeln, die nie gebrochen werden dürfen

### Regel 1 — Kein Mengenfilter im echten Hotfolder

Ein Testmodus-Filter ist ein **Mengenfilter**, kein Einzeltest. Er schreibt **jede**
Testbestellung der Datenbank auf einmal in den Hotfolder.

| Aufruf | Wirkung | Bon? |
|---|---|---|
| `-DryRun` | in ein TEMP-Verzeichnis, kein Ack | **nein** |
| `-Once` (Standard) | nur Live-Bestellungen | nur bei echten |
| `-Once -ModeFilter test` | **ALLE Testbestellungen** | **JA — für jede!** |

**Real passiert:** ein Lauf erzeugte **19 Bons** und **zwei Kassen-Abstürze**. Für
Formatprüfungen **immer `-DryRun`**.

### Regel 2 — Kein Schreibvorgang in `Incoming` ohne ausdrückliche Freigabe

Auch ein Test-Skript, das direkt in den Hotfolder schreibt, erzeugt einen Bon. Nur
bewusst und mit Einverständnis.

---

## 5. Die Kasse einrichten (Vorbereitung, der Kunde klickt)

- [ ] Thermodrucker verbunden (Bluetooth!) — Status **„Verbunden"**, nicht nur „gekoppelt"
- [ ] Kasse: Drucker auswählen, Bon-Typ zuweisen, **Testdruck aus der Kasse** (nicht nur
      aus dem Drucker-Tool)
- [ ] Kasse: Online-Shop / EShop-Schnittstelle aktiv
- [ ] **Unbekannte Artikel: „Immer abfragen"** — **nicht** automatisch anlegen
      (Auto-Create schreibt jeden falschen Namen als neuen Artikel → Müll im Stamm)
- [ ] Hotfolder existiert und wird beobachtet
- [ ] Auto-Druck für Shop-Bestellungen aktiv
- [ ] **Zahlungsart anlegen:** Der `PaymentType`-Text aus der Bestellung (z. B.
      „Online bezahlt") muss in der Kasse unter Stammdaten/Zahlungsarten existieren,
      sonst ordnet die Kasse die Zahlung nicht zu.

> ⚠️ **Konfigurationsdateien der Kasse nie mit falschem Encoding** lesen/schreiben
> (oft ISO-8859-1). Und: die Kasse liest beim **Start**, schreibt beim **Beenden** —
> Änderungen bei laufender Kasse werden überschrieben.

---

## 6. Tracking zurück (Kunde und Küche)

Die Kasse meldet Statuscodes zurück; die App bildet sie auf Bestellstatus und
**Kundenmails** ab (bestellt → in Zubereitung → unterwegs → fertig).

- [ ] Statuscode-Tabelle je Kasse dokumentieren (Codes variieren)
- [ ] Mails **nie** an Testbestellungen
- [ ] Eine fehlgeschlagene Mail darf die Kassenmeldung **nicht** scheitern lassen
      (`try/catch` in der Route)
- [ ] **Mail-Marker ≠ Bezahlt-Marker.** Die Bestätigungsmail hängt an einem **eigenen**
      Zeitstempel, den **nur** der Mailserver schreibt — nicht an „bezahlt". Sonst gibt
      es Doppel- oder gar keine Mails.

---

## 7. Diagnose „bezahlt, aber kein Bon"

Der **häufigste** Fall zuerst prüfen:

1. **Testmodus?** Ist die Bestellung als Test markiert, wird sie **absichtlich**
   zurückgehalten. Erst das prüfen, dann alles andere.
2. **Status `offen`?** (bezahlt) — nicht `ausstehend`.
3. **Hotfolder:** liegt die Datei in `Incoming` oder schon in `Processed`?
4. **Kassen-Log** auf den Shopnamen prüfen.
5. **Fehlerdatei** der Kasse.
6. **Druckauftrag** in der Warteschlange.
7. **Artikelmap:** `FEHLT` im Bridge-Log?

```powershell
Get-ChildItem "<WINORDER-BASIS>\EShop\Incoming"
Get-ChildItem "<WINORDER-BASIS>\EShop\Processed" |
  Sort-Object LastWriteTime -Descending | Select-Object -First 3
Get-PrintJob -PrinterName "<drucker>"
```

### Wenn zu viele Bons gedruckt wurden

```powershell
# 1. Druckauftraege SOFORT loeschen
Get-PrintJob -PrinterName "<drucker>" |
  ForEach-Object { Remove-PrintJob -PrinterName "<drucker>" -ID $_.Id }
# 2. Eigene EShop-Dateien entfernen
Get-ChildItem "<WINORDER-BASIS>\EShop\Incoming" -Filter "<praefix>*" | Remove-Item -Force
Get-ChildItem "<WINORDER-BASIS>\EShop\Processed" -Filter "<praefix>*" | Remove-Item -Force
# 3. Laufende Bridge beenden
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
  Where-Object { $_.CommandLine -match '<bridge>\.ps1' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

> **Die Rechnungen in der Kasse werden NICHT gelöscht** — sie bleiben und müssen dort
> **storniert** werden. Das ist ein Buchhaltungsvorgang, kein Skript-Schritt.

---

## 8. Erfolgsdefinition

Eine Online-Bestellung erscheint **ohne manuelles Kopieren** in der Kassen-Software
und löst einen **Bon** aus. Erst dann ist die Kassen-Anbindung fertig.

- [ ] End-to-End mit **echter** (oder bewusst freigegebener) Bestellung bewiesen
- [ ] Beweis festgehalten: Bestellnummer, Zeit, Rechnungsnummer, Druckauftrag
- [ ] Artikelmap-Log ohne `FEHLT`
