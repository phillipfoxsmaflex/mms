# Test-Anleitung: Endpoint Diagnose

## ⚠️ WICHTIGSTER SCHRITT: Docker Container neu bauen!

```bash
# ZUERST DIES AUSFÜHREN!
cd /pfad/zu/mms
docker compose down
docker compose build --no-cache
docker compose up -d

# Warten bis Container gestartet sind
docker compose logs -f atlas-cmms-backend | head -50
```

**WARUM?** Ohne Rebuild läuft noch der **alte Code** ohne die Fix!

---

## Test 1: Backend Endpoint direkt testen

Nach dem Rebuild, teste den Endpoint direkt:

```bash
# Ersetze <ACCESS_TOKEN> mit deinem JWT Token aus localStorage
# Ersetze <LOCATION_ID> mit einer existierenden Location ID (z.B. 79)

curl -X GET "http://localhost:8080/locations/<LOCATION_ID>/assets/unmapped" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -v
```

### Erwartete Antworten:

**✅ Erfolg (200 OK):**
```json
[
  {
    "id": 88,
    "name": "Asset Name",
    ...
  }
]
```
Oder eine leere Liste `[]` wenn keine unmapped Assets vorhanden sind.

**❌ Fehler (404 Not Found):**
```
< HTTP/1.1 404 
```
→ Container wurde **nicht** neu gebaut oder alter Code läuft noch!

**❌ Fehler (401 Unauthorized):**
```
< HTTP/1.1 401
```
→ Token fehlt oder ist ungültig

**❌ Fehler (403 Forbidden):**
```json
{"message": "Access denied"}
```
→ User hat keine Berechtigung für ASSETS

---

## Test 2: Frontend Logging prüfen

Öffne die Browser Console (F12) und schaue nach:

### Neue Log-Messages (nach Frontend-Rebuild):
```
Fetching unmapped assets from: /locations/79/assets/unmapped
LocationId: 79
```

### Bei Fehler:
```
Error details: {
  status: 404,
  fullUrl: "http://localhost:8080/locations/79/assets/unmapped",
  baseURL: "http://localhost:8080/"
}
```

**WICHTIG:** Die `fullUrl` muss **genau** sein:
- ✅ `http://localhost:8080/locations/79/assets/unmapped`
- ❌ NICHT: `http://localhost:8080//locations/79/assets/unmapped` (doppelter Slash)
- ❌ NICHT: `http://localhost:8080/api/locations/79/assets/unmapped` (falscher Pfad)

---

## Test 3: Network Tab prüfen

1. Öffne Browser DevTools (F12)
2. Gehe zum **Network** Tab
3. Lade die Floor Plan Seite neu
4. Suche nach Request: `unmapped`
5. Klicke auf den Request

### Was zu prüfen ist:

**Request URL:**
```
http://localhost:8080/locations/79/assets/unmapped
```

**Request Method:**
```
GET
```

**Request Headers:**
```
Authorization: Bearer eyJhbGc...
```

**Response Status:**
- ✅ `200 OK` = Funktioniert!
- ❌ `404 Not Found` = Container nicht neu gebaut
- ❌ `401 Unauthorized` = Token fehlt
- ❌ `403 Forbidden` = Keine Berechtigung

---

## Test 4: Backend Logs prüfen

```bash
# Live-Logs anschauen
docker compose logs -f atlas-cmms-backend

# Nach spezifischen Fehlern suchen
docker compose logs atlas-cmms-backend | grep -i "error\|exception\|404"
```

### Was zu erwarten ist:

**Bei 404-Fehler (alter Code):**
```
No message available
```
Oder gar kein Log-Eintrag für den Request.

**Bei 200-Erfolg (neuer Code):**
```
INFO ... LocationController : GET /locations/79/assets/unmapped
```

---

## Test 5: Verifiziere dass der Fix im Container ist

```bash
# Prüfe, ob die Änderung im Container vorhanden ist
docker compose exec atlas-cmms-backend cat /app/com/grash/controller/LocationController.class

# Oder prüfe die Zeilen im Source (wenn gemountet)
docker compose exec atlas-cmms-backend sh -c "find /app -name LocationController.java" 2>/dev/null || echo "Source nicht verfügbar (normal in Production Build)"
```

---

## Checkliste zur Fehlersuche

- [ ] Docker Container mit `docker compose build --no-cache` neu gebaut?
- [ ] Container laufen? `docker compose ps` zeigt "Up"?
- [ ] Backend-Logs zeigen keine Fehler beim Start?
- [ ] User ist eingeloggt? JWT Token in localStorage vorhanden?
- [ ] Location ID existiert? Asset ID existiert?
- [ ] Asset ist mit der Location verknüpft?
- [ ] Asset hat **KEIN** floorPlan zugewiesen? (muss null sein für "unmapped")

---

## Häufige Fehlerquellen

### 1. Container nicht neu gebaut
**Symptom:** 404 Fehler bleibt
**Lösung:** `docker compose down && docker compose build --no-cache && docker compose up -d`

### 2. Frontend nicht neu gebaut
**Symptom:** Keine neuen Log-Messages in Console
**Lösung:** 
```bash
cd frontend
npm run build
# Oder wenn Vite Dev Server läuft, neu starten
```

### 3. JWT Token abgelaufen
**Symptom:** 401 Unauthorized
**Lösung:** Neu einloggen

### 4. Asset hat bereits ein floorPlan
**Symptom:** Leere Liste zurück, aber kein Fehler
**Lösung:** Asset muss `floorPlan = null` haben

### 5. Falsche Location ID
**Symptom:** Leere Liste oder 404
**Lösung:** Prüfe dass Location existiert und ID korrekt ist

---

## Erwartete vollständige URL

Wenn alles korrekt ist:
```
Request URL: http://localhost:8080/locations/79/assets/unmapped
Method: GET
Status: 200 OK
Response: [{"id": 88, "name": "...", ...}]
```

## Nächste Schritte nach erfolgreichem Test

1. ✅ Endpoint funktioniert → Assets sollten im Floor Plan Editor erscheinen
2. ✅ Edit Toggle aktivieren → Unmapped Assets Liste wird angezeigt
3. ✅ Asset auf Grundriss platzieren → Position wird gespeichert
4. ✅ Asset verschwindet aus "Unmapped" Liste nach Speichern

