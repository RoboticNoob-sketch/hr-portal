using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.Features.Payroll.DTOs;
using HR.Application.Features.Payroll.Interfaces;
using HR.Domain.Entities;
using HR.Domain.Enums;
using AttendanceEntity = HR.Domain.Entities.Attendance;

namespace HR.Application.Features.Payroll.Services;

public class PayrollService : IPayrollService
{
    private readonly IRepository<PayrollRecord> _payrollRepo;
    private readonly IRepository<Employee> _employeeRepo;
    private readonly IRepository<Position> _positionRepo;
    private readonly IRepository<Department> _deptRepo;
    private readonly IRepository<AttendanceEntity> _attendanceRepo;
    private readonly IUnitOfWork _unitOfWork;

    public PayrollService(
        IRepository<PayrollRecord> payrollRepo,
        IRepository<Employee> employeeRepo,
        IRepository<Position> positionRepo,
        IRepository<Department> deptRepo,
        IRepository<AttendanceEntity> attendanceRepo,
        IUnitOfWork unitOfWork)
    {
        _payrollRepo = payrollRepo;
        _employeeRepo = employeeRepo;
        _positionRepo = positionRepo;
        _deptRepo = deptRepo;
        _attendanceRepo = attendanceRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<PayrollSummaryDto> GetSummaryAsync(int year, int month, CancellationToken cancellationToken = default)
    {
        var activeEmployees = await _employeeRepo.CountAsync(
            e => !e.IsDeleted && e.Status == EmploymentStatus.Active, cancellationToken);
        var records = (await _payrollRepo.FindAsync(
            p => !p.IsDeleted && p.PeriodYear == year && p.PeriodMonth == month, cancellationToken)).ToList();

        return new PayrollSummaryDto(
            year,
            month,
            activeEmployees,
            records.Count,
            records.Count(r => r.Status == PayrollStatus.Paid),
            records.Sum(r => r.GrossPay),
            records.Sum(r => r.NetPay),
            records.Sum(r => r.TotalDeductions));
    }

    public async Task<PagedResult<PayrollRecordDto>> GetRecordsAsync(
        int page, int pageSize, int? year = null, int? month = null, PayrollStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var all = (await _payrollRepo.FindAsync(p => !p.IsDeleted, cancellationToken)).AsEnumerable();

        if (year.HasValue)
            all = all.Where(p => p.PeriodYear == year.Value);
        if (month.HasValue)
            all = all.Where(p => p.PeriodMonth == month.Value);
        if (status.HasValue)
            all = all.Where(p => p.Status == status.Value);

        var ordered = all.OrderByDescending(p => p.PeriodYear)
            .ThenByDescending(p => p.PeriodMonth)
            .ThenBy(p => p.EmployeeId)
            .ToList();

        var total = ordered.Count;
        var pageItems = ordered.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        var dtos = await MapListAsync(pageItems, cancellationToken);
        return PagedResult<PayrollRecordDto>.Create(dtos, total, page, pageSize);
    }

    public async Task<PagedResult<PayrollRecordDto>> GetMyPayslipsAsync(
        Guid userId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var employee = await GetEmployeeByUserIdAsync(userId, cancellationToken);
        var all = (await _payrollRepo.FindAsync(
            p => !p.IsDeleted && p.EmployeeId == employee.Id, cancellationToken))
            .OrderByDescending(p => p.PeriodYear)
            .ThenByDescending(p => p.PeriodMonth)
            .ToList();

        var total = all.Count;
        var pageItems = all.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        var dtos = await MapListAsync(pageItems, cancellationToken);
        return PagedResult<PayrollRecordDto>.Create(dtos, total, page, pageSize);
    }

    public async Task<PayrollRecordDto> GetByIdAsync(
        Guid id, Guid userId, IEnumerable<string> roles, CancellationToken cancellationToken = default)
    {
        var record = await _payrollRepo.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(PayrollRecord), id);

        var roleList = roles.ToList();
        var isHrOrAdmin = roleList.Contains("Admin") || roleList.Contains("HR");
        if (!isHrOrAdmin)
        {
            var employee = await GetEmployeeByUserIdAsync(userId, cancellationToken);
            if (record.EmployeeId != employee.Id)
                throw new ForbiddenException();
        }

        return await MapAsync(record, cancellationToken);
    }

