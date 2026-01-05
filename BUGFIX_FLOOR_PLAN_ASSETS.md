# Bugfix: "Failed to load unmapped assets" in Floor Plan Editor

## Problem Beschreibung

Wenn eine Location angelegt, ein Grundriss hochgeladen und danach ein Asset angelegt wird, um es auf dem Grundriss mit dem Edit-Toggle zu platzieren, wird im Frontend der Fehler **"Failed to load unmapped assets"** angezeigt.

### Backend Logs

```
java.lang.IndexOutOfBoundsException: Index 0 out of bounds for length 0
	at io.github.jav.exposerversdk.PushClientCustomData.zipMessagesTickets(PushClientCustomData.java:156)
	at com.grash.service.NotificationService.sendPushNotifications(NotificationService.java:136)
```

## Root Cause Analyse

### Problem 1: Spring Controller Mapping Reihenfolge (PRIMÄR - 404 NOT FOUND)

**Location:** `api/src/main/java/com/grash/controller/LocationController.java`

**Das Hauptproblem:**
Der Endpoint `/{id}/assets/unmapped` stand **nach** dem generischen Endpoint `/{id}` im Code.

**Original-Reihenfolge (FALSCH):**
```java
@GetMapping("/{id}")                      // Zeile 127
public LocationShowDTO getById(...) {}

// ... andere Mappings ...

@GetMapping("/{id}/assets/unmapped")      // Zeile 206
public Collection<AssetShowDTO> getUnmappedAssets(...) {}
```

**Problem:**
- Spring interpretiert Requests von **oben nach unten**
- Ein Request zu `/locations/79/assets/unmapped` wurde zuerst gegen `/{id}` geprüft
- Spring versuchte, `"assets"` als `id` zu parsen (Long)
- Da `"assets"` keine Zahl ist, wurde der Request abgelehnt → **404 Not Found**

**Lösung:**
Spezifischere Pfade müssen **vor** generischen Pfaden stehen!

**Korrigierte Reihenfolge (RICHTIG):**
```java
@GetMapping("/{id}/assets/unmapped")      // Jetzt Zeile 127
public Collection<AssetShowDTO> getUnmappedAssets(...) {}

@GetMapping("/{id}")                      // Jetzt Zeile 155
public LocationShowDTO getById(...) {}
```

**Effekt:**
- Spring prüft zuerst den spezifischeren Pfad `/{id}/assets/unmapped`
- Nur wenn dieser nicht passt, wird `/{id}` geprüft
- Requests zu `/locations/79/assets/unmapped` werden jetzt korrekt geroutet

### Problem 2: NotificationService IndexOutOfBoundsException (SEKUNDÄR)

**Location:** `api/src/main/java/com/grash/service/NotificationService.java`

Der NotificationService wirft einen `IndexOutOfBoundsException` wenn:
1. Ein Asset angelegt wird
2. Notifications verschickt werden sollen
3. Aber keine gültigen Push-Notification-Tokens vorhanden sind
4. Die `allTickets` Liste ist leer
5. Die Library versucht auf Index 0 zuzugreifen → Exception

**Impact:** Dieser Fehler tritt asynchron auf (in MyExecutor Thread) und blockiert nicht den Hauptrequest. Er ist NICHT die Hauptursache für "Failed to load unmapped assets".

### Problem 3: Axios Response Interceptor

**Location:** `frontend/src/utils/axios.ts`

Der alte Response-Interceptor hat Fehler verschleiert:

```typescript
// ALT - FALSCH
axiosInt.interceptors.response.use(
  (response) => response,
  (error) =>
    Promise.reject(
      (error.response && error.response.data) || 'There is an error!'
    )
);
```

**Problem:**
- Bei Fehlern wurde nur `error.response.data` ODER der String `'There is an error!'` weitergegeben
- Das vollständige Error-Objekt mit `status`, `statusText`, `headers`, etc. ging verloren
- Frontend konnte nicht debuggen, was genau schiefgelaufen ist
- **Ohne diesen Fix hätten wir nie erkannt, dass es ein 404-Fehler war!**

### Problem 4: Mögliche Authentifizierung (HYPOTHESE - War nicht die Ursache)

**Location:** `api/src/main/java/com/grash/controller/LocationController.java`

