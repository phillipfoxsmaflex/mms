# Schnellanleitung - Registrierungsfehler beheben

## TL;DR - Schnelle Lösung

```bash
cd /pfad/zu/mms

# 1. Container stoppen
docker-compose down

# 2. Backend NEU BAUEN (WICHTIG!)
docker-compose build --no-cache api

# 3. Alle starten
docker-compose up -d

# 4. Warten bis Backend gestartet ist (ca. 30-60 Sekunden)
docker-compose logs -f api
# Warten auf: "Started GrashApplication in X.XXX seconds"
# Dann Ctrl+C drücken

# 5. Verify-Script ausführen
./verify-fix.sh
```

## Browser vorbereiten

**WICHTIG**: Bevor Sie die Registrierung testen:

1. **Browser-Cache leeren**
   - Firefox/Chrome: Drücken Sie `Cmd+Shift+Delete` (Mac) oder `Ctrl+Shift+Delete` (Windows)
   - Wählen Sie "Gesamte Zeit" / "All time"
   - Aktivieren Sie: Cookies, Cache, Webspeicher
   - Klicken Sie auf "Löschen" / "Clear"

2. **ODER: Inkognito-Fenster verwenden**
   - Firefox: `Cmd+Shift+P` (Mac) / `Ctrl+Shift+P` (Windows)
   - Chrome: `Cmd+Shift+N` (Mac) / `Ctrl+Shift+N` (Windows)

3. **Alte Test-Benutzer löschen**
   ```bash
   docker exec atlas_db psql -U rootUser -d atlas -c "DELETE FROM own_user WHERE email = 'test@test.de';"
   ```

## Registrierung testen

1. Öffnen Sie: http://localhost:12000
2. Klicken Sie auf "Registrieren"
3. Verwenden Sie eine **NEUE E-Mail-Adresse** (z.B. `neuertest@example.com`)
4. Füllen Sie alle Felder aus
5. Akzeptieren Sie die AGB
6. Klicken Sie auf "Konto erstellen"

**Erwartetes Ergebnis:**
- ✅ Keine Fehler
- ✅ Sie werden automatisch eingeloggt
- ✅ Sie sehen das Dashboard

## Problembehandlung

### Fehler tritt weiterhin auf?

```bash
# 1. Prüfen Sie die Logs
docker-compose logs --tail=50 api

# 2. Führen Sie das Verify-Script aus
./verify-fix.sh

# 3. Bei "Backend muss neu gebaut werden":
docker-compose down
docker-compose build --no-cache api
docker-compose up -d
```

### "test@test.de" erscheint immer noch im Log?

Das ist wahrscheinlich eine **gecachte Anfrage** im Browser!

```javascript
// Öffnen Sie die Browser-Konsole (F12) und führen Sie aus:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### API nicht erreichbar?

```bash
# Prüfen Sie ob alle Container laufen
docker-compose ps

# Sollte zeigen:
# atlas-cmms-backend    Up
# atlas-cmms-frontend   Up
# atlas_db              Up
# atlas_minio           Up
```

## Was wurde geändert?

**2 Dateien wurden korrigiert:**

1. **docker-compose.yml** (Zeile 25)
   - Vorher: `DB_URL: postgres/atlas`
   - Nachher: `DB_URL: postgres:5432/atlas`

2. **api/src/main/java/com/grash/service/UserService.java** (Zeilen 113 & 251)
   - Vorher: `userRepository.save(user)`
   - Nachher: `userRepository.saveAndFlush(user)`

Der `saveAndFlush()` Fix stellt sicher, dass der Benutzer sofort in die Datenbank geschrieben wird, bevor das JWT-Token zurückgegeben wird.

## Erfolg prüfen

Nach erfolgreicher Registrierung:
- Keine "JSON.parse" Fehler im Browser
- Keine "User not found" Fehler im Backend-Log
- Sie sehen das Dashboard

## Bei weiteren Problemen

Führen Sie das Debug-Script aus und schicken Sie die Ausgabe:

```bash
./DEBUG_REGISTRATION.sh > debug-output.txt
cat debug-output.txt
```

Oder senden Sie die vollständigen Logs:

```bash
docker-compose logs api > backend-logs.txt
```

## Wichtig zu verstehen

Der Fehler tritt auf, weil:
1. Backend gibt JWT-Token zurück
2. Frontend ruft sofort `/auth/me` auf
3. Backend sucht Benutzer in Datenbank
4. **Problem**: Ohne `saveAndFlush()` ist der Benutzer noch nicht sichtbar
5. **Lösung**: `saveAndFlush()` schreibt sofort in die DB

Deshalb MUSS das Backend neu gebaut werden - der Code-Fix muss im Container sein!
