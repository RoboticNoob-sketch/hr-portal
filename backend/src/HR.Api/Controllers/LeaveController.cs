using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.Features.Leave.DTOs;
using HR.Application.Features.Leave.Interfaces;
using HR.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HR.Api.Controllers;

[ApiController]
[Route("api/leave")]
[Authorize]
public class LeaveController : ControllerBase
{
    private readonly ILeaveService _service;
    private readonly ICurrentUserService _currentUser;

    public LeaveController(ILeaveService service, ICurrentUserService currentUser)
    {
        _service = service;
        _currentUser = currentUser;
    }

    [HttpGet("balances/me")]
    public async Task<ActionResult<ApiResponse<IEnumerable<LeaveBalanceDto>>>> GetMyBalances(CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var result = await _service.GetMyBalancesAsync(userId, cancellationToken);
        return Ok(ApiResponse<IEnumerable<LeaveBalanceDto>>.Ok(result));
    }

    [HttpGet("requests/me")]
    public async Task<ActionResult<ApiResponse<PagedResult<LeaveRequestDto>>>> GetMyRequests(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] LeaveStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var result = await _service.GetMyRequestsAsync(userId, page, pageSize, status, cancellationToken);
        return Ok(ApiResponse<PagedResult<LeaveRequestDto>>.Ok(result));
    }

    [HttpGet("requests/pending")]
    [Authorize(Policy = "ManagerOrAbove")]
    public async Task<ActionResult<ApiResponse<PagedResult<LeaveRequestDto>>>> GetPendingRequests(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var result = await _service.GetPendingRequestsAsync(
            userId, _currentUser.Roles, page, pageSize, cancellationToken);
        return Ok(ApiResponse<PagedResult<LeaveRequestDto>>.Ok(result));
    }

    [HttpGet("requests/reviewed")]
    [Authorize(Policy = "ManagerOrAbove")]
    public async Task<ActionResult<ApiResponse<PagedResult<LeaveRequestDto>>>> GetReviewedRequests(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var result = await _service.GetReviewedRequestsAsync(
            userId, _currentUser.Roles, page, pageSize, cancellationToken);
        return Ok(ApiResponse<PagedResult<LeaveRequestDto>>.Ok(result));
    }

    [HttpGet("requests/all")]
    [Authorize(Policy = "HROrAdmin")]
    public async Task<ActionResult<ApiResponse<PagedResult<LeaveRequestDto>>>> GetAllRequests(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] LeaveStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _service.GetAllRequestsAsync(page, pageSize, status, cancellationToken);
        return Ok(ApiResponse<PagedResult<LeaveRequestDto>>.Ok(result));
    }

    [HttpPost("requests")]
    public async Task<ActionResult<ApiResponse<LeaveRequestDto>>> CreateRequest(
        [FromBody] CreateLeaveRequest request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var result = await _service.CreateRequestAsync(userId, request, cancellationToken);
        return CreatedAtAction(nameof(GetMyRequests), ApiResponse<LeaveRequestDto>.Ok(result, "Leave request submitted."));
    }

    [HttpPost("requests/{id:guid}/review")]
    [Authorize(Policy = "ManagerOrAbove")]
    public async Task<ActionResult<ApiResponse<LeaveRequestDto>>> ReviewRequest(
        Guid id, [FromBody] ReviewLeaveRequest request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var email = _currentUser.UserEmail ?? "unknown";
        var result = await _service.ReviewRequestAsync(
            id, email, _currentUser.Roles, userId, request, cancellationToken);
        return Ok(ApiResponse<LeaveRequestDto>.Ok(result, request.Approve ? "Leave approved." : "Leave rejected."));
    }

    [HttpPost("requests/{id:guid}/cancel")]
    public async Task<ActionResult<ApiResponse>> CancelRequest(Guid id, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        await _service.CancelRequestAsync(id, userId, _currentUser.Roles, cancellationToken);
        return Ok(ApiResponse.Ok("Leave request cancelled."));
    }
}
