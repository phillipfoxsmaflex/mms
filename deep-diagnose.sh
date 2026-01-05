#!/bin/bash

echo "========================================="
echo "Tiefgehende Backend Diagnose"
echo "========================================="
echo ""

# 1. Container Status
echo "1. Docker Container Status:"
echo "-----------------------------------"
docker compose ps
echo ""

# 2. Backend Container Details
echo "2. Backend Container Details:"
echo "-----------------------------------"
BACKEND_STATUS=$(docker compose ps atlas-cmms-backend --format json 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4)
echo "Backend State: $BACKEND_STATUS"

# Get container ID
CONTAINER_ID=$(docker compose ps -q atlas-cmms-backend 2>/dev/null)
if [ -n "$CONTAINER_ID" ]; then
    echo "Container ID: $CONTAINER_ID"
    
    # Check if container is actually running
    RUNNING=$(docker inspect -f '{{.State.Running}}' $CONTAINER_ID 2>/dev/null)
    echo "Actually Running: $RUNNING"
    
    # Check container health
    HEALTH=$(docker inspect -f '{{.State.Health.Status}}' $CONTAINER_ID 2>/dev/null || echo "no healthcheck")
    echo "Health Status: $HEALTH"
else
    echo "❌ Backend container not found!"
fi
echo ""

# 3. Port Mapping
echo "3. Port Mapping Check:"
echo "-----------------------------------"
if [ -n "$CONTAINER_ID" ]; then
    docker port $CONTAINER_ID 2>/dev/null || echo "No ports exposed"
else
    echo "Container not found - checking docker-compose.yml..."
    grep -A 5 "atlas-cmms-backend:" docker-compose.yml | grep -E "ports:|expose:" || echo "No port config found in docker-compose.yml"
fi
echo ""

# 4. Backend Logs (letzten 30 Zeilen)
echo "4. Backend Logs (letzte 30 Zeilen):"
echo "-----------------------------------"
docker compose logs --tail=30 atlas-cmms-backend 2>&1
echo ""

# 5. Prüfe ob Backend-Prozess läuft
echo "5. Prozesse im Backend Container:"
echo "-----------------------------------"
if [ -n "$CONTAINER_ID" ]; then
    docker exec $CONTAINER_ID ps aux 2>/dev/null | grep -E "java|PID" || echo "❌ Kann Prozesse nicht abrufen"
else
    echo "❌ Container nicht verfügbar"
fi
echo ""

# 6. Network Connectivity Test
echo "6. Network Connectivity Tests:"
echo "-----------------------------------"

# Test localhost:8080
echo "Testing http://localhost:8080/actuator/health ..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://localhost:8080/actuator/health 2>&1)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Backend antwortet auf localhost:8080"
elif [ "$HEALTH_RESPONSE" = "000" ]; then
    echo "❌ Backend antwortet NICHT (Connection refused oder timeout)"
else
    echo "⚠️  Backend antwortet mit Status: $HEALTH_RESPONSE"
fi

# Test 127.0.0.1:8080
echo ""
echo "Testing http://127.0.0.1:8080/actuator/health ..."
HEALTH_RESPONSE_IP=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://127.0.0.1:8080/actuator/health 2>&1)
if [ "$HEALTH_RESPONSE_IP" = "200" ]; then
    echo "✅ Backend antwortet auf 127.0.0.1:8080"
elif [ "$HEALTH_RESPONSE_IP" = "000" ]; then
    echo "❌ Backend antwortet NICHT (Connection refused oder timeout)"
else
    echo "⚠️  Backend antwortet mit Status: $HEALTH_RESPONSE_IP"
fi
echo ""

# 7. Prüfe was auf Port 8080 lauscht
echo "7. Was lauscht auf Port 8080?"
echo "-----------------------------------"
if command -v lsof >/dev/null 2>&1; then
    lsof -i :8080 2>/dev/null || echo "Nichts lauscht auf Port 8080!"
elif command -v netstat >/dev/null 2>&1; then
    netstat -an | grep 8080 || echo "Nichts lauscht auf Port 8080!"
else
    echo "⚠️  lsof/netstat nicht verfügbar - Port-Check übersprungen"
fi
echo ""

# 8. Prüfe letzte Fehler im Backend
echo "8. Letzte Fehler im Backend:"
echo "-----------------------------------"
ERROR_COUNT=$(docker compose logs atlas-cmms-backend 2>&1 | grep -i "error\|exception\|failed" | wc -l | tr -d ' ')
if [ "$ERROR_COUNT" -gt 0 ]; then
    echo "⚠️  Gefunden: $ERROR_COUNT Fehler/Exception Zeilen"
    echo "Letzte 10 Fehler:"
    docker compose logs atlas-cmms-backend 2>&1 | grep -i "error\|exception\|failed" | tail -10
