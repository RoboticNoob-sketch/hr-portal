namespace HR.Application.Features.Dashboard.DTOs;

public record HrDashboardDto(
    int TotalEmployees,
    int ActiveHirings,
    int PendingLeaveRequests,
    string PayrollStatus,
    IEnumerable<RecentActivityDto> RecentActivities,
    IEnumerable<PendingApprovalDto> PendingApprovals,
    AttendanceSummaryDto AttendanceSummary
);

public record EmployeeDashboardDto(
    EmployeeProfileSummaryDto Profile,
    IEnumerable<LeaveBalanceSummaryDto> LeaveBalances,
    TodayAttendanceDto? TodayAttendance,
    IEnumerable<AnnouncementSummaryDto> RecentAnnouncements
);

public record RecentActivityDto(
    string Title,
    string Description,
    string TimeAgo,
    string IconType
);

public record PendingApprovalDto(
    Guid Id,
    string EmployeeName,
    string EmployeeAvatar,
    string Department,
    string Type,
    string Status,
    DateTime RequestedAt
);

public record AttendanceSummaryDto(
    IEnumerable<AttendanceBarDto> Bars
);

public record AttendanceBarDto(string Month, int Present, int Absent);

public record EmployeeProfileSummaryDto(
    Guid EmployeeId,
    string FullName,
    string Position,
    string Department,
    string EmployeeNumber,
    string? ProfilePhotoUrl,
    string EmploymentStatus
);

public record LeaveBalanceSummaryDto(
    string LeaveType,
    decimal Total,
    decimal Used,
    decimal Remaining,
    decimal Pending
);

public record TodayAttendanceDto(
    DateTime? ClockIn,
    DateTime? ClockOut,
    bool IsClockedIn,
    string TotalHours
);

public record AnnouncementSummaryDto(
    Guid Id,
    string Title,
    string Category,
    DateTime PublishDate,
    string? AuthorName
);
