#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ "$#" -eq 0 ]]; then
  echo "Usage: $0 <command> [args...]" >&2
  exit 2
fi

if [[ -z "${DATABASE_URL:-}" && -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required to create an isolated test database." >&2
  exit 1
fi

export NODE_ENV=test

if [[ -n "${TEST_DATABASE_URL:-}" ]]; then
  export DATABASE_URL="$TEST_DATABASE_URL"
  export POLY_ALLOW_TEST_DB_RESET=true
  "$@"
  exit $?
fi

db_info="$(
  node <<'NODE'
const crypto = require("crypto");

const raw = process.env.DATABASE_URL;
const base = new URL(raw);
const originalDb = decodeURIComponent(base.pathname.replace(/^\//, ""));
if (!originalDb) {
  throw new Error("DATABASE_URL must include a database name.");
}

const suffix = `${process.pid}_${crypto.randomBytes(4).toString("hex")}`;
const safeBase = originalDb.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 40);
const testDbName = `${safeBase}_jest_${suffix}`.toLowerCase();

const admin = new URL(base.toString());
admin.pathname = "/postgres";
admin.search = "";

const test = new URL(base.toString());
test.pathname = `/${encodeURIComponent(testDbName)}`;

console.log(JSON.stringify({
  adminUrl: admin.toString(),
  testUrl: test.toString(),
  testDbName,
}));
NODE
)"

admin_url="$(node -e 'const info=JSON.parse(process.argv[1]); process.stdout.write(info.adminUrl)' "$db_info")"
test_url="$(node -e 'const info=JSON.parse(process.argv[1]); process.stdout.write(info.testUrl)' "$db_info")"
test_db_name="$(node -e 'const info=JSON.parse(process.argv[1]); process.stdout.write(info.testDbName)' "$db_info")"

cleanup() {
  local status=$?
  psql "$admin_url" -v ON_ERROR_STOP=1 -q \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${test_db_name}' AND pid <> pg_backend_pid();" \
    -c "DROP DATABASE IF EXISTS \"${test_db_name}\";" >/dev/null 2>&1 || true
  exit "$status"
}
trap cleanup EXIT

echo "[test-db] creating isolated database ${test_db_name}"
psql "$admin_url" -v ON_ERROR_STOP=1 -q -c "CREATE DATABASE \"${test_db_name}\";"

echo "[test-db] applying Prisma migrations"
DATABASE_URL="$test_url" npx prisma migrate deploy >/dev/null

echo "[test-db] running command against isolated database ${test_db_name}"
export DATABASE_URL="$test_url"
export POLY_ALLOW_TEST_DB_RESET=true
"$@"
