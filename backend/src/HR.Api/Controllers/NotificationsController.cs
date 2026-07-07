using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.Features.Notifications.DTOs;
using HR.Application.Features.Notifications.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HR.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _service;
    private readonly ICurrentUserService _currentUser;

    public NotificationsController(INotificationService service, ICurrentUserService currentUser)
    {
        _service = service;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<NotificationDto>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var result = await _service.GetUserNotificationsAsync(userId, page, pageSize, cancellationToken);
        return Ok(ApiResponse<PagedResult<NotificationDto>>.Ok(result));
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<ApiResponse<int>>> GetUnreadCount(CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var count = await _service.GetUnreadCountAsync(userId, cancellationToken);
        return Ok(ApiResponse<int>.Ok(count));
    }

    [HttpPut("{id:guid}/read")]
    public async Task<ActionResult<ApiResponse>> MarkAsRead(Guid id, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        await _service.MarkAsReadAsync(id, userId, cancellationToken);
        return Ok(ApiResponse.Ok("Notification marked as read."));
    }

    [HttpPut("read-all")]
    public async Task<ActionResult<ApiResponse>> MarkAllAsRead(CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        await _service.MarkAllAsReadAsync(userId, cancellationToken);
        return Ok(ApiResponse.Ok("All notifications marked as read."));
    }
}
