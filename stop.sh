#!/bin/bash
# Para tudo que o ./start.sh subiu.
echo "Parando PerfectJob..."

# API rodando via Docker (quando nao ha Java no host)
docker rm -f perfectjob-api >/dev/null 2>&1 && echo "  API (Docker) parada" || true

# Processos por porta: API nativa (8080), Metro (8081), Admin (5173)
for p in 8080 8081 5173; do
  pids=$(lsof -ti:$p 2>/dev/null)
  if [ -n "$pids" ]; then
    kill -9 $pids 2>/dev/null && echo "  porta $p liberada"
  fi
done

# Garante que o Expo/Metro encerrou
pkill -f "expo start" >/dev/null 2>&1 || true

# Postgres + Redis
docker compose down >/dev/null 2>&1 && echo "  Postgres/Redis parados" || true

echo "Tudo parado."
