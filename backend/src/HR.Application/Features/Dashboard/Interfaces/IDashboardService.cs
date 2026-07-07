using HR.Application.Features.Dashboard.DTOs;

namespace HR.Application.Features.Dashboard.Interfaces;

public interface IDashboardService
{
    Task<HrDashboardDto> GetHrDashboardAsync(CancellationToken cancellationToken = default);
    Task<EmployeeDashboardDto> GetEmployeeDashboardAsync(Guid userId, CancellationToken cancellationToken = default);
}
