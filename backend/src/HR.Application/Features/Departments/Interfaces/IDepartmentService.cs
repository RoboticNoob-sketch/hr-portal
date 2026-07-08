using HR.Application.Common.Models;
using HR.Application.Features.Departments.DTOs;

namespace HR.Application.Features.Departments.Interfaces;

public interface IDepartmentService
{
    Task<PagedResult<DepartmentDto>> GetDepartmentsAsync(int page, int pageSize, string? search = null, CancellationToken cancellationToken = default);
    Task<IEnumerable<DepartmentDto>> GetAllActiveAsync(CancellationToken cancellationToken = default);
    Task<DepartmentDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DepartmentDto> CreateAsync(CreateDepartmentRequest request, CancellationToken cancellationToken = default);
    Task<DepartmentDto> UpdateAsync(Guid id, UpdateDepartmentRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
