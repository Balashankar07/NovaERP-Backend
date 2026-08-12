$baseUrl = "http://localhost:5233/api"

function Get-Token {
    param([string]$email, [string]$password)
    $body = @{ email = $email; password = $password } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/Auth/login" -Method Post -Body $body -ContentType "application/json"
    return $response.data.accessToken
}

function Test-Endpoint {
    param([string]$token, [string]$email, [string]$endpoint, [int]$expectedStatus)
    try {
        $headers = @{ Authorization = "Bearer $token" }
        $response = Invoke-RestMethod -Uri "$baseUrl$endpoint" -Method Get -Headers $headers
        $statusCode = 200
        
        if ($statusCode -eq $expectedStatus) {
            Write-Host "PASS: $email accessing $endpoint returned $statusCode"
        } else {
            Write-Host "FAIL: $email accessing $endpoint returned $statusCode, expected $expectedStatus"
        }
    } catch {
        $ex = $_.Exception
        $statusCode = 500
        if ($ex.Response) {
            $statusCode = [int]$ex.Response.StatusCode
        }
        
        if ($statusCode -eq $expectedStatus) {
            Write-Host "PASS: $email accessing $endpoint returned expected error $statusCode"
        } else {
            Write-Host "FAIL: $email accessing $endpoint returned $statusCode, expected $expectedStatus"
        }
    }
}

$adminToken = Get-Token "balashankar07@gmail.com" "Admin@123"
$empToken = Get-Token "balashankarspillai2027@mca.ajce.in" "Employee@123"

Test-Endpoint $adminToken "balashankar07@gmail.com" "/Reports/audit" 200
Test-Endpoint $empToken "balashankarspillai2027@mca.ajce.in" "/Reports/audit" 403
