using HR.Domain.Common;

namespace HR.Domain.Entities;

public class Position : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal MinSalary { get; set; }
    public decimal MaxSalary { get; set; }
    public string? SalaryGrade { get; set; }
    public bool IsActive { get; set; } = true;

    public Guid DepartmentId { get; set; }
    public Department Department { get; set; } = null!;

    public ICollection<Employee> Employees { get; set; } = new List<Employee>();
}
