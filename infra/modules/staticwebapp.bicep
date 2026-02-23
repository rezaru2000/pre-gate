param environment string
param location string = 'eastus2'

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: 'aswa-pregate-${environment}'
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    buildProperties: {
      skipGithubActionWorkflowGeneration: true
    }
  }
}

output url string = 'https://${staticWebApp.properties.defaultHostname}'
#disable-next-line outputs-should-not-contain-secrets
output deploymentToken string = staticWebApp.listSecrets().properties.apiKey
output staticWebAppName string = staticWebApp.name
