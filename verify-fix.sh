#!/bin/bash
# Verify-Script: Prüft ob die Fixes im laufenden Container aktiv sind

echo "=========================================="
echo "VERIFY REGISTRATION FIX"
echo "=========================================="
echo ""

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Prüfe ob Container laufen
echo "1. Prüfe Container-Status..."
if docker ps | grep -q "atlas-cmms-backend"; then
    echo -e "${GREEN}✓${NC} Backend-Container läuft"
else
    echo -e "${RED}✗${NC} Backend-Container läuft NICHT!"
    echo "   Bitte starten Sie die Container mit: docker-compose up -d"
    exit 1
fi

# 2. Prüfe Datenbank-Verbindung
echo ""
echo "2. Prüfe Datenbank-Verbindung..."
if docker exec atlas_db psql -U rootUser -d atlas -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Datenbank ist erreichbar"
else
    echo -e "${RED}✗${NC} Datenbank ist NICHT erreichbar!"
    exit 1
fi

# 3. Prüfe Backend-Logs auf Fehler
echo ""
echo "3. Prüfe Backend auf kritische Fehler..."
if docker-compose logs --tail=50 api | grep -q "UnknownHostException"; then
    echo -e "${RED}✗${NC} Database connection errors gefunden!"
    echo "   Details:"
    docker-compose logs --tail=10 api | grep "UnknownHostException"
else
    echo -e "${GREEN}✓${NC} Keine Database connection errors"
fi

# 4. Prüfe ob Backend erfolgreich gestartet ist
echo ""
echo "4. Prüfe ob Backend vollständig gestartet ist..."
if docker-compose logs --tail=100 api | grep -q "Started GrashApplication"; then
    echo -e "${GREEN}✓${NC} Backend erfolgreich gestartet"
else
    echo -e "${YELLOW}⚠${NC} Backend-Start nicht bestätigt"
    echo "   Prüfen Sie die Logs mit: docker-compose logs -f api"
fi

# 5. Prüfe ob saveAndFlush im kompilierten Code vorhanden ist
echo ""
echo "5. Prüfe ob saveAndFlush-Fix im Container aktiv ist..."
echo "   (Dies ist eine Heuristik - prüft auf 'Flush' im kompilierten Code)"

# Extrahiere alle .class Dateien und suche nach "Flush"
if docker exec atlas-cmms-backend find /app/BOOT-INF/classes/com/grash/service/ -name "UserService.class" -exec cat {} \; 2>/dev/null | strings | grep -q "Flush"; then
    echo -e "${GREEN}✓${NC} 'Flush'-Referenz im kompilierten Code gefunden"
    echo "   Dies deutet darauf hin, dass saveAndFlush() verwendet wird"
else
    echo -e "${YELLOW}⚠${NC} Keine 'Flush'-Referenz gefunden"
    echo -e "${RED}   WICHTIG: Backend muss neu gebaut werden!${NC}"
    echo "   Führen Sie aus:"
    echo "   docker-compose down"
    echo "   docker-compose build --no-cache api"
    echo "   docker-compose up -d"
fi

# 6. Prüfe docker-compose.yml DB_URL
echo ""
echo "6. Prüfe docker-compose.yml Konfiguration..."
if grep -q "DB_URL: postgres:5432/atlas" docker-compose.yml; then
    echo -e "${GREEN}✓${NC} DB_URL ist korrekt konfiguriert (postgres:5432/atlas)"
else
    echo -e "${RED}✗${NC} DB_URL ist NICHT korrekt konfiguriert!"
    echo "   Erwartet: DB_URL: postgres:5432/atlas"
    echo "   Gefunden:"
    grep "DB_URL:" docker-compose.yml
fi

# 7. Prüfe .env Datei
echo ""
echo "7. Prüfe .env Datei..."
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} .env Datei existiert"
    
    # Prüfe wichtige Variablen
    if grep -q "POSTGRES_USER=" .env && grep -q "POSTGRES_PWD=" .env; then
        echo -e "${GREEN}✓${NC} POSTGRES credentials vorhanden"
    else
        echo -e "${RED}✗${NC} POSTGRES credentials fehlen in .env!"
    fi
    
    if grep -q "JWT_SECRET_KEY=" .env; then
        echo -e "${GREEN}✓${NC} JWT_SECRET_KEY vorhanden"
    else
        echo -e "${RED}✗${NC} JWT_SECRET_KEY fehlt in .env!"
    fi
else
    echo -e "${RED}✗${NC} .env Datei existiert NICHT!"
    echo "   Kopieren Sie .env.example zu .env und füllen Sie die Werte aus"
fi

# 8. Zeige Benutzer in Datenbank
echo ""
echo "8. Benutzer in Datenbank:"
docker exec atlas_db psql -U rootUser -d atlas -c "SELECT id, email, enabled, created_at FROM own_user ORDER BY created_at DESC LIMIT 5;" 2>/dev/null || echo "   Keine Benutzer oder Verbindungsfehler"

# 9. Test: API Health-Check
echo ""
echo "9. API Health-Check..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:12001/actuator/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓${NC} API ist erreichbar (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "000" ]; then
    echo -e "${YELLOW}⚠${NC} API nicht erreichbar (curl failed)"
else
    echo -e "${YELLOW}⚠${NC} API antwortet mit HTTP $HTTP_CODE"
fi

# Zusammenfassung
echo ""
echo "=========================================="
echo "ZUSAMMENFASSUNG"
echo "=========================================="
echo ""
echo "Nächste Schritte:"
echo ""
echo "1. Wenn '${RED}WICHTIG: Backend muss neu gebaut werden!${NC}' oben erscheint:"
echo "   docker-compose down"
echo "   docker-compose build --no-cache api"
echo "   docker-compose up -d"
echo ""
echo "2. Browser-Cache leeren:"
echo "   - Firefox: Cmd+Shift+Delete (Mac) / Ctrl+Shift+Delete (Windows)"
echo "   - Chrome: Cmd+Shift+Delete (Mac) / Ctrl+Shift+Delete (Windows)"
echo "   - Oder verwenden Sie ein Inkognito/Privat-Fenster"
echo ""
echo "3. Alte Benutzer löschen (optional):"
echo "   docker exec atlas_db psql -U rootUser -d atlas -c \"DELETE FROM own_user WHERE email = 'test@test.de';\""
echo ""
echo "4. Registrierung mit NEUER E-Mail testen"
echo ""
echo "5. Bei Problemen: Logs anschauen:"
echo "   docker-compose logs -f api"
echo ""
