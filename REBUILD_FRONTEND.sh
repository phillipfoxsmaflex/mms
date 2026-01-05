#!/bin/bash

echo "========================================="
echo "Frontend Container neu bauen"
echo "========================================="
echo ""
echo "⚠️  WICHTIG: Dies dauert 5-10 Minuten!"
echo ""

# Check if .env exists and has PUBLIC_API_URL
echo "1. Prüfe .env Konfiguration..."
if [ ! -f .env ]; then
    echo "   ❌ .env Datei existiert nicht!"
    echo ""
    echo "   Erstelle .env aus Vorlage:"
    echo "   cp .env.example .env"
    echo ""
    echo "   Dann füge hinzu:"
    echo "   PUBLIC_API_URL=http://localhost:12001"
    exit 1
fi

if grep -q "PUBLIC_API_URL" .env; then
    API_URL=$(grep PUBLIC_API_URL .env | cut -d'=' -f2)
    echo "   ✅ PUBLIC_API_URL gefunden: $API_URL"
    
    if [[ "$API_URL" != *"12001"* ]]; then
        echo "   ⚠️  WARNING: URL enthält nicht Port 12001!"
        echo "   Aktuelle URL: $API_URL"
        echo "   Sollte sein: http://localhost:12001"
        echo ""
        read -p "   Trotzdem fortfahren? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    echo "   ❌ PUBLIC_API_URL nicht in .env gefunden!"
    echo ""
    echo "   Füge diese Zeile zu .env hinzu:"
    echo "   PUBLIC_API_URL=http://localhost:12001"
    exit 1
fi
echo ""

# Stop containers
echo "2. Stoppe Container..."
docker compose down
echo "   ✅ Container gestoppt"
echo ""

# Rebuild frontend without cache
echo "3. Baue Frontend neu (ohne Cache)..."
echo "   ⏳ Dies dauert 5-10 Minuten..."
echo ""
docker compose build --no-cache frontend

if [ $? -ne 0 ]; then
    echo ""
    echo "   ❌ Build fehlgeschlagen!"
    echo ""
    echo "   Versuche:"
    echo "   1. Prüfe ob Docker läuft"
    echo "   2. Prüfe Docker Logs"
    echo "   3. Versuche: docker system prune -f"
    exit 1
fi

echo ""
echo "   ✅ Frontend neu gebaut!"
echo ""

# Start all containers
echo "4. Starte alle Container..."
docker compose up -d

if [ $? -ne 0 ]; then
    echo ""
    echo "   ❌ Start fehlgeschlagen!"
    echo ""
    echo "   Prüfe Logs:"
    echo "   docker compose logs"
    exit 1
fi

echo "   ✅ Container gestartet"
echo ""

# Wait for backend to be ready
echo "5. Warte auf Backend (max 120 Sekunden)..."
COUNTER=0
while [ $COUNTER -lt 24 ]; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:12001/actuator/health 2>/dev/null)
    if [ "$STATUS" = "200" ]; then
        echo "   ✅ Backend ist bereit!"
        break
    fi
    echo "   ⏳ Warte... ($((COUNTER * 5))s)"
    sleep 5
    COUNTER=$((COUNTER + 1))
done

if [ $COUNTER -eq 24 ]; then
    echo "   ⚠️  Backend Timeout! Prüfe Logs:"
    echo "   docker compose logs atlas-cmms-backend"
fi
echo ""

# Verify frontend is running
echo "6. Prüfe Frontend..."
FRONTEND_STATUS=$(docker compose ps frontend --format json 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4)
if [ "$FRONTEND_STATUS" = "running" ]; then
    echo "   ✅ Frontend läuft"
else
    echo "   ❌ Frontend läuft nicht! Status: $FRONTEND_STATUS"
    echo "   Prüfe Logs: docker compose logs atlas-cmms-frontend"
fi
echo ""

# Final check
echo "========================================="
echo "Verifizierung"
echo "========================================="
echo ""

# Check backend
BACKEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:12001/actuator/health 2>/dev/null)
if [ "$BACKEND_CHECK" = "200" ]; then
    echo "✅ Backend: http://localhost:12001 → OK"
else
    echo "❌ Backend: http://localhost:12001 → Nicht erreichbar"
fi

# Check frontend
FRONTEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:12000 2>/dev/null)
if [ "$FRONTEND_CHECK" = "200" ]; then
    echo "✅ Frontend: http://localhost:12000 → OK"
else
    echo "❌ Frontend: http://localhost:12000 → Nicht erreichbar"
fi

echo ""
echo "========================================="
echo "Nächste Schritte"
echo "========================================="
echo ""
echo "1. Öffne Browser: http://localhost:12000"
echo "2. Login mit deinen Credentials"
echo "3. Öffne DevTools (F12) → Application → Local Storage"
echo "4. Prüfe ob gespeichert ist:"
echo "   - Sollte sein: Keine apiUrl ODER http://localhost:12001"
echo ""
echo "5. Falls alte URL gespeichert ist:"
echo "   → Local Storage löschen (Rechtsklick → Clear)"
echo "   → Seite neu laden (Cmd+R)"
echo "   → Neu einloggen"
echo ""
echo "6. Teste Floor Plan Editor:"
echo "   → Locations → Floor Plan auswählen"
echo "   → Asset hinzufügen"
echo "   → Edit Toggle aktivieren"
echo "   → Asset auf Plan platzieren"
echo "   → KEIN 404 Fehler mehr! ✅"
echo ""
echo "7. Falls immer noch 404:"
echo "   → DevTools (F12) → Network Tab"
echo "   → Screenshot machen und mir senden"
echo "   → Prüfe: Wird wirklich Port 12001 verwendet?"
echo ""
echo "Viel Erfolg! 🚀"
