# 🔧 Port-Mismatch Fix: Backend vs Frontend

## Problem erkannt: ❌

```
Backend läuft auf:    http://localhost:12001
Frontend verbindet:   http://localhost:8080  ← FALSCH!
```

**Deshalb bekommst du 404 Fehler!**

---

## ✅ Lösung: Environment Variable setzen

### Schritt 1: `.env` Datei prüfen/erstellen

```bash
cd /pfad/zu/mms

# Prüfe ob .env existiert
ls -la .env

# Falls nicht: erstelle aus Vorlage
cp .env.example .env
```

---

### Schritt 2: `PUBLIC_API_URL` setzen

Öffne `.env` und füge hinzu bzw. ändere:

```bash
PUBLIC_API_URL=http://localhost:12001
```

**WICHTIG:** Kein trailing slash am Ende!

---

### Schritt 3: Container neu starten

```bash
# Container stoppen
docker compose down

# Container neu starten (lädt neue Env-Vars)
docker compose up -d

# Warte 60 Sekunden bis Backend bereit ist
sleep 60
```

---

### Schritt 4: Verifizieren

```bash
# 1. Prüfe Backend-Port
docker compose ps

# Sollte zeigen:
# atlas-cmms-backend    ...    0.0.0.0:12001->8080/tcp

# 2. Teste Backend erreichbar
curl http://localhost:12001/actuator/health

# Sollte zurückgeben:
# {"status":"UP"}

# 3. Teste Endpoint mit Diagnose-Script
./diagnose-endpoint.sh 79 <JWT_TOKEN>

# Script erkennt automatisch Port 12001!
```

---

## 🎯 Warum ist das passiert?

### Problem-Analyse:

1. **docker-compose.yml (Zeile 61):**
   ```yaml
   ports:
     - "12001:8080"
   ```
   → Backend läuft extern auf Port **12001**

2. **docker-compose.yml (Zeile 68):**
   ```yaml
   environment:
     API_URL: ${PUBLIC_API_URL}
   ```
   → Frontend nutzt `PUBLIC_API_URL` Environment Variable

3. **frontend/src/config.ts (Zeile 30):**
   ```typescript
   : 'http://localhost:8080/';
   ```
   → Falls `PUBLIC_API_URL` nicht gesetzt → **Default Port 8080!**

---

## 🔍 Alternative: Port auf 8080 ändern (nicht empfohlen)

Falls du Backend auf Standard-Port 8080 laufen lassen willst:

### docker-compose.yml ändern:

```yaml
services:
  api:
    ports:
      - "8080:8080"  # Statt 12001:8080
```

### Container neu bauen:

```bash
docker compose down
docker compose up -d
```

**⚠️ Vorsicht:** Port 8080 könnte bereits belegt sein!

---

## 📝 .env Datei Beispiel

Deine `.env` Datei sollte mindestens enthalten:

```bash
# Database
POSTGRES_USER=your_user
POSTGRES_PWD=your_password

# JWT
JWT_SECRET_KEY=your_secret_key_min_32_chars

# API URLs (WICHTIG!)
PUBLIC_API_URL=http://localhost:12001
PUBLIC_FRONT_URL=http://localhost:12000

# MinIO Storage
MINIO_USER=admin
MINIO_PASSWORD=your_minio_password
PUBLIC_MINIO_ENDPOINT=http://localhost:9000
STORAGE_TYPE=minio

# Optional (können leer bleiben für lokale Entwicklung)
FASTSPRING_USER=
FASTSPRING_PWD=
SPRING_PROFILES_ACTIVE=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PWD=
```

**Hinweis:** Ersetze `your_*` Werte mit echten Credentials!

---

## 🧪 Testen nach der Korrektur

### 1. Diagnose-Script (Auto-detect Port)

```bash
./diagnose-endpoint.sh 79 <JWT_TOKEN>
```

**Erwartete Ausgabe:**
```
ℹ️  Auto-detected backend port: 12001

1. Checking Docker containers...
   ✅ Backend container is running

2. Checking backend logs for errors...
   ✅ No significant errors in logs

3. Checking if LocationController is loaded...
   ✅ LocationController loaded

4. Testing endpoint accessibility (without auth)...
   ✅ Endpoint exists (got 403 - authentication required)

5. Testing endpoint WITH authentication...
   URL: http://localhost:12001/locations/79/assets/unmapped
   ✅ SUCCESS! Got 200 OK
```

