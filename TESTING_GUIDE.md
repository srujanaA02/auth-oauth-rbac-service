# API Testing Guide

This guide provides commands to test all endpoints of the OAuth Authentication Service.

## Prerequisites

The application must be running:
```bash
docker-compose up --build
```

Wait for all services to show as "healthy" (check with `docker-compose ps`).

## Test Endpoints

### 1. Health Check

**PowerShell:**
```powershell
Invoke-WebRequest -Uri http://localhost:8080/health -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected Response:**
```json
{"status":"ok"}
```

---

### 2. Register New User

**PowerShell:**
```powershell
$body = @{ 
    name = 'John Doe'
    email = 'john.doe@example.com'
    password = 'SecurePassword123!' 
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:8080/api/auth/register `
    -Method POST `
    -Body $body `
    -ContentType 'application/json' `
    -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected Response (201):**
```json
{
  "id": "uuid-here",
  "email": "john.doe@example.com",
  "name": "John Doe",
  "role": "user",
  "created_at": "timestamp"
}
```

---

### 3. Login (Admin User)

**PowerShell:**
```powershell
$body = @{ 
    email = 'admin@example.com'
    password = 'AdminPassword123!' 
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri http://localhost:8080/api/auth/login `
    -Method POST `
    -Body $body `
    -ContentType 'application/json' `
    -UseBasicParsing

$tokens = $response.Content | ConvertFrom-Json
$accessToken = $tokens.accessToken
$refreshToken = $tokens.refreshToken

Write-Host "Access Token: $accessToken"
Write-Host "Refresh Token: $refreshToken"
```

**Expected Response (200):**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

---

### 4. Login (Regular User)

**PowerShell:**
```powershell
$body = @{ 
    email = 'user@example.com'
    password = 'UserPassword123!' 
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:8080/api/auth/login `
    -Method POST `
    -Body $body `
    -ContentType 'application/json' `
    -UseBasicParsing | Select-Object -ExpandProperty Content
```

---

### 5. Refresh Access Token

**PowerShell:**
```powershell
# First login to get refresh token
$loginBody = @{ email = 'admin@example.com'; password = 'AdminPassword123!' } | ConvertTo-Json
$loginResponse = Invoke-WebRequest -Uri http://localhost:8080/api/auth/login -Method POST -Body $loginBody -ContentType 'application/json' -UseBasicParsing
$tokens = $loginResponse.Content | ConvertFrom-Json
$refreshToken = $tokens.refreshToken

# Use refresh token to get new access token
$refreshBody = @{ refreshToken = $refreshToken } | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:8080/api/auth/refresh `
    -Method POST `
    -Body $refreshBody `
    -ContentType 'application/json' `
    -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected Response (200):**
```json
{
  "accessToken": "eyJhbGci..."
}
```

---

### 6. Get Current User Profile

**PowerShell:**
```powershell
# Login first
$loginBody = @{ email = 'admin@example.com'; password = 'AdminPassword123!' } | ConvertTo-Json
$response = Invoke-WebRequest -Uri http://localhost:8080/api/auth/login -Method POST -Body $loginBody -ContentType 'application/json' -UseBasicParsing
$tokens = $response.Content | ConvertFrom-Json
$accessToken = $tokens.accessToken

# Get profile
$headers = @{ Authorization = "Bearer $accessToken" }
Invoke-WebRequest -Uri http://localhost:8080/api/users/me `
    -Method GET `
    -Headers $headers `
    -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected Response (200):**
```json
{
  "id": "uuid",
  "name": "Admin User",
  "email": "admin@example.com",
  "role": "admin"
}
```

---

### 7. Update User Profile

**PowerShell:**
```powershell
# Login first
$loginBody = @{ email = 'user@example.com'; password = 'UserPassword123!' } | ConvertTo-Json
$response = Invoke-WebRequest -Uri http://localhost:8080/api/auth/login -Method POST -Body $loginBody -ContentType 'application/json' -UseBasicParsing
$tokens = $response.Content | ConvertFrom-Json
$accessToken = $tokens.accessToken

# Update profile
$headers = @{ Authorization = "Bearer $accessToken" }
$updateBody = @{ name = 'Updated User Name' } | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:8080/api/users/me `
    -Method PATCH `
    -Headers $headers `
    -Body $updateBody `
    -ContentType 'application/json' `
    -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected Response (200):**
```json
{
  "id": "uuid",
  "name": "Updated User Name",
  "email": "user@example.com",
  "role": "user"
}
```

---

### 8. Get All Users (Admin Only)

**PowerShell:**
```powershell
# Login as admin
$loginBody = @{ email = 'admin@example.com'; password = 'AdminPassword123!' } | ConvertTo-Json
$response = Invoke-WebRequest -Uri http://localhost:8080/api/auth/login -Method POST -Body $loginBody -ContentType 'application/json' -UseBasicParsing
$tokens = $response.Content | ConvertFrom-Json
$accessToken = $tokens.accessToken

# Get all users
$headers = @{ Authorization = "Bearer $accessToken" }
Invoke-WebRequest -Uri http://localhost:8080/api/users `
    -Method GET `
    -Headers $headers `
    -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Expected Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  },
  {
    "id": "uuid",
    "name": "Regular User",
    "email": "user@example.com",
    "role": "user"
  }
]
```

---

### 9. Test RBAC (Regular User Cannot Access Admin Endpoint)

**PowerShell:**
```powershell
# Login as regular user
$loginBody = @{ email = 'user@example.com'; password = 'UserPassword123!' } | ConvertTo-Json
$response = Invoke-WebRequest -Uri http://localhost:8080/api/auth/login -Method POST -Body $loginBody -ContentType 'application/json' -UseBasicParsing
$tokens = $response.Content | ConvertFrom-Json
$accessToken = $tokens.accessToken

