param namespaceName string
param eventHubName string
param consumerGroupName string = '$Default'
param senderPrincipalId string
param location string = resourceGroup().location

// https://learn.microsoft.com/en-gb/azure/role-based-access-control/built-in-roles#azure-event-hubs-data-sender
var eventHubDataSenderRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '2b629674-e913-4c01-ae53-ef4638d8f975')
var eventHubSenderRoleAssignment = guid(resourceGroup().id, eventHubDataSenderRoleId)


resource namespace 'Microsoft.EventHub/namespaces@2022-10-01-preview' = {
  name: namespaceName
  location: location
  sku: {
    name: 'Standard'
    capacity: 1
  }
}

resource namespace_eventHub 'Microsoft.EventHub/namespaces/eventhubs@2022-10-01-preview' = {
  parent: namespace
  name: eventHubName
}

resource namespace_eventHubName_consumerGroup 'Microsoft.EventHub/namespaces/eventhubs/consumergroups@2022-10-01-preview' = {
  parent: namespace_eventHub
  name: consumerGroupName
}

resource namespace_eventHubName_reader 'Microsoft.EventHub/namespaces/eventhubs/authorizationRules@2022-10-01-preview' = {
  name: 'reader'
  parent: namespace_eventHub
  properties: {
    rights: [ 'Listen' ]
  }
}

resource eventHubSenderAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: eventHubSenderRoleAssignment
  properties: {
    principalId: senderPrincipalId
    roleDefinitionId: eventHubDataSenderRoleId
  }
}

var eventHubConnectionString = namespace_eventHubName_reader.listKeys().primaryConnectionString

output eventHubConnectionString string = eventHubConnectionString
