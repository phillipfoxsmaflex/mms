#!/bin/bash
# Debug-Script für Registrierungsprobleme

echo "=== REGISTRIERUNGS-DEBUG SCRIPT ==="
echo ""

echo "1. Prüfe Docker Container Status:"
docker-compose ps
echo ""

echo "2. Prüfe ob Backend läuft und welche Version:"
docker exec atlas-cmms-backend cat /app/BOOT-INF/classes/com/grash/service/UserService.class | strings | grep -c "saveAndFlush" || echo "Alte Version ohne Fix!"
echo ""

echo "3. Prüfe Datenbank-Verbindung:"
docker exec atlas_db psql -U rootUser -d atlas -c "SELECT email, enabled FROM own_user LIMIT 5;"
echo ""

echo "4. Zeige letzte 30 Zeilen Backend-Logs:"
docker-compose logs --tail=30 api
echo ""

echo "5. Prüfe .env Datei:"
cat .env | grep -E "POSTGRES|JWT_SECRET|PUBLIC_API_URL|PUBLIC_FRONT_URL|INVITATION"
echo ""

echo "=== Manuelle Tests ==="
echo ""
echo "Test 1: Registrierung via API testen (ersetzen Sie die E-Mail):"
echo 'curl -X POST http://localhost:12001/auth/signup \\'
echo '  -H "Content-Type: application/json" \\'
echo '  -d "{\"email\":\"newuser@test.com\",\"password\":\"Test123!\",\"firstName\":\"Test\",\"lastName\":\"User\",\"companyName\":\"Test Company\"}"'
echo ""
echo "Test 2: Prüfen ob User bereits existiert:"
echo 'docker exec atlas_db psql -U rootUser -d atlas -c "SELECT email, enabled, created_at FROM own_user WHERE email = '\''test@test.de'\'';"'
echo ""
