# Vollständige Lösung - Registrierungsproblem

## Problem-Analyse

Der Fehler tritt auf, weil:

1. **Backend**: Benutzer wird registriert mit `userRepository.save(user)`
2. **Backend**: JWT-Token wird sofort zurückgegeben
3. **Frontend**: Erhält Token und ruft `loginInternal(token)` auf
4. **Frontend**: `loginInternal` ruft `/auth/me` API auf (in Zeile 579)
5. **Backend**: JWT-Filter versucht Benutzer zu laden mit `customUserDetailsService.loadUserByUsername()`
6. **FEHLER**: Benutzer ist noch nicht in der Datenbank sichtbar (Transaction nicht committed)
7. **Ergebnis**: "User 'test@test.de' not found"

## Die Lösung wurde bereits implementiert

Die Code-Änderungen in `UserService.java` (Zeilen 113 und 251) von `save()` zu `saveAndFlush()` sind die korrekte Lösung.

## WICHTIG: Sie müssen den Backend-Container NEU BAUEN!

Der Container läuft noch mit der alten Java-Version!

### Schritt-für-Schritt Anleitung

```bash
# 1. Navigieren Sie zum Projekt-Verzeichnis
cd /pfad/zu/mms

# 2. Container vollständig stoppen und entfernen
docker-compose down

# 3. Prüfen Sie, dass keine alten Container laufen
docker ps -a | grep atlas

# Wenn noch Container existieren, löschen Sie diese:
docker rm -f atlas-cmms-backend atlas-cmms-frontend atlas_db atlas_minio

# 4. Docker-Cache leeren (optional aber empfohlen)
docker system prune -f

# 5. Backend NEU BAUEN (WICHTIG!)
docker-compose build --no-cache api

# 6. Alle Container starten
docker-compose up -d

# 7. Logs in Echtzeit verfolgen
docker-compose logs -f api
```

### Warten Sie auf erfolgreichen Backend-Start

Sie sollten folgende Zeilen sehen:
```
INFO --- [main] com.zaxxer.hikari.HikariDataSource : HikariPool-1 - Starting...
INFO --- [main] com.zaxxer.hikari.HikariDataSource : HikariPool-1 - Start completed.
INFO --- [main] liquibase.lockservice : Successfully acquired change log lock
INFO --- [main] com.grash.GrashApplication : Started GrashApplication in X.XXX seconds
```

### Überprüfen Sie, dass die Änderungen im Container sind

```bash
# Zeige die UserService.java Datei im Container
docker exec atlas-cmms-backend cat /app/BOOT-INF/classes/com/grash/service/UserService.class | strings | grep -A 2 -B 2 "Flush"
```

Wenn Sie "saveAndFlush" oder "Flush" sehen, ist die neue Version aktiv!

## Testen der Registrierung

### Test 1: Browser-Cache leeren

**WICHTIG**: Leeren Sie Ihren Browser-Cache komplett!

**Firefox**:
- Öffnen Sie Einstellungen > Datenschutz & Sicherheit
- Cookies und Website-Daten > Daten löschen
- Oder drücken Sie: Cmd+Shift+Delete (Mac) / Ctrl+Shift+Delete (Windows)

**Chrome**:
- Öffnen Sie Einstellungen > Datenschutz und Sicherheit
- Browserdaten löschen
- Oder drücken Sie: Cmd+Shift+Delete (Mac) / Ctrl+Shift+Delete (Windows)

### Test 2: Alte Benutzer aus Datenbank löschen

```bash
# Löschen Sie den test@test.de Benutzer aus der Datenbank
docker exec atlas_db psql -U rootUser -d atlas -c "DELETE FROM own_user WHERE email = 'test@test.de';"

# Prüfen Sie alle Benutzer
docker exec atlas_db psql -U rootUser -d atlas -c "SELECT id, email, enabled, created_at FROM own_user;"
```

### Test 3: Registrierung durchführen

1. Öffnen Sie **neues Inkognito/Privat-Fenster**: http://localhost:12000
2. Klicken Sie auf "Registrieren"
3. Füllen Sie das Formular aus mit **NEUER E-MAIL** (z.B. neueremail@test.com):
   - Email: neueremail@test.com
   - Passwort: Test123!
   - Vorname: Neuer
   - Nachname: User
   - Firma: Test Company
   - Land: Deutschland
   - Telefon: 1234567890
   - Mitarbeiter: 5
   - ✅ AGB akzeptieren
4. Klicken Sie auf "Konto erstellen"

**Erwartetes Ergebnis:**
✅ Keine Fehler
✅ Sie werden automatisch eingeloggt
✅ Sie sehen das Dashboard

## Debug: Wenn der Fehler weiterhin auftritt

