targetScope='subscription'

@minLength(3)
param project string
@minLength(3)
param prefix string
@minLength(1)
param salt string
param location string = 'switzerlandnorth'
param pubSubHubName string = 'acshr'
param eventHubName string = 'conversation'

param imageNameFrontend string = 'interview-frontend'
param imageNameBackend string = 'interview-backend'
param imageNameCopilot string = 'interview-copilot'
param adminUserId string
param azureOpenAiEndpoint string
param azureOpenAiAPIKey string
param azureOpenAiCompletionsModel string

var resourceGroupName = '${prefix}-${project}-${salt}'

resource deploymentResourceGroup 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: resourceGroupName
  location: location
}

module monitoring 'core/monitor.bicep' = {
  name: 'monitoring'
  scope: deploymentResourceGroup
  params: {
    name: '${prefix}-${project}-${salt}'
    location: location
  }
}

module commSvc 'core/communication.bicep' = {
  name: 'commServices'
  scope: deploymentResourceGroup
  params: {
    name: '${prefix}-${project}-${salt}'
  }
}

module webPubSub 'core/pubsub.bicep' = {
  name: 'webPubSub'
  scope: deploymentResourceGroup
  params: {
    name: '${prefix}-${project}-${salt}'
    location: location
  }
}

module eventHub 'core/eventhub.bicep' = {
  name: 'eventHub'
  scope: deploymentResourceGroup
  params: {
    namespaceName: '${prefix}-${project}-${salt}'
    eventHubName: eventHubName
    consumerGroupName: 'copilot' 
    senderPrincipalId: webPubSub.outputs.princpialId
    location: location
  }
}

module pubsubhub 'core/pubsubhub.bicep' = {
  name: 'pubsubhub'
  scope: deploymentResourceGroup
  params: {
    name: '${prefix}-${project}-${salt}'
    hubName: pubSubHubName
    eventHubEndpoint: '${prefix}-${project}-${salt}.servicebus.windows.net'
    eventHubName: eventHubName
  }
  dependsOn: [
    eventHub
  ]
}

module containerRegistry 'core/acr.bicep' = {
  name: 'acr'
  scope: deploymentResourceGroup
  params: {
    name: '${prefix}${project}${salt}'
    location: location
    uaiName: 'app-${prefix}${project}${salt}'
  }
}

module containerAppsEnvironment 'core/appenvironment.bicep' = {
  name: 'containerAppsEnvironment'
  scope: deploymentResourceGroup
  params: {
    name: '${prefix}-${project}-${salt}'
    location: location
    logAnalyticsName: monitoring.outputs.logAnalyticsName
  }
}

output deployEnvironment string = join([
  'CommSvcConnectionString=${commSvc.outputs.connectionString}'
  'CommSvcEndpointUrl=${commSvc.outputs.endpoint}'
  'WebPubSubConnectionString=${webPubSub.outputs.connectionString}'
  'WebPubSubHub=${pubSubHubName}'
  'EventHubConnectionString=${eventHub.outputs.eventHubConnectionString}'
  'APPLICATIONINSIGHTS_CONNECTION_STRING=${monitoring.outputs.appInsightsConnectionString}'
], '\n')
