param name string
param location string = resourceGroup().location
param environmentId string
param image string
param targetPort int
param environmentVariables array
param registryServer string
param ingressEnabled bool = true
param daprEnabled bool = true
param uaiName string
param resources object = {
  cpu: json('.25')
  memory: '.5Gi'
}

resource uai 'Microsoft.ManagedIdentity/userAssignedIdentities@2022-01-31-preview' existing = {
  name: uaiName
}

resource application 'Microsoft.App/containerApps@2023-05-01' = {
  name: name
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${uai.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      registries: [
        {
          identity: uai.id
          server: registryServer
        }
      ]
      activeRevisionsMode: 'Single'
      ingress: ingressEnabled ? {
        allowInsecure: false
        external: true
        targetPort: targetPort
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      } : null
      dapr: daprEnabled ? {
        enabled: true
        appPort: targetPort
        appId: name
        appProtocol: 'http'
      } : null
    }
    template: {
      containers: [
        {
          env: [
            for env in environmentVariables: {
              name: env.name
              value: env.value
            }
          ]
          image: image
          name: name
          resources: resources
        }
      ]
      scale: {
        maxReplicas: 1
        minReplicas: 1
      }
    }
    workloadProfileName: 'Consumption'
  }
}