### 1. Prüfen Sie die Backend-Logs während der Registrierung

Öffnen Sie ein Terminal und führen Sie aus:
```bash
docker-compose logs -f api
```

Versuchen Sie dann die Registrierung. Sie sollten sehen:
```
INFO --- [nio-8080-exec-X] c.g.controller.UserController : POST /auth/signup
INFO --- [nio-8080-exec-X] c.g.service.UserService : Saving user with email: neueremail@test.com
```

**KEIN "User not found" Fehler mehr!**

### 2. Prüfen Sie die Browser-Konsole

Öffnen Sie die Browser-Entwicklertools (F12) und gehen Sie zum **Console**-Tab.

Sie sollten diese Debug-Ausgaben sehen:
```
[REGISTER DEBUG] Making signup request with values: {email: "neueremail@test.com", ...}
[REGISTER DEBUG] Received response: {success: true, token: "...", requiresEmailVerification: false}
[REGISTER DEBUG] Calling loginInternal with token
[REGISTER DEBUG] loginInternal completed successfully
```

### 3. Prüfen Sie die Network-Anfragen

In den Browser-Entwicklertools (F12) > **Network**-Tab:

**POST http://localhost:12001/auth/signup**
- Status: 200 OK
- Response: `{"success":true,"token":"...","requiresEmailVerification":false}`

**GET http://localhost:12001/auth/me**
- Status: 200 OK (NICHT 401 oder 500!)
- Response: `{"id":1,"email":"neueremail@test.com",...}`

## Warum "test@test.de" immer noch im Log erscheint

Mögliche Gründe:

### Grund 1: Browser cached die Anfrage
- **Lösung**: Browser-Cache komplett leeren + Inkognito-Fenster verwenden

### Grund 2: Benutzer existiert bereits in der Datenbank
```bash
docker exec atlas_db psql -U rootUser -d atlas -c "SELECT email, enabled FROM own_user WHERE email = 'test@test.de';"
```

Wenn der Benutzer existiert, wird die Registrierung fehlschlagen mit "User already exists".

- **Lösung**: Verwenden Sie eine NEUE E-Mail-Adresse oder löschen Sie den Benutzer

### Grund 3: Frontend cached die alte Registrierung im LocalStorage
```javascript
// Öffnen Sie die Browser-Konsole und führen Sie aus:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Grund 4: Der alte JWT-Token ist noch im LocalStorage
```javascript
// In der Browser-Konsole:
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
location.reload();
```

## Test-Befehl: Registrierung via CURL

Um zu testen, ob das Backend korrekt funktioniert (ohne Frontend):

```bash
curl -X POST http://localhost:12001/auth/signup \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "curltest@test.com",
    "password": "Test123!",
    "firstName": "Curl",
    "lastName": "Test",
    "companyName": "Test Company",
    "language": "DE",
    "phone": "+491234567890",
    "employeesCount": 5
  }' \
  -v
```

**Erwartete Antwort:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "requiresEmailVerification": false
}
```

**KEIN** Fehler wie:
- "User not found"
- "JSON.parse: unexpected end of data"

## Checkliste für erfolgreiche Registrierung

- [ ] Backend mit `docker-compose build --no-cache api` neu gebaut
- [ ] Alle Container mit `docker-compose down` gestoppt
- [ ] Container mit `docker-compose up -d` gestartet
- [ ] Backend-Logs zeigen erfolgreichen Start (HikariPool, Liquibase, "Started GrashApplication")
- [ ] Browser-Cache komplett geleert
- [ ] Inkognito/Privat-Fenster verwendet
- [ ] NEUE E-Mail-Adresse verwendet (NICHT test@test.de)
- [ ] LocalStorage geleert (`localStorage.clear()` in Browser-Konsole)
- [ ] Alte JWT-Tokens entfernt

## Nach erfolgreicher Registrierung

Sie sollten jetzt:
- ✅ Erfolgreich registriert sein
- ✅ Automatisch eingeloggt sein
- ✅ Das Dashboard sehen
- ✅ Keine "JSON.parse" Fehler mehr sehen
- ✅ Keine "User not found" Fehler mehr sehen

## Support & Weitere Hilfe

Wenn der Fehler **nach allen Schritten** immer noch auftritt:

1. Schicken Sie die vollständigen Backend-Logs:
   ```bash
   docker-compose logs api > backend-logs.txt
   ```

2. Schicken Sie die Browser-Konsolen-Ausgabe (F12 > Console)

3. Schicken Sie die Network-Anfragen (F12 > Network > POST signup & GET /auth/me)

4. Führen Sie das Debug-Script aus:
   ```bash
   chmod +x DEBUG_REGISTRATION.sh
   ./DEBUG_REGISTRATION.sh > debug-output.txt
   ```
