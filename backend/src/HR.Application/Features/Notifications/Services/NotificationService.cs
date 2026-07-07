using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.Features.Notifications.DTOs;
using HR.Application.Features.Notifications.Interfaces;
using HR.Domain.Entities;

namespace HR.Application.Features.Notifications.Services;

public class NotificationService : INotificationService
{
    private readonly IRepository<Notification> _repo;
    private readonly IUnitOfWork _unitOfWork;

    public NotificationService(IRepository<Notification> repo, IUnitOfWork unitOfWork)
    {
        _repo = repo;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<NotificationDto>> GetUserNotificationsAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var all = await _repo.FindAsync(n => n.UserId == userId && !n.IsDeleted, cancellationToken);
        var ordered = all.OrderByDescending(n => n.CreatedAt).ToList();
        var total = ordered.Count;
        var items = ordered.Skip((page - 1) * pageSize).Take(pageSize);
        return PagedResult<NotificationDto>.Create(items.Select(Map), total, page, pageSize);
    }

    public async Task<int> GetUnreadCountAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await _repo.CountAsync(n => n.UserId == userId && !n.IsRead && !n.IsDeleted, cancellationToken);

    public async Task MarkAsReadAsync(Guid notificationId, Guid userId, CancellationToken cancellationToken = default)
    {
        var n = await _repo.FirstOrDefaultAsync(x => x.Id == notificationId && x.UserId == userId && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(Notification), notificationId);
        n.IsRead = true;
        n.ReadAt = DateTime.UtcNow;
        _repo.Update(n);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var notifications = await _repo.FindAsync(n => n.UserId == userId && !n.IsRead && !n.IsDeleted, cancellationToken);
        foreach (var n in notifications)
        {
            n.IsRead = true;
            n.ReadAt = DateTime.UtcNow;
            _repo.Update(n);
        }
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static NotificationDto Map(Notification n) =>
        new(n.Id, n.Title, n.Message, n.Type.ToString(), n.IsRead, n.ReadAt, n.ActionUrl, n.CreatedAt);
}
