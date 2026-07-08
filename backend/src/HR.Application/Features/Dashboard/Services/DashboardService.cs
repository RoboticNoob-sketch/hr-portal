using HR.Application.Common.Interfaces;
using HR.Application.Features.Dashboard.DTOs;
using HR.Application.Features.Dashboard.Interfaces;
using AttendanceEntity = HR.Domain.Entities.Attendance;
using HR.Domain.Entities;
using HR.Domain.Enums;

namespace HR.Application.Features.Dashboard.Services;

public class DashboardService : IDashboardService
{
    private readonly IRepository<Employee> _employeeRepo;
    private readonly IRepository<LeaveRequest> _leaveRepo;
    private readonly IRepository<Announcement> _announcementRepo;
    private readonly IRepository<AttendanceEntity> _attendanceRepo;
    private readonly IRepository<LeaveBalance> _leaveBalanceRepo;
    private readonly IRepository<Department> _deptRepo;
    private readonly IRepository<Position> _positionRepo;
    private readonly IRepository<PayrollRecord> _payrollRepo;

    public DashboardService(
        IRepository<Employee> employeeRepo,
        IRepository<LeaveRequest> leaveRepo,
        IRepository<Announcement> announcementRepo,
        IRepository<AttendanceEntity> attendanceRepo,
        IRepository<LeaveBalance> leaveBalanceRepo,
        IRepository<Department> deptRepo,
        IRepository<Position> positionRepo,
        IRepository<PayrollRecord> payrollRepo)
    {
        _employeeRepo = employeeRepo;
        _leaveRepo = leaveRepo;
        _announcementRepo = announcementRepo;
        _attendanceRepo = attendanceRepo;
        _leaveBalanceRepo = leaveBalanceRepo;
        _deptRepo = deptRepo;
        _positionRepo = positionRepo;
        _payrollRepo = payrollRepo;
    }

    public async Task<HrDashboardDto> GetHrDashboardAsync(CancellationToken cancellationToken = default)
    {
        var totalEmployees = await _employeeRepo.CountAsync(e => !e.IsDeleted && e.Status == EmploymentStatus.Active, cancellationToken);
        var pendingLeave = await _leaveRepo.CountAsync(l => !l.IsDeleted && l.Status == LeaveStatus.Pending, cancellationToken);

        var pendingApprovals = await BuildPendingApprovalsAsync(cancellationToken);
        var recentActivities = await BuildRecentActivitiesAsync(cancellationToken);
        var attendanceSummary = await BuildAttendanceSummaryAsync(totalEmployees, cancellationToken);
        var payrollStatus = await BuildPayrollStatusAsync(totalEmployees, cancellationToken);

        return new HrDashboardDto(
            totalEmployees,
            0,
            pendingLeave,
            payrollStatus,
            recentActivities,
            pendingApprovals,
            attendanceSummary
        );
    }

    public async Task<EmployeeDashboardDto> GetEmployeeDashboardAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var employee = await _employeeRepo.FirstOrDefaultAsync(e => e.UserId == userId && !e.IsDeleted, cancellationToken);

        EmployeeProfileSummaryDto profile;
        if (employee is null)
        {
            profile = new EmployeeProfileSummaryDto(Guid.Empty, "New User", "—", "—", "—", null, "Active");
        }
        else
        {
            Department? dept = null;
            Position? pos = null;
            if (employee.DepartmentId.HasValue)
                dept = await _deptRepo.FirstOrDefaultAsync(d => d.Id == employee.DepartmentId.Value, cancellationToken);
            if (employee.PositionId.HasValue)
                pos = await _positionRepo.FirstOrDefaultAsync(p => p.Id == employee.PositionId.Value, cancellationToken);

            profile = new EmployeeProfileSummaryDto(
                employee.Id,
                employee.FullName,
                pos?.Title ?? "—",
                dept?.Name ?? "—",
                employee.EmployeeNumber,
                employee.ProfilePhotoUrl,
                employee.Status.ToString()
            );
        }

        IEnumerable<LeaveBalanceSummaryDto> leaveBalances = [];
        TodayAttendanceDto? todayAttendance = null;

