using HR.Domain.Common;
using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class Announcement : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public AnnouncementCategory Category { get; set; } = AnnouncementCategory.General;
    public DateTime PublishDate { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiryDate { get; set; }
    public bool IsPublished { get; set; } = true;
    public string? TargetAudience { get; set; }
    public string? AuthorName { get; set; }
}
