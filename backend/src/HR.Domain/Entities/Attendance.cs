using HR.Domain.Common;

namespace HR.Domain.Entities;

public class Attendance : BaseEntity
{
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;

    public DateTime Date { get; set; }
    public DateTime? ClockIn { get; set; }
    public DateTime? ClockOut { get; set; }
    public TimeSpan? TotalHours { get; set; }
    public TimeSpan? OvertimeHours { get; set; }
    public TimeSpan? UndertimeMinutes { get; set; }
    public bool IsLate { get; set; } = false;
    public string? Notes { get; set; }
    public string? ShiftName { get; set; }
}