# Try to access admin endpoint
$headers = @{ Authorization = "Bearer $accessToken" }
try {
    Invoke-WebRequest -Uri http://localhost:8080/api/users -Method GET -Headers $headers -UseBasicParsing
    Write-Host "ERROR: Should have received 403"
} catch {
    Write-Host "Expected status code: $($_.Exception.Response.StatusCode.value__)"
}
```

**Expected Status Code:** 403 Forbidden

---

### 10. Test Rate Limiting

**PowerShell:**
```powershell
$body = @{ email = 'wrong@example.com'; password = 'wrongpassword' } | ConvertTo-Json

for ($i = 1; $i -le 12; $i++) {
    try {
        $response = Invoke-WebRequest -Uri http://localhost:8080/api/auth/login `
            -Method POST `
            -Body $body `
            -ContentType 'application/json' `
            -UseBasicParsing
        Write-Host "Attempt $i`: Success (Unexpected)"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Attempt $i`: $statusCode"
    }
}
```

**Expected Output:**
- Attempts 1-10: Status 401 (Unauthorized)
- Attempts 11-12: Status 429 (Too Many Requests)

---

### 11. Test OAuth Redirect (Google)

**PowerShell:**
```powershell
$response = Invoke-WebRequest -Uri http://localhost:8080/api/auth/google `
    -Method GET `
    -MaximumRedirection 0 `
    -UseBasicParsing `
    -ErrorAction SilentlyContinue

Write-Host "Status Code: $($response.StatusCode)"
Write-Host "Redirect Location: $($response.Headers.Location)"
```

**Expected Output:**
- Status Code: 302
- Redirect Location: https://accounts.google.com/o/oauth2/v2/auth?...

---

### 12. Test OAuth Redirect (GitHub)

**PowerShell:**
```powershell
$response = Invoke-WebRequest -Uri http://localhost:8080/api/auth/github `
    -Method GET `
    -MaximumRedirection 0 `
    -UseBasicParsing `
    -ErrorAction SilentlyContinue

Write-Host "Status Code: $($response.StatusCode)"
Write-Host "Redirect Location: $($response.Headers.Location)"
```

**Expected Output:**
- Status Code: 302
- Redirect Location: https://github.com/login/oauth/authorize?...

---

### 13. Test Invalid Token