---

### 2. Manueller Test im Browser

1. **Öffne:** http://localhost:12000 (Frontend)
2. **Login** mit deinen Credentials
3. **Öffne DevTools** (F12) → Network Tab
4. **Navigiere zu:** Locations → Floor Plan Editor
5. **Prüfe Requests:**
   - Sollte zu `http://localhost:12001/locations/...` gehen
   - Status sollte **200 OK** sein (nicht 404!)

---

### 3. Frontend localStorage prüfen

**DevTools → Application → Local Storage → http://localhost:12000**

Prüfe ob `API_URL` korrekt gespeichert ist:
- Sollte sein: `http://localhost:12001/` (mit trailing slash)

Falls falsch:
1. localStorage löschen
2. Seite neu laden
3. Neu einloggen

---

## 🆘 Noch Probleme?

### Problem 1: Environment Variable wird nicht übernommen

**Symptom:**
```
Frontend verbindet immer noch zu :8080
```

**Lösung:**
```bash
# Container komplett neu bauen
docker compose down
docker compose build --no-cache frontend
docker compose up -d

# Warte bis alles läuft
sleep 60
```

---

### Problem 2: Backend antwortet nicht auf 12001

**Symptom:**
```
curl: (7) Failed to connect to localhost port 12001
```

**Lösung:**
```bash
# Prüfe ob Backend wirklich läuft
docker compose logs atlas-cmms-backend | grep "Started Application"

# Falls nicht gestartet:
docker compose restart atlas-cmms-backend

# Logs live anschauen
docker compose logs -f atlas-cmms-backend
```

---

### Problem 3: Port 12001 bereits belegt

**Symptom:**
```
Error: bind: address already in use
```

**Lösung:**
```bash
# Finde welcher Prozess Port nutzt
lsof -i :12001

# Stoppe den Prozess ODER
# Ändere Port in docker-compose.yml zu z.B. 12002
```

---

## ✅ Checkliste nach Fix

- [ ] `.env` Datei existiert mit `PUBLIC_API_URL=http://localhost:12001`
- [ ] Container neu gestartet: `docker compose down && docker compose up -d`
- [ ] Backend erreichbar: `curl http://localhost:12001/actuator/health` → `{"status":"UP"}`
- [ ] Diagnose-Script: `./diagnose-endpoint.sh 79 <TOKEN>` → ✅ alle grün
- [ ] Frontend öffnet: http://localhost:12000
- [ ] Network Tab zeigt Requests zu `localhost:12001` (nicht 8080!)
- [ ] Keine "Failed to load unmapped assets" Fehler mehr
- [ ] Assets können auf Grundriss platziert werden

---

## 🎉 Erwartetes Ergebnis

Nach erfolgreichem Fix:

1. ✅ Backend läuft und antwortet auf Port **12001**
2. ✅ Frontend verbindet korrekt zu Port **12001**
3. ✅ Endpoint `/locations/{id}/assets/unmapped` gibt **200 OK**
4. ✅ Floor Plan Editor lädt Assets ohne Fehler
5. ✅ Assets können per Drag & Drop platziert werden

**Der Fix ist komplett! 🚀**

---

## 📚 Technischer Hintergrund

### Port-Mapping erklärt:

```yaml
ports:
  - "12001:8080"
    ^^^^^  ^^^^
    HOST   CONTAINER
```

- **12001** = Externer Port (Host/macOS)
- **8080** = Interner Port (im Docker-Container)

**Intern** (Container zu Container):
- Frontend kann Backend erreichen via: `http://api:8080`

**Extern** (Browser zu Container):
- Browser muss Backend erreichen via: `http://localhost:12001`

**Problem:**
- Frontend-Code läuft im **Browser** (nicht im Container!)
- Deshalb braucht es den **externen Port 12001**!

---

**Fragen? Sende mir:**
- Output von `./diagnose-endpoint.sh 79 <token>`
- Inhalt deiner `.env` Datei (ohne Passwörter!)
- Browser DevTools Network Tab Screenshot
