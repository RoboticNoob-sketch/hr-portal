# HR Portal

Enterprise-grade HR Management System built with ASP.NET Core 10 (Clean Architecture) and React 19 + Material UI.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, MUI v6, TanStack Query, React Hook Form + Zod |
| Backend | ASP.NET Core 10 Web API, Clean Architecture |
| Database | SQL Server 2022 |
| Auth | JWT + Refresh Tokens |
| ORM | Entity Framework Core |
| Container | Docker + Docker Compose |

## Quick Start

### Prerequisites
- Docker Desktop
- (For local dev) .NET 10 SDK + Node.js 20+

### Run with Docker

```bash
cp .env.example .env
# Edit .env with your secrets
docker-compose up --build
```

App opens at: http://localhost:3000  
API Swagger: http://localhost:5000/swagger

### Default Seeded Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hrportal.com | Admin@123! |
| HR | hr@hrportal.com | Admin@123! |
| Manager | manager@hrportal.com | Admin@123! |
| Employee | employee@hrportal.com | Admin@123! |

## Project Structure

```
hr-portal/
├── backend/
│   ├── src/
│   │   ├── HR.Api            # Controllers, Middleware, DI
│   │   ├── HR.Application    # Services, DTOs, Validators
│   │   ├── HR.Domain         # Entities, Enums, Interfaces
│   │   └── HR.Infrastructure # EF Core, Repositories, Migrations
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── features/         # Feature-based modules
│   │   ├── components/       # Shared UI components
│   │   ├── services/         # API client
│   │   └── ...
│   └── Dockerfile
└── docker-compose.yml
```

## Development Phases

- **Phase 1** ✅ Auth, Users, Roles, Dashboards (HR + Employee)
- **Phase 2** ✅ Employee Management, Departments, Positions
- **Phase 3** ✅ Attendance, Leave Management
- **Phase 4** ✅ Payroll
- **Phase 5** Recruitment, Onboarding
- **Phase 6** Documents, Assets
- **Phase 7** Reports, Notifications
