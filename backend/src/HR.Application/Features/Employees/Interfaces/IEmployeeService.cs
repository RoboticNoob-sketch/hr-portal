using HR.Application.Common.Models;
using HR.Application.Features.Employees.DTOs;

namespace HR.Application.Features.Employees.Interfaces;

public interface IEmployeeService
{
    Task<PagedResult<EmployeeListDto>> GetEmployeesAsync(int page, int pageSize, string? search = null, Guid? departmentId = null, CancellationToken cancellationToken = default);
    Task<EmployeeDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<EmployeeDetailDto> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<EmployeeDetailDto> CreateAsync(CreateEmployeeRequest request, CancellationToken cancellationToken = default);
    Task<EmployeeDetailDto> UpdateAsync(Guid id, UpdateEmployeeRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
