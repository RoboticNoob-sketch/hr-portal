using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.Features.Payroll.DTOs;
using HR.Application.Features.Payroll.Interfaces;
using HR.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HR.Api.Controllers;

[ApiController]
[Route("api/payroll")]
[Authorize]
public class PayrollController : ControllerBase
{
    private readonly IPayrollService _service;
    private readonly ICurrentUserService _currentUser;

    public PayrollController(IPayrollService service, ICurrentUserService currentUser)
    {
        _service = service;
        _currentUser = currentUser;
    }

    [HttpGet("summary")]
    [Authorize(Policy = "HROrAdmin")]
    public async Task<ActionResult<ApiResponse<PayrollSummaryDto>>> GetSummary(
        [FromQuery] int? year = null,
        [FromQuery] int? month = null,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var result = await _service.GetSummaryAsync(year ?? now.Year, month ?? now.Month, cancellationToken);
        return Ok(ApiResponse<PayrollSummaryDto>.Ok(result));
    }

    [HttpGet("records")]
    [Authorize(Policy = "HROrAdmin")]
    public async Task<ActionResult<ApiResponse<PagedResult<PayrollRecordDto>>>> GetRecords(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] int? year = null,
        [FromQuery] int? month = null,
        [FromQuery] PayrollStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _service.GetRecordsAsync(page, pageSize, year, month, status, cancellationToken);
        return Ok(ApiResponse<PagedResult<PayrollRecordDto>>.Ok(result));
    }

    [HttpGet("payslips/me")]
    public async Task<ActionResult<ApiResponse<PagedResult<PayrollRecordDto>>>> GetMyPayslips(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var result = await _service.GetMyPayslipsAsync(userId, page, pageSize, cancellationToken);
        return Ok(ApiResponse<PagedResult<PayrollRecordDto>>.Ok(result));
    }

    [HttpGet("records/{id:guid}")]
    public async Task<ActionResult<ApiResponse<PayrollRecordDto>>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var result = await _service.GetByIdAsync(id, userId, _currentUser.Roles, cancellationToken);
        return Ok(ApiResponse<PayrollRecordDto>.Ok(result));
    }

    [HttpPost("process")]
    [Authorize(Policy = "HROrAdmin")]
    public async Task<ActionResult<ApiResponse<IEnumerable<PayrollRecordDto>>>> ProcessPayroll(
        [FromBody] ProcessPayrollRequest request, CancellationToken cancellationToken)
    {
        var processedBy = _currentUser.UserEmail ?? "system";
        var result = await _service.ProcessPayrollAsync(request.Year, request.Month, processedBy, cancellationToken);
        return Ok(ApiResponse<IEnumerable<PayrollRecordDto>>.Ok(result, "Payroll processed successfully."));
    }

    [HttpPost("records/{id:guid}/mark-paid")]
    [Authorize(Policy = "HROrAdmin")]
    public async Task<ActionResult<ApiResponse<PayrollRecordDto>>> MarkPaid(Guid id, CancellationToken cancellationToken)
    {
        var result = await _service.MarkPaidAsync(id, cancellationToken);
        return Ok(ApiResponse<PayrollRecordDto>.Ok(result, "Payroll marked as paid."));
    }
}
