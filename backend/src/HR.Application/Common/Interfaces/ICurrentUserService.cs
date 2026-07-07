namespace HR.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? UserEmail { get; }
    IEnumerable<string> Roles { get; }
    bool IsInRole(string role);
    bool IsAuthenticated { get; }
}
