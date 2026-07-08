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
        await SeedManagerLinksAsync();
        await SeedSampleAttendanceAsync();
        await SeedSampleLeaveAsync();
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

        // Link employee to manager for approval workflows
        var managerEmp = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeNumber == "EMP1002");
        var employeeEmp = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeNumber == "EMP1003");
        if (managerEmp is not null && employeeEmp is not null && employeeEmp.ManagerId is null)
        {
            employeeEmp.ManagerId = managerEmp.Id;
            await _context.SaveChangesAsync();
        }

        _logger.LogInformation("Users and employees seeded.");
    }

    private async Task SeedManagerLinksAsync()
    {
        var managerEmp = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeNumber == "EMP1002");
        var employeeEmp = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeNumber == "EMP1003");
        if (managerEmp is null || employeeEmp is null || employeeEmp.ManagerId is not null) return;

        employeeEmp.ManagerId = managerEmp.Id;
        await _context.SaveChangesAsync();
        _logger.LogInformation("Manager relationship seeded.");
    }

    private async Task SeedSampleAttendanceAsync()
    {
        var employees = await _context.Employees.Where(e => !e.IsDeleted).ToListAsync();
        if (employees.Count == 0) return;

        var today = DateTime.UtcNow.Date;

        if (!await _context.Attendances.AnyAsync())
        {
            foreach (var emp in employees)
            {
                for (var i = 1; i <= 5; i++)
                {
                    var date = today.AddDays(-i);
                    if (date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday) continue;

                    var isLate = emp.EmployeeNumber == "EMP1003" && i == 1;
                    var hasOvertime = emp.EmployeeNumber == "EMP1002" && i == 2;
                    var clockIn = date.AddHours(isLate ? 9.5 : 9);
                    var clockOut = date.AddHours(hasOvertime ? 20 : 18);

                    _context.Attendances.Add(new Attendance
                    {
                        EmployeeId = emp.Id,
                        Date = date,
                        ClockIn = clockIn,
                        ClockOut = clockOut,
                        TotalHours = clockOut - clockIn,
                        OvertimeHours = hasOvertime ? TimeSpan.FromHours(2) : null,
                        IsLate = isLate,
                        ShiftName = "Regular"
                    });
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Past attendance records seeded.");
        }

        if (!await _context.Attendances.AnyAsync(a => a.Date == today))
        {
            foreach (var emp in employees)
            {
                var clockedIn = emp.EmployeeNumber != "EMP1001";
                _context.Attendances.Add(new Attendance
                {
                    EmployeeId = emp.Id,
                    Date = today,
                    ClockIn = clockedIn ? today.AddHours(9) : null,
                    ClockOut = null,
                    TotalHours = null,
                    IsLate = false,
                    ShiftName = "Regular"
                });
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Today's attendance seeded.");
        }
    }

    private async Task SeedSampleLeaveAsync()
    {
        if (await _context.LeaveRequests.AnyAsync()) return;

        var employees = await _context.Employees.Where(e => !e.IsDeleted).ToListAsync();
        var today = DateTime.UtcNow.Date;
        var john = employees.FirstOrDefault(e => e.EmployeeNumber == "EMP1003");
        var mike = employees.FirstOrDefault(e => e.EmployeeNumber == "EMP1002");

        if (john is not null)
        {
            var pendingStart = today.AddDays(14);
            while (pendingStart.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
                pendingStart = pendingStart.AddDays(1);
            var pendingEnd = pendingStart.AddDays(2);
            while (pendingEnd.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
                pendingEnd = pendingEnd.AddDays(1);

            var pendingDays = CountWeekdays(pendingStart, pendingEnd);

            _context.LeaveRequests.Add(new LeaveRequest
            {
                EmployeeId = john.Id,
                LeaveType = LeaveType.Vacation,
                StartDate = pendingStart,
                EndDate = pendingEnd,
                TotalDays = pendingDays,
                Reason = "Family vacation",
                Status = LeaveStatus.Pending
            });

            var balance = await _context.LeaveBalances.FirstOrDefaultAsync(b =>
                b.EmployeeId == john.Id && b.LeaveType == LeaveType.Vacation && b.Year == today.Year);
            if (balance is not null)
                balance.PendingDays += pendingDays;

            var approvedStart = today.AddDays(-30);
            while (approvedStart.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
                approvedStart = approvedStart.AddDays(-1);
            var approvedEnd = approvedStart;
            var approvedDays = 1;

            _context.LeaveRequests.Add(new LeaveRequest
            {
                EmployeeId = john.Id,
                LeaveType = LeaveType.Sick,
                StartDate = approvedStart,
                EndDate = approvedEnd,
                TotalDays = approvedDays,
                Reason = "Medical appointment",
                Status = LeaveStatus.Approved,
                ReviewedBy = "manager@hrportal.com",
                ReviewedAt = approvedStart.AddDays(-2),
                ReviewNotes = "Approved. Get well soon."
            });

            var sickBalance = await _context.LeaveBalances.FirstOrDefaultAsync(b =>
                b.EmployeeId == john.Id && b.LeaveType == LeaveType.Sick && b.Year == today.Year);
            if (sickBalance is not null)
                sickBalance.UsedDays += approvedDays;
        }

        if (mike is not null)
        {
            var rejectedStart = today.AddDays(-14);
            while (rejectedStart.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
                rejectedStart = rejectedStart.AddDays(-1);
            var rejectedEnd = rejectedStart.AddDays(4);
            while (rejectedEnd.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
                rejectedEnd = rejectedEnd.AddDays(-1);

            _context.LeaveRequests.Add(new LeaveRequest
            {
                EmployeeId = mike.Id,
                LeaveType = LeaveType.Casual,
                StartDate = rejectedStart,
                EndDate = rejectedEnd,
                TotalDays = CountWeekdays(rejectedStart, rejectedEnd),
                Reason = "Personal errands",
                Status = LeaveStatus.Rejected,
                ReviewedBy = "hr@hrportal.com",
                ReviewedAt = rejectedStart.AddDays(-3),
                ReviewNotes = "Insufficient notice for extended casual leave."
            });
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Sample leave data seeded.");
    }

    private static int CountWeekdays(DateTime start, DateTime end)
    {
        var count = 0;
        for (var d = start; d <= end; d = d.AddDays(1))
            if (d.DayOfWeek is not DayOfWeek.Saturday and not DayOfWeek.Sunday) count++;
        return count;
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
