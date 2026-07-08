using HR.Application.Common.Models;
using HR.Application.Features.Positions.DTOs;
using HR.Application.Features.Positions.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HR.Api.Controllers;

[ApiController]
[Route("api/positions")]
[Authorize]
public class PositionsController : ControllerBase
{
    private readonly IPositionService _service;

    public PositionsController(IPositionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<PositionDto>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? departmentId = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _service.GetPositionsAsync(page, pageSize, departmentId, search, cancellationToken);
        return Ok(ApiResponse<PagedResult<PositionDto>>.Ok(result));
    }

    [HttpGet("active")]
    public async Task<ActionResult<ApiResponse<IEnumerable<PositionDto>>>> GetActive(
        [FromQuery] Guid? departmentId = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _service.GetAllActiveAsync(departmentId, cancellationToken);
        return Ok(ApiResponse<IEnumerable<PositionDto>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<PositionDto>>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _service.GetByIdAsync(id, cancellationToken);
        return Ok(ApiResponse<PositionDto>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "HROrAdmin")]
    public async Task<ActionResult<ApiResponse<PositionDto>>> Create([FromBody] CreatePositionRequest request, CancellationToken cancellationToken)
    {
        var result = await _service.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<PositionDto>.Ok(result, "Position created."));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "HROrAdmin")]
    public async Task<ActionResult<ApiResponse<PositionDto>>> Update(Guid id, [FromBody] UpdatePositionRequest request, CancellationToken cancellationToken)
    {
        var result = await _service.UpdateAsync(id, request, cancellationToken);
        return Ok(ApiResponse<PositionDto>.Ok(result, "Position updated."));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "HROrAdmin")]
    public async Task<ActionResult<ApiResponse>> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _service.DeleteAsync(id, cancellationToken);
        return Ok(ApiResponse.Ok("Position deleted."));
    }
}
