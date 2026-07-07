using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.Features.Dashboard.DTOs;
using HR.Application.Features.Dashboard.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HR.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly ICurrentUserService _currentUser;

    public DashboardController(IDashboardService dashboardService, ICurrentUserService currentUser)
    {
        _dashboardService = dashboardService;
        _currentUser = currentUser;
    }

    [HttpGet("hr")]
    [Authorize(Policy = "ManagerOrAbove")]
    public async Task<ActionResult<ApiResponse<HrDashboardDto>>> GetHrDashboard(CancellationToken cancellationToken)
    {
        var result = await _dashboardService.GetHrDashboardAsync(cancellationToken);
        return Ok(ApiResponse<HrDashboardDto>.Ok(result));
    }

    [HttpGet("employee")]
    public async Task<ActionResult<ApiResponse<EmployeeDashboardDto>>> GetEmployeeDashboard(CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var result = await _dashboardService.GetEmployeeDashboardAsync(userId, cancellationToken);
        return Ok(ApiResponse<EmployeeDashboardDto>.Ok(result));
    }
}
