# Deployment Guide — PreGate on Azure

This guide walks you through deploying PreGate to Azure from scratch.
Everything is explained step by step — no prior Azure or Docker experience required.

---

## How Deployment Works (Big Picture)

Before touching anything, here is what will happen:

```
Your laptop  →  GitHub  →  GitHub Actions  →  Azure
     │               │              │               │
  push code      stores code    builds &        runs the
                               deploys it        app
```

**GitHub Actions** is an automation system. Every time you push code to GitHub,
it automatically builds and deploys the app to Azure — you do not have to do it manually.

**Azure** hosts three things:


| Azure Service                      | What it does                                          |
| ---------------------------------- | ----------------------------------------------------- |
| **Azure Container Registry (ACR)** | Stores your Docker image (a packaged copy of the API) |
| **Azure Container Apps**           | Runs the API Docker image in the cloud                |
| **Azure Static Web Apps**          | Hosts the React UI (HTML/CSS/JS files)                |
| **Azure PostgreSQL**               | Cloud database                                        |
| **Azure Key Vault**                | Stores secrets (passwords, keys) safely               |
| **Azure Log Analytics**            | Collects logs from the API                            |


**Bicep** is the Infrastructure-as-Code tool used here. The files in `infra/` describe
all the Azure resources above. Running Bicep creates everything automatically — you do not
click around in the Azure portal.

---

## Environments

There are three environments, each on its own Git branch:


| Environment | Git Branch | Purpose                                           |
| ----------- | ---------- | ------------------------------------------------- |
| `dev`       | `dev`      | Your development/testing environment              |
| `uat`       | `uat`      | User acceptance testing — share with stakeholders |
| `prod`      | `main`     | Live production — real users                      |


Pushing to a branch automatically deploys to the matching environment.

---

## Step 1 — Prerequisites

Install these tools on your laptop before starting.

### Azure CLI

The command-line tool for managing Azure resources.

