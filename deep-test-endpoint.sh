#!/bin/bash

# Deep diagnostic test for the unmapped assets endpoint
# This script tests various scenarios to find the root cause

if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <location_id> <jwt_token>"
    exit 1
fi

LOCATION_ID=$1
JWT_TOKEN=$2

# Auto-detect backend port
BACKEND_PORT=$(docker compose port api 8080 2>/dev/null | cut -d':' -f2)
if [ -z "$BACKEND_PORT" ]; then
    echo "⚠️  Could not detect backend port, using 12001"
    BACKEND_PORT=12001
fi

BASE_URL="http://localhost:${BACKEND_PORT}"

echo "========================================="
echo "Deep Endpoint Diagnostics"
echo "========================================="
echo "Location ID: $LOCATION_ID"
echo "Backend URL: $BASE_URL"
echo "Backend Port: $BACKEND_PORT"
echo ""

# Test 1: Check if location exists
echo "1. Verifying location exists..."
LOCATION_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer ${JWT_TOKEN}" \
    -H "Content-Type: application/json" \
    "${BASE_URL}/locations/${LOCATION_ID}")

LOCATION_HTTP_CODE=$(echo "$LOCATION_RESPONSE" | tail -n1)
LOCATION_BODY=$(echo "$LOCATION_RESPONSE" | sed '$d')

if [ "$LOCATION_HTTP_CODE" = "200" ]; then
    echo "   ✅ Location exists (200 OK)"
    LOCATION_NAME=$(echo "$LOCATION_BODY" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "   Location name: $LOCATION_NAME"
else
    echo "   ❌ Location request failed: $LOCATION_HTTP_CODE"
    echo "   Response: $LOCATION_BODY"
    exit 1
fi
echo ""

# Test 2: Check all assets for this location
echo "2. Fetching all assets for location..."
ASSETS_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer ${JWT_TOKEN}" \
    -H "Content-Type: application/json" \
    "${BASE_URL}/assets?location=${LOCATION_ID}")

ASSETS_HTTP_CODE=$(echo "$ASSETS_RESPONSE" | tail -n1)
ASSETS_BODY=$(echo "$ASSETS_RESPONSE" | sed '$d')

if [ "$ASSETS_HTTP_CODE" = "200" ]; then
    ASSET_COUNT=$(echo "$ASSETS_BODY" | grep -o '"id"' | wc -l | tr -d ' ')
    echo "   ✅ Assets query successful: $ASSET_COUNT assets found"
else
    echo "   ❌ Assets query failed: $ASSETS_HTTP_CODE"
fi
echo ""

# Test 3: Try unmapped assets endpoint (THE PROBLEMATIC ONE)
echo "3. Testing unmapped assets endpoint..."
echo "   URL: ${BASE_URL}/locations/${LOCATION_ID}/assets/unmapped"

# First without auth
echo ""
echo "   3a) Without authentication:"
UNAUTH_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Content-Type: application/json" \
    "${BASE_URL}/locations/${LOCATION_ID}/assets/unmapped")

UNAUTH_HTTP_CODE=$(echo "$UNAUTH_RESPONSE" | tail -n1)
UNAUTH_BODY=$(echo "$UNAUTH_RESPONSE" | sed '$d')

echo "      HTTP Code: $UNAUTH_HTTP_CODE"
if [ "$UNAUTH_HTTP_CODE" = "403" ] || [ "$UNAUTH_HTTP_CODE" = "401" ]; then
    echo "      ✅ Correctly requires authentication"
elif [ "$UNAUTH_HTTP_CODE" = "404" ]; then
    echo "      ❌ 404 - Endpoint not found (even without auth check!)"
    echo "      This means Spring is not mapping this route!"
else
    echo "      ⚠️  Unexpected code: $UNAUTH_HTTP_CODE"
fi
echo ""

# Now with auth
echo "   3b) With authentication:"
UNMAPPED_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer ${JWT_TOKEN}" \
    -H "Content-Type: application/json" \
    -H "Origin: http://localhost:12000" \
    "${BASE_URL}/locations/${LOCATION_ID}/assets/unmapped")

UNMAPPED_HTTP_CODE=$(echo "$UNMAPPED_RESPONSE" | tail -n1)
UNMAPPED_BODY=$(echo "$UNMAPPED_RESPONSE" | sed '$d')

echo "      HTTP Code: $UNMAPPED_HTTP_CODE"

if [ "$UNMAPPED_HTTP_CODE" = "200" ]; then
    UNMAPPED_COUNT=$(echo "$UNMAPPED_BODY" | grep -o '"id"' | wc -l | tr -d ' ')
    echo "      ✅ SUCCESS! Got $UNMAPPED_COUNT unmapped assets"
    echo ""
    echo "      Response body:"
    echo "$UNMAPPED_BODY" | head -20
elif [ "$UNMAPPED_HTTP_CODE" = "404" ]; then
    echo "      ❌ 404 NOT FOUND"
    echo "      Response: $UNMAPPED_BODY"
    echo ""
    echo "      ⚠️  CRITICAL: This means the endpoint is NOT registered in Spring!"
