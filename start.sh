#!/bin/bash
# =============================================================================
# PerfectJob - Sobe TUDO localmente com um comando:
#   - PostgreSQL + Redis (Docker Compose)
#   - API Spring Boot (Java do host se houver; senao via Docker, sem precisar de JDK)
#   - App mobile (Expo/Metro em modo --offline)
#   - Painel Admin (Vite)
#
# Detecta automaticamente o IP da sua rede (LAN) e configura o app mobile para
# apontar para ele, para que funcione em um celular fisico via Expo Go.
#
# Uso:  ./start.sh        (sobe tudo em background)
#       ./stop.sh         (para tudo)
# =============================================================================

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

API_PORT=8080
METRO_PORT=8081
ADMIN_PORT=5173
API_CONTAINER=perfectjob-api

# ---------------------------------------------------------------------------
# Carrega .env (OPENROUTER_API_KEY, DB_*, etc.) se existir.
# ---------------------------------------------------------------------------
if [ -f "${ROOT}/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT}/.env"
  set +a
fi

# ---------------------------------------------------------------------------
# Detecta o IP da LAN (para o celular alcancar a API/Metro)
# ---------------------------------------------------------------------------
detect_lan_ip() {
  local ip=""
  if command -v ipconfig >/dev/null 2>&1; then                  # macOS
    ip=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)
  fi
  if [ -z "$ip" ] && command -v hostname >/dev/null 2>&1; then  # Linux
    ip=$(hostname -I 2>/dev/null | awk '{print $1}')
  fi
  echo "${ip:-localhost}"
}

LAN_IP="$(detect_lan_ip)"
API_URL="http://${LAN_IP}:${API_PORT}/api"

echo "=========================================="
echo "  PerfectJob - subindo aplicacao"
echo "=========================================="
echo "  IP da LAN detectado: ${LAN_IP}"
echo "  API_URL do mobile:   ${API_URL}"
echo ""

# ---------------------------------------------------------------------------
# 0. Docker precisa estar rodando (Postgres + Redis vivem no Docker mesmo
#    quando a API roda no host).
# ---------------------------------------------------------------------------
if ! docker info >/dev/null 2>&1; then
  echo "ERRO: Docker nao esta rodando. Abra o Docker Desktop e tente de novo."
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. Infra: PostgreSQL + Redis
# ---------------------------------------------------------------------------
echo "[1/5] PostgreSQL + Redis..."
docker compose up -d postgres redis >/dev/null
echo -n "      aguardando o Postgres ficar pronto"
for _ in $(seq 1 30); do
  if docker exec perfectjob-postgres pg_isready -U perfectjob -d perfectjob >/dev/null 2>&1; then break; fi
  echo -n "."; sleep 1
done
echo " OK"

# ---------------------------------------------------------------------------
# 2. API (Spring Boot) - Java do host se houver Java 21+ E tectonic local,
#    senao via Docker (que baixa tectonic estaticamente).
# ---------------------------------------------------------------------------
echo "[2/5] API (Spring Boot)..."

# Auto-instala tectonic local se ainda nao existir (uma vez so).
if [ ! -x "${HOME}/.local/bin/tectonic" ]; then
  bash "${ROOT}/scripts/install-tectonic.sh" || true
fi

JAVA_OK=0
if command -v java >/dev/null 2>&1; then
  JV=$(java -version 2>&1 | head -1 | grep -oE '[0-9]+' | head -1)
  [ "${JV:-0}" -ge 21 ] && JAVA_OK=1
fi

TECTONIC_OK=0
[ -x "${HOME}/.local/bin/tectonic" ] && TECTONIC_OK=1

# Quando rodamos a API no host, o DB esta em localhost (nao em Docker).
# Quando rodamos em Docker, o DB esta em host.docker.internal.
export DB_URL="${DB_URL:-jdbc:postgresql://localhost:5432/perfectjob}"
export DB_USER="${DB_USER:-perfectjob}"
# O container postgres define POSTGRES_PASSWORD=perfectjob.
export DB_PASSWORD="${DB_PASSWORD:-perfectjob}"
export REDIS_HOST="${REDIS_HOST:-localhost}"
export PERFECTJOB_RESUME_STORAGE_DIR="${ROOT}/data/resumes"

if [ "$JAVA_OK" = "1" ] && [ "$TECTONIC_OK" = "1" ]; then
  echo "      usando Java do host ($(java -version 2>&1 | head -1)) + tectonic local"
  export PATH="${HOME}/.local/bin:$PATH"
  export TECTONIC_PATH="${HOME}/.local/bin/tectonic"
  # Mata qualquer API antiga nessa porta
  old_pids=$(lsof -ti:${API_PORT} 2>/dev/null || true)
  [ -n "$old_pids" ] && kill -9 $old_pids 2>/dev/null || true
  ( cd perfectjob-api && nohup ./mvnw -q -Dmaven.test.skip=true spring-boot:run \
      > /tmp/perfectjob-api.log 2>&1 & )
