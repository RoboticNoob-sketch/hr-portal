using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.Features.Users.DTOs;
using HR.Application.Features.Users.Interfaces;
using HR.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace HR.Application.Features.Users.Services;

public class UserService : IUserService
{
    private readonly IRepository<User> _userRepo;
    private readonly IRepository<UserRole> _userRoleRepo;
    private readonly IRepository<Role> _roleRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly ILogger<UserService> _logger;

    public UserService(
        IRepository<User> userRepo,
        IRepository<UserRole> userRoleRepo,
        IRepository<Role> roleRepo,
        IUnitOfWork unitOfWork,
        IPasswordHasher<User> passwordHasher,
        ILogger<UserService> logger)
    {
        _userRepo = userRepo;
        _userRoleRepo = userRoleRepo;
        _roleRepo = roleRepo;
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task<PagedResult<UserListDto>> GetUsersAsync(int page, int pageSize, string? search = null, CancellationToken cancellationToken = default)
    {
        // Load all non-deleted users, filter in memory to avoid EF Core dependency in Application layer
        var allUsers = await _userRepo.FindAsync(u => !u.IsDeleted, cancellationToken);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            allUsers = allUsers.Where(u => u.Email.Contains(lower, StringComparison.OrdinalIgnoreCase)
                || u.FirstName.Contains(lower, StringComparison.OrdinalIgnoreCase)
                || u.LastName.Contains(lower, StringComparison.OrdinalIgnoreCase));
        }

        var userList = allUsers.OrderBy(u => u.LastName).ToList();
        var total = userList.Count;
        var users = userList.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        var userIds = users.Select(u => u.Id).ToList();
        var userRoles = await _userRoleRepo.FindAsync(ur => userIds.Contains(ur.UserId) && !ur.IsDeleted, cancellationToken);
        var roleIds = userRoles.Select(ur => ur.RoleId).Distinct().ToList();
        var roles = await _roleRepo.FindAsync(r => roleIds.Contains(r.Id), cancellationToken);

        var roleMap = userRoles
            .GroupBy(ur => ur.UserId)
            .ToDictionary(g => g.Key, g => g.Select(ur => roles.FirstOrDefault(r => r.Id == ur.RoleId)?.Name ?? "").ToList());

        var dtos = users.Select(u => new UserListDto(
            u.Id, u.Email, u.FullName, u.FirstName, u.LastName,
            roleMap.TryGetValue(u.Id, out var r) ? r : [],
            u.IsActive, u.CreatedAt, u.LastLoginAt
        ));

        return PagedResult<UserListDto>.Create(dtos, total, page, pageSize);
    }

    public async Task<UserDetailDto> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await _userRepo.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(User), id);

        var roles = await GetRoleNamesAsync(id, cancellationToken);
        return MapToDetail(user, roles);
    }

    public async Task<UserDetailDto> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        var emailLower = request.Email.ToLower();
        var exists = await _userRepo.AnyAsync(u => u.Email == emailLower && !u.IsDeleted, cancellationToken);
        if (exists)
            throw new ConflictException($"A user with email '{request.Email}' already exists.");

        var role = await _roleRepo.FirstOrDefaultAsync(r => r.Name == request.Role && !r.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(Role), request.Role);

        var user = new User
        {
            Email = emailLower,
            FirstName = request.FirstName,
            LastName = request.LastName,
            IsActive = true
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        await _userRepo.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var userRole = new UserRole { UserId = user.Id, RoleId = role.Id };
        await _userRoleRepo.AddAsync(userRole, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created user {Email} with role {Role}.", user.Email, request.Role);
        return MapToDetail(user, [request.Role]);
    }

    public async Task<UserDetailDto> UpdateUserAsync(Guid id, UpdateUserRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepo.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(User), id);

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        _userRepo.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var roles = await GetRoleNamesAsync(id, cancellationToken);
        return MapToDetail(user, roles);
    }

    public async Task DeleteUserAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await _userRepo.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(User), id);

        user.IsDeleted = true;
        user.UpdatedAt = DateTime.UtcNow;
        _userRepo.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task AssignRoleAsync(AssignRoleRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepo.GetByIdAsync(request.UserId, cancellationToken)
            ?? throw new NotFoundException(nameof(User), request.UserId);

        var role = await _roleRepo.FirstOrDefaultAsync(r => r.Name == request.RoleName, cancellationToken)
            ?? throw new NotFoundException(nameof(Role), request.RoleName);

        var existing = await _userRoleRepo.FirstOrDefaultAsync(ur => ur.UserId == user.Id && ur.RoleId == role.Id, cancellationToken);
        if (existing is not null) return;

        await _userRoleRepo.AddAsync(new UserRole { UserId = user.Id, RoleId = role.Id }, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<IEnumerable<string>> GetRoleNamesAsync(Guid userId, CancellationToken cancellationToken)
    {
        var userRoles = await _userRoleRepo.FindAsync(ur => ur.UserId == userId && !ur.IsDeleted, cancellationToken);
        var roleIds = userRoles.Select(ur => ur.RoleId).ToList();
        var roles = await _roleRepo.FindAsync(r => roleIds.Contains(r.Id), cancellationToken);
        return roles.Select(r => r.Name);
    }

    private static UserDetailDto MapToDetail(User user, IEnumerable<string> roles) =>
        new(user.Id, user.Email, user.FullName, user.FirstName, user.LastName,
            roles, user.IsActive, user.CreatedAt, user.UpdatedAt, user.LastLoginAt);
}
