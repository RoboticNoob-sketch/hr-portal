using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Features.Auth.DTOs;
using HR.Application.Features.Auth.Interfaces;
using HR.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace HR.Application.Features.Auth.Services;

public class AuthService : IAuthService
{
    private readonly IRepository<User> _userRepo;
    private readonly IRepository<UserRole> _userRoleRepo;
    private readonly IRepository<Role> _roleRepo;
    private readonly IRepository<RefreshToken> _refreshTokenRepo;
    private readonly IRepository<PasswordResetToken> _resetTokenRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITokenService _tokenService;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IRepository<User> userRepo,
        IRepository<UserRole> userRoleRepo,
        IRepository<Role> roleRepo,
        IRepository<RefreshToken> refreshTokenRepo,
        IRepository<PasswordResetToken> resetTokenRepo,
        IUnitOfWork unitOfWork,
        ITokenService tokenService,
        IPasswordHasher<User> passwordHasher,
        IEmailService emailService,
        ILogger<AuthService> logger)
    {
        _userRepo = userRepo;
        _userRoleRepo = userRoleRepo;
        _roleRepo = roleRepo;
        _refreshTokenRepo = refreshTokenRepo;
        _resetTokenRepo = resetTokenRepo;
        _unitOfWork = unitOfWork;
        _tokenService = tokenService;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request, string? ipAddress = null, CancellationToken cancellationToken = default)
    {
        var user = await _userRepo.FirstOrDefaultAsync(u => u.Email == request.Email.ToLower() && !u.IsDeleted, cancellationToken)
            ?? throw new UnauthorizedException("Invalid email or password.");

        if (!user.IsActive)
            throw new UnauthorizedException("Your account has been deactivated. Please contact HR.");

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
            throw new UnauthorizedException("Invalid email or password.");

        var roles = await GetUserRolesAsync(user.Id, cancellationToken);
        var accessToken = _tokenService.GenerateAccessToken(user, roles);
        var refreshTokenValue = _tokenService.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = refreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedByIp = ipAddress
        };
        await _refreshTokenRepo.AddAsync(refreshToken, cancellationToken);

        user.LastLoginAt = DateTime.UtcNow;
        _userRepo.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("User {Email} logged in successfully.", user.Email);

        return new LoginResponse(
            accessToken,
            refreshTokenValue,
            DateTime.UtcNow.AddMinutes(15),
            MapToUserDto(user, roles)
        );
    }

    public async Task LogoutAsync(LogoutRequest request, CancellationToken cancellationToken = default)
    {
        var token = await _refreshTokenRepo.FirstOrDefaultAsync(
            t => t.TokenHash == request.RefreshToken && !t.IsRevoked, cancellationToken);

        if (token is not null)
        {
            token.IsRevoked = true;
            token.RevokedReason = "Logout";
            _refreshTokenRepo.Update(token);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request, string? ipAddress = null, CancellationToken cancellationToken = default)
    {
        var token = await _refreshTokenRepo.FirstOrDefaultAsync(
            t => t.TokenHash == request.RefreshToken && !t.IsDeleted, cancellationToken)
            ?? throw new UnauthorizedException("Invalid refresh token.");

        if (token.IsRevoked)
        {
            _logger.LogWarning("Refresh token reuse attempt detected for user {UserId}.", token.UserId);
            throw new UnauthorizedException("Refresh token has been revoked.");
        }

        if (token.IsExpired)
            throw new UnauthorizedException("Refresh token has expired.");

        var user = await _userRepo.GetByIdAsync(token.UserId, cancellationToken)
            ?? throw new UnauthorizedException("User not found.");

        if (!user.IsActive)
            throw new UnauthorizedException("Account is deactivated.");

        var roles = await GetUserRolesAsync(user.Id, cancellationToken);
        var newAccessToken = _tokenService.GenerateAccessToken(user, roles);
        var newRefreshTokenValue = _tokenService.GenerateRefreshToken();

        token.IsRevoked = true;
        token.ReplacedByToken = newRefreshTokenValue;
        token.RevokedReason = "Rotated";
        _refreshTokenRepo.Update(token);

        var newRefreshToken = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = newRefreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedByIp = ipAddress
        };
        await _refreshTokenRepo.AddAsync(newRefreshToken, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new LoginResponse(
            newAccessToken,
            newRefreshTokenValue,
            DateTime.UtcNow.AddMinutes(15),
            MapToUserDto(user, roles)
        );
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepo.FirstOrDefaultAsync(u => u.Email == request.Email.ToLower() && !u.IsDeleted, cancellationToken);
        if (user is null)
        {
            // Don't reveal whether the email exists
            _logger.LogInformation("Password reset requested for non-existent email: {Email}", request.Email);
            return;
        }

        var tokenValue = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
        var resetToken = new PasswordResetToken
        {
            UserId = user.Id,
            Token = tokenValue,
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        };

        await _resetTokenRepo.AddAsync(resetToken, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _emailService.SendPasswordResetEmailAsync(user.Email, tokenValue, cancellationToken);
        _logger.LogInformation("Password reset token generated for user {Email}.", user.Email);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        var resetToken = await _resetTokenRepo.FirstOrDefaultAsync(t => t.Token == request.Token && !t.IsDeleted, cancellationToken)
            ?? throw new AppException("Invalid or expired password reset token.");

        if (!resetToken.IsValid)
            throw new AppException("Password reset token has expired or already been used.");

        var user = await _userRepo.GetByIdAsync(resetToken.UserId, cancellationToken)
            ?? throw new NotFoundException(nameof(User), resetToken.UserId);

        user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
        _userRepo.Update(user);

        resetToken.IsUsed = true;
        _resetTokenRepo.Update(resetToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Password reset successfully for user {Email}.", user.Email);
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepo.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException(nameof(User), userId);

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword);
        if (result == PasswordVerificationResult.Failed)
            throw new AppException("Current password is incorrect.");

        user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
        _userRepo.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<IEnumerable<string>> GetUserRolesAsync(Guid userId, CancellationToken cancellationToken)
    {
        var userRoles = await _userRoleRepo.FindAsync(ur => ur.UserId == userId && !ur.IsDeleted, cancellationToken);
        var roleIds = userRoles.Select(ur => ur.RoleId).ToList();
        var roles = await _roleRepo.FindAsync(r => roleIds.Contains(r.Id), cancellationToken);
        return roles.Select(r => r.Name);
    }

    private static Features.Auth.DTOs.UserDto MapToUserDto(User user, IEnumerable<string> roles) =>
        new(user.Id, user.Email, user.FirstName, user.LastName, user.FullName, roles, user.IsActive);
}
