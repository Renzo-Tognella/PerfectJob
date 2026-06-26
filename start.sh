#!/bin/bash
set -uo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

API_PORT=8080
METRO_PORT=8081
ADMIN_PORT=5173
API_CONTAINER=perfectjob-api
LOG_DIR=/tmp
PIDS_DIR=/tmp/perfectjob-pids
mkdir -p "$PIDS_DIR"

log()  { echo "[start] $*"; }
warn() { echo "[start] AVISO: $*" >&2; }
die()  { echo "[start] ERRO: $*" >&2; exit 1; }

log "============================================================"
log "  PerfectJob — subindo aplicação"
log "============================================================"
echo ""

log "[0/6] Checando pré-requisitos..."

if ! docker info >/dev/null 2>&1; then
  die "Docker não está rodando.
  Mac/Windows: abra o Docker Desktop e espere o ícone ficar verde.
  Linux: sudo systemctl start docker"
fi
log "  Docker: OK"

if [ ! -f "${ROOT}/.env" ]; then
  if [ -f "${ROOT}/.env.example" ]; then
    cp "${ROOT}/.env.example" "${ROOT}/.env"
    warn ".env criado a partir de .env.example.
    Edite o arquivo .env e preencha OPENROUTER_API_KEY para usar geração de currículo.
    Pegue em https://openrouter.ai/keys
    Sem ela, o resto funciona normalmente."
  else
    die "Nem .env nem .env.example encontrados em ${ROOT}"
  fi
fi

set -a
# shellcheck disable=SC1091
source "${ROOT}/.env"
set +a

if [ -z "${OPENROUTER_API_KEY:-}" ]; then
  warn "OPENROUTER_API_KEY vazia. Geração de currículo via IA vai falhar (401). O resto funciona."
fi

if ! command -v node >/dev/null 2>&1; then
  die "Node.js não encontrado. Instale Node 20+ de https://nodejs.org/"
fi
NV=$(node --version 2>/dev/null | grep -oE '[0-9]+' | head -1)
if [ "${NV:-0}" -lt 20 ]; then
  warn "Node $(node --version) detectado. Recomendado 20+."
fi
log "  Node $(node --version): OK"
echo ""

detect_lan_ip() {
  local ip=""
  if command -v ipconfig >/dev/null 2>&1; then
    ip=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)
  fi
  if [ -z "$ip" ] && command -v hostname >/dev/null 2>&1; then
    ip=$(hostname -I 2>/dev/null | awk '{print $1}')
  fi
  echo "${ip:-localhost}"
}
LAN_IP="$(detect_lan_ip)"
API_URL="http://${LAN_IP}:${API_PORT}/api"
log "IP da LAN detectado: ${LAN_IP}"
log "API_URL do mobile:   ${API_URL}"
echo ""

log "Liberando portas de execuções anteriores..."
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${API_CONTAINER}$"; then
  log "  API container antigo encontrado — removendo..."
  docker rm -f "$API_CONTAINER" >/dev/null 2>&1 || true
