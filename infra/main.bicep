@allowed(['dev', 'uat', 'prod'])
param environment string

param location string = resourceGroup().location
param dbAdminLogin string = 'pregate'

@secure()
param dbAdminPassword string

@secure()
param jwtSecret string

// On first deploy the ACR is empty, so use a public placeholder.
// Deploy Backend will replace this with the real image after infra is up.
param containerImage string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

// ─── Log Analytics ────────────────────────────────────────────────────────────
module logAnalytics 'modules/loganalytics.bicep' = {
  name: 'loganalytics'
  params: {
    environment: environment
    location: location
  }
}

// ─── Container Registry ───────────────────────────────────────────────────────
module registry 'modules/registry.bicep' = {
  name: 'registry'
  params: {
    environment: environment
    location: location
  }
}

// ─── Database ─────────────────────────────────────────────────────────────────
module database 'modules/database.bicep' = {
  name: 'database'
  params: {
    environment: environment
    location: location
    administratorLogin: dbAdminLogin
    administratorLoginPassword: dbAdminPassword
  }
}

// ─── Container App ────────────────────────────────────────────────────────────
module containerApp 'modules/containerapp.bicep' = {
  name: 'containerapp'
  params: {
    environment: environment
    location: location
    logAnalyticsCustomerId: logAnalytics.outputs.customerId
    logAnalyticsSharedKey: logAnalytics.outputs.sharedKey
    containerImage: containerImage
    registryServer: registry.outputs.loginServer
    registryUsername: registry.outputs.adminUsername
    registryPassword: registry.outputs.adminPassword
    databaseUrl: 'postgresql://${dbAdminLogin}:${dbAdminPassword}@${database.outputs.fqdn}:5432/${database.outputs.databaseName}?sslmode=require'
    jwtSecret: jwtSecret
  }
}

// ─── Static Web App ───────────────────────────────────────────────────────────
module staticWebApp 'modules/staticwebapp.bicep' = {
  name: 'staticwebapp'
  params: {
    environment: environment
  }
}

// ─── Outputs ──────────────────────────────────────────────────────────────────
output staticWebAppUrl string = staticWebApp.outputs.url
output containerAppUrl string = containerApp.outputs.containerAppUrl
output postgresFqdn string = database.outputs.fqdn
output staticWebAppDeploymentToken string = staticWebApp.outputs.deploymentToken
