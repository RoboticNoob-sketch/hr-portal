using HR.Application.Common.Models;
using HR.Application.Features.Users.DTOs;

namespace HR.Application.Features.Users.Interfaces;

public interface IUserService
{
    Task<PagedResult<UserListDto>> GetUsersAsync(int page, int pageSize, string? search = null, CancellationToken cancellationToken = default);
    Task<UserDetailDto> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<UserDetailDto> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default);
    Task<UserDetailDto> UpdateUserAsync(Guid id, UpdateUserRequest request, CancellationToken cancellationToken = default);
    Task DeleteUserAsync(Guid id, CancellationToken cancellationToken = default);
    Task AssignRoleAsync(AssignRoleRequest request, CancellationToken cancellationToken = default);
}
