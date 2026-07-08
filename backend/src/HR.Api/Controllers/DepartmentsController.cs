using HR.Application.Common.Models;
using HR.Application.Features.Departments.DTOs;
using HR.Application.Features.Departments.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HR.Api.Controllers;

[ApiController]
[Route("api/departments")]
[Authorize]
public class DepartmentsController : ControllerBase
{
    private readonly IDepartmentService _service;

    public DepartmentsController(IDepartmentService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<DepartmentDto>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _service.GetDepartmentsAsync(page, pageSize, search, cancellationToken);
        return Ok(ApiResponse<PagedResult<DepartmentDto>>.Ok(result));
    }

    [HttpGet("active")]
    public async Task<ActionResult<ApiResponse<IEnumerable<DepartmentDto>>>> GetActive(CancellationToken cancellationToken)
    {
        var result = await _service.GetAllActiveAsync(cancellationToken);
        return Ok(ApiResponse<IEnumerable<DepartmentDto>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<DepartmentDto>>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _service.GetByIdAsync(id, cancellationToken);
        return Ok(ApiResponse<DepartmentDto>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "HROrAdmin")]
    public async Task<ActionResult<ApiResponse<DepartmentDto>>> Create([FromBody] CreateDepartmentRequest request, CancellationToken cancellationToken)
    {
        var result = await _service.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<DepartmentDto>.Ok(result, "Department created."));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "HROrAdmin")]
    public async Task<ActionResult<ApiResponse<DepartmentDto>>> Update(Guid id, [FromBody] UpdateDepartmentRequest request, CancellationToken cancellationToken)
    {
        var result = await _service.UpdateAsync(id, request, cancellationToken);
        return Ok(ApiResponse<DepartmentDto>.Ok(result, "Department updated."));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "HROrAdmin")]
    public async Task<ActionResult<ApiResponse>> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _service.DeleteAsync(id, cancellationToken);
        return Ok(ApiResponse.Ok("Department deleted."));
    }
}