else
    echo "✅ Keine offensichtlichen Fehler in Logs"
fi
echo ""

# 9. Prüfe Application Startup Message
echo "9. Prüfe ob Application gestartet ist:"
echo "-----------------------------------"
if docker compose logs atlas-cmms-backend 2>&1 | grep -q "Started Application"; then
    echo "✅ Backend erfolgreich gestartet!"
    STARTED_LINE=$(docker compose logs atlas-cmms-backend 2>&1 | grep "Started Application" | tail -1)
    echo "   $STARTED_LINE"
else
    echo "❌ 'Started Application' nicht in Logs gefunden!"
    echo "   → Backend ist noch am Starten oder ist gecrasht"
fi
echo ""

# 10. Database Connection Check
echo "10. Database Connection Check:"
echo "-----------------------------------"
POSTGRES_STATUS=$(docker compose ps atlas-cmms-postgres --format json 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4)
echo "Postgres State: $POSTGRES_STATUS"

if docker compose logs atlas-cmms-backend 2>&1 | grep -q "HikariPool.*connection"; then
    echo "✅ Backend hat Datenbankverbindung hergestellt"
elif docker compose logs atlas-cmms-backend 2>&1 | grep -qi "connection.*refused\|connection.*timeout"; then
    echo "❌ Backend kann nicht mit Datenbank verbinden!"
    echo "   Postgres Logs:"
    docker compose logs --tail=10 atlas-cmms-postgres 2>&1
else
    echo "⚠️  Datenbankverbindung unklar"
fi
echo ""

# 11. Environment Variables Check
echo "11. Wichtige Environment Variables:"
echo "-----------------------------------"
if [ -n "$CONTAINER_ID" ]; then
    echo "JWT_SECRET_KEY: $(docker exec $CONTAINER_ID printenv JWT_SECRET_KEY 2>/dev/null | head -c 20)..." || echo "❌ Nicht gesetzt"
    echo "SPRING_PROFILES_ACTIVE: $(docker exec $CONTAINER_ID printenv SPRING_PROFILES_ACTIVE 2>/dev/null)" || echo "❌ Nicht gesetzt"
    echo "DATABASE_URL: $(docker exec $CONTAINER_ID printenv DATABASE_URL 2>/dev/null)" || echo "❌ Nicht gesetzt"
else
    echo "❌ Container nicht verfügbar"
fi
echo ""

# 12. Final Summary
echo "========================================="
echo "Zusammenfassung & Empfehlungen"
echo "========================================="

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ BACKEND FUNKTIONIERT!"
    echo ""
    echo "Nächste Schritte:"
    echo "1. Teste den Asset-Endpoint:"
    echo "   ./diagnose-endpoint.sh 79 <JWT_TOKEN>"
    echo "2. Öffne Frontend und teste Floor Plan Editor"
elif [ "$BACKEND_STATUS" != "running" ]; then
    echo "❌ PROBLEM: Backend Container läuft nicht!"
    echo ""
    echo "Versuche:"
    echo "1. docker compose restart atlas-cmms-backend"
    echo "2. docker compose logs -f atlas-cmms-backend"
elif ! docker compose logs atlas-cmms-backend 2>&1 | grep -q "Started Application"; then
    echo "❌ PROBLEM: Backend ist noch am Starten oder gecrasht!"
    echo ""
    echo "Versuche:"
    echo "1. Warte 60 Sekunden und führe Script erneut aus"
    echo "2. Prüfe Logs: docker compose logs -f atlas-cmms-backend"
    echo "3. Falls Fehler in Logs → Fixe Konfiguration (.env Datei?)"
elif [ "$HEALTH_RESPONSE" = "000" ]; then
    echo "❌ PROBLEM: Backend läuft, aber Port 8080 nicht erreichbar!"
    echo ""
    echo "Versuche:"
    echo "1. Prüfe Port-Mapping in docker-compose.yml"
    echo "2. Prüfe ob ein anderer Prozess Port 8080 blockiert"
    echo "3. Prüfe Firewall-Einstellungen"
    echo "4. Versuche Backend neu zu starten:"
    echo "   docker compose restart atlas-cmms-backend"
else
    echo "⚠️  UNKLAR: Backend läuft, aber gibt unerwarteten Status: $HEALTH_RESPONSE"
    echo ""
    echo "Prüfe Backend-Logs manuell:"
    echo "   docker compose logs -f atlas-cmms-backend"
fi
echo ""
echo "Für weitere Hilfe, sende mir:"
echo "- Output von diesem Script"
echo "- docker-compose.yml (zumindest backend service)"
echo "- .env Datei (ohne sensible Daten!)"
