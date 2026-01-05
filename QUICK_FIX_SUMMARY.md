# ⚡ QUICK FIX: "Failed to load unmapped assets"

## 🎯 Problem gefunden:

**Backend läuft auf Port 12001, aber Frontend verbindet zu Port 8080!**

```
❌ Backend:  http://localhost:12001  (docker-compose.yml)
❌ Frontend: http://localhost:8080   (Default in config.ts)
          
→ Result: 404 Not Found!
```

---

## ✅ Schnelle Lösung (2 Minuten):

### Schritt 1: `.env` Datei bearbeiten

```bash
cd /pfad/zu/mms

# Falls .env nicht existiert:
cp .env.example .env

# Öffne .env und füge hinzu:
PUBLIC_API_URL=http://localhost:12001
```

### Schritt 2: Container neu starten

```bash
docker compose down
docker compose up -d
```

### Schritt 3: Warte 60 Sekunden

```bash
# Backend braucht Zeit zum Starten
sleep 60

# Oder watch logs:
docker compose logs -f atlas-cmms-backend
# Warte auf: "Started Application in X.XX seconds"
```

### Schritt 4: Teste

```bash
# Backend erreichbar?
curl http://localhost:12001/actuator/health
# → {"status":"UP"}

# Diagnose-Script (erkennt Port automatisch):
./diagnose-endpoint.sh 79 <DEIN_JWT_TOKEN>
# → Sollte jetzt "✅ SUCCESS! Got 200 OK" zeigen
```

### Schritt 5: Frontend testen

1. Öffne http://localhost:12000
2. Login
3. Gehe zu Locations → Floor Plan Editor
4. **KEIN FEHLER MEHR!** ✅

---

## 📚 Details?

Lies diese Dateien für mehr Infos:

- **`FIX_PORT_MISMATCH.md`** - Ausführliche Erklärung + Troubleshooting
- **`START_CONTAINERS.md`** - Container-Start Probleme
- **`TEST_ENDPOINT.md`** - Endpoint-Tests
- **`SOLUTION_SUMMARY.md`** - Komplette Lösung vom ursprünglichen Bug

---

## 🆘 Immer noch Probleme?

```bash
# Führe aus und sende mir das Ergebnis:
./diagnose-endpoint.sh 79 <JWT_TOKEN>
```

---

## ✅ Checkliste

- [ ] `.env` Datei hat `PUBLIC_API_URL=http://localhost:12001`
- [ ] Container laufen: `docker compose ps` zeigt "Up"
- [ ] Backend antwortet: `curl http://localhost:12001/actuator/health`
- [ ] Diagnose-Script zeigt ✅ (nicht ❌)
- [ ] Frontend lädt ohne "Failed to load unmapped assets"

**Fertig! 🎉**
