namespace HR.Application.Features.Positions.DTOs;

public record CreatePositionRequest(
    string Title,
    string? Description,
    decimal MinSalary,
    decimal MaxSalary,
    string? SalaryGrade,
    bool IsActive,
    Guid DepartmentId
);

public record UpdatePositionRequest(
    string Title,
    string? Description,
    decimal MinSalary,
    decimal MaxSalary,
    string? SalaryGrade,
    bool IsActive,
    Guid DepartmentId
);

public record PositionDto(
    Guid Id,
    string Title,
    string? Description,
    decimal MinSalary,
    decimal MaxSalary,
    string? SalaryGrade,
    bool IsActive,
    Guid DepartmentId,
    string DepartmentName,
    int EmployeeCount,
    DateTime CreatedAt
);
