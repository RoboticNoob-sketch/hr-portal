using HR.Domain.Common;
using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class PayrollRecord : BaseEntity
{
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;

    public int PeriodYear { get; set; }
    public int PeriodMonth { get; set; }

    public decimal BasicSalary { get; set; }
    public decimal Allowances { get; set; }
    public decimal OvertimePay { get; set; }
    public decimal SssDeduction { get; set; }
    public decimal PhilHealthDeduction { get; set; }
    public decimal PagIbigDeduction { get; set; }
    public decimal TaxDeduction { get; set; }
    public decimal OtherDeductions { get; set; }
    public decimal GrossPay { get; set; }
    public decimal TotalDeductions { get; set; }
    public decimal NetPay { get; set; }

    public PayrollStatus Status { get; set; } = PayrollStatus.Processed;
    public DateTime? ProcessedAt { get; set; }
    public string? ProcessedBy { get; set; }
    public DateTime? PaidAt { get; set; }
}
