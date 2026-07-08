using HR.Domain.Entities;
using HR.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HR.Infrastructure.Persistence;

public class DataSeeder
{
    private readonly HrDbContext _context;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly ILogger<DataSeeder> _logger;

    public DataSeeder(HrDbContext context, IPasswordHasher<User> passwordHasher, ILogger<DataSeeder> logger)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        await _context.Database.MigrateAsync();

        await SeedRolesAsync();
        await SeedDepartmentsAsync();
        await SeedPositionsAsync();
        await SeedUsersAsync();
        await SeedAnnouncementsAsync();

        _logger.LogInformation("Database seeding completed.");
    }

    private async Task SeedRolesAsync()
    {
        if (await _context.Roles.AnyAsync()) return;

        var roles = new[]
        {
            new Role { Name = "Admin", Description = "System Administrator" },
            new Role { Name = "HR", Description = "Human Resources" },
            new Role { Name = "Manager", Description = "Department Manager" },
            new Role { Name = "Employee", Description = "Regular Employee" }
        };

        _context.Roles.AddRange(roles);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Roles seeded.");
    }

    private async Task SeedDepartmentsAsync()
    {
        if (await _context.Departments.AnyAsync()) return;

        var departments = new[]
        {
            new Department { Name = "Human Resources", Code = "HR", Description = "HR Department" },
            new Department { Name = "Engineering", Code = "ENG", Description = "Software Engineering" },
            new Department { Name = "Finance", Code = "FIN", Description = "Finance and Accounting" },
            new Department { Name = "Operations", Code = "OPS", Description = "Operations" },
            new Department { Name = "Sales", Code = "SLS", Description = "Sales and Marketing" }
        };

        _context.Departments.AddRange(departments);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Departments seeded.");
    }

    private async Task SeedPositionsAsync()
    {
        if (await _context.Positions.AnyAsync()) return;

        var hrDept = await _context.Departments.FirstAsync(d => d.Code == "HR");
        var engDept = await _context.Departments.FirstAsync(d => d.Code == "ENG");
        var finDept = await _context.Departments.FirstAsync(d => d.Code == "FIN");

        _context.Positions.AddRange(
            new Position { Title = "HR Manager", DepartmentId = hrDept.Id, MinSalary = 50000, MaxSalary = 80000, SalaryGrade = "M3", IsActive = true },
            new Position { Title = "HR Specialist", DepartmentId = hrDept.Id, MinSalary = 30000, MaxSalary = 45000, SalaryGrade = "P3", IsActive = true },
            new Position { Title = "Software Engineer", DepartmentId = engDept.Id, MinSalary = 45000, MaxSalary = 90000, SalaryGrade = "P4", IsActive = true },
            new Position { Title = "Engineering Manager", DepartmentId = engDept.Id, MinSalary = 70000, MaxSalary = 120000, SalaryGrade = "M4", IsActive = true },
            new Position { Title = "Accountant", DepartmentId = finDept.Id, MinSalary = 35000, MaxSalary = 55000, SalaryGrade = "P3", IsActive = true }
        );

        await _context.SaveChangesAsync();
        _logger.LogInformation("Positions seeded.");
    }

    private async Task SeedUsersAsync()
    {
        if (await _context.Users.AnyAsync()) return;

        var roles = await _context.Roles.ToListAsync();
        var hrDept = await _context.Departments.FirstAsync(d => d.Code == "HR");
        var engDept = await _context.Departments.FirstAsync(d => d.Code == "ENG");
        var hrManager = await _context.Positions.FirstAsync(p => p.Title == "HR Manager");
        var engManager = await _context.Positions.FirstAsync(p => p.Title == "Engineering Manager");
        var softwareEng = await _context.Positions.FirstAsync(p => p.Title == "Software Engineer");

        var seedUsers = new[]
        {
            ("admin@hrportal.com", "Admin", "System", "Admin"),
            ("hr@hrportal.com", "Sarah", "Johnson", "HR"),
            ("manager@hrportal.com", "Mike", "Williams", "Manager"),
            ("employee@hrportal.com", "John", "Doe", "Employee")
        };

        int empNum = 1001;
        foreach (var (email, first, last, roleName) in seedUsers)
        {
            var user = new User { Email = email, FirstName = first, LastName = last, IsActive = true };
            user.PasswordHash = _passwordHasher.HashPassword(user, "Admin@123!");
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var role = roles.First(r => r.Name == roleName);
            _context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });

            if (roleName != "Admin")
            {
                var dept = roleName == "HR" ? hrDept : engDept;
                var position = roleName switch
                {
                    "HR" => hrManager,
                    "Manager" => engManager,
                    _ => softwareEng
                };
                var emp = new Employee
                {
                    UserId = user.Id,
                    EmployeeNumber = $"EMP{empNum++}",
                    FirstName = first,
                    LastName = last,
                    HireDate = DateTime.UtcNow.AddYears(-2),
                    Status = EmploymentStatus.Active,
                    DepartmentId = dept.Id,
                    PositionId = position.Id
                };
                _context.Employees.Add(emp);

                var leaveTypes = new[] { LeaveType.Vacation, LeaveType.Sick, LeaveType.Casual };
                foreach (var lt in leaveTypes)
                {
                    _context.LeaveBalances.Add(new LeaveBalance
                    {
                        EmployeeId = emp.Id,
                        LeaveType = lt,
                        Year = DateTime.UtcNow.Year,
                        TotalEntitlement = lt == LeaveType.Sick ? 15 : lt == LeaveType.Vacation ? 15 : 5,
                        UsedDays = 0,
                        PendingDays = 0
                    });
                }
            }

            await _context.SaveChangesAsync();
        }

        _logger.LogInformation("Users and employees seeded.");
    }

    private async Task SeedAnnouncementsAsync()
    {
        if (await _context.Announcements.AnyAsync()) return;

        _context.Announcements.AddRange(
            new Announcement
            {
                Title = "Welcome to the New HR Portal",
                Body = "We are excited to announce the launch of our new HR Management Portal. This system will help streamline HR processes.",
                Category = AnnouncementCategory.News,
                PublishDate = DateTime.UtcNow.AddDays(-5),
                IsPublished = true,
                AuthorName = "HR Department"
            },
            new Announcement
            {
                Title = "Company Outing — August 2025",
                Body = "Join us for our annual company outing on August 15, 2025. Details to follow.",
                Category = AnnouncementCategory.Event,
                PublishDate = DateTime.UtcNow.AddDays(-2),
                IsPublished = true,
                AuthorName = "HR Department"
            },
            new Announcement
            {
                Title = "Updated Work From Home Policy",
                Body = "Effective next month, the work-from-home policy has been updated. Please review the attached document.",
                Category = AnnouncementCategory.Policy,
                PublishDate = DateTime.UtcNow.AddDays(-1),
                IsPublished = true,
                AuthorName = "Management"
            }
        );

        await _context.SaveChangesAsync();
        _logger.LogInformation("Announcements seeded.");
    }
}
