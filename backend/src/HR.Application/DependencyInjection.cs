using FluentValidation;
using HR.Application.Features.Announcements.Interfaces;
using HR.Application.Features.Announcements.Services;
using HR.Application.Features.Auth.Interfaces;
using HR.Application.Features.Auth.Services;
using HR.Application.Features.Dashboard.Interfaces;
using HR.Application.Features.Dashboard.Services;
using HR.Application.Features.Notifications.Interfaces;
using HR.Application.Features.Notifications.Services;
using HR.Application.Features.Auth.Validators;
using HR.Application.Features.Users.Interfaces;
using HR.Application.Features.Users.Services;
using Microsoft.Extensions.DependencyInjection;

namespace HR.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IAnnouncementService, AnnouncementService>();
        services.AddScoped<INotificationService, NotificationService>();

        return services;
    }
}
