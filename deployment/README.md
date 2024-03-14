
# Deployment

1. Adjust the values in global.parameters.json to something unique for your deployment. Obtain endpoint and key for an Azure OpenAI Service of your choice (we don't provision it automatically). Deploy a chat completion model or use an existing one. Update the azureOpenAI settings.

1. ```az deployment sub create --name acs-interview-copilot --template-file 01_infra.bicep --parameters @global.parameters.json```

1. ```powershell .\02_build.ps1```

1. Generate a user with "Chat" permission assigned under Identities & User Access Tokens of your newly created Azure Communication Services, capture the id and adjust the value of adminUserId in *global.parameters.json*

1. ```az deployment sub create --name acs-interview-copilot --template-file 03_apps.bicep --parameters @global.parameters.json```

For local frontend development, make sure to point the API_BASE in frontend/public/config.js to the backend url.