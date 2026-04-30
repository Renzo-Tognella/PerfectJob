#!/bin/bash
set -e

echo "=========================================="
echo "  PerfectJob - Subindo aplicacao"
echo "=========================================="

if [ -z "$JAVA_HOME" ]; then
  BREW_JAVA="$(brew --prefix openjdk 2>/dev/null)/libexec/openjdk.jdk/Contents/Home"
  if [ -d "$BREW_JAVA" ]; then
    export JAVA_HOME="$BREW_JAVA"
    export PATH="$JAVA_HOME/bin:$PATH"
    echo "[0] JAVA_HOME configurado: $JAVA_HOME"
  else
    echo "ERRO: Java nao encontrado. Instale com: brew install openjdk"
    exit 1
  fi
fi

# 1. Docker (PostgreSQL + Redis)
echo ""
echo "[1/5] Subindo PostgreSQL e Redis..."
docker compose up -d
echo "  OK"

# 2. Instalar dependencias do Admin se necessario
echo ""
echo "[2/5] Verificando dependencias..."
if [ ! -d "perfectjob-admin/node_modules" ]; then
  echo "  Instalando dependencias do Admin..."
  (cd perfectjob-admin && npm install --silent)
fi
echo "  OK"

# 3. Backend
echo ""
echo "[3/5] Subindo API (Spring Boot)..."
cd perfectjob-api
./mvnw spring-boot:run -Dmaven.test.skip=true -q > /tmp/perfectjob-api.log 2>&1 &
API_PID=$!
cd ..
echo "  OK (PID: $API_PID)"

# Esperar API ficar pronta
echo ""
echo "[4/5] Aguardando API responder..."
for i in $(seq 1 30); do
  if curl -s http://localhost:8080/api/v1/jobs > /dev/null 2>&1; then
    echo "  API pronta!"
    break
  fi
  sleep 2
done

# 4. Admin Web
echo ""
echo "[5/5] Subindo Painel Admin..."
cd perfectjob-admin
npm run dev -- --host > /tmp/perfectjob-admin.log 2>&1 &
ADMIN_PID=$!
cd ..
echo "  OK (PID: $ADMIN_PID)"

echo ""
echo "=========================================="
echo "  Tudo pronto!"
echo "=========================================="
echo ""
echo "  API:        http://localhost:8080/api"
echo "  Swagger:    http://localhost:8080/api/swagger-ui.html"
echo "  Admin:      http://localhost:5173"
echo "  Mobile:     npx expo start (em outro terminal)"
echo ""
echo "  Logs da API:   tail -f /tmp/perfectjob-api.log"
echo "  Logs do Admin: tail -f /tmp/perfectjob-admin.log"
echo ""
echo "  Para parar tudo:  ./stop.sh"
echo ""

wait
