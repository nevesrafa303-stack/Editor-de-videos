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
PGPASSWORD="$APP_PASS" psql -q -v ON_ERROR_STOP=1 -h "$HOST" -U "$APP_USER" -d "$DB" \
  -f "$HERE/01_tenant_isolation.sql" \
  -f "$HERE/02_state_and_scheduling.sql" \
  -f "$HERE/03_clinical_and_traceability.sql" \
  -f "$HERE/04_finance_and_audit.sql" 2>&1 \
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