- Download: [https://learn.microsoft.com/en-us/cli/azure/install-azure-cli](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
- After installing, verify:

```bash
az --version
```

### GitHub account

You need a GitHub account and the code pushed to a GitHub repository.
If you haven't done that yet, create a repo at [https://github.com/new](https://github.com/new) and push the code:

```bash
git remote add origin https://github.com/YOUR_USERNAME/PreGate.git
git push -u origin main
```

---

## Step 2 — Set Up Your Azure Account

### 2a. Create a free Azure account

If you don't have one: [https://azure.microsoft.com/free/](https://azure.microsoft.com/free/)
(Free tier includes enough credits to run this project)

### 2b. Log in via the CLI

```bash
az login
```

A browser window will open — sign in with your Azure account.

### 2c. Get your Subscription ID

```bash
az account show --query id -o tsv
```

Copy the output — it looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
You will need this in several places.

---

## Step 3 — Create Resource Groups

A **Resource Group** is a folder in Azure that holds related resources.
Create one per environment:

```bash
# Replace YOUR_AZURE_SUBSCRIPTION_ID with the value from Step 2c
# Replace australiaeast with your preferred Azure region

az group create --name rg-pregate-dev  --location australiaeast
az group create --name rg-pregate-uat  --location australiaeast
az group create --name rg-pregate-prod --location australiaeast
```

> **What is a region?** Azure has data centres around the world. Pick the one closest to your users.
> Run `az account list-locations -o table` to see all options.

---

## Step 4 — Register Resource Providers

Azure subscriptions must register resource providers before creating certain resources.
If you see `MissingSubscriptionRegistration` or `The subscription is not registered to use namespace 'Microsoft.KeyVault'`, run:

```bash
# Register providers used by PreGate (Key Vault, Container Apps, PostgreSQL, etc.)
az provider register --namespace Microsoft.KeyVault
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights
az provider register --namespace Microsoft.ContainerRegistry
az provider register --namespace Microsoft.DBforPostgreSQL
az provider register --namespace Microsoft.Web

# Wait for registration to complete (can take 1–2 minutes)
az provider show --namespace Microsoft.KeyVault --query "registrationState" -o tsv
```

When the output shows `Registered`, proceed to the next step.

---

## Step 5 — Create Azure Key Vaults

**Key Vault** stores secrets (database passwords, JWT keys) safely — never hard-coded in files.
Each environment gets its own Key Vault.

```bash
# Replace YOUR_AZURE_SUBSCRIPTION_ID everywhere below

# Dev
az keyvault create \
  --name kv-pregate-dev \
  --resource-group rg-pregate-dev \
  --location australiaeast

# UAT
az keyvault create \
  --name kv-pregate-uat \
  --resource-group rg-pregate-uat \
  --location australiaeast

# Prod
az keyvault create \
  --name kv-pregate-prod \
  --resource-group rg-pregate-prod \
  --location australiaeast
```

### Grant yourself permission to set secrets

Key Vault uses RBAC. Grant your user the **Key Vault Secrets Officer** role on each vault (run once per vault):

```bash
# Get your user identity
USER_ID=$(az ad signed-in-user show --query id -o tsv)
SUB_ID=$(az account show --query id -o tsv)

# Dev
az role assignment create \
  --role "Key Vault Secrets Officer" \
  --assignee "$USER_ID" \
  --scope "/subscriptions/$SUB_ID/resourceGroups/rg-pregate-dev/providers/Microsoft.KeyVault/vaults/kv-pregate-dev"

# UAT
az role assignment create \
  --role "Key Vault Secrets Officer" \
  --assignee "$USER_ID" \
  --scope "/subscriptions/$SUB_ID/resourceGroups/rg-pregate-uat/providers/Microsoft.KeyVault/vaults/kv-pregate-uat"

# Prod
az role assignment create \
  --role "Key Vault Secrets Officer" \
  --assignee "$USER_ID" \
  --scope "/subscriptions/$SUB_ID/resourceGroups/rg-pregate-prod/providers/Microsoft.KeyVault/vaults/kv-pregate-prod"
```

> **If you get "Forbidden" when setting secrets**, you need to run the role assignment commands above. Role changes can take 1–2 minutes to propagate.

### Add secrets to each Key Vault

Generate a strong random JWT secret first:

```bash
# Generate a random 64-character secret — copy the output
openssl rand -hex 32
```

Then store the secrets (repeat for each environment, using different strong passwords):

```bash
# ── Dev ──────────────────────────────────────────────────────────────────────
az keyvault secret set \
  --vault-name kv-pregate-dev \
  --name db-admin-password \
  --value "YourStrongDevDbPassword123!"

az keyvault secret set \
  --vault-name kv-pregate-dev \
  --name jwt-secret \
  --value "paste-your-generated-secret-here"

# ── UAT ──────────────────────────────────────────────────────────────────────
az keyvault secret set \
  --vault-name kv-pregate-uat \
  --name db-admin-password \
  --value "YourStrongUatDbPassword123!"

az keyvault secret set \
  --vault-name kv-pregate-uat \
  --name jwt-secret \
  --value "paste-a-different-secret-here"

# ── Prod ──────────────────────────────────────────────────────────────────────
az keyvault secret set \
  --vault-name kv-pregate-prod \
  --name db-admin-password \
  --value "YourStrongProdDbPassword123!"

az keyvault secret set \
  --vault-name kv-pregate-prod \
  --name jwt-secret \
  --value "paste-another-different-secret-here"
```

> **Why different secrets per environment?** If one environment is compromised, the others stay safe.

---

## Step 6 — Update the Parameter Files

The Bicep parameter files in `infra/` reference your Key Vault by Subscription ID.
You need to replace the placeholder with your real Subscription ID.

Open each of these three files and replace `AZURE_SUBSCRIPTION_ID` with your actual Subscription ID from Step 2c:

- [infra/parameters.dev.json](../infra/parameters.dev.json)
- [infra/parameters.uat.json](../infra/parameters.uat.json)
- [infra/parameters.prod.json](../infra/parameters.prod.json)

In each file, you will see lines like:

```json
"id": "/subscriptions/AZURE_SUBSCRIPTION_ID/resourceGroups/rg-pregate-dev/..."
```

Replace `AZURE_SUBSCRIPTION_ID` with your real value. Do NOT change anything else.

---

## Step 7 — Create a Service Principal for GitHub Actions

GitHub Actions needs permission to deploy to your Azure subscription.
A **Service Principal** is a special Azure account created just for automation.

```bash
az ad sp create-for-rbac \
  --name "sp-pregate-github-actions" \
  --role Contributor \
  --scopes /subscriptions/YOUR_AZURE_SUBSCRIPTION_ID \
  --sdk-auth
```

This outputs a JSON block like:

```json
{
  "clientId": "...",
  "clientSecret": "...",
  "subscriptionId": "...",
  "tenantId": "...",
  ...
}
```

**Copy the entire JSON block** — you will need it in the next step.

> **What is a Service Principal?** It is like a user account for an application.
> Instead of your personal login, GitHub Actions uses this account to talk to Azure.
> The `Contributor` role lets it create and update resources.

---

## Step 8 — Add Secrets to GitHub

GitHub Actions reads secrets from your repository settings — they are never visible in code.

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets one by one:


| Secret name                       | Value                                      |
| --------------------------------- | ------------------------------------------ |
| `AZURE_CREDENTIALS`               | The entire JSON block from Step 7 (or use the 4 below) |
| `AZURE_CLIENT_ID`                 | From JSON `clientId` — use if AZURE_CREDENTIALS fails |
| `AZURE_CLIENT_SECRET`             | From JSON `clientSecret`                   |
| `AZURE_TENANT_ID`                 | From JSON `tenantId`                       |
| `AZURE_SUBSCRIPTION_ID`           | Your Subscription ID from Step 2c (or JSON `subscriptionId`) |
| `AZURE_STATIC_WEB_APP_TOKEN_DEV`  | Leave blank for now — fill in after Step 9 |
| `AZURE_STATIC_WEB_APP_TOKEN_UAT`  | Leave blank for now — fill in after Step 9 |
| `AZURE_STATIC_WEB_APP_TOKEN_PROD` | Leave blank for now — fill in after Step 9 |

### Troubleshooting: "Not all values are present" / "client-id and tenant-id"

If the workflow fails with `Login failed... Ensure 'client-id' and 'tenant-id' are supplied`:

1. **Regenerate the service principal** and copy the output again:
   ```bash
   az ad sp create-for-rbac \
     --name "sp-pregate-github-actions" \
     --role Contributor \
     --scopes /subscriptions/YOUR_SUBSCRIPTION_ID \
     --sdk-auth
   ```

2. **Update the `AZURE_CREDENTIALS` secret** in GitHub: Settings → Secrets → Actions → edit `AZURE_CREDENTIALS`.

3. **Paste the full JSON** — all four fields must be present: `clientId`, `clientSecret`, `subscriptionId`, `tenantId`. No extra spaces or line breaks. The JSON should look like:
   ```json
   {"clientId":"xxx","clientSecret":"xxx","subscriptionId":"xxx","tenantId":"xxx"}
   ```

4. **Alternative: use separate secrets** — instead of `AZURE_CREDENTIALS`, add these four secrets and the workflows will use them:
   - `AZURE_CLIENT_ID` (from the JSON `clientId`)
   - `AZURE_CLIENT_SECRET` (from the JSON `clientSecret`)
   - `AZURE_TENANT_ID` (from the JSON `tenantId`)
   - `AZURE_SUBSCRIPTION_ID` (from the JSON `subscriptionId`)

---

## Step 9 — Deploy the Infrastructure (First Time Only)

This creates all the Azure resources (database, container registry, container app, static web app).

Run this for each environment:

```bash
# Dev
az deployment group create \
  --resource-group rg-pregate-dev \
  --template-file infra/main.bicep \
  --parameters @infra/parameters.dev.json

# UAT
az deployment group create \
  --resource-group rg-pregate-uat \
  --template-file infra/main.bicep \
  --parameters @infra/parameters.uat.json

# Prod
az deployment group create \
  --resource-group rg-pregate-prod \
  --template-file infra/main.bicep \
  --parameters @infra/parameters.prod.json
```

Each deployment takes around 5–10 minutes. When it finishes, the outputs will show the URLs:

```
staticWebAppUrl     = https://aswa-pregate-dev.azurestaticapps.net
containerAppUrl     = https://ca-pregate-dev.azurecontainerapps.io
postgresFqdn        = pregate-dev.postgres.database.azure.com
staticWebAppDeploymentToken = <long token>
```

### Get and save the Static Web App deployment tokens

You need the `staticWebAppDeploymentToken` from each environment's output.
If you missed it, retrieve it with:

```bash
# Dev
az staticwebapp secrets list --name aswa-pregate-dev --query "properties.apiKey" -o tsv

# UAT
az staticwebapp secrets list --name aswa-pregate-uat --query "properties.apiKey" -o tsv

# Prod
az staticwebapp secrets list --name aswa-pregate-prod --query "properties.apiKey" -o tsv
```

Go back to GitHub → **Settings** → **Secrets** and fill in:

- `AZURE_STATIC_WEB_APP_TOKEN_DEV` with the dev token
- `AZURE_STATIC_WEB_APP_TOKEN_UAT` with the uat token
- `AZURE_STATIC_WEB_APP_TOKEN_PROD` with the prod token

---

## Step 10 — Run Database Migrations

The cloud database starts empty. You need to run the SQL migration scripts to create the tables.

First get the database connection string. Replace the placeholders:

```bash
# The host (FQDN) was shown in Step 9 output, or find it:
az postgres flexible-server list --resource-group rg-pregate-dev --query "[0].fullyQualifiedDomainName" -o tsv
```

Then run the migrations from the `db/` folder:

```bash
DATABASE_URL="postgresql://pregate:YourStrongDevDbPassword123!@YOUR_DB_FQDN:5432/pregate_dev?sslmode=require" \
  ./db/migrate.sh
```

Repeat for `uat` and `prod` with their respective passwords and hostnames.

> **Why `?sslmode=require`?** Azure PostgreSQL requires encrypted connections. Locally we skip this because it is on your own machine, but in the cloud it is mandatory.

---

## Step 11 — Push Code to Trigger Deployment

From here on, deployment is fully automatic. You just push code to the right branch.

```bash
# Deploy to dev
git push origin dev

# Deploy to uat
git push origin uat

# Deploy to prod (merge dev → uat → main first, then push)
git push origin main
```

GitHub Actions will:

1. Detect which files changed
2. Build the Docker image for the API (if `api/` changed)
3. Push the image to Azure Container Registry
4. Update the Container App to use the new image
5. Build and deploy the React UI (if `ui/` changed)
6. Re-deploy infrastructure (if `infra/` changed)

You can watch the progress under your GitHub repository → **Actions** tab.

---

## Checking Your Deployments


| URL pattern                                             | What to check             |
| ------------------------------------------------------- | ------------------------- |
| `https://aswa-pregate-{env}.azurestaticapps.net`        | UI loads                  |
| `https://ca-pregate-{env}.azurecontainerapps.io/health` | Returns `{"status":"ok"}` |
| `https://aswa-pregate-{env}.azurestaticapps.net/admin`  | Admin login works         |


---

## Checking Logs

If something is not working, check the API logs in Azure:

```bash
az containerapp logs show \
  --name ca-pregate-dev \
  --resource-group rg-pregate-dev \
  --follow
```

Or in the Azure portal: go to **Container Apps** → your app → **Log stream**.

---

## Summary — What to Do Each Time


| Situation                                            | What to do                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| First-time setup                                     | Follow all steps above (one-off)                              |
| Deploy a code change                                 | Push to the relevant branch — GitHub Actions handles the rest |
| Change infrastructure (database size, scaling, etc.) | Edit `infra/` files and push — Bicep redeploys automatically  |
| New environment secret                               | Add to Azure Key Vault, then redeploy infrastructure          |


---

## Learning Resources

### Azure (beginner)

- [Azure Fundamentals learning path](https://learn.microsoft.com/en-us/training/paths/azure-fundamentals/) — free, interactive, from Microsoft
- Focus on these concepts first: **Resource Groups**, **App Services / Container Apps**, **Storage**

### Docker

- [Docker "Getting Started" tutorial](https://docs.docker.com/get-started/) — official, step by step
- Key concept for this project: a **Dockerfile** is a recipe that packages your Node.js app into a portable image

### GitHub Actions

- [GitHub Actions quickstart](https://docs.github.com/en/actions/quickstart) — 10 minute intro
- The workflow files for this project are in [.github/workflows/](../.github/workflows/)

### Bicep (Azure infrastructure-as-code)

- [Bicep tutorial](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/learn-bicep) — official, beginner-friendly
- Think of Bicep like a config file that tells Azure what to build

> **Tip:** You do not need to understand Bicep to use it. The files are already written —
> just replace `AZURE_SUBSCRIPTION_ID` and run the deployment commands. Learn Bicep later when you
> want to change the infrastructure.

