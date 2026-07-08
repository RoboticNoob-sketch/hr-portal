$ErrorActionPreference = 'Stop'

Write-Host '=== Phase 4 API Smoke Test ==='

$hrLogin = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method Post -Body (@{
  email = 'hr@hrportal.com'; password = 'Admin@123!'; rememberMe = $false
} | ConvertTo-Json) -ContentType 'application/json'
$hrHeaders = @{ Authorization = "Bearer $($hrLogin.data.accessToken)" }

$now = Get-Date
$summary = Invoke-RestMethod -Uri "http://localhost:5000/api/payroll/summary?year=$($now.Year)&month=$($now.Month)" -Headers $hrHeaders
Write-Host "Payroll summary: processed=$($summary.data.processedCount) paid=$($summary.data.paidCount)"

$records = Invoke-RestMethod -Uri 'http://localhost:5000/api/payroll/records?pageSize=5' -Headers $hrHeaders
Write-Host "Payroll records: $($records.data.totalCount) total"

$empLogin = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method Post -Body (@{
  email = 'employee@hrportal.com'; password = 'Admin@123!'; rememberMe = $false
} | ConvertTo-Json) -ContentType 'application/json'
$empHeaders = @{ Authorization = "Bearer $($empLogin.data.accessToken)" }

$payslips = Invoke-RestMethod -Uri 'http://localhost:5000/api/payroll/payslips/me' -Headers $empHeaders
Write-Host "Employee payslips: $($payslips.data.totalCount)"

if ($records.data.items.Count -gt 0) {
  $id = $records.data.items[0].id
  $detail = Invoke-RestMethod -Uri "http://localhost:5000/api/payroll/records/$id" -Headers $hrHeaders
  Write-Host "Payslip detail net pay: $($detail.data.netPay)"
}

Write-Host '=== Phase 4 smoke tests passed ==='
