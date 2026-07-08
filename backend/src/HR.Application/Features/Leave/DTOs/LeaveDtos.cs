using HR.Domain.Enums;

namespace HR.Application.Features.Leave.DTOs;

public record LeaveBalanceDto(
    Guid Id,
    Guid EmployeeId,
    string LeaveType,
    int Year,
    decimal TotalEntitlement,
    decimal UsedDays,
    decimal PendingDays,
    decimal RemainingDays
);

public record LeaveRequestDto(
    Guid Id,
    Guid EmployeeId,
    string EmployeeName,
    string? DepartmentName,
    string LeaveType,
    DateTime StartDate,
    DateTime EndDate,
    int TotalDays,
    string Reason,
    string Status,
    string? ReviewedBy,
    DateTime? ReviewedAt,
    string? ReviewNotes,
    DateTime CreatedAt
);

public record CreateLeaveRequest(
    LeaveType LeaveType,
    DateTime StartDate,
    DateTime EndDate,
    string Reason
);

public record ReviewLeaveRequest(
    bool Approve,
    string? ReviewNotes
);
