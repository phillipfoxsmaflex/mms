#!/bin/bash

echo "========================================="
echo "Frontend Configuration Check"
echo "========================================="
echo ""

# Check .env file
echo "1. Checking .env file..."
if [ -f .env ]; then
    echo "   ✅ .env exists"
    
    if grep -q "PUBLIC_API_URL" .env; then
        API_URL=$(grep PUBLIC_API_URL .env | cut -d'=' -f2)
        echo "   ✅ PUBLIC_API_URL found: $API_URL"
        
        if [[ "$API_URL" == *"12001"* ]]; then
            echo "   ✅ Correct port 12001"
        else
            echo "   ❌ WARNING: URL does not contain port 12001!"
            echo "      Found: $API_URL"
            echo "      Should be: http://localhost:12001"
        fi
    else
        echo "   ❌ PUBLIC_API_URL not found in .env"
        echo ""
        echo "   Add this line to .env:"
        echo "   PUBLIC_API_URL=http://localhost:12001"
    fi
else
    echo "   ❌ .env file not found!"
    echo ""
    echo "   Create .env:"
    echo "   cp .env.example .env"
    echo "   echo 'PUBLIC_API_URL=http://localhost:12001' >> .env"
fi
echo ""

# Check docker-compose.yml
echo "2. Checking docker-compose.yml..."
if [ -f docker-compose.yml ]; then
    echo "   ✅ docker-compose.yml exists"
    
    # Check backend port
    BACKEND_PORT=$(grep -A 2 "atlas-cmms-backend:" docker-compose.yml | grep -o "[0-9]*:8080" | cut -d':' -f1)
    if [ -n "$BACKEND_PORT" ]; then
        echo "   Backend external port: $BACKEND_PORT"
    fi
    
    # Check frontend port
    FRONTEND_PORT=$(grep -A 2 "atlas-cmms-frontend:" docker-compose.yml | grep -o "[0-9]*:3000" | cut -d':' -f1)
    if [ -n "$FRONTEND_PORT" ]; then
        echo "   Frontend external port: $FRONTEND_PORT"
    fi
    
    # Check environment variable usage
    if grep -q "API_URL: \${PUBLIC_API_URL}" docker-compose.yml; then
        echo "   ✅ Frontend uses PUBLIC_API_URL from .env"
    else
        echo "   ⚠️  Frontend may not be configured to use PUBLIC_API_URL"
    fi
else
    echo "   ❌ docker-compose.yml not found!"
fi
echo ""

# Check if containers are running
echo "3. Checking container status..."
BACKEND_STATUS=$(docker compose ps atlas-cmms-backend --format json 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4)
FRONTEND_STATUS=$(docker compose ps atlas-cmms-frontend --format json 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4)

if [ "$BACKEND_STATUS" = "running" ]; then
    echo "   ✅ Backend container running"
else
    echo "   ❌ Backend container NOT running (Status: $BACKEND_STATUS)"
fi

if [ "$FRONTEND_STATUS" = "running" ]; then
    echo "   ✅ Frontend container running"
else
    echo "   ❌ Frontend container NOT running (Status: $FRONTEND_STATUS)"
fi
echo ""

# Check when frontend was built
echo "4. Checking frontend build date..."
FRONTEND_IMAGE=$(docker compose ps atlas-cmms-frontend --format json 2>/dev/null | grep -o '"Image":"[^"]*"' | cut -d'"' -f4)
if [ -n "$FRONTEND_IMAGE" ]; then
    BUILD_DATE=$(docker inspect "$FRONTEND_IMAGE" 2>/dev/null | grep -o '"Created":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$BUILD_DATE" ]; then
        echo "   Frontend image built: $BUILD_DATE"
        echo "   .env last modified: $(stat -f "%Sm" .env 2>/dev/null || stat -c "%y" .env 2>/dev/null || echo "unknown")"
        echo ""
        echo "   ⚠️  If .env was modified AFTER the build date,"
        echo "   you MUST rebuild the frontend:"
        echo "   ./REBUILD_FRONTEND.sh"
    fi
fi
echo ""

# Check actual frontend config inside container
echo "5. Checking config INSIDE frontend container..."
FRONTEND_CONFIG=$(docker compose exec -T atlas-cmms-frontend sh -c 'cat /usr/share/nginx/html/config.js 2>/dev/null || echo "NOT_FOUND"' 2>/dev/null)

if [ "$FRONTEND_CONFIG" != "NOT_FOUND" ]; then
    echo "   ✅ Found config.js in container"
    
    # Extract API URL from config
    CONTAINER_API_URL=$(echo "$FRONTEND_CONFIG" | grep -o "API_URL['\"]:['\"][^'\"]*" | cut -d'"' -f2 | cut -d"'" -f2)
    if [ -n "$CONTAINER_API_URL" ]; then
        echo "   Container API URL: $CONTAINER_API_URL"
        
        if [[ "$CONTAINER_API_URL" == *"12001"* ]]; then
            echo "   ✅ Container is configured for port 12001"
        else
            echo "   ❌ Container is NOT configured for port 12001!"
            echo "      REBUILD REQUIRED!"
        fi
    fi
else
    echo "   ⚠️  Could not read config from container"
    echo "   (This may be normal if using env vars differently)"
fi
echo ""

# Test backend connectivity
echo "6. Testing backend connectivity..."
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:12001/actuator/health 2>/dev/null)
if [ "$BACKEND_HEALTH" = "200" ]; then
    echo "   ✅ Backend accessible at http://localhost:12001"
