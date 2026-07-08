using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.Features.Departments.DTOs;
using HR.Application.Features.Departments.Interfaces;
using HR.Domain.Entities;

namespace HR.Application.Features.Departments.Services;

public class DepartmentService : IDepartmentService
{
    private readonly IRepository<Department> _deptRepo;
    private readonly IRepository<Employee> _employeeRepo;
    private readonly IRepository<Position> _positionRepo;
    private readonly IUnitOfWork _unitOfWork;

    public DepartmentService(
        IRepository<Department> deptRepo,
        IRepository<Employee> employeeRepo,
        IRepository<Position> positionRepo,
        IUnitOfWork unitOfWork)
    {
        _deptRepo = deptRepo;
        _employeeRepo = employeeRepo;
        _positionRepo = positionRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<DepartmentDto>> GetDepartmentsAsync(int page, int pageSize, string? search = null, CancellationToken cancellationToken = default)
    {
        var all = await _deptRepo.FindAsync(d => !d.IsDeleted, cancellationToken);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            all = all.Where(d =>
                d.Name.Contains(lower, StringComparison.OrdinalIgnoreCase) ||
                (d.Code?.Contains(lower, StringComparison.OrdinalIgnoreCase) ?? false));
        }

        var ordered = all.OrderBy(d => d.Name).ToList();
        var total = ordered.Count;
        var pageItems = ordered.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        var dtos = await MapListAsync(pageItems, cancellationToken);
        return PagedResult<DepartmentDto>.Create(dtos, total, page, pageSize);
    }

    public async Task<IEnumerable<DepartmentDto>> GetAllActiveAsync(CancellationToken cancellationToken = default)
    {
        var all = await _deptRepo.FindAsync(d => !d.IsDeleted && d.IsActive, cancellationToken);
        return await MapListAsync(all.OrderBy(d => d.Name).ToList(), cancellationToken);
    }

    public async Task<DepartmentDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var dept = await _deptRepo.FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(Department), id);
        return (await MapListAsync([dept], cancellationToken)).First();
    }

    public async Task<DepartmentDto> CreateAsync(CreateDepartmentRequest request, CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(request.Code))
        {
            var codeExists = await _deptRepo.AnyAsync(d => d.Code == request.Code && !d.IsDeleted, cancellationToken);
            if (codeExists)
                throw new ConflictException($"Department code '{request.Code}' already exists.");
        }

        if (request.HeadEmployeeId.HasValue)
            await ValidateEmployeeExistsAsync(request.HeadEmployeeId.Value, cancellationToken);

        var dept = new Department
        {
            Name = request.Name,
            Description = request.Description,
            Code = request.Code,
            IsActive = request.IsActive,
            HeadEmployeeId = request.HeadEmployeeId
        };

        await _deptRepo.AddAsync(dept, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(dept.Id, cancellationToken);
    }

    public async Task<DepartmentDto> UpdateAsync(Guid id, UpdateDepartmentRequest request, CancellationToken cancellationToken = default)
    {
        var dept = await _deptRepo.FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(Department), id);

        if (!string.IsNullOrWhiteSpace(request.Code))
        {
            var codeExists = await _deptRepo.AnyAsync(
                d => d.Code == request.Code && d.Id != id && !d.IsDeleted, cancellationToken);
            if (codeExists)
                throw new ConflictException($"Department code '{request.Code}' already exists.");
        }

        if (request.HeadEmployeeId.HasValue)
            await ValidateEmployeeExistsAsync(request.HeadEmployeeId.Value, cancellationToken);

        dept.Name = request.Name;
        dept.Description = request.Description;
        dept.Code = request.Code;
        dept.IsActive = request.IsActive;
        dept.HeadEmployeeId = request.HeadEmployeeId;
        dept.UpdatedAt = DateTime.UtcNow;

        _deptRepo.Update(dept);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var dept = await _deptRepo.FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(Department), id);

        var hasEmployees = await _employeeRepo.AnyAsync(e => e.DepartmentId == id && !e.IsDeleted, cancellationToken);
        if (hasEmployees)
            throw new ConflictException("Cannot delete a department that has assigned employees.");

        dept.IsDeleted = true;
        dept.UpdatedAt = DateTime.UtcNow;
        _deptRepo.Update(dept);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task ValidateEmployeeExistsAsync(Guid employeeId, CancellationToken cancellationToken)
    {
        var exists = await _employeeRepo.AnyAsync(e => e.Id == employeeId && !e.IsDeleted, cancellationToken);
        if (!exists)
            throw new NotFoundException(nameof(Employee), employeeId);
    }

    private async Task<List<DepartmentDto>> MapListAsync(List<Department> departments, CancellationToken cancellationToken)
    {
        if (departments.Count == 0) return [];

        var deptIds = departments.Select(d => d.Id).ToList();
        var employees = await _employeeRepo.FindAsync(e => e.DepartmentId != null && deptIds.Contains(e.DepartmentId.Value) && !e.IsDeleted, cancellationToken);
        var positions = await _positionRepo.FindAsync(p => deptIds.Contains(p.DepartmentId) && !p.IsDeleted, cancellationToken);

        var headIds = departments.Where(d => d.HeadEmployeeId.HasValue).Select(d => d.HeadEmployeeId!.Value).Distinct().ToList();
        var heads = headIds.Count > 0
            ? await _employeeRepo.FindAsync(e => headIds.Contains(e.Id) && !e.IsDeleted, cancellationToken)
            : [];

        return departments.Select(d => new DepartmentDto(
            d.Id,
            d.Name,
            d.Description,
            d.Code,
            d.IsActive,
            d.HeadEmployeeId,
            heads.FirstOrDefault(h => h.Id == d.HeadEmployeeId)?.FullName,
            employees.Count(e => e.DepartmentId == d.Id),
            positions.Count(p => p.DepartmentId == d.Id),
            d.CreatedAt
        )).ToList();
    }
}
