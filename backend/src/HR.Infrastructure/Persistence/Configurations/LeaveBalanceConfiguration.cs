using HR.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class LeaveBalanceConfiguration : IEntityTypeConfiguration<LeaveBalance>
{
    public void Configure(EntityTypeBuilder<LeaveBalance> builder)
    {
        builder.HasKey(lb => lb.Id);
        builder.Property(lb => lb.TotalEntitlement).HasPrecision(5, 1);
        builder.Property(lb => lb.UsedDays).HasPrecision(5, 1);
        builder.Property(lb => lb.PendingDays).HasPrecision(5, 1);

        builder.HasOne(lb => lb.Employee)
            .WithMany(e => e.LeaveBalances)
            .HasForeignKey(lb => lb.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
