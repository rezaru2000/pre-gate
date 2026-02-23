# PreGate — Human Verification Gateway for Online Surveys

PreGate is a human verification gateway that sits between a survey invite and the actual survey URL. It filters out bots and automated tools, ensuring only real humans complete surveys.

## Architecture

- **UI:** React (Vite) → Azure Static Web Apps (Free tier)
- **API:** Node.js + Express → Azure Container Apps (consumption, scale to zero)
- **Database:** PostgreSQL → Azure Database for PostgreSQL Flexible Server (B1ms)
- **Logging:** Winston + Azure Log Analytics Workspace
- **Auth:** JWT-based admin auth (httpOnly cookie)
- **IaC:** Azure Bicep
- **CI/CD:** GitHub Actions

## Quick Start (Local Dev)

### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- PostgreSQL client (optional, for direct DB access)

### Setup

```bash
# Clone and install dependencies
cd api && npm install
cd ../ui && npm install

# Start local services (API + Postgres)
cd .. && docker compose up -d

# Run DB migrations
cd db && npm run migrate

# Start UI dev server
cd ../ui && npm run dev
```

### Environment URLs (Local)
- UI: http://localhost:5173
- API: http://localhost:3000
- API Health: http://localhost:3000/health

## Project Structure

```
pregate/
├── ui/                   ← React + Vite frontend
├── api/                  ← Node.js + Express backend
├── db/                   ← Database migrations
├── infra/                ← Azure Bicep IaC
├── .github/workflows/    ← CI/CD pipelines
└── docker-compose.yml    ← Local dev
```

## Environments

| Env | Branch | API URL | UI URL |
|-----|--------|---------|--------|
| dev | dev | ca-pregate-dev.azurecontainerapps.io | aswa-pregate-dev.azurestaticapps.net |
| uat | uat | ca-pregate-uat.azurecontainerapps.io | aswa-pregate-uat.azurestaticapps.net |
| prod | main | ca-pregate-prod.azurecontainerapps.io | aswa-pregate-prod.azurestaticapps.net |

## Cost Estimate (per environment)

| Resource | Tier | Est. Cost/mo |
|---|---|---|
| Azure Static Web Apps | Free | $0 |
| Azure Container Apps | Consumption (scale to zero) | ~$2-5 |
| PostgreSQL Flexible Server | B1ms burstable | ~$12 |
| Container Registry | Basic | ~$5 |
| Log Analytics | Pay-per-GB | ~$2 |
| **Total** | | **~$21-24/mo** |

> **Tip:** Use Neon.tech free tier Postgres for dev/uat to cut non-prod costs to ~$7-9/mo.

## Admin Panel

Access at `/admin`. Default admin credentials are configured via environment variables.

## How It Works

1. User receives invite URL: `/s/{invite_uuid}`
2. PreGate loads quiz questions for that survey
3. User answers all questions and submits
4. System scores submission against pass mark (default 80%)
5. **Pass:** Redirect to actual survey URL
6. **Fail:** Show friendly error. Actual survey URL is never exposed.
7. All responses saved to audit log regardless of outcome
