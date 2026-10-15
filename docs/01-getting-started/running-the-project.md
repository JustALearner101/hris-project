# Running the Project

## Current Setup (Next.js 15 + ASP.NET Core 9 Modular Microservices)

Here are the step-by-step instructions to run, build, and extend the HRIS application stack.

### 1. Install Dependencies
Run from the repository root:
```bash
pnpm install
```

### 2. Running in Development Mode

#### Option 1: Run Frontend & Backend Concurrently
```bash
pnpm dev
```
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8080` (Swagger UI opens automatically at `http://localhost:8080/swagger`)

#### Option 2: Run Services Separately
- **Frontend Only**:
  ```bash
  pnpm dev:client
  ```
- **Backend Only (with Hot Reload & Auto-Browser Open)**:
  ```bash
  pnpm dev:backend
  ```
  *This executes `dotnet watch` on `apps/api/src/Services/Master/hris-be`, automatically opening your default web browser to the Swagger UI (`http://localhost:8080/swagger`).*

#### Option 3: Using Docker Compose Stack
To run the full stack (including Postgres, Redis, Keycloak) using Docker Compose:
```bash
docker compose -f infra/docker-compose.yml --profile dev up --build
```

---

## Creating New Backend Microservices / Services

The backend architecture uses an automated scaffolding tool. To generate a new 5-layer microservice (e.g. `Recruitment`, `Payroll`, `Attendance`):

```bash
pnpm create:service <ServiceName>
```
*Example:*
```bash
pnpm create:service Recruitment
```

### What gets generated automatically:
1. Directory structure under `apps/api/src/Services/Recruitment/`.
2. All 5 project `.csproj` layers:
   - `hris-recruitment-be` (Web API Host)
   - `hris-recruitment-be.database` (DbContext & Models)
   - `hris-recruitment-be.service` (Business Logic)
   - `hris-recruitment-be.view` (ViewModels & DTOs)
   - `hris-recruitment-be.lib` (Utilities)
3. Initial starter C# files (`Program.cs`, `RecruitmentController.cs`, `RecruitmentDbContext.cs`, `RecruitmentItem.cs`).
4. Automatic solution registration into `Hris.Backend.sln`.

---

## Acceptance Checklist ("Done Right")

Verify that your environment is running properly:
- [ ] Node 20 or higher is active (`node -v`)
- [ ] .NET 9 SDK is installed (`dotnet --version`)
- [ ] Backend API Swagger documentation is accessible at `http://localhost:8080/swagger`
- [ ] Next.js Frontend is accessible at `http://localhost:3000`
- [ ] `pnpm create:service <ServiceName>` successfully scaffolds new backend services
- [ ] The API successfully returns formatted data wrapped in `DefaultDtoResponse<T>`
