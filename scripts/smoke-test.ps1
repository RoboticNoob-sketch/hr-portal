$ErrorActionPreference = 'Stop'

Write-Host '=== HR Portal Smoke Test ==='

# Health
$health = Invoke-RestMethod -Uri 'http://localhost:5000/api/health'
Write-Host "Health: $($health.status)"

# Login
$loginBody = @{ email = 'admin@hrportal.com'; password = 'Admin@123!'; rememberMe = $false } | ConvertTo-Json
$login = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
Write-Host "Login: success=$($login.success), user=$($login.data.user.fullName), roles=$($login.data.user.roles -join ',')"

$token = $login.data.accessToken
$headers = @{ Authorization = "Bearer $token" }

# HR Dashboard
$hrDash = Invoke-RestMethod -Uri 'http://localhost:5000/api/dashboard/hr' -Headers $headers
Write-Host "HR Dashboard: employees=$($hrDash.data.totalEmployees), pendingLeave=$($hrDash.data.pendingLeaveRequests)"

# Users
$users = Invoke-RestMethod -Uri 'http://localhost:5000/api/users?page=1&pageSize=5' -Headers $headers
Write-Host "Users: total=$($users.data.totalCount)"

# Announcements
$ann = Invoke-RestMethod -Uri 'http://localhost:5000/api/announcements?page=1&pageSize=5' -Headers $headers
Write-Host "Announcements: total=$($ann.data.totalCount)"

# Refresh token
$refreshBody = @{ refreshToken = $login.data.refreshToken } | ConvertTo-Json
$refresh = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/refresh' -Method Post -Body $refreshBody -ContentType 'application/json'
Write-Host "Refresh token: success=$($refresh.success)"

# Employee login + dashboard
$empLoginBody = @{ email = 'employee@hrportal.com'; password = 'Admin@123!'; rememberMe = $false } | ConvertTo-Json
$empLogin = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method Post -Body $empLoginBody -ContentType 'application/json'
$empHeaders = @{ Authorization = "Bearer $($empLogin.data.accessToken)" }
$empDash = Invoke-RestMethod -Uri 'http://localhost:5000/api/dashboard/employee' -Headers $empHeaders
Write-Host "Employee Dashboard: profile=$($empDash.data.profile.fullName), leaveBalances=$($empDash.data.leaveBalances.Count)"

# Frontend
$frontend = Invoke-WebRequest -Uri 'http://localhost:3000/' -UseBasicParsing
Write-Host "Frontend: HTTP $($frontend.StatusCode)"

Write-Host '=== All smoke tests passed ==='
