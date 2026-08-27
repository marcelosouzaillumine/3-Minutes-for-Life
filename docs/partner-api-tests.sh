#!/usr/bin/env bash
# Partner API — curl test suite
# Usage: API_KEY=3mfl_xxx PROJECT_REF=abcxyz bash docs/partner-api-tests.sh

BASE_URL="https://${PROJECT_REF}.supabase.co/functions/v1/partner-api"
KEY="${API_KEY:-}"

if [ -z "$KEY" ] || [ -z "$PROJECT_REF" ]; then
  echo "Usage: API_KEY=3mfl_xxx PROJECT_REF=abcxyz bash docs/partner-api-tests.sh"
  exit 1
fi

H="Authorization: Bearer $KEY"
SEP="─────────────────────────────────────────"

run() {
  local label="$1"; shift
  echo -e "\n$SEP\n▶ $label"
  curl -s -w "\n[HTTP %{http_code} | %{time_total}s]\n" -H "$H" "$@"
}

# ── Auth ─────────────────────────────────────────────────────────────────────

run "No key → 401" "${BASE_URL}/devotionals/today"  # sem header

run "Wrong key → 401" \
  -H "Authorization: Bearer 3mfl_INVALIDO" \
  "${BASE_URL}/devotionals/today"

# ── Today ────────────────────────────────────────────────────────────────────

run "Today — pt-BR (default)" \
  "${BASE_URL}/devotionals/today"

run "Today — English" \
  "${BASE_URL}/devotionals/today?lang=en"

run "Today — Spanish" \
  "${BASE_URL}/devotionals/today?lang=es"

run "Today — lang inválido cai em pt-BR" \
  "${BASE_URL}/devotionals/today?lang=fr"

# ── Library ──────────────────────────────────────────────────────────────────

run "Library — primeira página pt-BR" \
  "${BASE_URL}/devotionals?page=1&limit=5"

run "Library — segunda página" \
  "${BASE_URL}/devotionals?page=2&limit=5"

run "Library — English, limit 3" \
  "${BASE_URL}/devotionals?lang=en&limit=3"

run "Library — limit máximo (100)" \
  "${BASE_URL}/devotionals?limit=100"

# ── By ID ────────────────────────────────────────────────────────────────────

# Substitua pelo id real de um devocional publicado
DEVOTIONAL_ID="${DEVOTIONAL_ID:-1}"

run "By legacy_id (inteiro)" \
  "${BASE_URL}/devotionals/${DEVOTIONAL_ID}"

run "By legacy_id — English" \
  "${BASE_URL}/devotionals/${DEVOTIONAL_ID}?lang=en"

run "ID inexistente → 404" \
  "${BASE_URL}/devotionals/99999"

# ── Erros ────────────────────────────────────────────────────────────────────

run "Endpoint desconhecido → 404" \
  "${BASE_URL}/categories"

run "Método POST → 405" \
  -X POST "${BASE_URL}/devotionals/today"

echo -e "\n$SEP\n✓ Testes concluídos"
