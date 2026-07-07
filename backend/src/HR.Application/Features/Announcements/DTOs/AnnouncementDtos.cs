using HR.Domain.Enums;

namespace HR.Application.Features.Announcements.DTOs;

public record CreateAnnouncementRequest(
    string Title,
    string Body,
    AnnouncementCategory Category,
    DateTime PublishDate,
    DateTime? ExpiryDate,
    bool IsPublished,
    string? TargetAudience
);

public record UpdateAnnouncementRequest(
    string Title,
    string Body,
    AnnouncementCategory Category,
    DateTime PublishDate,
    DateTime? ExpiryDate,
    bool IsPublished,
    string? TargetAudience
);

public record AnnouncementDto(
    Guid Id,
    string Title,
    string Body,
    string Category,
    DateTime PublishDate,
    DateTime? ExpiryDate,
    bool IsPublished,
    string? TargetAudience,
    string? AuthorName,
    DateTime CreatedAt
);
