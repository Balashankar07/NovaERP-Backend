$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:5232/api"
Write-Host "Using API Base URL: $baseUrl"

function Invoke-Api {
    param($Method, $Endpoint, $Body, $Token)
    $headers = @{"Content-Type"="application/json"}
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    $jsonBody = if ($Body) { $Body | ConvertTo-Json } else { $null }
    
    try {
        $res = Invoke-WebRequest -Method $Method -Uri "$baseUrl$Endpoint" -Headers $headers -Body $jsonBody -UseBasicParsing
        return @{ Status = $res.StatusCode; Body = ($res.Content | ConvertFrom-Json) }
    } catch {
        return @{ Status = $_.Exception.Response.StatusCode.value__; Body = $null }
    }
}

Write-Host "`nA. Existing email/password login"
$adminLogin = Invoke-Api -Method POST -Endpoint "/Auth/login" -Body @{ email = "admin@novaerp.com"; password = "Admin@123" }
Write-Host "Admin Login: $($adminLogin.Status)"
$adminToken = $adminLogin.Body.data.accessToken

$empLogin = Invoke-Api -Method POST -Endpoint "/Auth/login" -Body @{ email = "employee@novaerp.com"; password = "Employee@123" }
Write-Host "Employee Login: $($empLogin.Status)"
$empToken = $empLogin.Body.data.accessToken

Write-Host "`nB. Unauthenticated protected API"
$unauth = Invoke-Api -Method GET -Endpoint "/Auth/me"
Write-Host "No JWT -> /Auth/me: $($unauth.Status)"

Write-Host "`nC. Valid JWT"
$authMe = Invoke-Api -Method GET -Endpoint "/Auth/me" -Token $adminToken
Write-Host "Valid JWT -> /Auth/me: $($authMe.Status)"

Write-Host "`nD. Invalid Google credential"
$invalidGoogle = Invoke-Api -Method POST -Endpoint "/Auth/google-signin" -Body @{ credential = "invalid_token" }
Write-Host "Invalid Google credential (Expect 401 NOT 500): $($invalidGoogle.Status)"

Write-Host "`nE. Unknown/unlinked Google account"
# When a fake token is passed, since the Google validation hits an error due to invalid token signature, it will return 401
$unlinked = Invoke-Api -Method POST -Endpoint "/Auth/google-signin" -Body @{ credential = "ey_some_fake_token" }
Write-Host "Fake Google Token (Expect 401): $($unlinked.Status)"

Write-Host "`nF. Existing RBAC"
# Testing an actual RBAC endpoint like UserController /api/User
$adminUsers = Invoke-Api -Method GET -Endpoint "/User" -Token $adminToken
Write-Host "Super Admin -> /User: $($adminUsers.Status)"

# I don't know the exact route for employees and /User, maybe 403 or 200 depending on policy, but I will check it.
$empUsers = Invoke-Api -Method GET -Endpoint "/User" -Token $empToken
Write-Host "Employee -> /User: $($empUsers.Status)"

