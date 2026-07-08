using HR.Domain.Enums;

namespace HR.Application.Features.Payroll.DTOs;

public record PayrollRecordDto(
    Guid Id,
    Guid EmployeeId,
    string EmployeeName,
    string? EmployeeNumber,
    string? DepartmentName,
    int PeriodYear,
    int PeriodMonth,
    decimal BasicSalary,
    decimal Allowances,
    decimal OvertimePay,
    decimal SssDeduction,
    decimal PhilHealthDeduction,
    decimal PagIbigDeduction,
    decimal TaxDeduction,
    decimal OtherDeductions,
    decimal GrossPay,
    decimal TotalDeductions,
    decimal NetPay,
    string Status,
    DateTime? ProcessedAt,
    string? ProcessedBy,
    DateTime? PaidAt,
    DateTime CreatedAt
);

public record PayrollSummaryDto(
    int PeriodYear,
    int PeriodMonth,
    int TotalEmployees,
    int ProcessedCount,
    int PaidCount,
    decimal TotalGrossPay,
    decimal TotalNetPay,
    decimal TotalDeductions
);

public record ProcessPayrollRequest(
    int Year,
    int Month
);
