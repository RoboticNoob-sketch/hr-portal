namespace HR.Application.Features.Users.DTOs;

public record CreateUserRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string Role
);

public record UpdateUserRequest(
    string FirstName,
    string LastName,
    bool IsActive
);

public record AssignRoleRequest(Guid UserId, string RoleName);

public record UserListDto(
    Guid Id,
    string Email,
    string FullName,
    string FirstName,
    string LastName,
    IEnumerable<string> Roles,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? LastLoginAt
);

public record UserDetailDto(
    Guid Id,
    string Email,
    string FullName,
    string FirstName,
    string LastName,
    IEnumerable<string> Roles,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? LastLoginAt
);
