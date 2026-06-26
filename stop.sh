

echo "Parando PerfectJob..."


docker rm -f perfectjob-api >/dev/null 2>&1 && echo "  API (Docker) parada" || true


for p in 8080 8081 5173; do
  pids=$(lsof -ti:$p 2>/dev/null)
  if [ -n "$pids" ]; then
    kill -9 $pids 2>/dev/null && echo "  porta $p liberada"
  fi
done


pkill -f "expo start" >/dev/null 2>&1 || true


docker compose down >/dev/null 2>&1 && echo "  Postgres/Redis parados" || true

echo "Tudo parado."