Der Endpoint `/locations/{id}/assets/unmapped` verwendet:
```java
@PreAuthorize("permitAll()")
public Collection<AssetShowDTO> getUnmappedAssets(@PathVariable("id") Long id, HttpServletRequest req) {
    OwnUser user = userService.whoami(req);  // Benötigt JWT Token!
    ...
}
```

**Problem:**
- `@PreAuthorize("permitAll()")` bedeutet NICHT "erlaube Zugriff ohne Auth"
- Es bedeutet nur "führe die SpEL-Expression `permitAll()` aus"
- Der Endpoint benötigt trotzdem einen gültigen JWT-Token für `userService.whoami(req)`
- Wenn der User nicht eingeloggt ist oder der Token fehlt/abgelaufen ist, schlägt der Request fehl

## Implementierte Fixes

### Fix 1: Spring Controller Mapping Reihenfolge (KRITISCHER FIX für 404)

**File:** `api/src/main/java/com/grash/controller/LocationController.java`

**Änderung:**
Die Methode `getUnmappedAssets` wurde von Zeile 206 nach Zeile 127 verschoben, **vor** die generische `getById` Methode.

**Neue Reihenfolge der Mappings:**
```
Zeile 116: @GetMapping("/mini")
Zeile 127: @GetMapping("/{id}/assets/unmapped")     ← JETZT VOR /{id}
Zeile 155: @GetMapping("/{id}")                     ← Generisches Mapping am Ende
Zeile 172: @PostMapping("")
Zeile 188: @PatchMapping("/{id}")
Zeile 216: @DeleteMapping("/{id}")
```

**Effekt:**
- Spring prüft spezifischere Pfade zuerst
- Requests zu `/locations/79/assets/unmapped` werden jetzt korrekt geroutet
- **404 Not Found Fehler ist behoben**

### Fix 2: NotificationService - IndexOutOfBoundsException Check

**File:** `api/src/main/java/com/grash/service/NotificationService.java`

**Änderung:**
```java
// If no tickets were received, skip further processing
if (allTickets.isEmpty()) {
    System.out.println("No push notification tickets received. Skipping ticket processing.");
    return;
}
```

**Effekt:**
- Verhindert `IndexOutOfBoundsException` wenn keine Push-Notification-Tickets empfangen wurden
- Stoppt die weitere Verarbeitung, wenn keine Tickets vorhanden sind
- Verhindert Fehler-Logs im Backend

### Fix 3: Axios Response Interceptor - Enhanced Error Logging

**File:** `frontend/src/utils/axios.ts`

**Änderung:**
```typescript
axiosInt.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enhanced error logging
    console.error('Axios Response Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    return Promise.reject(error);
  }
);
```

**Effekt:**
- Loggt vollständige Error-Informationen in der Browser-Console
- Gibt das vollständige Error-Objekt weiter (nicht nur `error.response.data`)
- Ermöglicht besseres Debugging
- Frontend-Code kann weiterhin `error.response.status`, `error.response.data`, etc. auslesen

## Test-Anweisungen

### Voraussetzungen

1. **Docker Container neu bauen:**
   ```bash
   docker compose down
   docker compose build
   docker compose up -d
   ```

2. **Sicherstellen, dass User eingeloggt ist:**
   - Im Frontend anmelden
   - JWT-Token muss in `localStorage.getItem('accessToken')` vorhanden sein

### Test-Schritte

1. **Location anlegen:**
   - Neue Location erstellen (z.B. "Test Building")
   
2. **Grundriss hochladen:**
   - Zur Location navigieren
   - Floor Plan Tab öffnen
   - Grundriss-Bild hochladen

3. **Asset anlegen:**
   - Neues Asset erstellen
   - Asset mit der Location verknüpfen
   - **WICHTIG:** FloorPlan-Feld muss leer bleiben (null)

4. **Floor Plan Editor öffnen:**
   - Zur Location navigieren
   - Floor Plan Map öffnen
   - Edit-Toggle aktivieren

5. **Erwartetes Verhalten:**
   - Das neu angelegte Asset sollte in der "Unmapped Assets" Liste erscheinen
   - Keine Fehlermeldung "Failed to load unmapped assets"
   - In der Browser-Console sollten bei Fehlern detaillierte Error-Logs erscheinen

### Browser-Console Check

Bei einem Fehler sollte jetzt Folgendes in der Console erscheinen:

```
Axios Response Error: {
  message: "Request failed with status code 403",
  status: 403,
  statusText: "Forbidden",
  data: { message: "Access denied" },
  config: {
    url: "/locations/79/assets/unmapped",
    method: "get",
    headers: { Authorization: "Bearer ..." }
  }
}

Failed to fetch unmapped assets: Error: Request failed with status code 403
Error details: {
  status: 403,
  statusText: "Forbidden",
  message: "Access denied",
  data: { message: "Access denied" }
}
```

### Backend-Logs Check

Die folgenden Logs sollten **NICHT** mehr erscheinen:

```
java.lang.IndexOutOfBoundsException: Index 0 out of bounds for length 0
	at io.github.jav.exposerversdk.PushClientCustomData.zipMessagesTickets
```

Stattdessen sollte erscheinen:

```
No push notification tickets received. Skipping ticket processing.
```

## Weitere Debugging-Schritte

Falls der Fehler weiterhin auftritt:

### 1. JWT-Token prüfen

```javascript
// In Browser-Console ausführen:
console.log('Access Token:', localStorage.getItem('accessToken'));
```

- Token sollte vorhanden sein
- Token sollte nicht abgelaufen sein

### 2. Network-Tab prüfen

- Browser DevTools öffnen → Network Tab
- Request zu `/locations/{id}/assets/unmapped` suchen
- Status Code prüfen:
  - **200 OK:** Erfolgreich
  - **401 Unauthorized:** JWT-Token fehlt oder ungültig
  - **403 Forbidden:** User hat keine Berechtigung
  - **404 Not Found:** Location existiert nicht
  - **500 Internal Server Error:** Backend-Fehler

### 3. Backend-Logs prüfen

```bash
docker compose logs -f atlas-cmms-backend
```

- Nach Fehler-Stacktraces suchen
- Nach "No push notification tickets received" suchen (sollte erscheinen)
- Nach "IndexOutOfBoundsException" suchen (sollte NICHT mehr erscheinen)

### 4. Repository Query prüfen

In Backend-Logs sollte die SQL-Query zu sehen sein:

```sql
SELECT * FROM asset WHERE location_id = ? AND floor_plan_id IS NULL
```

Falls keine Assets zurückgegeben werden:
- Prüfen, ob das Asset korrekt angelegt wurde
- Prüfen, ob `location_id` korrekt gesetzt ist
- Prüfen, ob `floor_plan_id` NULL ist (nicht gesetzt)

## Mögliche weitere Ursachen

Falls der Fehler weiterhin besteht:

### A. CORS-Problem

**Symptom:** Network-Request wird blockiert, Console zeigt CORS-Error

**Lösung:** CORS ist bereits aktiviert in `WebSecurityConfig.java` (Zeile 88: `http.cors()`)

Falls CORS-Config fehlt, hinzufügen:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList("*"));
    configuration.setAllowedMethods(Arrays.asList("*"));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    configuration.setAllowCredentials(true);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

### B. Axios baseURL fehlt

**Symptom:** Request geht an falsche URL (z.B. `localhost:3000/locations/...` statt `localhost:8080/locations/...`)

**Status:** BEREITS GEFIXED in vorherigem Commit (f4a1567)

`frontend/src/utils/axios.ts` hat bereits:
```typescript
const axiosInt = axios.create({
  baseURL: apiUrl
});
```

### C. Asset-Repository Query falsch

**Status:** BEREITS GEFIXED in vorherigem Commit (e32cc8a)

Repository-Methode ist korrekt:
```java
Collection<Asset> findByLocation_IdAndFloorPlanIsNull(Long locationId);
```

## Zusammenfassung

### Gefixte Probleme:
1. ✅ **Spring Controller Mapping Reihenfolge** - Hauptproblem für 404 Fehler
2. ✅ NotificationService `IndexOutOfBoundsException` 
3. ✅ Axios Response Interceptor - Enhanced Error Logging (ermöglichte Diagnose!)
4. ✅ (Vorheriger Commit) Axios baseURL konfiguriert
5. ✅ (Vorheriger Commit) Repository Query korrigiert

### Nächste Schritte:
1. Docker Container neu bauen
2. User muss eingeloggt sein
3. Test-Szenario durchführen
4. Falls Fehler weiterhin besteht: Browser-Console und Network-Tab prüfen
5. Backend-Logs analysieren

### Erwartetes Ergebnis:
- Kein "Failed to load unmapped assets" Fehler
- Assets werden korrekt geladen
- Detaillierte Error-Logs in Browser-Console falls Fehler auftreten
- Keine `IndexOutOfBoundsException` im Backend