else
  echo "      Java 21+ e/ou tectonic ausentes no host -> API via Docker"
  export DB_URL="jdbc:postgresql://host.docker.internal:5432/perfectjob"
  export DB_USER="perfectjob"
  export DB_PASSWORD="perfectjob"
  export REDIS_HOST="host.docker.internal"
  export PERFECTJOB_RESUME_STORAGE_DIR="/app/data/resumes"
  export TECTONIC_PATH="/usr/local/bin/tectonic"
  docker rm -f "$API_CONTAINER" >/dev/null 2>&1 || true
  docker run -d --name "$API_CONTAINER" -p ${API_PORT}:8080 \
    --add-host=host.docker.internal:host-gateway \
    -e DB_URL -e DB_USER -e DB_PASSWORD -e REDIS_HOST \
    -e TECTONIC_PATH -e PERFECTJOB_RESUME_STORAGE_DIR \
    -e OPENROUTER_API_KEY -e OPENROUTER_MODEL -e OPENROUTER_BASE_URL \
    -v "$ROOT/perfectjob-api":/app -w /app -v perfectjob-m2:/root/.m2 \
    -v "$ROOT/data/resumes":/app/data/resumes \
    maven:3.9-eclipse-temurin-21 bash /app/scripts/docker-api-entrypoint.sh
fi

echo -n "      aguardando a API responder (compila+migra; pode demorar)"
for _ in $(seq 1 120); do
  if curl -s "http://localhost:${API_PORT}/api/v1/jobs" >/dev/null 2>&1; then break; fi
  echo -n "."; sleep 2
done
echo " OK"

# ---------------------------------------------------------------------------
# 3. Dependencias Node (instala se faltar)
# ---------------------------------------------------------------------------
echo "[3/5] Dependencias do mobile/admin..."
[ -d perfectjob-mobile/node_modules ] || ( cd perfectjob-mobile && npm install --silent )
[ -d perfectjob-admin/node_modules ]  || ( cd perfectjob-admin  && npm install --silent )
echo "      OK"

# ---------------------------------------------------------------------------
# 4. Mobile (Expo/Metro). Escreve o .env com o IP da LAN e sobe em --offline
#    (--offline evita o erro 500 de modo nao-interativo/tunnel do Expo).
# ---------------------------------------------------------------------------
echo "[4/5] Mobile (Expo)..."
cat > perfectjob-mobile/.env <<EOF
API_URL=${API_URL}
APP_VARIANT=development
EOF
# Mata qualquer Metro antigo nessa porta
old_pids=$(lsof -ti:${METRO_PORT} 2>/dev/null || true)
[ -n "$old_pids" ] && kill -9 $old_pids 2>/dev/null || true
( cd perfectjob-mobile && PATH="${HOME}/.local/bin:$PATH" nohup npx expo start --offline --port ${METRO_PORT} \
    > /tmp/perfectjob-mobile.log 2>&1 & )
echo "      Metro (offline) na porta ${METRO_PORT}"

# ---------------------------------------------------------------------------
# 5. Admin (Vite)
# ---------------------------------------------------------------------------
echo "[5/5] Admin (Vite)..."
old_pids=$(lsof -ti:${ADMIN_PORT} 2>/dev/null || true)
[ -n "$old_pids" ] && kill -9 $old_pids 2>/dev/null || true
( cd perfectjob-admin && nohup npm run dev -- --port ${ADMIN_PORT} > /tmp/perfectjob-admin.log 2>&1 & )
echo "      Admin na porta ${ADMIN_PORT}"

echo ""
echo "=========================================="
echo "  Tudo no ar!"
echo "=========================================="
echo "  API:     http://localhost:${API_PORT}/api"
echo "  Swagger: http://localhost:${API_PORT}/api/swagger-ui.html"
echo "  Admin:   http://localhost:${ADMIN_PORT}"
echo "  Mobile:  abra o Expo Go e aponte para  exp://${LAN_IP}:${METRO_PORT}"
echo "           (o celular precisa estar na MESMA rede Wi-Fi)"
echo ""
echo "  Logs:"
echo "    API:    tail -f /tmp/perfectjob-api.log"
echo "    Mobile: tail -f /tmp/perfectjob-mobile.log"
echo "    Admin:  tail -f /tmp/perfectjob-admin.log"
echo ""
echo "  Para parar tudo:  ./stop.sh"
echo ""
