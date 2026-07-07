# EF Core Migrations

## Prerequisites
- .NET 10 SDK installed
- SQL Server running on localhost:1433

## Create Initial Migration

```bash
cd backend/src/HR.Infrastructure
dotnet ef migrations add InitialCreate --startup-project ../HR.Api --output-dir Persistence/Migrations
```

## Apply Migration

```bash
dotnet ef database update --startup-project ../HR.Api
```

## From HR.Api directory (alternative)

```bash
cd backend/src/HR.Api
dotnet ef migrations add InitialCreate --project ../HR.Infrastructure
dotnet ef database update --project ../HR.Infrastructure
```

## Notes
- Migrations are stored in `HR.Infrastructure/Persistence/Migrations/`
- In Docker, migrations run automatically via `DataSeeder.SeedAsync()` which calls `Database.MigrateAsync()`
- Soft-delete global query filter is applied to all entities inheriting `BaseEntity`
