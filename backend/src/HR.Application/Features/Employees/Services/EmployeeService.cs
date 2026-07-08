using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.Features.Employees.DTOs;
using HR.Application.Features.Employees.Interfaces;
using HR.Domain.Entities;
using HR.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace HR.Application.Features.Employees.Services;

public class EmployeeService : IEmployeeService
{
    private readonly IRepository<Employee> _employeeRepo;
    private readonly IRepository<User> _userRepo;
    private readonly IRepository<Department> _deptRepo;
    private readonly IRepository<Position> _positionRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<EmployeeService> _logger;

    public EmployeeService(
        IRepository<Employee> employeeRepo,
        IRepository<User> userRepo,
        IRepository<Department> deptRepo,
        IRepository<Position> positionRepo,
        IUnitOfWork unitOfWork,
        ILogger<EmployeeService> logger)
    {
        _employeeRepo = employeeRepo;
        _userRepo = userRepo;
        _deptRepo = deptRepo;
        _positionRepo = positionRepo;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResult<EmployeeListDto>> GetEmployeesAsync(int page, int pageSize, string? search = null, Guid? departmentId = null, CancellationToken cancellationToken = default)
    {
        var all = await _employeeRepo.FindAsync(e => !e.IsDeleted, cancellationToken);

        if (departmentId.HasValue)
            all = all.Where(e => e.DepartmentId == departmentId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            all = all.Where(e =>
                e.FirstName.Contains(lower, StringComparison.OrdinalIgnoreCase) ||
                e.LastName.Contains(lower, StringComparison.OrdinalIgnoreCase) ||
                e.EmployeeNumber.Contains(lower, StringComparison.OrdinalIgnoreCase));
        }

        var ordered = all.OrderBy(e => e.LastName).ThenBy(e => e.FirstName).ToList();
        var total = ordered.Count;
        var pageItems = ordered.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        var dtos = await MapListAsync(pageItems, cancellationToken);
        return PagedResult<EmployeeListDto>.Create(dtos, total, page, pageSize);
    }

    public async Task<EmployeeDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var employee = await _employeeRepo.FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(Employee), id);
        return await MapDetailAsync(employee, cancellationToken);
    }

    public async Task<EmployeeDetailDto> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var employee = await _employeeRepo.FirstOrDefaultAsync(e => e.UserId == userId && !e.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(Employee), userId);
        return await MapDetailAsync(employee, cancellationToken);
    }

    public async Task<EmployeeDetailDto> CreateAsync(CreateEmployeeRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepo.FirstOrDefaultAsync(u => u.Id == request.UserId && !u.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(User), request.UserId);

        var existingEmployee = await _employeeRepo.AnyAsync(e => e.UserId == request.UserId && !e.IsDeleted, cancellationToken);
        if (existingEmployee)
            throw new ConflictException("This user already has an employee record.");

        await ValidateForeignKeysAsync(request.DepartmentId, request.PositionId, request.ManagerId, cancellationToken);

        var employeeNumber = request.EmployeeNumber;
        if (string.IsNullOrWhiteSpace(employeeNumber))
            employeeNumber = await GenerateEmployeeNumberAsync(cancellationToken);
        else
        {
            var numberExists = await _employeeRepo.AnyAsync(e => e.EmployeeNumber == employeeNumber && !e.IsDeleted, cancellationToken);
            if (numberExists)
                throw new ConflictException($"Employee number '{employeeNumber}' already exists.");
        }

        var employee = new Employee
        {
            UserId = request.UserId,
            EmployeeNumber = employeeNumber,
            FirstName = request.FirstName,
            LastName = request.LastName,
            MiddleName = request.MiddleName,
            Suffix = request.Suffix,
            DateOfBirth = request.DateOfBirth,
            Gender = request.Gender,
            CivilStatus = request.CivilStatus,
            Nationality = request.Nationality,
            PhoneNumber = request.PhoneNumber,
            Address = request.Address,
            City = request.City,
            Province = request.Province,
            ZipCode = request.ZipCode,
            HireDate = request.HireDate,
            Status = request.Status,
            EmploymentType = request.EmploymentType,
            DepartmentId = request.DepartmentId,
            PositionId = request.PositionId,
            ManagerId = request.ManagerId,
            SssNumber = request.SssNumber,
            PhilHealthNumber = request.PhilHealthNumber,
            PagIbigNumber = request.PagIbigNumber,
            TinNumber = request.TinNumber
        };

        await _employeeRepo.AddAsync(employee, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Created employee {EmployeeNumber} for user {Email}.", employee.EmployeeNumber, user.Email);
        return await MapDetailAsync(employee, cancellationToken);
    }

    public async Task<EmployeeDetailDto> UpdateAsync(Guid id, UpdateEmployeeRequest request, CancellationToken cancellationToken = default)
    {
        var employee = await _employeeRepo.FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(Employee), id);

        if (request.ManagerId == id)
            throw new AppException("An employee cannot be their own manager.");

        await ValidateForeignKeysAsync(request.DepartmentId, request.PositionId, request.ManagerId, cancellationToken);

        employee.FirstName = request.FirstName;
        employee.LastName = request.LastName;
        employee.MiddleName = request.MiddleName;
        employee.Suffix = request.Suffix;
        employee.DateOfBirth = request.DateOfBirth;
        employee.Gender = request.Gender;
        employee.CivilStatus = request.CivilStatus;
        employee.Nationality = request.Nationality;
        employee.PhoneNumber = request.PhoneNumber;
        employee.Address = request.Address;
        employee.City = request.City;
        employee.Province = request.Province;
        employee.ZipCode = request.ZipCode;
        employee.ProfilePhotoUrl = request.ProfilePhotoUrl;
        employee.HireDate = request.HireDate;
        employee.RegularizationDate = request.RegularizationDate;
        employee.ResignationDate = request.ResignationDate;
        employee.Status = request.Status;
        employee.EmploymentType = request.EmploymentType;
        employee.DepartmentId = request.DepartmentId;
        employee.PositionId = request.PositionId;
        employee.ManagerId = request.ManagerId;
        employee.SssNumber = request.SssNumber;
        employee.PhilHealthNumber = request.PhilHealthNumber;
        employee.PagIbigNumber = request.PagIbigNumber;
        employee.TinNumber = request.TinNumber;
        employee.UpdatedAt = DateTime.UtcNow;

        _employeeRepo.Update(employee);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return await MapDetailAsync(employee, cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var employee = await _employeeRepo.FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(Employee), id);

        employee.IsDeleted = true;
        employee.UpdatedAt = DateTime.UtcNow;
        _employeeRepo.Update(employee);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task ValidateForeignKeysAsync(Guid? departmentId, Guid? positionId, Guid? managerId, CancellationToken cancellationToken)
    {
        if (departmentId.HasValue)
        {
            var deptExists = await _deptRepo.AnyAsync(d => d.Id == departmentId.Value && !d.IsDeleted, cancellationToken);
            if (!deptExists) throw new NotFoundException(nameof(Department), departmentId.Value);
        }

        if (positionId.HasValue)
        {
            var posExists = await _positionRepo.AnyAsync(p => p.Id == positionId.Value && !p.IsDeleted, cancellationToken);
            if (!posExists) throw new NotFoundException(nameof(Position), positionId.Value);
        }

        if (managerId.HasValue)
        {
            var mgrExists = await _employeeRepo.AnyAsync(e => e.Id == managerId.Value && !e.IsDeleted, cancellationToken);
            if (!mgrExists) throw new NotFoundException(nameof(Employee), managerId.Value);
        }
    }

    private async Task<string> GenerateEmployeeNumberAsync(CancellationToken cancellationToken)
    {
        var all = await _employeeRepo.FindAsync(e => !e.IsDeleted, cancellationToken);
        var maxNum = all
            .Select(e => int.TryParse(e.EmployeeNumber.Replace("EMP", ""), out var n) ? n : 0)
            .DefaultIfEmpty(1000)
            .Max();
        return $"EMP{maxNum + 1}";
    }

    private async Task<List<EmployeeListDto>> MapListAsync(List<Employee> employees, CancellationToken cancellationToken)
    {
        if (employees.Count == 0) return [];

        var userIds = employees.Select(e => e.UserId).Distinct().ToList();
        var users = await _userRepo.FindAsync(u => userIds.Contains(u.Id) && !u.IsDeleted, cancellationToken);

        var deptIds = employees.Where(e => e.DepartmentId.HasValue).Select(e => e.DepartmentId!.Value).Distinct().ToList();
        var posIds = employees.Where(e => e.PositionId.HasValue).Select(e => e.PositionId!.Value).Distinct().ToList();

        var departments = deptIds.Count > 0
            ? await _deptRepo.FindAsync(d => deptIds.Contains(d.Id) && !d.IsDeleted, cancellationToken)
            : [];
        var positions = posIds.Count > 0
            ? await _positionRepo.FindAsync(p => posIds.Contains(p.Id) && !p.IsDeleted, cancellationToken)
            : [];

        return employees.Select(e =>
        {
            var user = users.FirstOrDefault(u => u.Id == e.UserId);
            return new EmployeeListDto(
                e.Id,
                e.EmployeeNumber,
                e.FullName,
                e.FirstName,
                e.LastName,
                user?.Email ?? "—",
                departments.FirstOrDefault(d => d.Id == e.DepartmentId)?.Name,
                positions.FirstOrDefault(p => p.Id == e.PositionId)?.Title,
                e.Status.ToString(),
                e.HireDate,
                e.Status == EmploymentStatus.Active || e.Status == EmploymentStatus.Probationary
            );
        }).ToList();
    }

    private async Task<EmployeeDetailDto> MapDetailAsync(Employee e, CancellationToken cancellationToken)
    {
        var user = await _userRepo.FirstOrDefaultAsync(u => u.Id == e.UserId && !u.IsDeleted, cancellationToken);
        Department? dept = null;
        Position? pos = null;
        Employee? manager = null;

        if (e.DepartmentId.HasValue)
            dept = await _deptRepo.FirstOrDefaultAsync(d => d.Id == e.DepartmentId.Value, cancellationToken);
        if (e.PositionId.HasValue)
            pos = await _positionRepo.FirstOrDefaultAsync(p => p.Id == e.PositionId.Value, cancellationToken);
        if (e.ManagerId.HasValue)
            manager = await _employeeRepo.FirstOrDefaultAsync(m => m.Id == e.ManagerId.Value, cancellationToken);

        return new EmployeeDetailDto(
            e.Id, e.UserId, e.EmployeeNumber, e.FullName,
            e.FirstName, e.LastName, e.MiddleName, e.Suffix,
            user?.Email ?? "—",
            e.DateOfBirth, e.Gender, e.CivilStatus, e.Nationality,
            e.PhoneNumber, e.Address, e.City, e.Province, e.ZipCode, e.ProfilePhotoUrl,
            e.HireDate, e.RegularizationDate, e.ResignationDate,
            e.Status.ToString(), e.EmploymentType,
            e.DepartmentId, dept?.Name,
            e.PositionId, pos?.Title,
            e.ManagerId, manager?.FullName,
            e.SssNumber, e.PhilHealthNumber, e.PagIbigNumber, e.TinNumber,
            e.CreatedAt, e.UpdatedAt
        );
    }
}
