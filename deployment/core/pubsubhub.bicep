param name string
param hubName string = 'acshr'
param eventHubEndpoint string
param eventHubName string

resource webPubSubService 'Microsoft.SignalRService/webPubSub@2023-02-01' existing = {
  name: name
}

resource webPubSubServiceHub 'Microsoft.SignalRService/webPubSub/hubs@2023-02-01' = {
  name: hubName
  parent: webPubSubService
  properties: {
    anonymousConnectPolicy: 'Deny'
    eventListeners: [
      {
        endpoint: {
          type: 'EventHub'
          fullyQualifiedNamespace: eventHubEndpoint
          eventHubName: eventHubName
        }
        filter: {
          type: 'EventName'
          systemEvents: []
          userEventPattern: '*'
        }
      }
    ]
  }
}
