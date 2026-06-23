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
# 0. Docker precisa estar rodando
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
# 2. API (Spring Boot) - Java do host se houver Java 21+, senao via Docker
# ---------------------------------------------------------------------------
echo "[2/5] API (Spring Boot)..."
JAVA_OK=0
if command -v java >/dev/null 2>&1; then
  JV=$(java -version 2>&1 | head -1 | grep -oE '[0-9]+' | head -1)
  [ "${JV:-0}" -ge 21 ] && JAVA_OK=1
fi

if [ "$JAVA_OK" = "1" ]; then
  echo "      usando Java do host ($(java -version 2>&1 | head -1))"
  ( cd perfectjob-api && nohup ./mvnw -q -Dmaven.test.skip=true spring-boot:run \
      > /tmp/perfectjob-api.log 2>&1 & )
else
  echo "      Java nao encontrado no host -> rodando a API via Docker (maven:21)"
  docker rm -f "$API_CONTAINER" >/dev/null 2>&1 || true
  docker run -d --name "$API_CONTAINER" -p ${API_PORT}:8080 \
    --add-host=host.docker.internal:host-gateway \
    -e DB_URL=jdbc:postgresql://host.docker.internal:5432/perfectjob \
    -e DB_USER=perfectjob -e DB_PASSWORD=perfectjob \
    -e REDIS_HOST=host.docker.internal \
    -e TECTONIC_PATH=/usr/local/bin/tectonic \
    -e PERFECTJOB_RESUME_STORAGE_DIR=/app/data/resumes \
    -e OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-}" \
    -e OPENROUTER_MODEL="${OPENROUTER_MODEL:-deepseek/deepseek-chat}" \
    -e OPENROUTER_BASE_URL="${OPENROUTER_BASE_URL:-https://openrouter.ai/api/v1}" \
    -v "$ROOT/perfectjob-api":/app -w /app -v perfectjob-m2:/root/.m2 \
    -v "$ROOT/data/resumes":/app/data/resumes \
    maven:3.9-eclipse-temurin-21 bash -c '
      set -e
      # Install tectonic (LaTeX engine) into the container
      if ! command -v tectonic >/dev/null 2>&1; then
        echo "Installing tectonic..."
        curl -fsSL https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic@0.15.0/tectonic-x86_64-unknown-linux-gnu.tar.gz | tar -xz -C /tmp
        mv /tmp/tectonic-x86_64-unknown-linux-gnu/tectonic /usr/local/bin/tectonic
        chmod +x /usr/local/bin/tectonic
        # Warm font/asset cache by compiling a trivial doc
        echo "Warming tectonic cache..."
        mkdir -p /tmp/tectonic-warm && cd /tmp/tectonic-warm
        printf "\\documentclass{article}\\begin{document}warm\\end{document}" > warm.tex
        tectonic --keep-logs --outdir . warm.tex >/dev/null 2>&1 || true
      fi
      mkdir -p /app/data/resumes
      mvn -q -Dmaven.test.skip=true spring-boot:run
    ' >/dev/null
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
( cd perfectjob-mobile && nohup npx expo start --offline --port ${METRO_PORT} \
    > /tmp/perfectjob-mobile.log 2>&1 & )
echo "      Metro (offline) na porta ${METRO_PORT}"

# ---------------------------------------------------------------------------
# 5. Admin (Vite)
# ---------------------------------------------------------------------------
echo "[5/5] Admin (Vite)..."
( cd perfectjob-admin && nohup npm run dev > /tmp/perfectjob-admin.log 2>&1 & )
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
echo "    API:    docker logs -f ${API_CONTAINER}   (ou tail -f /tmp/perfectjob-api.log)"
echo "    Mobile: tail -f /tmp/perfectjob-mobile.log"
echo "    Admin:  tail -f /tmp/perfectjob-admin.log"
echo ""
echo "  Para parar tudo:  ./stop.sh"
echo ""