        if (employee is not null)
        {
            var balances = await _leaveBalanceRepo.FindAsync(
                lb => lb.EmployeeId == employee.Id && lb.Year == DateTime.UtcNow.Year, cancellationToken);

            leaveBalances = balances.Select(b => new LeaveBalanceSummaryDto(
                b.LeaveType.ToString(), b.TotalEntitlement, b.UsedDays, b.RemainingDays, b.PendingDays));

            var today = DateTime.UtcNow.Date;
            var todayAtt = await _attendanceRepo.FirstOrDefaultAsync(
                a => a.EmployeeId == employee.Id && a.Date == today && !a.IsDeleted, cancellationToken);

            if (todayAtt is not null)
            {
                todayAttendance = new TodayAttendanceDto(
                    todayAtt.ClockIn,
                    todayAtt.ClockOut,
                    todayAtt.ClockIn is not null && todayAtt.ClockOut is null,
                    todayAtt.TotalHours.HasValue ? todayAtt.TotalHours.Value.ToString(@"hh\:mm") : "0:00"
                );
            }
        }

        var allAnnouncements = await _announcementRepo.FindAsync(a => !a.IsDeleted && a.IsPublished && a.PublishDate <= DateTime.UtcNow, cancellationToken);
        var announcements = allAnnouncements.OrderByDescending(a => a.PublishDate).Take(5).ToList();

        var announcementDtos = announcements.Select(a => new AnnouncementSummaryDto(
            a.Id, a.Title, a.Category.ToString(), a.PublishDate, a.AuthorName));

