param location string = resourceGroup().location
param appEnvName string
param storageAccountName string
param eventHubConnectionString string
param eventHub string
param eventHubConsumerGroup string
param copilotAppName string

resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' existing = {
  name: appEnvName
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }

  properties: {
    supportsHttpsTrafficOnly: true
    defaultToOAuthAuthentication: true
  }
}

resource storageAccountTableServices 'Microsoft.Storage/storageAccounts/tableServices@2023-01-01' existing = {
  name: 'default'
  parent: storageAccount
}

resource daprStateTable 'Microsoft.Storage/storageAccounts/tableServices/tables@2023-01-01' = {
  name: 'daprstorage'
  parent: storageAccountTableServices
}

resource storageAccountBlobServices 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' existing = {
  name: 'default'
  parent: storageAccount
}

resource daprBindingContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: 'copilot-binding'
  parent: storageAccountBlobServices
}


resource daprStateStore 'Microsoft.App/managedEnvironments/daprComponents@2023-05-01' = {
  parent: containerAppEnv
  name: 'statestore'
  properties: {
    componentType: 'state.azure.tablestorage'
    secrets: [
      {
        name: 'storageaccountkey'
        value: storageAccount.listKeys().keys[0].value
      }
    ]
    metadata: [
      {
        name: 'tableName'
        value: 'daprstorage'
      }
      {
        name: 'accountName'
        value: storageAccount.name
      }
      {
        name: 'accountKey'
        secretRef: 'storageaccountkey'
      }
    ]
    version: 'v1'
    scopes: [ copilotAppName ]
  }
}

resource daprCopilotBinding 'Microsoft.App/managedEnvironments/daprComponents@2023-05-01' = {
  parent: containerAppEnv
  name: 'conversation'
  properties: {
    componentType: 'bindings.azure.eventhubs'
    secrets: [
      {
        name: 'eventhubconnectionstring'
        value: eventHubConnectionString
      }
    ]
    metadata: [
      {
        name: 'connectionString'
        secretRef: 'eventhubconnectionstring'
      }
      {
        name: 'consumerGroup'
        value: eventHubConsumerGroup
      }
      {
        name: 'eventHub'
        value: eventHub
      }
      {
        name: 'storageAccountName'
        value: storageAccount.name
      }
      {
        name: 'storageAccountKey'
        value: storageAccount.listKeys().keys[0].value
      }
      {
        name: 'storageContainerName'
        value: 'copilot-binding'
      }
      {
        name: 'direction'
        value: 'input'
      }
    ]
    version: 'v1'
    scopes: [ copilotAppName ]
  }
}
