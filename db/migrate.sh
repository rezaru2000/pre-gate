#!/bin/bash
# Run all migrations in order against the configured DATABASE_URL
# Usage: DATABASE_URL=postgres://... ./migrate.sh

set -e

DATABASE_URL="${DATABASE_URL:-postgresql://pregate:pregate_dev_password@localhost:5432/pregate_dev}"

echo "Running migrations against: $DATABASE_URL"

for file in $(ls migrations/*.sql | sort); do
  echo "Applying: $file"
  psql "$DATABASE_URL" -f "$file"
done

echo "All migrations applied successfully."
