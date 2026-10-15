# Backend Workflow Guide (ASP.NET Core 9)

This guide outlines the backend development flow for `apps/api` using ASP.NET Core 9 and the `eproc-be` 5-layer modular service pattern.

---

## 1. Scaffolding New Services

To create a new backend service (e.g. `Recruitment`, `Payroll`, `Attendance`), run the CLI generator:

```bash
pnpm create:service <ServiceName>
```

*Example:*
```bash
pnpm create:service Recruitment
```

### Generated Layer Responsibilities:
- **`hris-recruitment-be`** (Web API Host):
  - API Controllers (`Controllers/RecruitmentController.cs`)
  - Dependency Injection configuration (`Program.cs`)
  - Swagger UI configuration (`/swagger`)
- **`hris-recruitment-be.database`** (Data Access):
  - Entity Models (`Models/`)
  - Custom Repositories (`Repositories/`)
  - EF Core `DbContext`
  - `BaseRepository<T>` and `UnitOfWork` implementations
- **`hris-recruitment-be.service`** (Business Logic):
  - Application Service interfaces (`IRecruitmentService.cs`) and implementations (`RecruitmentService.cs`)
  - Domain rules and event publishing
- **`hris-recruitment-be.view`** (DTOs & View Models):
  - Request & Response DTOs (`DTOs/`)
  - View Models (`ViewModels/`)
- **`hris-recruitment-be.lib`** (Utilities):
  - Helper functions and service-specific utilities

---

## 2. Development Workflow

1. **Scaffold Service**: Run `pnpm create:service <ServiceName>` if creating a new domain boundary.
2. **Define Data Entities**: Add domain entity models under `hris-<name>-be.database/Models/` with clean C# properties and base audit fields (`Status`, `CreatedBy`, `CreatedAt`, `ModifiedBy`, `ModifiedAt`, `IsDeleted`).
3. **Register DB Set**: Add `DbSet<TEntity>` to `ApplicationDbContext` / `<ServiceName>DbContext`.
4. **Define View Models & DTOs**: Create DTOs under `hris-<name>-be.view/ViewModels/`.
5. **Implement Service Logic**: Implement use case business logic under `hris-<name>-be.service/Services/`. Wrap API query/command results using `BuildResponseUtil.Success(...)` to return `DefaultDtoResponse<T>`.
6. **Create Controller**: Expose HTTP endpoints in `hris-<name>-be/Controllers/`.
7. **Verify & Build**:
   ```bash
   dotnet build apps/api/Hris.Backend.sln
   ```

---

## 3. Running & Testing

### Running Locally
```bash
# Run backend with Hot Reload & auto-browser launch to Swagger UI
pnpm dev:backend
```
Access Swagger UI at `http://localhost:8080/swagger`.

### Running Tests
```bash
dotnet test apps/api/Hris.Backend.sln
```

### Monorepo Production Build
```bash
pnpm build:backend
```

---

## 4. Asynchronous Workers & Messaging (MassTransit / RabbitMQ)

For heavy background workloads (e.g. CV parsing, payroll calculations, email notifications):
- Publish events from your service layer: `publishEndpoint.Publish<CandidateCvUploadedEvent>(...)`.
- Implement worker consumers in a worker project or background service: `class ProcessCvConsumer : IConsumer<CandidateCvUploadedEvent>`.
