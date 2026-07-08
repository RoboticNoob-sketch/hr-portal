using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.Features.Attendance.DTOs;
using HR.Application.Features.Attendance.Interfaces;
using AttendanceEntity = HR.Domain.Entities.Attendance;
using HR.Domain.Entities;

namespace HR.Application.Features.Attendance.Services;

public class AttendanceService : IAttendanceService
{
    private static readonly TimeSpan StandardShiftStart = new(9, 0, 0);
    private static readonly TimeSpan StandardWorkDay = TimeSpan.FromHours(8);

    private readonly IRepository<AttendanceEntity> _attendanceRepo;
    private readonly IRepository<Employee> _employeeRepo;
    private readonly IRepository<Department> _deptRepo;
    private readonly IUnitOfWork _unitOfWork;

    public AttendanceService(
        IRepository<AttendanceEntity> attendanceRepo,
        IRepository<Employee> employeeRepo,
        IRepository<Department> deptRepo,
        IUnitOfWork unitOfWork)
    {
        _attendanceRepo = attendanceRepo;
        _employeeRepo = employeeRepo;
        _deptRepo = deptRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<TodayAttendanceStatusDto> GetTodayStatusAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var employee = await GetEmployeeByUserIdAsync(userId, cancellationToken);
        var today = DateTime.UtcNow.Date;
        var attendance = await _attendanceRepo.FirstOrDefaultAsync(
            a => a.EmployeeId == employee.Id && a.Date == today && !a.IsDeleted, cancellationToken);

        var dto = attendance is null ? null : await MapAsync(attendance, cancellationToken);
        var canClockIn = attendance is null || attendance.ClockIn is null;
        var canClockOut = attendance?.ClockIn is not null && attendance.ClockOut is null;

        return new TodayAttendanceStatusDto(dto, canClockIn, canClockOut);
    }

    public async Task<AttendanceDto> ClockInAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var employee = await GetEmployeeByUserIdAsync(userId, cancellationToken);
        var today = DateTime.UtcNow.Date;
        var now = DateTime.UtcNow;

        var attendance = await _attendanceRepo.FirstOrDefaultAsync(
            a => a.EmployeeId == employee.Id && a.Date == today && !a.IsDeleted, cancellationToken);

        if (attendance?.ClockIn is not null)
            throw new ConflictException("You have already clocked in today.");

        if (attendance is null)
        {
            attendance = new AttendanceEntity
            {
                EmployeeId = employee.Id,
                Date = today,
                ShiftName = "Regular"
            };
            await _attendanceRepo.AddAsync(attendance, cancellationToken);
        }