        return new EmployeeDashboardDto(profile, leaveBalances, todayAttendance, announcementDtos);
    }

    private async Task<List<PendingApprovalDto>> BuildPendingApprovalsAsync(CancellationToken cancellationToken)
    {
        var pendingLeaves = await _leaveRepo.FindAsync(l => !l.IsDeleted && l.Status == LeaveStatus.Pending, cancellationToken);
        var pendingList = pendingLeaves.OrderByDescending(l => l.CreatedAt).Take(5).ToList();
        if (pendingList.Count == 0) return [];

        var empIds = pendingList.Select(l => l.EmployeeId).Distinct().ToList();
        var employees = (await _employeeRepo.FindAsync(e => empIds.Contains(e.Id) && !e.IsDeleted, cancellationToken)).ToList();
        var deptIds = employees.Where(e => e.DepartmentId.HasValue).Select(e => e.DepartmentId!.Value).Distinct().ToList();
        var depts = deptIds.Count > 0
            ? (await _deptRepo.FindAsync(d => deptIds.Contains(d.Id) && !d.IsDeleted, cancellationToken)).ToList()
            : [];

        return pendingList.Select(l =>
        {
            var emp = employees.FirstOrDefault(e => e.Id == l.EmployeeId);
            var deptName = emp?.DepartmentId is not null
                ? depts.FirstOrDefault(d => d.Id == emp.DepartmentId)?.Name ?? "—"
                : "—";
            return new PendingApprovalDto(
                l.Id,
                emp?.FullName ?? "Unknown",
                emp is not null ? GetInitials(emp) : "?",
                deptName,
                l.LeaveType + " Leave",
                l.Status.ToString(),
                l.CreatedAt
            );
        }).ToList();
    }

    private async Task<List<RecentActivityDto>> BuildRecentActivitiesAsync(CancellationToken cancellationToken)
    {
        var activities = new List<(DateTime When, RecentActivityDto Dto)>();

        var leaves = await _leaveRepo.FindAsync(l => !l.IsDeleted, cancellationToken);
        var empIds = leaves.Select(l => l.EmployeeId).Distinct().ToList();
        var employees = empIds.Count > 0
            ? (await _employeeRepo.FindAsync(e => empIds.Contains(e.Id) && !e.IsDeleted, cancellationToken)).ToList()
            : [];

        foreach (var leave in leaves.OrderByDescending(l => l.ReviewedAt ?? l.CreatedAt).Take(8))
        {
            var emp = employees.FirstOrDefault(e => e.Id == leave.EmployeeId);
            var name = emp?.FullName ?? "An employee";
            var when = leave.ReviewedAt ?? leave.CreatedAt;

            if (leave.Status == LeaveStatus.Pending)
            {
                activities.Add((when, new RecentActivityDto(
                    "Leave request submitted",
                    $"{name} requested {leave.LeaveType} leave ({leave.TotalDays} days).",
                    FormatTimeAgo(when),
                    "event")));
            }
            else if (leave.Status == LeaveStatus.Approved)
            {
                activities.Add((when, new RecentActivityDto(
                    "Leave approved",
                    $"{name}'s {leave.LeaveType} leave was approved.",
                    FormatTimeAgo(when),
                    "check")));
            }
            else if (leave.Status == LeaveStatus.Rejected)
            {
                activities.Add((when, new RecentActivityDto(
                    "Leave rejected",
                    $"{name}'s {leave.LeaveType} leave was rejected.",
                    FormatTimeAgo(when),
                    "event")));
            }
        }

        var recentAttendances = await _attendanceRepo.FindAsync(a => !a.IsDeleted && a.ClockIn != null, cancellationToken);
        foreach (var att in recentAttendances.OrderByDescending(a => a.ClockIn).Take(3))
        {
            var emp = employees.FirstOrDefault(e => e.Id == att.EmployeeId)
                ?? await _employeeRepo.FirstOrDefaultAsync(e => e.Id == att.EmployeeId && !e.IsDeleted, cancellationToken);
            if (emp is null) continue;
            activities.Add((att.ClockIn!.Value, new RecentActivityDto(
                "Clock in recorded",
                $"{emp.FullName} clocked in at {att.ClockIn:HH:mm}.",
                FormatTimeAgo(att.ClockIn.Value),
                "person")));
        }

        return activities
            .OrderByDescending(a => a.When)
            .Take(5)
            .Select(a => a.Dto)
            .ToList();
    }

    private async Task<AttendanceSummaryDto> BuildAttendanceSummaryAsync(int totalEmployees, CancellationToken cancellationToken)
    {
        var attendances = (await _attendanceRepo.FindAsync(a => !a.IsDeleted, cancellationToken)).ToList();
        var bars = new List<AttendanceBarDto>();

        for (var i = 5; i >= 0; i--)
        {
            var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1).AddMonths(-i);
            var monthEnd = monthStart.AddMonths(1);
            var workDays = CountWeekdays(monthStart, monthEnd.AddDays(-1));
            var expected = totalEmployees * workDays;
            var present = attendances.Count(a => a.ClockIn != null && a.Date >= monthStart && a.Date < monthEnd);
            var presentPct = expected > 0 ? Math.Min(100, (int)Math.Round(100.0 * present / expected)) : 0;
            bars.Add(new AttendanceBarDto(monthStart.ToString("MMM"), presentPct, Math.Max(0, 100 - presentPct)));
        }

        return new AttendanceSummaryDto(bars);
    }

    private async Task<string> BuildPayrollStatusAsync(int totalEmployees, CancellationToken cancellationToken)
    {
        if (totalEmployees == 0) return "No Employees";

        var now = DateTime.UtcNow;
        var records = (await _payrollRepo.FindAsync(
            p => !p.IsDeleted && p.PeriodYear == now.Year && p.PeriodMonth == now.Month, cancellationToken)).ToList();

        if (records.Count == 0) return "Not Processed";
        if (records.All(r => r.Status == PayrollStatus.Paid)) return "Paid";
        if (records.Any(r => r.Status == PayrollStatus.Processed)) return "Processed";
        return records.Count >= totalEmployees ? "Ready" : "In Progress";
    }

    private static int CountWeekdays(DateTime start, DateTime end)
    {
        var count = 0;
        for (var date = start.Date; date <= end.Date; date = date.AddDays(1))
        {
            if (date.DayOfWeek is not DayOfWeek.Saturday and not DayOfWeek.Sunday)
                count++;
        }
        return count;
    }

    private static string FormatTimeAgo(DateTime dateTime)
    {
        var span = DateTime.UtcNow - dateTime.ToUniversalTime();
        if (span.TotalMinutes < 1) return "just now";
        if (span.TotalMinutes < 60) return $"{(int)span.TotalMinutes} min ago";
        if (span.TotalHours < 24) return $"{(int)span.TotalHours} hours ago";
        if (span.TotalDays < 7) return $"{(int)span.TotalDays} days ago";
        return dateTime.ToString("MMM d");
    }

    private static string GetInitials(Employee employee)
    {
        var first = string.IsNullOrWhiteSpace(employee.FirstName) ? "?" : employee.FirstName.Trim()[0].ToString();
        var last = string.IsNullOrWhiteSpace(employee.LastName) ? "?" : employee.LastName.Trim()[0].ToString();
        return first + last;
    }
}
