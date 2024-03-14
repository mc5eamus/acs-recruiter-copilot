param name string
param dataLocation string = 'switzerland'

resource communicationService 'Microsoft.Communication/communicationServices@2023-04-01-preview' = {
  name: name
  location: 'global'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    dataLocation: dataLocation
  }
}

var endpoint = 'https://${communicationService.properties.hostName}'
var connectionString  = communicationService.listKeys().primaryConnectionString

output connectionString string = connectionString
output endpoint string = endpoint


