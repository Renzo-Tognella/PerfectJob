#!/bin/bash
echo "Parando PerfectJob..."

# Kill API and Admin
kill $(lsof -t -i:8080) 2>/dev/null && echo "  API parada"
kill $(lsof -t -i:5173) 2>/dev/null && echo "  Admin parado"

# Stop Docker
docker compose down 2>/dev/null && echo "  Docker parado"

echo "Tudo parado."
