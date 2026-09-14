#!/usr/bin/env bash
# Recria o banco do zero, aplica migrations + seed e roda a suite como o papel
# da aplicacao (nao superusuario) — do contrario RLS seria ignorada e os testes
# de isolamento nao provariam nada.
set -euo pipefail

DB=${DB:-crm_v2_test}
export DB
HOST=${PGHOST:-127.0.0.1}
ADMIN_USER=${ADMIN_USER:-crm}
ADMIN_PASS=${ADMIN_PASS:-crm}
APP_USER=${APP_USER:-crm_test}
APP_PASS=${APP_PASS:-crm_test}
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export PGPASSWORD="$ADMIN_PASS"
admin() { psql -q -v ON_ERROR_STOP=1 -h "$HOST" -U "$ADMIN_USER" -d "$1" "${@:2}"; }

"$HERE/../reset.sh"
admin "$DB" -f "$HERE/_helpers.sql" >/dev/null

echo "==> testes"

# Descoberta por glob, nao lista a mao: suite nova que ninguem lembrou de
# registrar no runner e suite que nao roda — e ninguem percebe, porque o
# resumo continua verde.
SUITES=()
for f in "$HERE"/0*.sql; do SUITES+=(-f "$f"); done

PGPASSWORD="$APP_PASS" psql -q -v ON_ERROR_STOP=1 -h "$HOST" -U "$APP_USER" -d "$DB" \
  "${SUITES[@]}" 2>&1 \
  | sed -E 's/^psql:[^:]+:[0-9]+: //' \
  | grep -E '^(NOTICE|ERROR|DETAIL)' \
  | sed -E 's/^NOTICE:  //'

echo
admin "$DB" -c "select * from test.summary();"
FAILED=$(admin "$DB" -tAc "select count(*) from test.result where not passed")
admin "$DB" -tAc "select '  FALHOU: ' || suite || ' / ' || description || ' -> ' || coalesce(detail,'') from test.result where not passed"

if [ "$FAILED" -gt 0 ]; then
  echo "==> $FAILED teste(s) falharam"
  exit 1
fi
echo "==> todos os testes passaram"