else
    echo "   ❌ Backend NOT accessible at http://localhost:12001"
    echo "      HTTP Code: $BACKEND_HEALTH"
fi

FRONTEND_ACCESS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:12000 2>/dev/null)
if [ "$FRONTEND_ACCESS" = "200" ]; then
    echo "   ✅ Frontend accessible at http://localhost:12000"
else
    echo "   ❌ Frontend NOT accessible at http://localhost:12000"
    echo "      HTTP Code: $FRONTEND_ACCESS"
fi
echo ""

# Summary
echo "========================================="
echo "SUMMARY & RECOMMENDATIONS"
echo "========================================="
echo ""

ENV_OK=false
CONTAINERS_OK=false
REBUILD_NEEDED=false

# Check if .env is correct
if [ -f .env ] && grep -q "PUBLIC_API_URL.*12001" .env; then
    ENV_OK=true
fi

# Check if containers running
if [ "$BACKEND_STATUS" = "running" ] && [ "$FRONTEND_STATUS" = "running" ]; then
    CONTAINERS_OK=true
fi

# Check if rebuild needed
if [ "$ENV_OK" = true ] && [ -n "$CONTAINER_API_URL" ] && [[ "$CONTAINER_API_URL" != *"12001"* ]]; then
    REBUILD_NEEDED=true
fi

if [ "$ENV_OK" = true ] && [ "$CONTAINERS_OK" = true ] && [ "$REBUILD_NEEDED" = false ]; then
    echo "✅ Configuration looks good!"
    echo ""
    echo "If you're still seeing 404 errors:"
    echo ""
    echo "1. Open browser: http://localhost:12000"
    echo "2. Open DevTools (F12)"
    echo "3. Go to Console tab"
    echo "4. Look for logs starting with '=== FETCHING UNMAPPED ASSETS ==='"
    echo "5. Check what URL is being called"
    echo "6. Send me a screenshot of:"
    echo "   - Console logs"
    echo "   - Network tab (showing the failed request)"
    
elif [ "$REBUILD_NEEDED" = true ]; then
    echo "⚠️  FRONTEND REBUILD NEEDED!"
    echo ""
    echo ".env is correctly configured, but the frontend container"
    echo "was built with the OLD configuration."
    echo ""
    echo "Run this script:"
    echo "   ./REBUILD_FRONTEND.sh"
    echo ""
    echo "This will:"
    echo "1. Stop containers"
    echo "2. Rebuild frontend (5-10 minutes)"
    echo "3. Start containers"
    echo "4. Wait for backend to be ready"
    
elif [ "$ENV_OK" = false ]; then
    echo "❌ .env FILE NEEDS FIXING"
    echo ""
    echo "1. Edit .env file:"
    echo "   nano .env"
    echo ""
    echo "2. Add or update this line:"
    echo "   PUBLIC_API_URL=http://localhost:12001"
    echo ""
    echo "3. Then rebuild:"
    echo "   ./REBUILD_FRONTEND.sh"
    
elif [ "$CONTAINERS_OK" = false ]; then
    echo "❌ CONTAINERS NOT RUNNING"
    echo ""
    echo "Start containers:"
    echo "   docker compose up -d"
    echo ""
    echo "Wait 60 seconds, then check status:"
    echo "   docker compose ps"
    echo ""
    echo "If still failing, check logs:"
    echo "   docker compose logs"
fi

echo ""
echo "========================================="
