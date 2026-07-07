using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace HR.Infrastructure.Persistence;

/// <summary>
/// Allows EF Core tools to create the DbContext during design-time (migrations).
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<HrDbContext>
{
    public HrDbContext CreateDbContext(string[] args)
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = config.GetConnectionString("DefaultConnection")
            ?? "Server=localhost,1433;Database=HrPortalDb;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;";

        var optionsBuilder = new DbContextOptionsBuilder<HrDbContext>();
        optionsBuilder.UseSqlServer(connectionString, b => b.MigrationsAssembly("HR.Infrastructure"));

        return new HrDbContext(optionsBuilder.Options);
    }
}
