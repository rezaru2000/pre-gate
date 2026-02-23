# Database Migrations

## Run migrations

**Option 1: Via Docker (recommended — uses same DB as API)**

```bash
cd /path/to/PreGate
docker compose --profile tools run --rm migrate
```

**Option 2: Via psql (from host)**

```bash
cd db
./migrate.sh
```

Uses `DATABASE_URL` or defaults to `postgresql://pregate:pregate_dev_password@localhost:5432/pregate_dev`.

**Important:** The API must connect to the **same database** as migrations. If you run the API in Docker, use Option 1. If you run the API locally, ensure `DATABASE_URL` in `api/.env.development` uses `localhost` (not `postgres`).

## If you see "No questions in the pool"

1. Run migrations (see above).
2. Ensure Docker postgres is running: `docker compose up -d postgres`
3. If API runs in Docker, run migrations via Docker: `docker compose --profile tools run --rm migrate`
