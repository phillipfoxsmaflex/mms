#!/bin/bash

# Diagnose Script für Floor Plan Asset Endpoint
# Usage: ./diagnose-endpoint.sh <LOCATION_ID> [ACCESS_TOKEN] [PORT]

LOCATION_ID=${1:-79}
ACCESS_TOKEN=${2:-""}
PORT=${3:-""}

echo "========================================="
echo "Floor Plan Asset Endpoint Diagnose"
echo "========================================="
echo ""

# Auto-detect backend port from docker compose
if [ -z "$PORT" ]; then
    PORT=$(docker compose port api 8080 2>/dev/null | cut -d: -f2)
    if [ -z "$PORT" ]; then
        echo "⚠️  Cannot auto-detect backend port, trying default 8080..."
        PORT=8080
    else
        echo "ℹ️  Auto-detected backend port: $PORT"
    fi
fi
echo ""

# Check if Docker containers are running
echo "1. Checking Docker containers..."
if docker compose ps | grep -q "atlas-cmms-backend.*Up"; then
    echo "   ✅ Backend container is running"
else
    echo "   ❌ Backend container is NOT running!"
    echo "   Run: docker compose up -d"
    exit 1
fi
echo ""

# Check backend logs for startup errors
echo "2. Checking backend logs for errors..."
ERROR_COUNT=$(docker compose logs atlas-cmms-backend 2>&1 | grep -i "error\|exception" | wc -l)
if [ "$ERROR_COUNT" -gt 5 ]; then
    echo "   ⚠️  Found $ERROR_COUNT error/exception messages in logs"
    echo "   Recent errors:"
    docker compose logs atlas-cmms-backend 2>&1 | grep -i "error\|exception" | tail -5
else
    echo "   ✅ No significant errors in logs"
fi
echo ""

# Check if LocationController class exists in container
echo "3. Checking if LocationController is loaded..."
CONTROLLER_CHECK=$(docker compose exec -T atlas-cmms-backend sh -c "ls /app/com/grash/controller/LocationController.class 2>/dev/null" || echo "not_found")
if [ "$CONTROLLER_CHECK" != "not_found" ]; then
    echo "   ✅ LocationController class found in container"
else
    echo "   ❌ LocationController class NOT found!"
fi
echo ""

# Test endpoint without authentication (should get 401 or 403)
echo "4. Testing endpoint accessibility (without auth)..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/locations/$LOCATION_ID/assets/unmapped")
case $RESPONSE in
    401|403)
        echo "   ✅ Endpoint exists (got $RESPONSE - authentication required)"
        ;;
    404)
        echo "   ❌ Endpoint NOT FOUND (404)!"
        echo "   → Container needs rebuild: docker compose build --no-cache"
        ;;
    200)
        echo "   ⚠️  Endpoint accessible without auth (got 200) - unexpected"
        ;;
    000)
        echo "   ❌ Cannot connect to backend (got 000)"
        echo "   → Check if backend is running and port $PORT is accessible"
        echo "   → Your port mapping: $(docker compose ps api 2>/dev/null | grep api || echo 'unknown')"
        ;;
    *)
        echo "   ⚠️  Unexpected response: $RESPONSE"
        ;;
esac
echo ""

# Test with authentication if token provided
if [ -n "$ACCESS_TOKEN" ]; then
    echo "5. Testing endpoint WITH authentication..."
    echo "   URL: http://localhost:$PORT/locations/$LOCATION_ID/assets/unmapped"
    FULL_RESPONSE=$(curl -s -w "\n%{http_code}" "http://localhost:$PORT/locations/$LOCATION_ID/assets/unmapped" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json")
    
    # macOS-compatible way to split response
    STATUS=$(echo "$FULL_RESPONSE" | tail -1)
    BODY=$(echo "$FULL_RESPONSE" | sed '$d')
    
    case $STATUS in
        200)
            echo "   ✅ SUCCESS! Got 200 OK"
            echo "   Response body:"
            echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
            ;;
        401)
            echo "   ❌ Unauthorized (401) - Token invalid or expired"
            ;;
        403)
            echo "   ❌ Forbidden (403) - No permission for ASSETS"
            ;;
        404)
            echo "   ❌ Not Found (404) - Endpoint not registered!"
            echo "   → REBUILD REQUIRED: docker compose build --no-cache"
            ;;
        *)
            echo "   ❌ Unexpected status: $STATUS"
            echo "   Response: $BODY"
            ;;
    esac
else
    echo "5. Skipping authenticated test (no token provided)"
    echo "   To test with auth, run:"
    echo "   ./diagnose-endpoint.sh $LOCATION_ID <YOUR_ACCESS_TOKEN> $PORT"
fi
echo ""

# Check LocationController mapping order
echo "6. Verifying Controller mapping order..."
echo "   Cannot verify from outside container, but the fix should have:"
echo "   Line 127: @GetMapping(\"/{id}/assets/unmapped\")"
echo "   Line 155: @GetMapping(\"/{id}\")"
echo ""

# Summary
echo "========================================="
echo "Summary"
echo "========================================="
echo "Location ID tested: $LOCATION_ID"
echo "Backend Port: $PORT"
echo "Backend URL: http://localhost:$PORT"
echo ""
echo "Next steps:"
echo "1. If you see '404 Not Found' → Rebuild: docker compose build --no-cache"
echo "2. If you see '401/403' → Get a valid JWT token from browser localStorage"
echo "3. If you see '200 OK' → Backend works! Check frontend config"
echo "4. If you see '000' → Backend not responding on port $PORT"
echo ""
echo "To get your JWT token:"
echo "  1. Open browser DevTools (F12)"
echo "  2. Go to Application tab → Local Storage"
echo "  3. Copy value of 'accessToken'"
echo "  4. Run: ./diagnose-endpoint.sh $LOCATION_ID <paste_token_here> $PORT"
