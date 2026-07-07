using HR.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HR.Infrastructure.Persistence.Configurations;

public class DepartmentConfiguration : IEntityTypeConfiguration<Department>
{
    public void Configure(EntityTypeBuilder<Department> builder)
    {
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Name).HasMaxLength(150).IsRequired();
        builder.Property(d => d.Code).HasMaxLength(20);

        builder.HasOne(d => d.HeadEmployee)
            .WithMany()
            .HasForeignKey(d => d.HeadEmployeeId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
