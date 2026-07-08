using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.Features.Employees.DTOs;
using HR.Application.Features.Employees.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HR.Api.Controllers;

[ApiController]
[Route("api/employees")]
[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _service;
    private readonly ICurrentUserService _currentUser;

    public EmployeesController(IEmployeeService service, ICurrentUserService currentUser)
    {
        _service = service;
        _currentUser = currentUser;
    }

    [HttpGet]
    [Authorize(Policy = "ManagerOrAbove")]
    public async Task<ActionResult<ApiResponse<PagedResult<EmployeeListDto>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] Guid? departmentId = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _service.GetEmployeesAsync(page, pageSize, search, departmentId, cancellationToken);
        return Ok(ApiResponse<PagedResult<EmployeeListDto>>.Ok(result));
    }

    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<EmployeeDetailDto>>> GetMyProfile(CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var result = await _service.GetByUserIdAsync(userId, cancellationToken);
        return Ok(ApiResponse<EmployeeDetailDto>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<EmployeeDetailDto>>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _service.GetByIdAsync(id, cancellationToken);

        if (!_currentUser.IsInRole("Admin") && !_currentUser.IsInRole("HR") && !_currentUser.IsInRole("Manager"))
        {
            var userId = _currentUser.UserId;
            if (userId is null || result.UserId != userId)
                return Forbid();
        }

        return Ok(ApiResponse<EmployeeDetailDto>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "HROrAdmin")]
    public async Task<ActionResult<ApiResponse<EmployeeDetailDto>>> Create([FromBody] CreateEmployeeRequest request, CancellationToken cancellationToken)
    {
        var result = await _service.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<EmployeeDetailDto>.Ok(result, "Employee created."));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "HROrAdmin")]
    public async Task<ActionResult<ApiResponse<EmployeeDetailDto>>> Update(Guid id, [FromBody] UpdateEmployeeRequest request, CancellationToken cancellationToken)
    {
        var result = await _service.UpdateAsync(id, request, cancellationToken);
        return Ok(ApiResponse<EmployeeDetailDto>.Ok(result, "Employee updated."));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "HROrAdmin")]
    public async Task<ActionResult<ApiResponse>> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _service.DeleteAsync(id, cancellationToken);
        return Ok(ApiResponse.Ok("Employee deleted."));
    }
}