else
    echo "      ❌ Failed with code: $UNMAPPED_HTTP_CODE"
    echo "      Response: $UNMAPPED_BODY"
fi
echo ""

# Test 4: Check Spring mappings via actuator
echo "4. Checking Spring actuator mappings..."
MAPPINGS_RESPONSE=$(curl -s "${BASE_URL}/actuator/mappings" 2>/dev/null)

if [ -n "$MAPPINGS_RESPONSE" ]; then
    echo "   Searching for 'assets/unmapped' in mappings..."
    UNMAPPED_MAPPING=$(echo "$MAPPINGS_RESPONSE" | grep -i "assets/unmapped" || echo "NOT FOUND")
    
    if [[ "$UNMAPPED_MAPPING" == "NOT FOUND" ]]; then
        echo "   ❌ Endpoint 'assets/unmapped' NOT found in Spring mappings!"
        echo ""
        echo "   This confirms: The endpoint is NOT registered!"
        echo "   Possible causes:"
        echo "   - LocationController not loaded"
        echo "   - Method mapping annotation wrong"
        echo "   - Spring component scan issue"
    else
        echo "   ✅ Found in mappings:"
        echo "$UNMAPPED_MAPPING" | head -5
    fi
else
    echo "   ⚠️  Could not fetch actuator mappings"
fi
echo ""

# Test 5: Check backend logs for errors
echo "5. Checking recent backend logs..."
docker compose logs --tail=50 atlas-cmms-backend 2>/dev/null | grep -i "error\|exception\|locationcontroller" | tail -10
echo ""

# Test 6: Alternative URL variations
echo "6. Testing URL variations..."

echo "   a) With trailing slash:"
TRAIL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${JWT_TOKEN}" \
    "${BASE_URL}/locations/${LOCATION_ID}/assets/unmapped/")
echo "      ${BASE_URL}/locations/${LOCATION_ID}/assets/unmapped/ → $TRAIL_RESPONSE"

echo "   b) Without leading slash in path:"
NO_SLASH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${JWT_TOKEN}" \
    "${BASE_URL}/locations${LOCATION_ID}/assets/unmapped")
echo "      ${BASE_URL}/locations${LOCATION_ID}/assets/unmapped → $NO_SLASH_RESPONSE"

echo "   c) With extra headers (mimicking browser):"
BROWSER_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer ${JWT_TOKEN}" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -H "Origin: http://localhost:12000" \
    -H "Referer: http://localhost:12000/" \
    -H "Sec-Fetch-Site: same-site" \
    -H "Sec-Fetch-Mode: cors" \
    -H "Sec-Fetch-Dest: empty" \
    "${BASE_URL}/locations/${LOCATION_ID}/assets/unmapped")

BROWSER_HTTP_CODE=$(echo "$BROWSER_RESPONSE" | tail -n1)
echo "      Full browser headers → $BROWSER_HTTP_CODE"
echo ""

# Summary
echo "========================================="
echo "DIAGNOSIS SUMMARY"
echo "========================================="
echo ""

if [ "$UNMAPPED_HTTP_CODE" = "200" ]; then
    echo "✅ ENDPOINT WORKS!"
    echo ""
    echo "The backend endpoint is working correctly."
    echo "If you're seeing 404 in the frontend:"
    echo ""
    echo "1. Check browser Network tab:"
    echo "   - What is the EXACT URL being called?"
    echo "   - Is it using http://localhost:12001 ?"
    echo "   - Are there any typos in the URL?"
    echo ""
    echo "2. Check browser Console for:"
    echo "   - '=== FETCHING UNMAPPED ASSETS ===' logs"
    echo "   - LocationId and URL being used"
    echo ""
    echo "3. Clear browser cache:"
    echo "   - Cmd+Shift+R (hard reload)"
    echo "   - Or clear Local Storage and reload"
    echo ""
    echo "4. Verify .env has: PUBLIC_API_URL=http://localhost:12001"
    echo "   Then rebuild frontend:"
    echo "   ./REBUILD_FRONTEND.sh"
    
elif [ "$UNMAPPED_HTTP_CODE" = "404" ]; then
    echo "❌ ENDPOINT NOT FOUND (404)"
    echo ""
    echo "The Spring controller is NOT registering this endpoint!"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Rebuild backend without cache:"
    echo "   docker compose build --no-cache api"
    echo "   docker compose up -d"
    echo ""
    echo "2. Verify LocationController.java has the correct mapping:"
    echo "   Line 127: @GetMapping(\"/{id}/assets/unmapped\")"
    echo ""
    echo "3. Check if there are multiple LocationController classes:"
    echo "   find api/src -name \"LocationController.java\""
    echo ""
    echo "4. Check Spring component scan configuration"
    
else
    echo "⚠️  UNEXPECTED ERROR: HTTP $UNMAPPED_HTTP_CODE"
    echo ""
    echo "Check backend logs:"
    echo "docker compose logs atlas-cmms-backend --tail=100"
fi

echo ""
echo "========================================="