    public async Task<IEnumerable<PayrollRecordDto>> ProcessPayrollAsync(
        int year, int month, string processedBy, CancellationToken cancellationToken = default)
    {
        var employees = (await _employeeRepo.FindAsync(
            e => !e.IsDeleted && e.Status == EmploymentStatus.Active, cancellationToken)).ToList();

        if (employees.Count == 0)
            throw new AppException("No active employees found to process payroll.");

        var existing = (await _payrollRepo.FindAsync(
            p => !p.IsDeleted && p.PeriodYear == year && p.PeriodMonth == month, cancellationToken))
            .Select(p => p.EmployeeId)
            .ToHashSet();

        var positions = (await _positionRepo.FindAsync(p => !p.IsDeleted, cancellationToken)).ToList();
        var periodStart = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var periodEnd = periodStart.AddMonths(1);
        var attendances = (await _attendanceRepo.FindAsync(
            a => !a.IsDeleted && a.Date >= periodStart && a.Date < periodEnd, cancellationToken)).ToList();

        var created = new List<PayrollRecord>();
        var now = DateTime.UtcNow;

        foreach (var employee in employees)
        {
            if (existing.Contains(employee.Id))
                continue;

            var position = employee.PositionId.HasValue
                ? positions.FirstOrDefault(p => p.Id == employee.PositionId.Value)
                : null;
            var basicSalary = position is not null
                ? Math.Round((position.MinSalary + position.MaxSalary) / 2m, 2)
                : 35000m;

            var overtimeHours = attendances
                .Where(a => a.EmployeeId == employee.Id && a.OvertimeHours.HasValue)
                .Sum(a => (decimal)a.OvertimeHours!.Value.TotalHours);
            var hourlyRate = basicSalary / 160m;
            var overtimePay = Math.Round(overtimeHours * hourlyRate * 1.25m, 2);
            var allowances = Math.Round(basicSalary * 0.05m, 2);

            var sss = Math.Round(basicSalary * 0.045m, 2);
            var philHealth = Math.Round(Math.Max(basicSalary * 0.03m, 400m), 2);
            var pagIbig = Math.Round(Math.Min(basicSalary * 0.02m, 200m), 2);
            var tax = basicSalary > 50000m ? Math.Round((basicSalary - 50000m) * 0.20m, 2) : 0m;
            var otherDeductions = 0m;

            var grossPay = basicSalary + allowances + overtimePay;
            var totalDeductions = sss + philHealth + pagIbig + tax + otherDeductions;
            var netPay = grossPay - totalDeductions;

            var record = new PayrollRecord
            {
                EmployeeId = employee.Id,
                PeriodYear = year,
                PeriodMonth = month,
                BasicSalary = basicSalary,
                Allowances = allowances,
                OvertimePay = overtimePay,
                SssDeduction = sss,
                PhilHealthDeduction = philHealth,
                PagIbigDeduction = pagIbig,
                TaxDeduction = tax,
                OtherDeductions = otherDeductions,
                GrossPay = grossPay,
                TotalDeductions = totalDeductions,
                NetPay = netPay,
                Status = PayrollStatus.Processed,
                ProcessedAt = now,
                ProcessedBy = processedBy
            };

            await _payrollRepo.AddAsync(record, cancellationToken);
            created.Add(record);
        }

        if (created.Count == 0)
            throw new ConflictException($"Payroll for {year}-{month:D2} has already been processed for all active employees.");

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return await MapListAsync(created, cancellationToken);
    }

    public async Task<PayrollRecordDto> MarkPaidAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var record = await _payrollRepo.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(PayrollRecord), id);

        if (record.Status == PayrollStatus.Paid)
            throw new ConflictException("Payroll record is already marked as paid.");
        if (record.Status == PayrollStatus.Cancelled)
            throw new ConflictException("Cancelled payroll records cannot be marked as paid.");

        record.Status = PayrollStatus.Paid;
        record.PaidAt = DateTime.UtcNow;
        record.UpdatedAt = DateTime.UtcNow;
        _payrollRepo.Update(record);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapAsync(record, cancellationToken);
    }

    private async Task<Employee> GetEmployeeByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await _employeeRepo.FirstOrDefaultAsync(e => e.UserId == userId && !e.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(Employee), userId);
    }

    private async Task<List<PayrollRecordDto>> MapListAsync(IEnumerable<PayrollRecord> records, CancellationToken cancellationToken)
    {
        var list = records.ToList();
        if (list.Count == 0) return [];

        var employeeIds = list.Select(p => p.EmployeeId).Distinct().ToList();
        var employees = (await _employeeRepo.FindAsync(e => employeeIds.Contains(e.Id) && !e.IsDeleted, cancellationToken)).ToList();
        var deptIds = employees.Where(e => e.DepartmentId.HasValue).Select(e => e.DepartmentId!.Value).Distinct().ToList();
        var depts = deptIds.Count > 0
            ? (await _deptRepo.FindAsync(d => deptIds.Contains(d.Id) && !d.IsDeleted, cancellationToken)).ToList()
            : [];

        return list.Select(record =>
        {
            var emp = employees.FirstOrDefault(e => e.Id == record.EmployeeId);
            var deptName = emp?.DepartmentId is not null
                ? depts.FirstOrDefault(d => d.Id == emp.DepartmentId)?.Name
                : null;
            return Map(record, emp, deptName);
        }).ToList();
    }

    private async Task<PayrollRecordDto> MapAsync(PayrollRecord record, CancellationToken cancellationToken)
    {
        var emp = await _employeeRepo.FirstOrDefaultAsync(e => e.Id == record.EmployeeId && !e.IsDeleted, cancellationToken);
        string? deptName = null;
        if (emp?.DepartmentId is not null)
        {
            var dept = await _deptRepo.FirstOrDefaultAsync(d => d.Id == emp.DepartmentId.Value && !d.IsDeleted, cancellationToken);
            deptName = dept?.Name;
        }

        return Map(record, emp, deptName);
    }

    private static PayrollRecordDto Map(PayrollRecord record, Employee? employee, string? departmentName) =>
        new(
            record.Id,
            record.EmployeeId,
            employee?.FullName ?? "Unknown",
            employee?.EmployeeNumber,
            departmentName,
            record.PeriodYear,
            record.PeriodMonth,
            record.BasicSalary,
            record.Allowances,
            record.OvertimePay,
            record.SssDeduction,
            record.PhilHealthDeduction,
            record.PagIbigDeduction,
            record.TaxDeduction,
            record.OtherDeductions,
            record.GrossPay,
            record.TotalDeductions,
            record.NetPay,
            record.Status.ToString(),
            record.ProcessedAt,
            record.ProcessedBy,
            record.PaidAt,
            record.CreatedAt);
}
