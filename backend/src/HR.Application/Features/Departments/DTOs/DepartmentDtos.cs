namespace HR.Application.Features.Departments.DTOs;

public record CreateDepartmentRequest(
    string Name,
    string? Description,
    string? Code,
    bool IsActive = true,
    Guid? HeadEmployeeId = null
);

public record UpdateDepartmentRequest(
    string Name,
    string? Description,
    string? Code,
    bool IsActive,
    Guid? HeadEmployeeId
);

public record DepartmentDto(
    Guid Id,
    string Name,
    string? Description,
    string? Code,
    bool IsActive,
    Guid? HeadEmployeeId,
    string? HeadEmployeeName,
    int EmployeeCount,
    int PositionCount,
    DateTime CreatedAt
);
