#!/usr/bin/env bash
# Recria o banco do zero, aplica migrations + seed e roda a suite como o papel
# da aplicacao (nao superusuario) — do contrario RLS seria ignorada e os testes
# de isolamento nao provariam nada.
set -euo pipefail

DB=${DB:-crm_v2_test}
HOST=${PGHOST:-127.0.0.1}
ADMIN_USER=${ADMIN_USER:-crm}
ADMIN_PASS=${ADMIN_PASS:-crm}
APP_USER=${APP_USER:-crm_test}
APP_PASS=${APP_PASS:-crm_test}
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export PGPASSWORD="$ADMIN_PASS"
admin() { psql -q -v ON_ERROR_STOP=1 -h "$HOST" -U "$ADMIN_USER" -d "$1" "${@:2}"; }

echo "==> recriando $DB"
admin postgres -c "drop database if exists $DB;" -c "create database $DB owner $ADMIN_USER;" >/dev/null

echo "==> migrations"
for f in "$HERE"/../migrations/0*.sql; do
  admin "$DB" -f "$f" >/dev/null
  printf '    %s\n' "$(basename "$f")"
done

echo "==> seed"
admin "$DB" -f "$HERE/../seeds/dev_seed.sql" >/dev/null

echo "==> papel de aplicacao"
admin "$DB" \
  -c "do \$\$ begin
        if not exists (select 1 from pg_roles where rolname = '$APP_USER') then
          create role $APP_USER login password '$APP_PASS';
        end if;
      end \$\$;" \
  -c "grant crm_app to $APP_USER;" >/dev/null
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
