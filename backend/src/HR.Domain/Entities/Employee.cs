using HR.Domain.Common;
using HR.Domain.Enums;

namespace HR.Domain.Entities;

public class Employee : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string EmployeeNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string? Suffix { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? CivilStatus { get; set; }
    public string? Nationality { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Province { get; set; }
    public string? ZipCode { get; set; }
    public string? ProfilePhotoUrl { get; set; }

    // Employment
    public DateTime HireDate { get; set; }
    public DateTime? RegularizationDate { get; set; }
    public DateTime? ResignationDate { get; set; }
    public EmploymentStatus Status { get; set; } = EmploymentStatus.Probationary;
    public string? EmploymentType { get; set; }

    public Guid? DepartmentId { get; set; }
    public Department? Department { get; set; }

    public Guid? PositionId { get; set; }
    public Position? Position { get; set; }

    public Guid? ManagerId { get; set; }
    public Employee? Manager { get; set; }

    // Gov IDs
    public string? SssNumber { get; set; }
    public string? PhilHealthNumber { get; set; }
    public string? PagIbigNumber { get; set; }
    public string? TinNumber { get; set; }

    public ICollection<Employee> DirectReports { get; set; } = new List<Employee>();
    public ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();
    public ICollection<LeaveBalance> LeaveBalances { get; set; } = new List<LeaveBalance>();
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public ICollection<PayrollRecord> PayrollRecords { get; set; } = new List<PayrollRecord>();

    public string FullName => $"{FirstName} {MiddleName} {LastName}".Replace("  ", " ").Trim();
}
