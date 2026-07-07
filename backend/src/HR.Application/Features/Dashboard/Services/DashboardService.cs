using HR.Application.Common.Interfaces;
using HR.Application.Features.Dashboard.DTOs;
using HR.Application.Features.Dashboard.Interfaces;
using HR.Domain.Entities;
using HR.Domain.Enums;

namespace HR.Application.Features.Dashboard.Services;

public class DashboardService : IDashboardService
{
    private readonly IRepository<Employee> _employeeRepo;
    private readonly IRepository<LeaveRequest> _leaveRepo;
    private readonly IRepository<Announcement> _announcementRepo;
    private readonly IRepository<Attendance> _attendanceRepo;
    private readonly IRepository<LeaveBalance> _leaveBalanceRepo;

    public DashboardService(
        IRepository<Employee> employeeRepo,
        IRepository<LeaveRequest> leaveRepo,
        IRepository<Announcement> announcementRepo,
        IRepository<Attendance> attendanceRepo,
        IRepository<LeaveBalance> leaveBalanceRepo)
    {
        _employeeRepo = employeeRepo;
        _leaveRepo = leaveRepo;
        _announcementRepo = announcementRepo;
        _attendanceRepo = attendanceRepo;
        _leaveBalanceRepo = leaveBalanceRepo;
    }

    public async Task<HrDashboardDto> GetHrDashboardAsync(CancellationToken cancellationToken = default)
    {
        var totalEmployees = await _employeeRepo.CountAsync(e => !e.IsDeleted && e.Status == EmploymentStatus.Active, cancellationToken);
        var pendingLeave = await _leaveRepo.CountAsync(l => !l.IsDeleted && l.Status == LeaveStatus.Pending, cancellationToken);

        var recentLeaves = await _leaveRepo.FindAsync(l => !l.IsDeleted && l.Status == LeaveStatus.Pending, cancellationToken);
        var recentLeavesList = recentLeaves.OrderByDescending(l => l.CreatedAt).Take(5).ToList();

        var pendingApprovals = recentLeavesList.Select(l => new PendingApprovalDto(
            l.Id,
            l.Employee?.FullName ?? "Unknown",
            l.Employee is not null ? l.Employee.FirstName[..1] + l.Employee.LastName[..1] : "?",
            l.Employee?.Department?.Name ?? "—",
            l.LeaveType.ToString() + " Leave",
            l.Status.ToString(),
            l.CreatedAt
        )).ToList();

        var recentActivities = new List<RecentActivityDto>
        {
            new("New employee onboarded", "Maria Santos joined Engineering Dept.", "2 hours ago", "person"),
            new("Leave approved", "John Doe's vacation leave was approved.", "5 hours ago", "check"),
            new("Payroll processed", "June 2025 payroll completed successfully.", "1 day ago", "payments")
        };

        var attendanceSummary = new AttendanceSummaryDto(new[]
        {
            new AttendanceBarDto("Jan", 95, 5),
            new AttendanceBarDto("Feb", 92, 8),
            new AttendanceBarDto("Mar", 97, 3),
            new AttendanceBarDto("Apr", 94, 6),
            new AttendanceBarDto("May", 96, 4),
            new AttendanceBarDto("Jun", 93, 7)
        });

        return new HrDashboardDto(
            totalEmployees,
            24,
            pendingLeave,
            "Ready",
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
            profile = new EmployeeProfileSummaryDto(
                employee.Id,
                employee.FullName,
                employee.Position?.Title ?? "—",
                employee.Department?.Name ?? "—",
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
                a => a.EmployeeId == employee.Id && a.Date.Date == today, cancellationToken);

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
}
