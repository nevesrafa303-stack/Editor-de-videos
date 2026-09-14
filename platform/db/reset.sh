#!/usr/bin/env bash
# Recria o banco do zero: migrations em ordem, seed e papel da aplicacao.
#
# Usado pela suite SQL e pela suite TypeScript. Integracao sem estado conhecido
# nao e teste: e adivinhacao sobre o que sobrou da execucao anterior.
set -euo pipefail

DB=${DB:-crm_v2_test}
HOST=${PGHOST:-127.0.0.1}
ADMIN_USER=${ADMIN_USER:-crm}
ADMIN_PASS=${ADMIN_PASS:-crm}
APP_USER=${APP_USER:-crm_test}
APP_PASS=${APP_PASS:-crm_test}
QUIET=${QUIET:-0}
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export PGPASSWORD="$ADMIN_PASS"
admin() { psql -q -v ON_ERROR_STOP=1 -h "$HOST" -U "$ADMIN_USER" -d "$1" "${@:2}"; }
say() { [ "$QUIET" = "1" ] || echo "$@"; }

say "==> recriando $DB"

# Derruba conexoes abertas antes de dropar. Sem isto, um `next dev` esquecido
# em outra aba faz o reset falhar em silencio e a suite seguinte roda contra o
# banco velho — que e pior do que falhar.
admin postgres -c "
  select pg_terminate_backend(pid)
    from pg_stat_activity
   where datname = '$DB' and pid <> pg_backend_pid();
" >/dev/null

admin postgres -c "drop database if exists $DB;" -c "create database $DB owner $ADMIN_USER;" >/dev/null

say "==> migrations"
for f in "$HERE"/migrations/0*.sql; do
  admin "$DB" -f "$f" >/dev/null
  say "    $(basename "$f")"
done

say "==> seed"
admin "$DB" -f "$HERE/seeds/dev_seed.sql" >/dev/null

say "==> papel da aplicacao ($APP_USER)"
admin "$DB" \
  -c "do \$\$ begin
        if not exists (select 1 from pg_roles where rolname = '$APP_USER') then
          create role $APP_USER login password '$APP_PASS';
        end if;
      end \$\$;" \
  -c "grant crm_app to $APP_USER;" >/dev/null 2>&1
