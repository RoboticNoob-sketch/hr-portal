using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.Features.Attendance.DTOs;
using HR.Application.Features.Attendance.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HR.Api.Controllers;

[ApiController]
[Route("api/attendance")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _service;
    private readonly ICurrentUserService _currentUser;

    public AttendanceController(IAttendanceService service, ICurrentUserService currentUser)
    {
        _service = service;
        _currentUser = currentUser;
    }

    [HttpGet("today")]
    public async Task<ActionResult<ApiResponse<TodayAttendanceStatusDto>>> GetToday(CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var result = await _service.GetTodayStatusAsync(userId, cancellationToken);
        return Ok(ApiResponse<TodayAttendanceStatusDto>.Ok(result));
    }

    [HttpPost("clock-in")]
    public async Task<ActionResult<ApiResponse<AttendanceDto>>> ClockIn(CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var result = await _service.ClockInAsync(userId, cancellationToken);
        return Ok(ApiResponse<AttendanceDto>.Ok(result, "Clocked in successfully."));
    }

    [HttpPost("clock-out")]
    public async Task<ActionResult<ApiResponse<AttendanceDto>>> ClockOut(CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var result = await _service.ClockOutAsync(userId, cancellationToken);
        return Ok(ApiResponse<AttendanceDto>.Ok(result, "Clocked out successfully."));
    }

    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<PagedResult<AttendanceDto>>>> GetMyAttendance(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var result = await _service.GetMyAttendanceAsync(userId, page, pageSize, fromDate, toDate, cancellationToken);
        return Ok(ApiResponse<PagedResult<AttendanceDto>>.Ok(result));
    }

    [HttpGet("team")]
    [Authorize(Policy = "ManagerOrAbove")]
    public async Task<ActionResult<ApiResponse<PagedResult<AttendanceDto>>>> GetTeamAttendance(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] DateTime? date = null,
        [FromQuery] Guid? departmentId = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _service.GetTeamAttendanceAsync(page, pageSize, date, departmentId, cancellationToken);
        return Ok(ApiResponse<PagedResult<AttendanceDto>>.Ok(result));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "HROrAdmin")]
    public async Task<ActionResult<ApiResponse<AttendanceDto>>> Update(
        Guid id, [FromBody] UpdateAttendanceRequest request, CancellationToken cancellationToken)
    {
        var result = await _service.UpdateAsync(id, request, cancellationToken);
        return Ok(ApiResponse<AttendanceDto>.Ok(result, "Attendance updated."));
    }
}
