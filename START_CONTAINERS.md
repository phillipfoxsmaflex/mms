# 🚀 Docker Container starten und testen

## Problem erkannt:

Die Docker Container **laufen nicht**! Deshalb bekommst du den 404-Fehler.

```
service "atlas-cmms-backend" is not running
❌ Cannot connect to backend (got 000)
```

---

## ✅ Lösung: Container starten

### Schritt 1: Container Status prüfen

```bash
cd /pfad/zu/mms
docker compose ps
```

**Erwartete Ausgabe wenn Container laufen:**
```
NAME                   STATUS
atlas-cmms-backend     Up 2 minutes
atlas-cmms-frontend    Up 2 minutes
atlas-cmms-postgres    Up 2 minutes
```

**Wenn "Exited" oder gar nichts angezeigt wird → Container sind gestoppt!**

---

### Schritt 2: Container starten (ERSTE MAL oder nach Code-Änderung)

```bash
cd /pfad/zu/mms

# Container neu bauen UND starten
docker compose up -d --build
```

**Flags erklärt:**
- `-d` = Detached mode (läuft im Hintergrund)
- `--build` = Baut Images neu vor dem Start

---

### Schritt 3: Warte bis Backend gestartet ist

```bash
# Logs live anschauen (Ctrl+C zum Beenden)
docker compose logs -f atlas-cmms-backend
```

**Suche nach dieser Zeile:**
```
Started Application in X.XX seconds
```

Das kann **30-90 Sekunden** dauern!

---

### Schritt 4: Verifiziere dass alles läuft

```bash
# Container Status prüfen
docker compose ps

# Sollte zeigen:
# NAME                   STATUS
# atlas-cmms-backend     Up
# atlas-cmms-frontend    Up
# atlas-cmms-postgres    Up
```

---

### Schritt 5: Backend Erreichbarkeit testen

```bash
# Einfacher Health-Check
curl http://localhost:8080/actuator/health

# Sollte zurückgeben:
# {"status":"UP"}
```

Oder teste direkt im Browser: http://localhost:8080/actuator/health

---

### Schritt 6: Diagnose-Script erneut ausführen

```bash
./diagnose-endpoint.sh 79 <DEIN_JWT_TOKEN>
```

**JETZT sollte es funktionieren!** ✅

---

## 🔧 Häufige Probleme beim Start

### Problem 1: Port 8080 bereits belegt

**Fehler:**
```
Error: bind: address already in use
```

**Lösung:**
```bash
# Finde welcher Prozess Port 8080 nutzt
lsof -i :8080

# Stoppe den Prozess oder ändere Port in docker-compose.yml
```

---

### Problem 2: Postgres startet nicht

**Fehler in Logs:**
```
postgres: database system is shut down
```

**Lösung:**
```bash
# Postgres-Daten zurücksetzen (⚠️ LÖSCHT DATENBANK!)
docker compose down -v
docker compose up -d
```

---

### Problem 3: Backend startet, aber mit Fehlern

**Prüfe Logs:**
```bash
docker compose logs atlas-cmms-backend | grep -i error
```

**Häufige Fehler:**
- `JWT_SECRET_KEY` nicht gesetzt → In `.env` Datei prüfen
- Postgres-Verbindung fehlschlägt → Warte länger oder prüfe Postgres-Logs

---

### Problem 4: Container bauen schlägt fehl

**Fehler:**
```
ERROR: failed to solve: process "/bin/sh -c ..." did not complete successfully
```

**Lösung:**
```bash
# Build mit mehr Details
docker compose build --no-cache --progress=plain
```

---

## 📝 Vollständiger Neustart-Workflow

Wenn alles schiefgeht, kompletter Reset:

```bash
cd /pfad/zu/mms

# 1. ALLES stoppen und löschen
docker compose down -v

# 2. Alte Images löschen (optional)
docker compose rm -f
docker image prune -f

# 3. Neu bauen ohne Cache
docker compose build --no-cache

# 4. Starten
docker compose up -d

# 5. Logs beobachten
docker compose logs -f
```

---

## 🎯 Schnell-Checkliste

Nach dem Start:

- [ ] `docker compose ps` zeigt alle Container als "Up"
- [ ] `curl http://localhost:8080/actuator/health` gibt `{"status":"UP"}`
- [ ] Backend-Logs zeigen "Started Application"
- [ ] Keine ERROR-Meldungen in Logs
- [ ] Frontend erreichbar unter http://localhost:3000 (oder dein Port)
- [ ] `./diagnose-endpoint.sh 79` zeigt ✅ statt ❌

---

## 🆘 Noch Probleme?

Falls Container nicht starten wollen, sende mir:

```bash
# 1. Container Status
docker compose ps

# 2. Alle Logs
docker compose logs > logs.txt

# 3. Docker Version
docker --version
docker compose version

# 4. System-Info
uname -a
```

---

## ℹ️ Docker Compose Befehle Übersicht

```bash
# Container starten (im Hintergrund)
docker compose up -d

# Container stoppen (Daten bleiben erhalten)
docker compose stop

# Container stoppen und löschen (Daten bleiben in Volumes)
docker compose down

# Container + Volumes löschen (⚠️ DATEN WEG!)
docker compose down -v

# Logs anschauen (live)
docker compose logs -f

# Logs eines einzelnen Services
docker compose logs -f atlas-cmms-backend

# Container neu bauen
docker compose build

# Container neu bauen ohne Cache
docker compose build --no-cache

# In Container-Shell einsteigen
docker compose exec atlas-cmms-backend sh

# Container neu starten (ohne neu bauen)
docker compose restart
```

---

## 🎉 Erwartetes Ergebnis

Nach erfolgreichem Start:

1. ✅ Container laufen (`docker compose ps` zeigt "Up")
2. ✅ Backend antwortet (`curl http://localhost:8080/actuator/health`)
3. ✅ Diagnose-Script zeigt "200 OK" statt "000"
4. ✅ Frontend lädt ohne "Failed to load unmapped assets"
5. ✅ Assets können auf Grundriss platziert werden

**Viel Erfolg! 🚀**
