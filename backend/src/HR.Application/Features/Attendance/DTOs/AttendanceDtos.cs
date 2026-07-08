namespace HR.Application.Features.Attendance.DTOs;

public record AttendanceDto(
    Guid Id,
    Guid EmployeeId,
    string EmployeeName,
    string? EmployeeNumber,
    string? DepartmentName,
    DateTime Date,
    DateTime? ClockIn,
    DateTime? ClockOut,
    string? TotalHours,
    string? OvertimeHours,
    string? UndertimeHours,
    bool IsLate,
    string? Notes,
    string? ShiftName
);

public record TodayAttendanceStatusDto(
    AttendanceDto? Today,
    bool CanClockIn,
    bool CanClockOut
);

public record UpdateAttendanceRequest(
    DateTime? ClockIn,
    DateTime? ClockOut,
    string? Notes,
    string? ShiftName
);
