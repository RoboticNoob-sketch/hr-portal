using HR.Application.Common.Models;
using HR.Application.Features.Notifications.DTOs;

namespace HR.Application.Features.Notifications.Interfaces;

public interface INotificationService
{
    Task<PagedResult<NotificationDto>> GetUserNotificationsAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken cancellationToken = default);
    Task MarkAsReadAsync(Guid notificationId, Guid userId, CancellationToken cancellationToken = default);
    Task MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken = default);
}
