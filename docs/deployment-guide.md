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

**GitHub Actions** runs your deployment workflows. Deployments are **manual** — you trigger them from the Actions tab when ready.

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


Deployments are triggered manually from the Actions tab. Choose the workflow and environment (dev, uat, prod).

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

### Enable template deployment (required for Bicep)

ARM must read Key Vault secrets during deployment. Enable this on each vault:

```bash
az keyvault update --name kv-pregate-dev --enabled-for-template-deployment true
az keyvault update --name kv-pregate-uat --enabled-for-template-deployment true
az keyvault update --name kv-pregate-prod --enabled-for-template-deployment true
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

> **Deployment fails with "jwt-secret was not found"?** Add the `jwt-secret` to your Key Vault before running the infrastructure deployment. Run the `az keyvault secret set` commands above for the environment you're deploying (dev, uat, or prod).

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

**Important:** The workflows use **Environment secrets**, not Repository secrets. You must create environments and add secrets there.

1. Go to your GitHub repository → **Settings** → **Environments**
2. Create three environments: `dev`, `uat`, `prod` (if they don't exist)
3. For each environment, click it → **Environment secrets** → **Add secret**

Add these secrets to **each environment** (dev, uat, prod):


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

> **Note on the Container App image:** The Container Registry is empty on first deploy — there is no
> API image yet. The Bicep uses a public Microsoft placeholder image so the Container App can start
> successfully. The real API image is pushed in Step 11 when you run Deploy Backend.

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

### Troubleshooting: "DeploymentActive" error

If you see `The deployment ... cannot be saved, because this would overwrite an existing deployment which is still active`, a previous deployment is still running. Cancel it first, then re-run:

```bash
# Cancel the stuck deployment
az deployment group cancel \
  --name main \
  --resource-group rg-pregate-dev

# Wait until status shows "Canceled"
az deployment group show \
  --name main \
  --resource-group rg-pregate-dev \
  --query "properties.provisioningState" -o tsv
```

Then trigger the workflow again from the Actions tab.

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

## Step 11 — Deploy Backend and Frontend

Now that infrastructure is up, deploy the actual application. **Always deploy in this order:**

### 11a. Deploy Backend (API)

Actions tab → **Deploy Backend** → **Run workflow** → choose environment (e.g. `dev`)

This will:
1. Build the Docker image from the `api/` folder
2. Push it to Azure Container Registry
3. Update the Container App to use the new image (replacing the placeholder)

### 11b. Deploy Frontend (UI)

Actions tab → **Deploy Frontend** → **Run workflow** → choose the same environment

This will:
1. Build the React app with `npm run build`
2. Deploy the built files to Azure Static Web Apps

> **Run workflow button missing?** It only appears when the workflow file is on your repository's **default branch** (usually `main`). Make sure your latest code is merged to `main`.

You can watch the progress under your GitHub repository → **Actions** tab.

### For future deployments

Push your code changes to the relevant branch, then trigger the workflows manually:

```bash
git push origin dev   # or uat, or main for prod
```

Then: Actions → **Deploy Backend** or **Deploy Frontend** → **Run workflow** → choose environment.

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
| Change infrastructure (database size, scaling, etc.) | Edit `infra/` files, push, then Actions → Deploy Infrastructure → Run workflow  |
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

