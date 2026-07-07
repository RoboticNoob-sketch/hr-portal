using HR.Domain.Common;
using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class LeaveBalance : BaseEntity
{
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;

    public LeaveType LeaveType { get; set; }
    public int Year { get; set; }
    public decimal TotalEntitlement { get; set; }
    public decimal UsedDays { get; set; }
    public decimal PendingDays { get; set; }
    public decimal RemainingDays => TotalEntitlement - UsedDays - PendingDays;
}
