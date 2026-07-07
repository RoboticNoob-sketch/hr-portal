using HR.Domain.Common;

namespace HR.Domain.Entities;

public class AuditLog : BaseEntity
{
    public string TableName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? RecordId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? ChangedBy { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}