fi
for port in $METRO_PORT $ADMIN_PORT; do
  pids=$(lsof -ti:$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    log "  Porta ${port} ocupada — matando PIDs antigos..."
    kill -9 $pids 2>/dev/null || true
    sleep 1
  fi
done
echo ""

log "[1/6] PostgreSQL + Redis..."
if lsof -ti:5432 >/dev/null 2>&1; then
  if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^perfectjob-postgres$'; then
    log "  Porta 5432 ocupada por processo que NÃO é o container. Tentando liberar..."
    if command -v brew >/dev/null 2>&1; then
      brew services stop postgresql@16 >/dev/null 2>&1 || true
      brew services stop postgresql@14 >/dev/null 2>&1 || true
    fi
    pids=$(lsof -ti:5432 2>/dev/null || true)
    [ -n "$pids" ] && kill -9 $pids 2>/dev/null || true
    sleep 2
  fi
fi

docker compose up -d postgres redis >/dev/null 2>&1 || die "docker compose up falhou. Veja: docker compose logs"

log -n "  Aguardando Postgres ficar pronto"
READY=0
for i in $(seq 1 90); do
  if docker exec perfectjob-postgres pg_isready -U perfectjob -d perfectjob >/dev/null 2>&1; then
    READY=1; break
  fi
  echo -n "."; sleep 1
done
echo ""
[ "$READY" = "1" ] || die "Postgres não ficou pronto em 90s. Veja: docker compose logs postgres"
log "  Postgres + Redis: OK"
echo ""

log "[2/6] API (Spring Boot)..."
if [ ! -x "${HOME}/.local/bin/tectonic" ]; then
  log "  Instalando tectonic (LaTeX engine, só na 1ª vez)..."
  bash "${ROOT}/scripts/install-tectonic.sh" >/dev/null 2>&1 || true
fi

JAVA_OK=0
if command -v java >/dev/null 2>&1; then
  JV=$(java -version 2>&1 | head -1 | grep -oE '[0-9]+' | head -1)
  [ "${JV:-0}" -ge 21 ] && JAVA_OK=1
fi
TECTONIC_OK=0
[ -x "${HOME}/.local/bin/tectonic" ] && TECTONIC_OK=1

export DB_URL="${DB_URL:-jdbc:postgresql://localhost:5432/perfectjob}"
export DB_USER="${DB_USER:-perfectjob}"
export DB_PASSWORD="${DB_PASSWORD:-perfectjob}"
export REDIS_HOST="${REDIS_HOST:-localhost}"
export PERFECTJOB_RESUME_STORAGE_DIR="${ROOT}/data/resumes"

if [ "$JAVA_OK" = "1" ] && [ "$TECTONIC_OK" = "1" ]; then
  log "  Modo: Java do host ($(java -version 2>&1 | head -1)) + tectonic local"
  export PATH="${HOME}/.local/bin:$PATH"
  export TECTONIC_PATH="${HOME}/.local/bin/tectonic"
  (
    cd perfectjob-api
    nohup ./mvnw -q -Dmaven.test.skip=true spring-boot:run \
      > "${LOG_DIR}/perfectjob-api.log" 2>&1 &
    echo $! > "${PIDS_DIR}/api.pid"
  )
else
  log "  Modo: API via Docker (Java 21+ e/ou tectonic ausentes no host)"
  export DB_URL="jdbc:postgresql://host.docker.internal:5432/perfectjob"
  export DB_USER="perfectjob"
  export DB_PASSWORD="perfectjob"
  export REDIS_HOST="host.docker.internal"
  export PERFECTJOB_RESUME_STORAGE_DIR="/app/data/resumes"
  export TECTONIC_PATH="/usr/local/bin/tectonic"
  docker run -d --name "$API_CONTAINER" -p ${API_PORT}:8080 \
    --add-host=host.docker.internal:host-gateway \
    -e DB_URL -e DB_USER -e DB_PASSWORD -e REDIS_HOST \
    -e TECTONIC_PATH -e PERFECTJOB_RESUME_STORAGE_DIR \
    -e OPENROUTER_API_KEY -e OPENROUTER_MODEL -e OPENROUTER_BASE_URL \
    -e INGESTION_ENABLED -e INGESTION_CRON -e INGESTION_LIMIT \
    -v "$ROOT/perfectjob-api":/app -w /app -v perfectjob-m2:/root/.m2 \
    -v "$ROOT/data/resumes":/app/data/resumes \
    maven:3.9-eclipse-temurin-21 bash /app/scripts/docker-api-entrypoint.sh >/dev/null
fi

log "  Aguardando API responder (1ª vez: Maven baixa ~600MB, pode levar até 10min)..."
READY=0
for i in $(seq 1 600); do
  if curl -sf --max-time 3 "http://localhost:${API_PORT}/api/v1/jobs" >/dev/null 2>&1; then
    READY=1; break
  fi
  if [ $((i % 15)) -eq 0 ]; then
    log "    ...${i}s (se travou, veja: docker logs -f perfectjob-api)"
  fi
  sleep 1
done
[ "$READY" = "1" ] || die "API não respondeu em 600s. Logs:
  Docker: docker logs perfectjob-api
  Host:   tail -f ${LOG_DIR}/perfectjob-api.log"
log "  API: OK"
echo ""

log "[3/6] Dependências do mobile/admin..."
if [ ! -d perfectjob-mobile/node_modules ]; then
  log "  Instalando deps do mobile (npm install)..."
  ( cd perfectjob-mobile && npm install --silent ) || die "npm install mobile falhou"
fi
if [ ! -d perfectjob-admin/node_modules ]; then
  log "  Instalando deps do admin (npm install)..."
  ( cd perfectjob-admin && npm install --silent ) || die "npm install admin falhou"
fi
log "  Deps: OK"
echo ""

log "[4/6] Mobile (Expo/Metro)..."
cat > perfectjob-mobile/.env <<EOF
API_URL=${API_URL}
APP_VARIANT=development
EOF
(
  cd perfectjob-mobile
  PATH="${HOME}/.local/bin:$PATH" nohup npx expo start --offline --port ${METRO_PORT} \
    > "${LOG_DIR}/perfectjob-mobile.log" 2>&1 &
  echo $! > "${PIDS_DIR}/metro.pid"
)
log -n "  Aguardando Metro"
READY=0
for i in $(seq 1 90); do
  if curl -sf --max-time 2 "http://localhost:${METRO_PORT}" >/dev/null 2>&1; then
    READY=1; break
  fi
  echo -n "."; sleep 1
done
echo ""
if [ "$READY" != "1" ]; then
  warn "Metro não respondeu em 90s. Veja: tail -f ${LOG_DIR}/perfectjob-mobile.log"
else
  log "  Metro: OK"
fi
echo ""

log "[5/6] Admin (Vite)..."
(
  cd perfectjob-admin
  nohup npm run dev -- --port ${ADMIN_PORT} > "${LOG_DIR}/perfectjob-admin.log" 2>&1 &
  echo $! > "${PIDS_DIR}/admin.pid"
)
log -n "  Aguardando Admin"
READY=0
for i in $(seq 1 90); do
  if curl -sf --max-time 2 "http://localhost:${ADMIN_PORT}" >/dev/null 2>&1; then
    READY=1; break
  fi
  echo -n "."; sleep 1
done
echo ""
if [ "$READY" != "1" ]; then
  warn "Admin não respondeu em 90s. Veja: tail -f ${LOG_DIR}/perfectjob-admin.log"
else
  log "  Admin: OK"
fi
echo ""

log "[6/6] Health-check final..."
HEALTH_OK=true
for url_label in "API|http://localhost:${API_PORT}/api/v1/jobs" \
                 "Swagger|http://localhost:${API_PORT}/api/swagger-ui.html" \
                 "Admin|http://localhost:${ADMIN_PORT}" \
                 "Metro|http://localhost:${METRO_PORT}"; do
  label="${url_label%%|*}"
  url="${url_label##*|}"
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$url" 2>/dev/null || echo "000")
  if [ "$code" = "000" ]; then
    warn "  ${label}: FALHOU (sem resposta)"
    HEALTH_OK=false
  else
    log "  ${label}: HTTP ${code}"
  fi
done
echo ""

echo "============================================================"
echo "  PerfectJob no ar!"
echo "============================================================"
echo "  API:      http://localhost:${API_PORT}/api"
echo "  Swagger:  http://localhost:${API_PORT}/api/swagger-ui.html"
echo "  Admin:    http://localhost:${ADMIN_PORT}"
echo "  Mobile:   exp://${LAN_IP}:${METRO_PORT}  (Expo Go, mesma rede Wi-Fi)"
echo ""
echo "  Logs:"
echo "    API:    docker logs -f perfectjob-api   (Docker)"
echo "            tail -f ${LOG_DIR}/perfectjob-api.log   (host)"
echo "    Mobile: tail -f ${LOG_DIR}/perfectjob-mobile.log"
echo "    Admin:  tail -f ${LOG_DIR}/perfectjob-admin.log"
echo ""
echo "  Parar tudo: ./stop.sh"
echo "============================================================"