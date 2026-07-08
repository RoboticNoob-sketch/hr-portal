using HR.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class PayrollRecordConfiguration : IEntityTypeConfiguration<PayrollRecord>
{
    public void Configure(EntityTypeBuilder<PayrollRecord> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.BasicSalary).HasPrecision(18, 2);
        builder.Property(p => p.Allowances).HasPrecision(18, 2);
        builder.Property(p => p.OvertimePay).HasPrecision(18, 2);
        builder.Property(p => p.SssDeduction).HasPrecision(18, 2);
        builder.Property(p => p.PhilHealthDeduction).HasPrecision(18, 2);
        builder.Property(p => p.PagIbigDeduction).HasPrecision(18, 2);
        builder.Property(p => p.TaxDeduction).HasPrecision(18, 2);
        builder.Property(p => p.OtherDeductions).HasPrecision(18, 2);
        builder.Property(p => p.GrossPay).HasPrecision(18, 2);
        builder.Property(p => p.TotalDeductions).HasPrecision(18, 2);
        builder.Property(p => p.NetPay).HasPrecision(18, 2);

        builder.HasIndex(p => new { p.EmployeeId, p.PeriodYear, p.PeriodMonth }).IsUnique();

        builder.HasOne(p => p.Employee)
            .WithMany(e => e.PayrollRecords)
            .HasForeignKey(p => p.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