        attendance.ClockIn = now;
        attendance.IsLate = now.TimeOfDay > StandardShiftStart;
        attendance.UpdatedAt = now;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return await MapAsync(attendance, cancellationToken);
    }

    public async Task<AttendanceDto> ClockOutAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var employee = await GetEmployeeByUserIdAsync(userId, cancellationToken);
        var today = DateTime.UtcNow.Date;
        var now = DateTime.UtcNow;

        var attendance = await _attendanceRepo.FirstOrDefaultAsync(
            a => a.EmployeeId == employee.Id && a.Date == today && !a.IsDeleted, cancellationToken)
            ?? throw new AppException("You have not clocked in today.");

        if (attendance.ClockIn is null)
            throw new AppException("You have not clocked in today.");

        if (attendance.ClockOut is not null)
            throw new ConflictException("You have already clocked out today.");

        attendance.ClockOut = now;
        var worked = now - attendance.ClockIn.Value;
        attendance.TotalHours = worked;
        attendance.OvertimeHours = worked > StandardWorkDay ? worked - StandardWorkDay : null;
        attendance.UndertimeMinutes = worked < StandardWorkDay ? StandardWorkDay - worked : null;
        attendance.UpdatedAt = now;

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return await MapAsync(attendance, cancellationToken);
    }

    public async Task<PagedResult<AttendanceDto>> GetMyAttendanceAsync(
        Guid userId, int page, int pageSize, DateTime? fromDate = null, DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var employee = await GetEmployeeByUserIdAsync(userId, cancellationToken);
        return await GetPagedAsync(page, pageSize, fromDate, toDate, [employee.Id], cancellationToken);
    }

    public async Task<PagedResult<AttendanceDto>> GetTeamAttendanceAsync(
        int page, int pageSize, DateTime? date = null, Guid? departmentId = null,
        CancellationToken cancellationToken = default)
    {
        var employees = await _employeeRepo.FindAsync(e => !e.IsDeleted, cancellationToken);

        if (departmentId.HasValue)
            employees = employees.Where(e => e.DepartmentId == departmentId.Value);

        var employeeIds = employees.Select(e => e.Id).ToList();
        var targetDate = date?.Date ?? DateTime.UtcNow.Date;

        var all = await _attendanceRepo.FindAsync(
            a => !a.IsDeleted && employeeIds.Contains(a.EmployeeId) && a.Date == targetDate, cancellationToken);

        var ordered = all.OrderBy(a => a.ClockIn).ToList();
        var total = ordered.Count;
        var pageItems = ordered.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        var dtos = await MapListAsync(pageItems, cancellationToken);

        return PagedResult<AttendanceDto>.Create(dtos, total, page, pageSize);
    }

    public async Task<AttendanceDto> UpdateAsync(Guid id, UpdateAttendanceRequest request, CancellationToken cancellationToken = default)
    {
        var attendance = await _attendanceRepo.FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(AttendanceEntity), id);

        if (request.ClockIn.HasValue)
            attendance.ClockIn = request.ClockIn.Value;

        if (request.ClockOut.HasValue)
            attendance.ClockOut = request.ClockOut.Value;

        if (request.Notes is not null)
            attendance.Notes = request.Notes;

        if (request.ShiftName is not null)
            attendance.ShiftName = request.ShiftName;

        if (attendance.ClockIn.HasValue && attendance.ClockOut.HasValue)
        {
            var worked = attendance.ClockOut.Value - attendance.ClockIn.Value;
            attendance.TotalHours = worked;
            attendance.OvertimeHours = worked > StandardWorkDay ? worked - StandardWorkDay : null;
            attendance.UndertimeMinutes = worked < StandardWorkDay ? StandardWorkDay - worked : null;
        }

        if (attendance.ClockIn.HasValue)
            attendance.IsLate = attendance.ClockIn.Value.TimeOfDay > StandardShiftStart;

        attendance.UpdatedAt = DateTime.UtcNow;
        _attendanceRepo.Update(attendance);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapAsync(attendance, cancellationToken);
    }

    private async Task<PagedResult<AttendanceDto>> GetPagedAsync(
        int page, int pageSize, DateTime? fromDate, DateTime? toDate, List<Guid> employeeIds,
        CancellationToken cancellationToken)
    {
        var all = await _attendanceRepo.FindAsync(
            a => !a.IsDeleted && employeeIds.Contains(a.EmployeeId), cancellationToken);

        if (fromDate.HasValue)
            all = all.Where(a => a.Date >= fromDate.Value.Date);

        if (toDate.HasValue)
            all = all.Where(a => a.Date <= toDate.Value.Date);

        var ordered = all.OrderByDescending(a => a.Date).ThenByDescending(a => a.ClockIn).ToList();
        var total = ordered.Count;
        var pageItems = ordered.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        var dtos = await MapListAsync(pageItems, cancellationToken);

        return PagedResult<AttendanceDto>.Create(dtos, total, page, pageSize);
    }

    private async Task<Employee> GetEmployeeByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await _employeeRepo.FirstOrDefaultAsync(e => e.UserId == userId && !e.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(Employee), userId);
    }

    private async Task<List<AttendanceDto>> MapListAsync(List<AttendanceEntity> items, CancellationToken cancellationToken)
    {
        var result = new List<AttendanceDto>();
        foreach (var item in items)
            result.Add(await MapAsync(item, cancellationToken));
        return result;
    }

    private async Task<AttendanceDto> MapAsync(AttendanceEntity a, CancellationToken cancellationToken)
    {
        var employee = await _employeeRepo.FirstOrDefaultAsync(e => e.Id == a.EmployeeId && !e.IsDeleted, cancellationToken);
        Department? dept = null;
        if (employee?.DepartmentId is not null)
            dept = await _deptRepo.FirstOrDefaultAsync(d => d.Id == employee.DepartmentId.Value, cancellationToken);

        return new AttendanceDto(
            a.Id,
            a.EmployeeId,
            employee?.FullName ?? "Unknown",
            employee?.EmployeeNumber,
            dept?.Name,
            a.Date,
            a.ClockIn,
            a.ClockOut,
            FormatTimeSpan(a.TotalHours),
            FormatTimeSpan(a.OvertimeHours),
            FormatTimeSpan(a.UndertimeMinutes),
            a.IsLate,
            a.Notes,
            a.ShiftName
        );
    }

    private static string? FormatTimeSpan(TimeSpan? value) =>
        value.HasValue ? value.Value.ToString(@"hh\:mm") : null;
}
