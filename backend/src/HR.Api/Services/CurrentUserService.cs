using HR.Application.Common.Interfaces;
using System.Security.Claims;

namespace HR.Api.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var sub = User?.FindFirstValue(ClaimTypes.NameIdentifier)
                   ?? User?.FindFirstValue("sub");
            return sub is not null && Guid.TryParse(sub, out var id) ? id : null;
        }
    }

    public string? UserEmail => User?.FindFirstValue(ClaimTypes.Email)
                             ?? User?.FindFirstValue("email");

    public IEnumerable<string> Roles =>
        User?.FindAll(ClaimTypes.Role).Select(c => c.Value) ?? Enumerable.Empty<string>();

    public bool IsInRole(string role) => User?.IsInRole(role) ?? false;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;
}
