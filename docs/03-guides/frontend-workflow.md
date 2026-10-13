# Frontend Workflow Guide (Next.js 15 & React 19)

This guide details the Next.js 15 (App Router) development workflow for `hris-frontend` using Feature-Driven Architecture and SWR data fetching.

---

## 1. Architecture Patterns

### Feature-Based Folder Structure
All domain features (e.g. `employee`, `attendance`, `payroll`) are organized in `hris-frontend/features/<feature-name>/`:

```text
features/employee/
├── api/                  # SWR hooks & mutation functions (use-employees.ts)
├── components/           # UI components (employee-table.tsx, employee-form-dialog.tsx)
├── types/                # TypeScript interfaces & Zod schemas (employee.ts)
└── README.md             # Feature-specific architectural guide & notes
```

### Route Groups & Layout Isolation (`app/`)
- Folder `app/` is strictly reserved for Next.js App Router **pages & layouts**.
- Use **Route Groups** `(dashboard)` to share Sidebar & Topbar layouts without affecting URL paths:
  - `app/(dashboard)/employees/page.tsx` -> Clean URL: `http://localhost:3000/employees`
  - `app/(dashboard)/layout.tsx` -> Shared `<SidebarProvider>`, `<AppSidebar />`, and `<Topbar />`.

---

## 2. Development Guidelines

1. **Server vs Client Components**:
   - Keep `page.tsx` as a **Server Component** (no `"use client"` directive).
   - Isolate `"use client"` to interactive islands (e.g. `employee-table.tsx`, `employee-form-dialog.tsx`).
2. **Centralized API Client (`lib/api-client.ts`)**:
   - Always use `apiClient<T>()` and `fetcher` from `@/lib/api-client` to communicate with backend APIs (`http://localhost:8080`).
   - Responses automatically unwrap ASP.NET Core `DefaultDtoResponse<T>` (`status`, `data`, `message`, `total`).
3. **Server-Side Pagination & Searching**:
   - Do not fetch all data to client memory. Pass `offset`, `limit`, and `search` query parameters to backend SWR hooks.
4. **Form Validation with Zod**:
   - Define validation schemas in `features/<feature>/types/` using `zod`.

---

## 3. Build & Testing Commands

```bash
# Type-check TypeScript code
pnpm --filter ./hris-frontend exec tsc --noEmit

# Run ESLint
pnpm lint:client

# Run Next.js Production Build
pnpm build:client
```
