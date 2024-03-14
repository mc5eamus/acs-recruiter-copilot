# load prefix, project and salt from global.parameters.json
$globalParameters = Get-Content global.parameters.json | ConvertFrom-Json
$prefix = $globalParameters.parameters.prefix.value
$project = $globalParameters.parameters.project.value
$salt = $globalParameters.parameters.salt.value
$acrName = $prefix + $project + $salt

$imageNameFrontend = $globalParameters.parameters.imageNameFrontend.value
$imageNameBackend = $globalParameters.parameters.imageNameBackend.value
$imageNameCopilot = $globalParameters.parameters.imageNameCopilot.value

az acr login -n $acrName

$remoteImageNameFrontend = $acrName + ".azurecr.io/" + $imageNameFrontend
$remoteImageNameBackend = $acrName + ".azurecr.io/" + $imageNameBackend
$remoteImageNameCopilot = $acrName + ".azurecr.io/" + $imageNameCopilot

docker build ../frontend -t $imageNameFrontend -t $remoteImageNameFrontend
docker build ../backend -t $imageNameBackend -t $remoteImageNameBackend
docker build ../copilot -t $imageNameCopilot -t $remoteImageNameCopilot

docker push $remoteImageNameFrontend
docker push $remoteImageNameBackend
docker push $remoteImageNameCopilot
