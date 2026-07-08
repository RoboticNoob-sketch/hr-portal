using HR.Application.Common.Models;
using HR.Application.Features.Payroll.DTOs;
using HR.Domain.Enums;

namespace HR.Application.Features.Payroll.Interfaces;

public interface IPayrollService
{
    Task<PayrollSummaryDto> GetSummaryAsync(int year, int month, CancellationToken cancellationToken = default);
    Task<PagedResult<PayrollRecordDto>> GetRecordsAsync(
        int page, int pageSize, int? year = null, int? month = null, PayrollStatus? status = null,
        CancellationToken cancellationToken = default);
    Task<PagedResult<PayrollRecordDto>> GetMyPayslipsAsync(
        Guid userId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<PayrollRecordDto> GetByIdAsync(Guid id, Guid userId, IEnumerable<string> roles, CancellationToken cancellationToken = default);
    Task<IEnumerable<PayrollRecordDto>> ProcessPayrollAsync(
        int year, int month, string processedBy, CancellationToken cancellationToken = default);
    Task<PayrollRecordDto> MarkPaidAsync(Guid id, CancellationToken cancellationToken = default);
}
