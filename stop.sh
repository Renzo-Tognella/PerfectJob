#!/bin/bash
set -uo pipefail

PIDS_DIR=/tmp/perfectjob-pids
LOG_DIR=/tmp

echo "Parando PerfectJob..."

for label in metro admin api; do
  pidfile="${PIDS_DIR}/${label}.pid"
  if [ -f "$pidfile" ]; then
    pid=$(cat "$pidfile")
    if kill -0 "$pid" 2>/dev/null; then
      kill -TERM "$pid" 2>/dev/null || true
      sleep 1
      kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null || true
      echo "  ${label} (PID ${pid}): parado"
    fi
    rm -f "$pidfile"
  fi
done

if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^perfectjob-api$'; then
  docker rm -f perfectjob-api >/dev/null 2>&1
  echo "  API (Docker container): parada"
fi

for p in 8080 8081 5173; do
  pids=$(lsof -ti:$p 2>/dev/null || true)
  if [ -n "$pids" ]; then
    kill -9 $pids 2>/dev/null || true
    echo "  porta ${p}: liberada"
  fi
done

pkill -f "expo start" >/dev/null 2>&1 || true
pkill -f "vite" >/dev/null 2>&1 || true
pkill -f "spring-boot:run" >/dev/null 2>&1 || true

docker compose down >/dev/null 2>&1 && echo "  Postgres/Redis: parados" || true

echo ""
echo "Tudo parado."