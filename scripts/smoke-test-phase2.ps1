$ErrorActionPreference = 'Stop'

Write-Host '=== Phase 2 API Smoke Test ==='

$loginBody = @{ email = 'hr@hrportal.com'; password = 'Admin@123!'; rememberMe = $false } | ConvertTo-Json
$login = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
$headers = @{ Authorization = "Bearer $($login.data.accessToken)" }

$depts = Invoke-RestMethod -Uri 'http://localhost:5000/api/departments?page=1&pageSize=10' -Headers $headers
Write-Host "Departments: total=$($depts.data.totalCount)"

$positions = Invoke-RestMethod -Uri 'http://localhost:5000/api/positions?page=1&pageSize=10' -Headers $headers
Write-Host "Positions: total=$($positions.data.totalCount)"

$employees = Invoke-RestMethod -Uri 'http://localhost:5000/api/employees?page=1&pageSize=10' -Headers $headers
Write-Host "Employees: total=$($employees.data.totalCount)"

if ($employees.data.items.Count -gt 0) {
  $empId = $employees.data.items[0].id
  $detail = Invoke-RestMethod -Uri "http://localhost:5000/api/employees/$empId" -Headers $headers
  Write-Host "Employee detail: $($detail.data.fullName) / $($detail.data.positionTitle)"
}

$newDept = Invoke-RestMethod -Uri 'http://localhost:5000/api/departments' -Method Post -Headers $headers -Body (@{
  name = 'Test Department'; code = 'TST'; description = 'Smoke test'; isActive = $true
} | ConvertTo-Json) -ContentType 'application/json'
Write-Host "Created department: $($newDept.data.name)"

Invoke-RestMethod -Uri "http://localhost:5000/api/departments/$($newDept.data.id)" -Method Delete -Headers $headers | Out-Null
Write-Host 'Deleted test department'

Write-Host '=== Phase 2 smoke tests passed ==='
