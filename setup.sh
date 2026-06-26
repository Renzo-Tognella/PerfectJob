#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "========================================"
echo "  PerfectJob - Development Setup"
echo "========================================"
echo ""

if ! docker info > /dev/null 2>&1; then
    echo "ERRO: Docker nao esta rodando."
    echo "  -> Mac/Windows: abra o Docker Desktop e espere o icone ficar verde"
    echo "  -> Linux:       sudo systemctl start docker"
    exit 1
fi
echo " [OK] Docker rodando"
echo ""

if [ ! -f "${ROOT}/.env" ]; then
    if [ -f "${ROOT}/.env.example" ]; then
        cp "${ROOT}/.env.example" "${ROOT}/.env"
        echo " [OK] .env criado a partir de .env.example"
        echo "      >>> EDITE o arquivo .env e preencha OPENROUTER_API_KEY <<<"
        echo "          (pegue em https://openrouter.ai/keys)"
        echo "          Sem ela, geracao de curriculo via IA nao funciona."
        echo "          O resto da aplicacao sobe normalmente."
        echo ""
    else
        echo "ERRO: .env.example nao encontrado em ${ROOT}"
        exit 1
    fi
else
    echo " [OK] .env ja existe"
fi
echo ""

if command -v node >/dev/null 2>&1; then
    NV=$(node --version | grep -oE '[0-9]+' | head -1)
    if [ "${NV:-0}" -ge 20 ]; then
        echo " [OK] Node $(node --version) detectado"
    else
        echo "AVISO: Node $(node --version) detectado, mas >= 20 eh recomendado."
    fi
else
    echo "AVISO: Node nao instalado. Instale Node 20+ de https://nodejs.org/"
fi
echo ""

if command -v java >/dev/null 2>&1; then
    JV=$(java -version 2>&1 | head -1 | grep -oE '[0-9]+' | head -1)
    if [ "${JV:-0}" -ge 21 ]; then
        echo " [OK] Java $(java -version 2>&1 | head -1) detectado"
    else
        echo "INFO: Java < 21 detectado. API vai subir via Docker automaticamente."
    fi
else
    echo "INFO: Java nao instalado. API vai subir via Docker automaticamente."
fi
echo ""

echo "Subindo PostgreSQL e Redis (Docker)..."
docker compose up -d

echo ""
echo "Aguardando o Postgres..."
RETRIES=30
until docker exec perfectjob-postgres pg_isready -U perfectjob -d perfectjob > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
    sleep 1
    RETRIES=$((RETRIES - 1))
    echo "   ...retrying ($RETRIES left)"
done

if [ $RETRIES -eq 0 ]; then
    echo "ERRO: PostgreSQL nao subiu. Veja os logs com: docker compose logs postgres"
    exit 1
fi
echo " [OK] Postgres pronto"
echo ""

if [ ! -d perfectjob-mobile/node_modules ]; then
    echo "Instalando dependencias do mobile (npm install)..."
    (cd perfectjob-mobile && npm install --silent)
    echo " [OK] mobile pronto"
else
    echo " [OK] mobile node_modules ja existe (pulando npm install)"
fi
echo ""

if [ ! -d perfectjob-admin/node_modules ]; then
    echo "Instalando dependencias do admin (npm install)..."
    (cd perfectjob-admin && npm install --silent)
    echo " [OK] admin pronto"
else
    echo " [OK] admin node_modules ja existe (pulando npm install)"
fi
echo ""

echo "========================================"
echo "  Setup concluido!"
echo "========================================"
echo ""
echo "Proximo passo:"
echo "  ./start.sh                  # sobe TUDO: API + mobile + admin"
echo ""
echo "Ou rode cada parte manualmente:"
echo "  cd perfectjob-api && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev"
echo "  cd perfectjob-mobile && npx expo start --offline"
echo "  cd perfectjob-admin && npm run dev"
echo ""