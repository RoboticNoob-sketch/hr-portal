using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.Features.Positions.DTOs;
using HR.Application.Features.Positions.Interfaces;
using HR.Domain.Entities;

namespace HR.Application.Features.Positions.Services;

public class PositionService : IPositionService
{
    private readonly IRepository<Position> _positionRepo;
    private readonly IRepository<Department> _deptRepo;
    private readonly IRepository<Employee> _employeeRepo;
    private readonly IUnitOfWork _unitOfWork;

    public PositionService(
        IRepository<Position> positionRepo,
        IRepository<Department> deptRepo,
        IRepository<Employee> employeeRepo,
        IUnitOfWork unitOfWork)
    {
        _positionRepo = positionRepo;
        _deptRepo = deptRepo;
        _employeeRepo = employeeRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<PositionDto>> GetPositionsAsync(int page, int pageSize, Guid? departmentId = null, string? search = null, CancellationToken cancellationToken = default)
    {
        var all = await _positionRepo.FindAsync(p => !p.IsDeleted, cancellationToken);

        if (departmentId.HasValue)
            all = all.Where(p => p.DepartmentId == departmentId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            all = all.Where(p =>
                p.Title.Contains(lower, StringComparison.OrdinalIgnoreCase) ||
                (p.SalaryGrade?.Contains(lower, StringComparison.OrdinalIgnoreCase) ?? false));
        }

        var ordered = all.OrderBy(p => p.Title).ToList();
        var total = ordered.Count;
        var pageItems = ordered.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        var dtos = await MapListAsync(pageItems, cancellationToken);
        return PagedResult<PositionDto>.Create(dtos, total, page, pageSize);
    }

    public async Task<IEnumerable<PositionDto>> GetAllActiveAsync(Guid? departmentId = null, CancellationToken cancellationToken = default)
    {
        var all = await _positionRepo.FindAsync(p => !p.IsDeleted && p.IsActive, cancellationToken);
        if (departmentId.HasValue)
            all = all.Where(p => p.DepartmentId == departmentId.Value);
        return await MapListAsync(all.OrderBy(p => p.Title).ToList(), cancellationToken);
    }

    public async Task<PositionDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var position = await _positionRepo.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(Position), id);
        return (await MapListAsync([position], cancellationToken)).First();
    }

    public async Task<PositionDto> CreateAsync(CreatePositionRequest request, CancellationToken cancellationToken = default)
    {
        await ValidateDepartmentAsync(request.DepartmentId, cancellationToken);
        ValidateSalaryRange(request.MinSalary, request.MaxSalary);

        var position = new Position
        {
            Title = request.Title,
            Description = request.Description,
            MinSalary = request.MinSalary,
            MaxSalary = request.MaxSalary,
            SalaryGrade = request.SalaryGrade,
            IsActive = request.IsActive,
            DepartmentId = request.DepartmentId
        };

        await _positionRepo.AddAsync(position, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(position.Id, cancellationToken);
    }

    public async Task<PositionDto> UpdateAsync(Guid id, UpdatePositionRequest request, CancellationToken cancellationToken = default)
    {
        var position = await _positionRepo.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(Position), id);

        await ValidateDepartmentAsync(request.DepartmentId, cancellationToken);
        ValidateSalaryRange(request.MinSalary, request.MaxSalary);

        position.Title = request.Title;
        position.Description = request.Description;
        position.MinSalary = request.MinSalary;
        position.MaxSalary = request.MaxSalary;
        position.SalaryGrade = request.SalaryGrade;
        position.IsActive = request.IsActive;
        position.DepartmentId = request.DepartmentId;
        position.UpdatedAt = DateTime.UtcNow;

        _positionRepo.Update(position);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var position = await _positionRepo.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(Position), id);

        var hasEmployees = await _employeeRepo.AnyAsync(e => e.PositionId == id && !e.IsDeleted, cancellationToken);
        if (hasEmployees)
            throw new ConflictException("Cannot delete a position that has assigned employees.");

        position.IsDeleted = true;
        position.UpdatedAt = DateTime.UtcNow;
        _positionRepo.Update(position);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task ValidateDepartmentAsync(Guid departmentId, CancellationToken cancellationToken)
    {
        var exists = await _deptRepo.AnyAsync(d => d.Id == departmentId && !d.IsDeleted, cancellationToken);
        if (!exists)
            throw new NotFoundException(nameof(Department), departmentId);
    }

    private static void ValidateSalaryRange(decimal min, decimal max)
    {
        if (min < 0 || max < 0)
            throw new AppException("Salary values cannot be negative.");
        if (min > max)
            throw new AppException("Minimum salary cannot exceed maximum salary.");
    }

    private async Task<List<PositionDto>> MapListAsync(List<Position> positions, CancellationToken cancellationToken)
    {
        if (positions.Count == 0) return [];

        var deptIds = positions.Select(p => p.DepartmentId).Distinct().ToList();
        var departments = await _deptRepo.FindAsync(d => deptIds.Contains(d.Id) && !d.IsDeleted, cancellationToken);
        var positionIds = positions.Select(p => p.Id).ToList();
        var employees = await _employeeRepo.FindAsync(e => e.PositionId != null && positionIds.Contains(e.PositionId.Value) && !e.IsDeleted, cancellationToken);

        return positions.Select(p => new PositionDto(
            p.Id,
            p.Title,
            p.Description,
            p.MinSalary,
            p.MaxSalary,
            p.SalaryGrade,
            p.IsActive,
            p.DepartmentId,
            departments.FirstOrDefault(d => d.Id == p.DepartmentId)?.Name ?? "—",
            employees.Count(e => e.PositionId == p.Id),
            p.CreatedAt
        )).ToList();
    }
}
