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
# Glob por DIGITO, nao por "0*": o glob antigo parou de pegar as suites no
# decimo arquivo (`10_import.sql`), e o resumo continuou verde — que e a pior
# forma de um teste falhar. Mesmo motivo de a lista ter deixado de ser escrita
# a mao; a armadilha so mudou de forma.
SUITES=()
for f in "$HERE"/[0-9]*.sql; do SUITES+=(-f "$f"); done

if [ ${#SUITES[@]} -eq 0 ]; then
  echo "Nenhuma suite encontrada em $HERE" >&2
  exit 1
fi

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
