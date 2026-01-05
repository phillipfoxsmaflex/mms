# Lösung: "Failed to load unmapped assets" - 404 Not Found

## 🔍 Problem-Analyse

Der 404-Fehler tritt **nach dem Code-Fix** weiterhin auf. Dies deutet stark darauf hin, dass:

**→ Die Docker-Container NICHT neu gebaut wurden und noch der alte Code läuft! ⚠️**

## ✅ Implementierte Fixes (3 Commits)

### Commit 1: `33fe245` - NotificationService + Axios Logging
- Fixte `IndexOutOfBoundsException` im NotificationService
- Verbesserte Axios Error Logging (ermöglichte 404-Diagnose!)

### Commit 2: `e3d8416` - Spring Controller Mapping Reihenfolge
- **Hauptfix:** Verschob `getUnmappedAssets()` vor `getById()` 
- Spezifische Routes müssen vor generischen Routes stehen
- Ohne diesen Fix interpretiert Spring `/locations/79/assets/unmapped` als `/{id}` mit id="assets"

### Commit 3: `e5c7e00` - Diagnose-Tools
- Enhanced Frontend Logging mit vollständiger Request-URL
- `TEST_ENDPOINT.md` - Umfassende Test-Anleitung
- `diagnose-endpoint.sh` - Automatisches Diagnose-Script

## 🚀 SOFORT AUSFÜHREN!

```bash
cd /pfad/zu/mms

# 1. KRITISCH: Container neu bauen!
docker compose down
docker compose build --no-cache
docker compose up -d

# 2. Warte bis Backend gestartet ist (ca. 30-60 Sekunden)
docker compose logs -f atlas-cmms-backend | grep "Started Application"

# 3. OPTIONAL: Diagnose-Script ausführen
./diagnose-endpoint.sh 79

# 4. OPTIONAL: Mit JWT Token testen
# Token aus Browser: DevTools → Application → Local Storage → accessToken
./diagnose-endpoint.sh 79 <DEIN_JWT_TOKEN>
```

## 📋 Test-Checkliste

Nach dem Rebuild:

### Backend Test (curl)
```bash
curl -v http://localhost:8080/locations/79/assets/unmapped \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Erwartete Antwort:**
- ✅ `200 OK` mit JSON-Array
- ❌ `404 Not Found` → Container **nicht** neu gebaut!

### Frontend Test (Browser)

1. **Öffne DevTools Console (F12)**
2. **Lade Floor Plan Seite neu**
3. **Suche nach Log:**
   ```
   Fetching unmapped assets from: /locations/79/assets/unmapped
   LocationId: 79
   ```

4. **Bei Erfolg:**
   ```
   Successfully fetched unmapped assets: [...]
   ```

5. **Bei Fehler - prüfe Network Tab:**
   - Request URL sollte sein: `http://localhost:8080/locations/79/assets/unmapped`
   - Status sollte sein: `200 OK` (nicht 404!)

## 🔧 Troubleshooting

### Fehler 404 bleibt

**Ursache:** Container nicht neu gebaut oder Build-Cache verwendet

**Lösung:**
```bash
# Aggressive rebuild
docker compose down -v
docker compose build --no-cache --pull
docker compose up -d
```

### Fehler 401 Unauthorized

**Ursache:** JWT Token fehlt oder abgelaufen

**Lösung:**
1. Neu einloggen
2. Token aus localStorage kopieren
3. Request erneut senden

### Fehler 403 Forbidden

**Ursache:** User hat keine Berechtigung für `ASSETS`

**Lösung:**
1. Prüfe User-Role und Permissions
2. User benötigt `VIEW` Berechtigung für `ASSETS`

### Leere Liste `[]` zurück (kein Fehler)

**Mögliche Ursachen:**
1. ✅ Korrekt: Keine Assets in dieser Location
2. ✅ Korrekt: Alle Assets haben bereits ein floorPlan
3. ❌ Asset nicht mit Location verknüpft
4. ❌ Asset existiert nicht

**Lösung:**
Erstelle ein neues Asset:
- Mit der gewünschten Location verknüpft
- **OHNE** floorPlan (muss `null` sein)
- User muss Zugriff auf das Asset haben

## 📊 Erwartetes End-to-End Verhalten

### 1. Location anlegen
- Name: "Test Location"
- ID: z.B. 79

### 2. Grundriss hochladen
- PNG/JPG Bild
- Wird als FloorPlan gespeichert

### 3. Asset anlegen
- Name: "Test Asset"
- Location: "Test Location" (ID 79)
- FloorPlan: **NICHT ZUWEISEN** (muss null bleiben!)

### 4. Floor Plan Editor öffnen
- Location auswählen
- FloorPlan wird angezeigt

### 5. Edit Toggle aktivieren
- **✅ JETZT sollte das Asset in "Unmapped Assets" Liste erscheinen**
- Keine "Failed to load unmapped assets" Fehlermeldung
- API-Call: `GET /locations/79/assets/unmapped` → `200 OK`

### 6. Asset platzieren
- Asset auf Grundriss ziehen
- Position wird gespeichert
- Asset hat jetzt `floorPlan` zugewiesen
- **Asset verschwindet aus "Unmapped Assets" Liste**

## 🎯 Root Cause Zusammenfassung

**Ursprüngliches Problem:**
Spring Boot Controller hatte falsche Mapping-Reihenfolge:
```java
// FALSCH (alt):
@GetMapping("/{id}")              // Zeile 127
@GetMapping("/{id}/assets/unmapped")  // Zeile 206

// RICHTIG (neu):
@GetMapping("/{id}/assets/unmapped")  // Zeile 127
@GetMapping("/{id}")              // Zeile 155
```

**Warum der Fehler nach dem Fix bleibt:**
Der geänderte Code ist **nur im Git Repository**. Docker Container laufen noch mit dem **alten kompilierten Code**.

**Lösung:**
```bash
docker compose build --no-cache
```

## 📝 Nächste Schritte

1. ✅ **Container neu bauen** (siehe oben)
2. ✅ **Backend testen** mit curl
3. ✅ **Frontend testen** in Browser
4. ✅ **End-to-End Test** durchführen
5. ✅ **Verifizieren** dass alles funktioniert

## 📂 Neue Dateien

- `BUGFIX_FLOOR_PLAN_ASSETS.md` - Technische Dokumentation
- `TEST_ENDPOINT.md` - Test-Anleitung
- `diagnose-endpoint.sh` - Diagnose-Script
- `SOLUTION_SUMMARY.md` - Diese Datei

## 🆘 Falls es immer noch nicht funktioniert

Bitte führe aus und sende mir die Ausgabe:

```bash
# 1. Diagnose-Script
./diagnose-endpoint.sh 79 <JWT_TOKEN>

# 2. Backend Logs
docker compose logs atlas-cmms-backend | tail -100

# 3. Container Status
docker compose ps

# 4. Network Tab Screenshot aus Browser
# (Zeige den Request zu /locations/.../assets/unmapped)

# 5. Console Logs aus Browser
# (Zeige die vollständigen Error Details)
```

---

**Status:** Alle Code-Fixes sind implementiert und gepusht.
**Blockiert durch:** Docker Container Rebuild erforderlich!