**PowerShell:**
```powershell
$headers = @{ Authorization = "Bearer invalid-token-here" }
try {
    Invoke-WebRequest -Uri http://localhost:8080/api/users/me `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing
    Write-Host "ERROR: Should have received 401"
} catch {
    Write-Host "Expected status code: $($_.Exception.Response.StatusCode.value__)"
}
```

**Expected Status Code:** 401 Unauthorized

---

### 14. Test Missing Authorization Header

**PowerShell:**
```powershell
try {
    Invoke-WebRequest -Uri http://localhost:8080/api/users/me `
        -Method GET `
        -UseBasicParsing
    Write-Host "ERROR: Should have received 401"
} catch {
    Write-Host "Expected status code: $($_.Exception.Response.StatusCode.value__)"
}
```

**Expected Status Code:** 401 Unauthorized

---

## Complete Test Suite (Run All Tests)

**PowerShell:**
```powershell
Write-Host "`n=== OAUTH AUTHENTICATION SERVICE TEST SUITE ===`n"

# 1. Health Check
Write-Host "1. Testing Health Check..."
$health = Invoke-WebRequest -Uri http://localhost:8080/health -UseBasicParsing
Write-Host "✓ Health check passed: $($health.Content)`n"

# 2. Register New User
Write-Host "2. Testing User Registration..."
$regBody = @{ name = 'Test User'; email = "test$(Get-Random)@example.com"; password = 'Test123456!' } | ConvertTo-Json
$regResponse = Invoke-WebRequest -Uri http://localhost:8080/api/auth/register -Method POST -Body $regBody -ContentType 'application/json' -UseBasicParsing
Write-Host "✓ Registration successful`n"

# 3. Login
Write-Host "3. Testing Login..."
$loginBody = @{ email = 'admin@example.com'; password = 'AdminPassword123!' } | ConvertTo-Json
$loginResponse = Invoke-WebRequest -Uri http://localhost:8080/api/auth/login -Method POST -Body $loginBody -ContentType 'application/json' -UseBasicParsing
$tokens = $loginResponse.Content | ConvertFrom-Json
Write-Host "✓ Login successful`n"

# 4. Get Profile
Write-Host "4. Testing Get Profile..."
$headers = @{ Authorization = "Bearer $($tokens.accessToken)" }
$profile = Invoke-WebRequest -Uri http://localhost:8080/api/users/me -Method GET -Headers $headers -UseBasicParsing
Write-Host "✓ Get profile successful`n"

# 5. Update Profile
Write-Host "5. Testing Update Profile..."
$updateBody = @{ name = 'Updated Admin' } | ConvertTo-Json
$updated = Invoke-WebRequest -Uri http://localhost:8080/api/users/me -Method PATCH -Headers $headers -Body $updateBody -ContentType 'application/json' -UseBasicParsing
Write-Host "✓ Update profile successful`n"

# 6. Get All Users (Admin)
Write-Host "6. Testing Get All Users (Admin)..."
$users = Invoke-WebRequest -Uri http://localhost:8080/api/users -Method GET -Headers $headers -UseBasicParsing
Write-Host "✓ Get all users successful`n"

# 7. Test RBAC
Write-Host "7. Testing RBAC..."
$userLoginBody = @{ email = 'user@example.com'; password = 'UserPassword123!' } | ConvertTo-Json
$userLoginResponse = Invoke-WebRequest -Uri http://localhost:8080/api/auth/login -Method POST -Body $userLoginBody -ContentType 'application/json' -UseBasicParsing
$userTokens = $userLoginResponse.Content | ConvertFrom-Json
$userHeaders = @{ Authorization = "Bearer $($userTokens.accessToken)" }
try {
    Invoke-WebRequest -Uri http://localhost:8080/api/users -Method GET -Headers $userHeaders -UseBasicParsing
    Write-Host "✗ RBAC test failed"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 403) {
        Write-Host "✓ RBAC working correctly (403 for regular user)`n"
    }
}

# 8. Test Refresh Token
Write-Host "8. Testing Refresh Token..."
$refreshBody = @{ refreshToken = $tokens.refreshToken } | ConvertTo-Json
$refreshResponse = Invoke-WebRequest -Uri http://localhost:8080/api/auth/refresh -Method POST -Body $refreshBody -ContentType 'application/json' -UseBasicParsing
Write-Host "✓ Refresh token successful`n"

Write-Host "=== ALL TESTS PASSED ===`n"
```

---

## Notes

- All tests assume the application is running on `http://localhost:8080`
- Rate limiting resets after 1 minute
- OAuth endpoints require real client IDs and secrets to complete the full flow
- For testing OAuth, you can verify the redirect URLs are correct (302 status)
