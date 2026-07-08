$ErrorActionPreference = 'Stop'

Write-Host '=== Phase 3 API Smoke Test ==='

$loginBody = @{ email = 'employee@hrportal.com'; password = 'Admin@123!'; rememberMe = $false } | ConvertTo-Json
$login = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
$empHeaders = @{ Authorization = "Bearer $($login.data.accessToken)" }

$today = Invoke-RestMethod -Uri 'http://localhost:5000/api/attendance/today' -Headers $empHeaders
Write-Host "Today status: canClockIn=$($today.data.canClockIn) canClockOut=$($today.data.canClockOut)"

if ($today.data.canClockIn) {
  $clockIn = Invoke-RestMethod -Uri 'http://localhost:5000/api/attendance/clock-in' -Method Post -Headers $empHeaders
  Write-Host "Clock in: $($clockIn.data.clockIn)"
}

$balances = Invoke-RestMethod -Uri 'http://localhost:5000/api/leave/balances/me' -Headers $empHeaders
Write-Host "Leave balances: $($balances.data.Count) types"

$start = (Get-Date).AddDays(30).ToString('yyyy-MM-dd')
$end = (Get-Date).AddDays(32).ToString('yyyy-MM-dd')
$newLeave = Invoke-RestMethod -Uri 'http://localhost:5000/api/leave/requests' -Method Post -Headers $empHeaders -Body (@{
  leaveType = 'Sick'; startDate = $start; endDate = $end; reason = 'Phase 3 smoke test'
} | ConvertTo-Json) -ContentType 'application/json'
Write-Host "Created leave request: $($newLeave.data.leaveType) $($newLeave.data.status)"

Invoke-RestMethod -Uri "http://localhost:5000/api/leave/requests/$($newLeave.data.id)/cancel" -Method Post -Headers $empHeaders | Out-Null
Write-Host 'Cancelled test leave request'

$mgrLogin = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method Post -Body (@{
  email = 'manager@hrportal.com'; password = 'Admin@123!'; rememberMe = $false
} | ConvertTo-Json) -ContentType 'application/json'
$mgrHeaders = @{ Authorization = "Bearer $($mgrLogin.data.accessToken)" }

$pending = Invoke-RestMethod -Uri 'http://localhost:5000/api/leave/requests/pending' -Headers $mgrHeaders
Write-Host "Pending approvals for manager: $($pending.data.totalCount)"

$team = Invoke-RestMethod -Uri 'http://localhost:5000/api/attendance/team' -Headers $mgrHeaders
Write-Host "Team attendance today: $($team.data.totalCount) records"

Write-Host '=== Phase 3 smoke tests passed ==='
