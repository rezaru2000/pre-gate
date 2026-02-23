# Service Principal Reference

Reference for the Azure Service Principal used by GitHub Actions to deploy PreGate.

## JSON structure

When you run `az ad sp create-for-rbac --sdk-auth`, the output looks like:

```json
{
  "clientId": "<uuid>",
  "clientSecret": "<secret>",
  "subscriptionId": "<uuid>",
  "tenantId": "<uuid>",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

## GitHub Secrets mapping

| GitHub Secret         | JSON field       |
| --------------------- | ---------------- |
| `AZURE_CLIENT_ID`     | `clientId`       |
| `AZURE_CLIENT_SECRET` | `clientSecret`   |
| `AZURE_SUBSCRIPTION_ID` | `subscriptionId` |
| `AZURE_TENANT_ID`     | `tenantId`       |

Or use the full JSON as `AZURE_CREDENTIALS`.

## Regenerate if needed

```bash
az ad sp create-for-rbac \
  --name "sp-pregate-github-actions" \
  --role Contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID \
  --sdk-auth
```

## Local storage (optional)

To keep a copy for CLI or local scripts, create `azure-credentials.json` in the project root and paste your JSON. This file is gitignored.

```bash
# Create the file (paste your JSON into it)
touch azure-credentials.json
```

Use with Azure CLI: `az login --service-principal -u <clientId> -p <clientSecret> --tenant <tenantId>`

## Security

- **Never commit** the JSON or `clientSecret` to git.
- Store in a password manager or secure location.
- Rotate the secret periodically via Azure Portal → Microsoft Entra ID → App registrations → Your app → Certificates & secrets.
