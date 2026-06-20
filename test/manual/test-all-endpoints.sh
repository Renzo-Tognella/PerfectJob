#!/bin/bash
API="http://localhost:8080/api"
PASS=0
FAIL=0

test() {
    local desc="$1"
    local expected="$2"
    local actual="$3"
    if [ "$actual" = "$expected" ]; then
        printf "  \033[32m✓\033[0m %-60s [HTTP %s]\n" "$desc" "$actual"
        ((PASS++))
    else
        printf "  \033[31m✗\033[0m %-60s [expected %s, got %s]\n" "$desc" "$expected" "$actual"
        ((FAIL++))
    fi
}

http() {
    local method="$1"
    local path="$2"
    local data="$3"
    local token="$4"
    local timeout="${5:-10}"
    local args=(-s -o /tmp/resp.txt -w "%{http_code}" --max-time "$timeout" -X "$method" -H "Content-Type: application/json")
    [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
    if [ -n "$data" ]; then
        args+=(-d "$data")
    fi
    curl "${args[@]}" "${API}${path}" 2>/dev/null
}

# Verificar API
echo "Verificando API..."
if ! curl -s --max-time 5 -o /dev/null http://localhost:8080/api/v3/api-docs; then
    echo "API não está respondendo. Reiniciando..."
    pkill -9 -f java 2>/dev/null
    sleep 3
    cd /Users/renzotognella/TheSearch/PerfectJob/perfectjob-api
    export JAVA_HOME=/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home
    export PATH=$JAVA_HOME/bin:$PATH
    ./mvnw spring-boot:run -Dmaven.test.skip=true > /tmp/api-respawn.log 2>&1 &
    sleep 50
    curl -s --max-time 5 -o /dev/null http://localhost:8080/api/v3/api-docs
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  TESTE EXTENSIVO - API PERFECTJOB                        ║"
echo "╚════════════════════════════════════════════════════════════╝"

echo ""
echo "[SETUP] Criando usuários de teste..."
TS=$(date +%s)
CAND_EMAIL="c.${TS}@p.com"
REC_EMAIL="r.${TS}@p.com"

R=$(http POST /v1/auth/register "{\"fullName\":\"Cand\",\"email\":\"${CAND_EMAIL}\",\"password\":\"password123\"}")
CAND_TOKEN=$(jq -r .accessToken /tmp/resp.txt 2>/dev/null)
test "Register candidate" "200" "$R"

R=$(http POST /v1/auth/register "{\"fullName\":\"Rec\",\"email\":\"${REC_EMAIL}\",\"password\":\"password123\"}")
REC_TOKEN=$(jq -r .accessToken /tmp/resp.txt 2>/dev/null)
test "Register recruiter" "200" "$R"

if [ -z "$CAND_TOKEN" ] || [ "$CAND_TOKEN" = "null" ]; then
    echo "Falha ao obter tokens"
    exit 1
fi

# ============ ENDPOINTS PÚBLICOS ============
echo ""
echo "[1] Endpoints públicos (anônimo):"
test "GET /v1/jobs" "200" "$(http GET /v1/jobs)"
sleep 0.5
test "GET /v1/jobs/featured" "200" "$(http GET /v1/jobs/featured)"
sleep 0.5
test "GET /v1/jobs/stats" "200" "$(http GET /v1/jobs/stats)"
sleep 0.5
test "GET /v1/jobs/suggest?q=dev" "200" "$(http GET '/v1/jobs/suggest?q=dev')"
sleep 0.5
test "GET /v1/jobs?keyword=java" "200" "$(http GET '/v1/jobs?keyword=java')"
sleep 0.5
test "GET /v1/jobs?workModel=REMOTE" "200" "$(http GET '/v1/jobs?workModel=REMOTE')"
sleep 0.5
test "GET /v1/jobs?experienceLevel=JUNIOR" "200" "$(http GET '/v1/jobs?experienceLevel=JUNIOR')"
sleep 0.5
test "GET /v1/jobs/inexistente (404)" "404" "$(http GET /v1/jobs/inexistente-slug)"
sleep 0.5
test "GET /v1/companies" "200" "$(http GET /v1/companies)"
sleep 0.5
test "GET /v1/companies/inexistente (404)" "404" "$(http GET /v1/companies/inexistente-slug)"
sleep 0.5
test "GET /v1/search/jobs?q=dev" "200" "$(http GET '/v1/search/jobs?q=dev')"
sleep 0.5
test "GET /v1/search/suggest?q=j" "200" "$(http GET '/v1/search/suggest?q=j')"

# ============ AUTENTICAÇÃO ============
echo ""
echo "[2] Autenticação:"
test "POST /v1/auth/login (válido)" "200" "$(http POST /v1/auth/login "{\"email\":\"${CAND_EMAIL}\",\"password\":\"password123\"}")"
sleep 0.5
test "POST /v1/auth/login (senha errada)" "401" "$(http POST /v1/auth/login "{\"email\":\"${CAND_EMAIL}\",\"password\":\"wrong\"}")"
sleep 0.5
test "POST /v1/auth/login (email inválido → 400)" "400" "$(http POST /v1/auth/login "{\"email\":\"bad\",\"password\":\"x\"}")"
sleep 0.5
test "POST /v1/auth/register (senha curta → 400)" "400" "$(http POST /v1/auth/register "{\"fullName\":\"X\",\"email\":\"x@x.com\",\"password\":\"123\"}")"
sleep 0.5
test "POST /v1/auth/register (email dup → 409)" "409" "$(http POST /v1/auth/register "{\"fullName\":\"Dup\",\"email\":\"${CAND_EMAIL}\",\"password\":\"password123\"}")"
sleep 0.5
test "GET /v1/auth/me (com token)" "200" "$(http GET /v1/auth/me "" "$CAND_TOKEN")"
sleep 0.5
test "GET /v1/auth/me (token inválido → 401)" "401" "$(http GET /v1/auth/me "" "invalid.token")"

# ============ RBAC ============
echo ""
echo "[3] RBAC (candidato não pode fazer ações de recrutador):"
test "POST /v1/jobs (candidato → 403)" "403" "$(http POST /v1/jobs '{}' "$CAND_TOKEN")"
sleep 0.5
test "POST /v1/companies (candidato → 403)" "403" "$(http POST /v1/companies '{}' "$CAND_TOKEN")"
sleep 0.5
test "DELETE /v1/companies/1 (candidato → 403)" "403" "$(http DELETE /v1/companies/1 "" "$CAND_TOKEN")"
sleep 0.5
test "PATCH /v1/companies/1 (candidato → 400/403)" "403" "$(http PATCH /v1/companies/1 '{}' "$CAND_TOKEN")"
sleep 0.5
test "POST /v1/jobs/1/close (candidato → 403)" "403" "$(http POST /v1/jobs/1/close "" "$CAND_TOKEN")"
sleep 0.5
test "GET /v1/applications/recent (candidato → 403)" "403" "$(http GET /v1/applications/recent "" "$CAND_TOKEN")"
sleep 0.5
test "GET /v1/applications/job/1 (candidato → 403)" "403" "$(http GET /v1/applications/job/1 "" "$CAND_TOKEN")"
sleep 0.5
test "PATCH /v1/applications/1/status (candidato → 403)" "403" "$(http PATCH /v1/applications/1/status '{"status":"ACCEPTED"}' "$CAND_TOKEN")"

# ============ SEM TOKEN ============
echo ""
echo "[4] Endpoints protegidos sem token (401):"
test "POST /v1/jobs" "401" "$(http POST /v1/jobs '{}')"
sleep 0.5
test "POST /v1/jobs/1/close" "401" "$(http POST /v1/jobs/1/close)"
sleep 0.5
test "POST /v1/companies" "401" "$(http POST /v1/companies '{}')"
sleep 0.5
test "POST /v1/applications" "401" "$(http POST /v1/applications '{}')"
sleep 0.5
test "GET /v1/notifications" "401" "$(http GET /v1/notifications)"
sleep 0.5
test "GET /v1/saved-jobs" "401" "$(http GET /v1/saved-jobs)"
sleep 0.5
test "GET /v1/auth/me" "401" "$(http GET /v1/auth/me)"
sleep 0.5
test "DELETE /v1/companies/1" "401" "$(http DELETE /v1/companies/1)"

# ============ VALIDAÇÕES ============
echo ""
echo "[5] Validações Bean Validation (400):"
test "Email inválido no register" "400" "$(http POST /v1/auth/register "{\"fullName\":\"X\",\"email\":\"bad\",\"password\":\"password123\"}")"
sleep 0.5
test "Nome vazio no register" "400" "$(http POST /v1/auth/register "{\"fullName\":\"\",\"email\":\"a@a.com\",\"password\":\"password123\"}")"
sleep 0.5
test "Senha < 8 no register" "400" "$(http POST /v1/auth/register "{\"fullName\":\"V\",\"email\":\"b@b.com\",\"password\":\"12345\"}")"

# ============ CANDIDATO AUTENTICADO ============
echo ""
echo "[6] Candidato autenticado (200):"
test "GET /v1/applications" "200" "$(http GET /v1/applications "" "$CAND_TOKEN")"
sleep 0.5
test "GET /v1/notifications" "200" "$(http GET /v1/notifications "" "$CAND_TOKEN")"
sleep 0.5
test "GET /v1/saved-jobs" "200" "$(http GET /v1/saved-jobs "" "$CAND_TOKEN")"
sleep 0.5
test "GET /v1/saved-jobs/1/check" "200" "$(http GET /v1/saved-jobs/1/check "" "$CAND_TOKEN")"

# ============ CORS ============
echo ""
echo "[7] CORS:"
CORS_OK=$(curl -s --max-time 5 -X OPTIONS "${API}/v1/jobs" -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: POST" -i 2>&1 | grep -c "Access-Control-Allow-Origin: http://localhost:5173")
if [ "$CORS_OK" -gt 0 ]; then
    echo "  \033[32m✓\033[0m CORS permite http://localhost:5173"
    ((PASS++))
else
    echo "  \033[31m✗\033[0m CORS rejeita http://localhost:5173"
    ((FAIL++))
fi

CORS_EVIL=$(curl -s --max-time 5 -X OPTIONS "${API}/v1/jobs" -H "Origin: http://evil.com" -H "Access-Control-Request-Method: POST" -i 2>&1 | grep -c "Access-Control-Allow-Origin: http://evil.com")
if [ "$CORS_EVIL" = "0" ]; then
    echo "  \033[32m✓\033[0m CORS rejeita http://evil.com"
    ((PASS++))
else
    echo "  \033[31m✗\033[0m CORS permite http://evil.com (vulnerabilidade!)"
    ((FAIL++))
fi

# ============ JWT ============
echo ""
echo "[8] JWT (RFC 6750):"
WWW=$(curl -s --max-time 5 -X GET "${API}/v1/jobs" -H "Authorization: Bearer invalid.token" -i 2>&1 | grep -c "WWW-Authenticate: Bearer error=\"invalid_token\"")
if [ "$WWW" -gt 0 ]; then
    echo "  \033[32m✓\033[0m Token inválido → WWW-Authenticate presente"
    ((PASS++))
else
    echo "  \033[31m✗\033[0m Falta WWW-Authenticate"
    ((FAIL++))
fi
test "Token inválido → 401" "401" "$(curl -s --max-time 5 -o /dev/null -w "%{http_code}" -X GET "${API}/v1/jobs" -H 'Authorization: Bearer invalid.token')"

# ============ Estrutura Page<T> ============
echo ""
echo "[9] Estrutura Page<T>:"
PAGE_KEYS=$(curl -s --max-time 5 "${API}/v1/jobs" | jq -r 'keys | sort | join(",")' 2>/dev/null)
test "GET /v1/jobs chaves 'content,page'" "content,page" "$PAGE_KEYS"
sleep 0.5
SEARCH_KEYS=$(curl -s --max-time 5 "${API}/v1/search/jobs?q=test" | jq -r 'keys | sort | join(",")' 2>/dev/null)
if [ "$SEARCH_KEYS" = "$PAGE_KEYS" ]; then
    echo "  \033[32m✓\033[0m /v1/search/jobs mesma estrutura"
    ((PASS++))
else
    echo "  \033[33m⚠\033[0m /v1/search/jobs estrutura diferente: $SEARCH_KEYS"
fi
sleep 0.5
COMPANIES_KEYS=$(curl -s --max-time 5 "${API}/v1/companies" | jq -r 'keys | sort | join(",")' 2>/dev/null)
if [ "$COMPANIES_KEYS" = "$PAGE_KEYS" ]; then
    echo "  \033[32m✓\033[0m /v1/companies mesma estrutura"
    ((PASS++))
fi

# ============ Filtros ============
echo ""
echo "[10] Filtros e queries avançadas:"
test "GET /v1/jobs?page=0&size=5" "200" "$(http GET '/v1/jobs?page=0&size=5')"
sleep 0.5
test "GET /v1/jobs?sort=createdAt,desc" "200" "$(http GET '/v1/jobs?sort=createdAt,desc')"
sleep 0.5
test "GET /v1/jobs?workModel=INVALID (400)" "400" "$(http GET '/v1/jobs?workModel=INVALID')"
sleep 0.5
test "GET /v1/jobs?minSalary=5000" "200" "$(http GET '/v1/jobs?minSalary=5000')"

# ============ Health ============
echo ""
echo "[11] Health checks:"
test "GET /api/swagger-ui.html" "200" "$(curl -s --max-time 5 -L -o /dev/null -w "%{http_code}" "${API}/swagger-ui.html")"
test "GET /api/v3/api-docs" "200" "$(curl -s --max-time 5 -o /dev/null -w "%{http_code}" "${API}/v3/api-docs")"
ENDPOINTS=$(curl -s --max-time 5 "${API}/v3/api-docs" | jq '.paths | keys | length' 2>/dev/null)
echo "  Total de endpoints: $ENDPOINTS"

# ============ RESULTADO ============
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
printf "║  RESULTADO: \033[32m%d PASS\033[0m | \033[31m%d FAIL\033[0m                          ║\n" "$PASS" "$FAIL"
echo "╚════════════════════════════════════════════════════════════╝"

if [ $FAIL -gt 0 ]; then
    exit 1
fi
echo "TODOS OS TESTES PASSARAM!"