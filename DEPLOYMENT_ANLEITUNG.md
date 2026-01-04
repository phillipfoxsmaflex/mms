# Deployment-Anleitung - Änderungen Anwenden

Die Code-Änderungen wurden gemacht, aber sie sind noch nicht im laufenden Container aktiv.

## Schritt-für-Schritt Anleitung

### Option 1: Vollständiger Neustart (Empfohlen)

```bash
# 1. Navigieren Sie zum Projekt-Verzeichnis
cd /pfad/zu/mms

# 2. Stoppen Sie alle Container
docker-compose down

# 3. Bauen Sie den Backend-Container neu (wichtig!)
docker-compose build api

# 4. Starten Sie alle Container
docker-compose up -d

# 5. Überprüfen Sie die Logs
docker-compose logs -f api
```

**Wichtig:** Der `docker-compose build api` Schritt ist erforderlich, damit die Java-Code-Änderungen in `UserService.java` in den Container übernommen werden!

### Option 2: Nur Backend neu bauen und starten

```bash
cd /pfad/zu/mms

# Backend neu bauen
docker-compose build api

# Backend neu starten
docker-compose up -d api

# Logs überprüfen
docker-compose logs -f api
```

### Option 3: Kompletter Neustart mit Volume-Reset (Falls Probleme bestehen)

```bash
cd /pfad/zu/mms

# Alles stoppen und Volumes löschen
docker-compose down -v

# Neu bauen
docker-compose build

# Starten
docker-compose up -d

# Logs verfolgen
docker-compose logs -f
```

## Erfolgskontrolle

### 1. Backend-Logs prüfen
Nach dem Neustart sollten Sie folgende Zeilen sehen:

```
INFO --- [main] com.zaxxer.hikari.HikariDataSource : HikariPool-1 - Starting...
INFO --- [main] com.zaxxer.hikari.HikariDataSource : HikariPool-1 - Start completed.
INFO --- [main] liquibase.lockservice : Successfully acquired change log lock
INFO --- [main] liquibase.changelog : Reading from atlas.databasechangelog
```

**Keine Fehler** wie `UnknownHostException: postgres` sollten erscheinen.

### 2. Container-Status prüfen
```bash
docker-compose ps
```

Alle Container sollten "Up" sein:
- atlas-cmms-backend
- atlas-cmms-frontend  
- atlas_db
- atlas_minio

### 3. Registrierung testen

1. Öffnen Sie http://localhost:12000
2. Klicken Sie auf "Register" / "Registrieren"
3. Füllen Sie das Formular aus:
   - Email: test@test.de
   - Passwort: Test123!
   - Vorname: Test
   - Nachname: User
   - Firma: Test Company
4. Klicken Sie auf "Registrieren"

**Erwartetes Ergebnis:** 
✅ Erfolgreiche Registrierung ohne Fehler
✅ Sie werden automatisch eingeloggt
✅ Sie sehen das Dashboard

**NICHT mehr:** 
❌ "JSON.parse: unexpected end of data"
❌ "User 'test@test.de' not found"

## Warum ist der Neustart notwendig?

Die Änderungen betreffen:

1. **docker-compose.yml** - wird beim `docker-compose up` gelesen
2. **UserService.java** - Java-Code muss neu kompiliert und in Container gepackt werden

Ohne `docker-compose build api` läuft weiterhin die alte Version des Java-Codes im Container!

## Troubleshooting

### Problem: "User not found" Fehler tritt weiterhin auf

**Lösung:** Backend wurde nicht neu gebaut!
```bash
docker-compose build --no-cache api
docker-compose up -d api
```

### Problem: Container startet nicht

**Logs anzeigen:**
```bash
docker-compose logs api
```

**Häufige Ursachen:**
- Port 12001 bereits belegt
- Datenbank nicht erreichbar
- .env Datei fehlt oder unvollständig

### Problem: Datenbank-Verbindungsfehler

**Prüfen Sie die .env Datei:**
```bash
cat .env
```

Sollte mindestens enthalten:
```
POSTGRES_USER=rootUser
POSTGRES_PWD=mypassword
JWT_SECRET_KEY=your_secret_key_minimum_32_characters
MINIO_USER=minio
MINIO_PASSWORD=minio123
PUBLIC_FRONT_URL=http://localhost:12000
PUBLIC_API_URL=http://localhost:12001
```

### Problem: Port-Konflikt

```bash
# Prüfen Sie, welche Prozesse die Ports belegen
lsof -i :12000  # Frontend
lsof -i :12001  # Backend
lsof -i :5432   # PostgreSQL
lsof -i :9000   # MinIO

# Oder für alle auf einmal:
lsof -i :12000 -i :12001 -i :5432 -i :9000
```

## Nach erfolgreicher Anwendung

✅ Backend läuft ohne Fehler
✅ Datenbank-Verbindung erfolgreich
✅ Registrierung funktioniert
✅ Login funktioniert
✅ Dashboard ist erreichbar

Sie können nun die Anwendung normal verwenden!
