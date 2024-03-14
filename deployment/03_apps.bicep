targetScope='subscription'

@minLength(3)
param project string
@minLength(3)
param prefix string
@minLength(1)
param salt string
param location string
param pubSubHubName string = 'acshr'
param eventHubName string = 'conversation'
param adminUserId string

param azureOpenAiEndpoint string
param azureOpenAiAPIKey string
param azureOpenAiCompletionsModel string

param imageNameFrontend string = 'interview-frontend'
param imageNameBackend string = 'interview-backend'
param imageNameCopilot string = 'interview-copilot'


var fullResourceName = '${prefix}-${project}-${salt}'
var shortResourceName = '${prefix}${project}${salt}'

resource rg 'Microsoft.Resources/resourceGroups@2022-09-01' existing = {
  name: fullResourceName
}

resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' existing = {
  scope: rg
  name: fullResourceName
}

resource communicationService 'Microsoft.Communication/communicationServices@2023-04-01-preview' existing = {
  scope: rg
  name: fullResourceName
}

resource webPubSubService 'Microsoft.SignalRService/webPubSub@2023-02-01' existing = {
  scope: rg
  name: fullResourceName
}

resource namespace 'Microsoft.EventHub/namespaces@2022-10-01-preview' existing = {
  name: fullResourceName
  scope: rg
}

resource namespace_eventHub 'Microsoft.EventHub/namespaces/eventhubs@2022-10-01-preview' existing = {
  parent: namespace
  name: eventHubName
}

resource namespace_eventHubName_reader 'Microsoft.EventHub/namespaces/eventhubs/authorizationRules@2022-10-01-preview' existing = {
  name: 'reader'
  parent: namespace_eventHub
}


module copilot 'app/app.bicep' = {
  name: 'app-copilot'
  scope: rg
  params: {
    name: imageNameCopilot
    location: location
    environmentId: containerAppEnv.id
    registryServer: '${shortResourceName}.azurecr.io'
    image: '${shortResourceName}.azurecr.io/${imageNameCopilot}:latest'
    targetPort: 5000
    daprEnabled: true
    ingressEnabled: false
    uaiName: 'app-${shortResourceName}'
    resources: {
      cpu: json('.5')
      memory: '1.0Gi'
    }
    environmentVariables: [
      {
        name: 'WebPubSubConnectionString'
        value: webPubSubService.listKeys().primaryConnectionString
      }
      {
        name: 'WebPubSubEndpoint'
        value: 'https://${webPubSubService.properties.hostName}'
      }
      {
        name: 'WebPubSubHub'
        value: pubSubHubName
      }
      {
        name: 'OpenAiEndpoint'
        value: azureOpenAiEndpoint
      }
      {
        name: 'OpenAiAPIKey'
        value: azureOpenAiAPIKey
      }
      {
        name: 'OpenAiCompletionsModel'
        value: azureOpenAiCompletionsModel
      } 
    ]
  }
}

module daprcomponents 'app./daprcomponents.bicep' = {
  name: 'daprcomponents'
  scope: rg
  params: {
    location: location
    appEnvName: containerAppEnv.name
    storageAccountName: '${shortResourceName}app'
    eventHubConnectionString: namespace_eventHubName_reader.listKeys().primaryConnectionString
    eventHub: eventHubName
    eventHubConsumerGroup: 'copilot'
    copilotAppName: imageNameCopilot
  }
}


module backend 'app/app.bicep' = {
  name: 'app-backend'
  scope: rg
  params: {
    name: 'interview-backend'
    location: location
    environmentId: containerAppEnv.id
    registryServer: '${shortResourceName}.azurecr.io'
    image: '${shortResourceName}.azurecr.io/${imageNameBackend}:latest'
    targetPort: 8080
    daprEnabled: false
    ingressEnabled: true
    uaiName: 'app-${shortResourceName}'
    environmentVariables: [
      {
        name: 'CommSvcConnectionString'
        value: communicationService.listKeys().primaryConnectionString
      }
      {
        name: 'CommSvcEndpointUrl'
        value: 'https://${communicationService.properties.hostName}'
      }
      {
        name: 'CommSvcAdminUserId'
        value: adminUserId
      }
      {
        name: 'WebPubSubConnectionString'
        value: webPubSubService.listKeys().primaryConnectionString
      }
      {
        name: 'WebPubSubHub'
        value: pubSubHubName
      }

    ]
  }
}

module frontend 'app/app.bicep' = {
  name: 'app-frontend'
  scope: rg
  params: {
    name: 'interview-frontend'
    location: location
    environmentId: containerAppEnv.id
    registryServer: '${shortResourceName}.azurecr.io'
    image: '${shortResourceName}.azurecr.io/${imageNameFrontend}:latest'
    targetPort: 3000
    daprEnabled: false
    ingressEnabled: true
    uaiName: 'app-${shortResourceName}'
    environmentVariables: [
      {
        name: 'API_BASE'
        value: 'https://interview-backend.${containerAppEnv.properties.defaultDomain}'
      }
    ]
  }
}
