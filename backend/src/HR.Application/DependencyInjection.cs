using FluentValidation;
using HR.Application.Features.Announcements.Interfaces;
using HR.Application.Features.Announcements.Services;
using HR.Application.Features.Auth.Interfaces;
using HR.Application.Features.Auth.Services;
using HR.Application.Features.Dashboard.Interfaces;
using HR.Application.Features.Dashboard.Services;
using HR.Application.Features.Departments.Interfaces;
using HR.Application.Features.Departments.Services;
using HR.Application.Features.Employees.Interfaces;
using HR.Application.Features.Employees.Services;
using HR.Application.Features.Notifications.Interfaces;
using HR.Application.Features.Notifications.Services;
using HR.Application.Features.Positions.Interfaces;
using HR.Application.Features.Positions.Services;
using HR.Application.Features.Attendance.Interfaces;
using HR.Application.Features.Attendance.Services;
using HR.Application.Features.Leave.Interfaces;
using HR.Application.Features.Leave.Services;
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
        services.AddScoped<IDepartmentService, DepartmentService>();
        services.AddScoped<IPositionService, PositionService>();
        services.AddScoped<IEmployeeService, EmployeeService>();
        services.AddScoped<IAttendanceService, AttendanceService>();
        services.AddScoped<ILeaveService, LeaveService>();

        return services;
    }
}
