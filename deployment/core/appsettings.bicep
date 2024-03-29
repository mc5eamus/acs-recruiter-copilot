// this one is currently not used, keeping it for reference for now

metadata description = 'Updates app settings for an Azure App Service.'
param name string

@description('The app settings to be applied to the app service')
@secure()
param appSettings object

resource appService 'Microsoft.Web/sites@2020-06-01' existing = {
    name: name
}

resource settings 'Microsoft.Web/sites/config@2020-06-01' = {
    name: 'appsettings'
    parent: appService
    properties: appSettings
}
