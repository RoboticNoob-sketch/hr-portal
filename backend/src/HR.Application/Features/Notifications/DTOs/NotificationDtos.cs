namespace HR.Application.Features.Notifications.DTOs;

public record NotificationDto(
    Guid Id,
    string Title,
    string Message,
    string Type,
    bool IsRead,
    DateTime? ReadAt,
    string? ActionUrl,
    DateTime CreatedAt
);
