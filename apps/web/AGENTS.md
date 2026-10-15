# AGENTS.md — HRIS Client (AnglerFish)

> **Purpose**: This document codifies every convention, pattern, and guideline
> that AI agents (and human contributors) must follow when working in this
> codebase. Treat each section as a **rule**, not a suggestion.

---

## 1. Project Overview

This is the **HRIS Client** (branded **AnglerFish**) — a Human Resource
Information System web client providing employee self-service and admin
features: dashboards, attendance, people management, requests, and onboarding
workflows.

| Attribute             | Value                                             |
| --------------------- | ------------------------------------------------- |
| Framework             | **Next.js 15** (App Router) with **Turbopack**    |
| Language              | **TypeScript 5** (strict mode)                    |
| UI Runtime            | **React 19**                                      |
| Styling               | **Tailwind CSS 4** + `tw-animate-css`             |
| Component Library     | **shadcn/ui** (New York style) + **Radix UI**     |
| Icons                 | **Lucide React** — the _only_ icon library        |
| Charts                | **Recharts** via shadcn chart wrappers            |
| Data Fetching         | **SWR** (client) — no server-side fetching yet    |
| Date Utilities        | **date-fns** + **react-day-picker**               |
| Notifications         | **Sonner** (`toast()`)                            |
| Fonts                 | **Geist Sans / Geist Mono**                       |
| Package Manager       | **pnpm** (preferred) — `pnpm-lock.yaml` in repo  |
| Node Version          | **18.18+** or **20+** (22 LTS in Docker)          |
| Testing               | **Jest** + **Testing Library** (`ts-jest`, jsdom)  |
| Code Quality          | **ESLint** (`next/core-web-vitals`, `next/typescript`), **Qodana** |
| Analytics             | **Vercel Analytics**                              |
| Deployment            | **Docker** (multi-stage) → **Kubernetes** via GitHub Actions CI/CD |
| Auth (planned)        | **Keycloak** SSO (configured in docker-compose)   |
| Backend (planned)     | **NestJS** API at `NEXT_PUBLIC_API_BASE_URL`      |

---

## 2. Project Structure

```
apps/web/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (fonts, analytics, Suspense)
│   ├── page.tsx                # Root page — redirects to /modules/dashboard
│   ├── globals.css             # CSS variables, Tailwind config, theming
│   ├── api/                    # API Route Handlers (mock data)
│   │   ├── announcement/
│   │   ├── attendance/
│   │   ├── departments/
│   │   ├── employees/
│   │   ├── processes/
│   │   └── shifts/
│   ├── global/                 # Global-scope components (alert system)
│   │   └── alert-global/
│   └── modules/                # Feature pages (module-based routing)
│       ├── dashboard/
│       ├── attendance/
│       ├── login/
│       └── people/
├── components/                 # Reusable UI components
│   ├── ui/                     # shadcn/ui primitives (DO NOT hand-edit)
│   ├── app-sidebar/            # Sidebar navigation
│   ├── app-dialog/             # Shared dialog wrappers
│   ├── app-calendar/           # Calendar component
│   ├── topbar/                 # Topbar (breadcrumbs, search, notifications)
│   ├── toaster/                # Toast provider
│   ├── dashboard-component/    # Dashboard-specific cards & widgets
│   ├── attendance-component/   # Attendance-specific cards & widgets
│   ├── people-component/       # People management UI
│   ├── data-table.tsx          # Generic data table (TanStack pattern)
│   └── theme-provider.tsx      # next-themes ThemeProvider wrapper
├── hooks/                      # Custom React hooks
├── lib/                        # Utility functions (cn, etc.)
├── types/                      # TypeScript interfaces/types
├── public/                     # Static assets
│   └── assets/
├── k8/                         # Kubernetes manifests (future)
├── .github/workflows/          # CI/CD (GitHub Actions)
├── Dockerfile                  # Multi-stage Docker build
├── docker-compose.yml          # Full dev stack (frontend + API + DB + Redis + Keycloak)
├── components.json             # shadcn/ui configuration
├── tsconfig.json               # TypeScript configuration
├── eslint.config.mjs           # ESLint flat config
├── postcss.config.mjs          # PostCSS (Tailwind plugin)
└── qodana.yaml                 # JetBrains Qodana config
```

---

## 3. Naming Conventions

### Files & Directories

| Element              | Convention        | Examples                                             |
| -------------------- | ----------------- | ---------------------------------------------------- |
| Directories          | `kebab-case`      | `app-sidebar/`, `dashboard-component/`, `master-employee/` |
| Component files      | `kebab-case.tsx`  | `clock-in-card.tsx`, `attendance-card.tsx`            |
| Type files           | `kebab-case.ts`   | `attendance.ts`, `department.ts`                     |
| Hook files           | `use-*.ts(x)`     | `use-mobile.ts`, `use-toast.tsx`                     |
| API route files      | `route.ts`        | `app/api/employees/route.ts`                         |
| Page files           | `page.tsx`        | `app/modules/dashboard/page.tsx`                     |
| Layout files         | `layout.tsx`      | `app/modules/attendance/layout.tsx`                  |
| CSS files            | `kebab-case.css`  | `globals.css`                                        |
| Config files         | Original names    | `next.config.ts`, `tsconfig.json`                    |

### Code Identifiers

| Element              | Convention        | Examples                                             |
| -------------------- | ----------------- | ---------------------------------------------------- |
| Components           | `PascalCase`      | `AppSidebar`, `DashboardAttendanceCard`, `ClockInCard` |
| Interfaces / Types   | `PascalCase`      | `Employee`, `AttendanceRecord`, `OnboardingProcess`  |
| Hooks                | `camelCase`       | `useIsMobile()`, `useToast()`                        |
| Functions / Variables | `camelCase`      | `fetcher`, `handleClockIn`, `isLoading`              |
| Constants            | `UPPER_SNAKE_CASE`| `NEXT_TELEMETRY_DISABLED`                            |
| CSS Variables        | `--kebab-case`    | `--primary`, `--sidebar-foreground`                  |
| Env Variables        | `UPPER_SNAKE_CASE`| `NEXT_PUBLIC_API_BASE_URL`                           |

---

## 4. Component Patterns

### General Rules

1. **Use `function` declarations** for component definitions — not arrow functions.
   ```tsx
   // ✅ Correct
   export function MyComponent() { ... }

   // ❌ Wrong
   export const MyComponent = () => { ... }
   ```

2. **Use named exports** for all components, hooks, types, and utilities.
   Do NOT use `export default` for components.
   ```tsx
   // ✅ Correct
   export function MyComponent() { ... }

   // ❌ Wrong
   export default function MyComponent() { ... }
   ```
   _Exception_: Next.js pages (`page.tsx`) and layouts (`layout.tsx`) MUST use
   `export default` as required by the framework.

3. **Add `"use client"` directive** at the top of any file that uses React hooks
   (`useState`, `useEffect`, `useSWR`, etc.), browser APIs, or event handlers.
   Omit it for server components and types-only files.

4. **Type props inline** or with a separate `interface` when the type is
   complex or reused. Destructure props in the function signature.
   ```tsx
   interface MyCardProps {
     title: string;
     count: number;
   }
   export function MyCard({ title, count }: MyCardProps) { ... }
   ```

5. **Feature-prefix component names** when they belong to a module:
   `Dashboard*Card`, `Attendance*Card`, `People*Content`.

### Component Organization

Components are organized in `components/` with this hierarchy:

- `components/ui/` — **shadcn/ui primitives**. Generated by the shadcn CLI.
  **Never hand-edit these files.** To customize, use the `cn()` wrapper or
  composition in feature components.
- `components/<feature>-component/` — Feature-specific components
  (e.g., `dashboard-component/`, `attendance-component/`).
- `components/app-*` — App-level shared components
  (e.g., `app-sidebar/`, `app-dialog/`, `app-calendar/`).
- `components/topbar/`, `components/toaster/` — Specific shared UI regions.

---

## 5. Import Conventions

### Path Alias

Always use the `@/*` path alias (mapped to project root in `tsconfig.json`)
for cross-directory imports:

```tsx
// ✅ Use path alias
import { Card, CardContent } from "@/README/ui/card";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Employee } from "@/types/employee";
```

### Relative Imports

Use relative imports **only** within the same component directory:

```tsx
// Inside README/dashboard-component/
import { ClockInCard } from "./clock-in-card";
```

### Import Order

Organize imports in this order (separated by blank lines):

1. React / Next.js framework imports
2. Third-party library imports
3. `@/components/ui/*` (shadcn primitives)
4. `@/components/*` (feature & app components)
5. `@/hooks/*`, `@/lib/*`
6. `@/types/*`
7. Relative imports (`./`)

```tsx
import { useState, useEffect } from "react";
import { redirect } from "next/navigation";

import useSWR from "swr";
import { format } from "date-fns";
import { Clock, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/README/ui/card";
import { Button } from "@/README/ui/button";

import { AppSidebar } from "@/README/app-sidebar/app-sidebar";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

import type { AttendanceRecord } from "@/types/attendance";

import { ClockInCard } from "./clock-in-card";
```

---

## 6. State Management

### Patterns

| Need                     | Use                          | NOT                            |
| ------------------------ | ---------------------------- | ------------------------------ |
| Local UI state           | `useState`                   | Global stores                  |
| Data fetching (client)   | `useSWR`                     | `useEffect` + `fetch`          |
| Write operations         | `fetch()` + `mutate()`       | Direct SWR mutations           |
| Cross-component state    | React Context + Provider     | Redux, Zustand, Jotai          |
| Theme state              | `data-theme` attr + CSS vars | Manual class toggling          |
| Global alerts/dialogs    | `AlertGlobalProvider` context| Ad-hoc state in each component |
| Derived/filtered data    | `useMemo`                    | Re-computing in render body    |

### SWR Fetcher Pattern

Use this consistent fetcher throughout the project:

```tsx
const fetcher = (url: string) => fetch(url).then((r) => r.json());

const { data, error, isLoading } = useSWR<MyType>("/api/resource", fetcher);
```

Always provide the generic type parameter to `useSWR<T>()` for proper typing.

### Write Operations Pattern

For mutations (POST, PUT, DELETE), use imperative `fetch()` followed by SWR's
`mutate()` to revalidate the cache:

```tsx
const handleCreate = async (data: NewEmployee) => {
  await fetch("/api/employees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  mutate("/api/employees"); // Revalidate SWR cache
  toast.success("Employee created");
};
```

---

## 7. API Route Handlers

### Structure

API routes live under `app/api/<resource>/route.ts` and export named HTTP
method functions:

```tsx
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // ...
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // ...
  return NextResponse.json(created, { status: 201 });
}
```

### Rules

- Always import `NextRequest` and `NextResponse` from `next/server`.
- Use `NextResponse.json()` for all responses.
- Support query parameter filtering where appropriate
  (`request.nextUrl.searchParams.get('key')`).
- Current API routes contain **mock/hardcoded data**. When integrating with the
  real backend, proxy requests to `NEXT_PUBLIC_API_BASE_URL` or replace with
  direct backend calls.
- **Never expose secrets** (database URLs, API keys) in client-accessible
  routes. Use server-only environment variables.

---

## 8. Styling Guidelines

### Tailwind CSS

- All styling is done with **Tailwind utility classes** directly in JSX.
- **Do NOT** use CSS Modules, styled-components, or inline `style` objects.
- Use the `cn()` utility from `@/lib/utils` to conditionally merge classes:
  ```tsx
  <div className={cn("rounded-lg p-4", isActive && "bg-primary text-white")} />
  ```

### Theming & CSS Variables

- Theme tokens are defined in `app/globals.css` under `:root` and `.dark`.
- Use semantic variable names: `--background`, `--foreground`, `--primary`,
  `--accent`, `--muted`, `--destructive`, `--border`, `--sidebar`, etc.
- Dark mode is handled by `next-themes` with the `class` strategy. The `.dark`
  selector in `globals.css` swaps CSS variable values.
- **Never hardcode colors** in components. Always reference theme variables via
  Tailwind classes (e.g., `bg-primary`, `text-muted-foreground`,
  `border-border`).

### Sidebar Theme

The sidebar uses a distinct dark navy palette regardless of the app theme:
- `--sidebar` (navy background), `--sidebar-foreground` (light text)
- `--sidebar-muted`, `--sidebar-border`, `--sidebar-accent`

---

## 9. Layout Pattern

Module pages use a shared layout structure:

```tsx
// app/modules/<feature>/layout.tsx
import { SidebarProvider } from "@/README/ui/sidebar";
import { AppSidebar } from "@/README/app-sidebar/app-sidebar";
import { Topbar } from "@/README/topbar/topbar";

export default function FeatureLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Topbar />
        <main className="px-4 md:px-6 lg:px-8 py-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

### Two-File Page Pattern

Most modules use a delegation pattern where `page.tsx` is a thin shell that
imports and renders the actual feature component:

```tsx
// app/modules/<feature>/page.tsx (thin shell — default export)
import { FeaturePage } from "./feature-page";
export default function Page() {
  return <FeaturePage />;
}

// app/modules/<feature>/feature-page.tsx ("use client" — real logic)
"use client";
export function FeaturePage() {
  // All state, data fetching, and UI logic lives here
}
```

This separates the Next.js route entry point (which must be `export default`)
from the feature component (which uses named export and `"use client"`).

### Layout Hierarchy

- The root layout (`app/layout.tsx`) handles fonts (Geist), `<Suspense>`,
  `<Analytics />`, and `suppressHydrationWarning` on `<html>`.
- Module layouts handle sidebar, topbar, and content area with responsive
  padding (`px-4 md:px-6 lg:px-8 py-6`).
- The login page has its own standalone layout (no sidebar/topbar).

---

## 10. Type Definitions

### Rules

- All shared types/interfaces live in the `types/` directory.
- One file per domain entity (e.g., `employee.ts`, `attendance.ts`).
- Use `interface` for object shapes, `type` for unions and utility types.
- Use named exports:
  ```ts
  export interface Employee {
    id: string;
    name: string;
    department: string;
    position: string;
    status: string;
    joinDate: string;
    email: string;
    phone: string;
  }
  ```
- **Prefer string literal unions** over bare `string` for status fields when
  the set of values is known:
  ```ts
  status: "active" | "inactive" | "on-leave";
  ```

### Existing Domain Types

| File             | Types                                          |
| ---------------- | ---------------------------------------------- |
| `employee.ts`    | `Employee`                                     |
| `attendance.ts`  | `AttendanceRecord`, `AttendanceSummary`         |
| `department.ts`  | `Department`, `DepartmentList`                  |
| `shift.ts`       | `Shift`                                        |
| `announcement.ts`| `Announcement`, `AnnouncementBadge`            |
| `onboarding.ts`  | `OnboardingProcess`, `OnboardingStep`, `OnboardingChecklist` |
| `document.ts`    | `Document`                                     |

---

## 11. Hooks

- Place custom hooks in the `hooks/` directory.
- Name files with the `use-` prefix in `kebab-case`: `use-mobile.ts`.
- Name the hook function in `camelCase`: `useIsMobile`.
- Always use **named exports**.
- If a hook returns JSX or needs JSX types, use `.tsx` extension.

---

## 12. Testing

### Setup

- **Jest** with `ts-jest` for TypeScript support.
- **jsdom** environment for DOM testing.
- **@testing-library/react** for component rendering.
- **@testing-library/user-event** for user interaction simulation.
- **@testing-library/jest-dom** for DOM assertions.

### Conventions

- Place test files next to the component they test, or in a `__tests__/`
  subdirectory.
- Name test files: `<component-name>.test.tsx` or `<hook-name>.test.ts`.
- Test user-visible behavior, not implementation details.

---

## 13. shadcn/ui Integration

### Configuration (`components.json`)

```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "css": "app/globals.css",
    "baseColor": "gray",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/README",
    "utils": "@/lib/utils",
    "ui": "@/README/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### Rules

- Use `npx shadcn@latest add <component>` to add new UI primitives.
- **Never hand-edit** files in `components/ui/`. Customize via composition in
  feature components or by wrapping with `cn()`.
- The `cn()` utility from `@/lib/utils` combines `clsx` + `tailwind-merge`:
  ```ts
  import { clsx, type ClassValue } from "clsx";
  import { twMerge } from "tailwind-merge";
  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }
  ```

---

## 14. Icons

- Use **only** `lucide-react` for icons. No Font Awesome, Heroicons, or other
  icon libraries.
- Import individual icons by name:
  ```tsx
  import { Home, Clock, Users, ChevronRight } from "lucide-react";
  ```
- Set icon size via Tailwind classes (e.g., `className="h-4 w-4"`) or the
  `size` prop.

---

## 15. Notifications & Toasts

- Use **Sonner** for toast notifications:
  ```tsx
  import { toast } from "sonner";
  toast.success("Record saved");
  toast.error("Something went wrong");
  ```
- The `<Toaster />` component is mounted globally (handled in module layouts or
  the root layout). Do not add additional `<Toaster />` instances.

---

## 16. Date & Time

- Use **date-fns** for all date formatting and manipulation.
- Use **react-day-picker** (wrapped via shadcn calendar) for date picker UI.
- Format dates consistently. Prefer ISO format (`yyyy-MM-dd`) for data and
  locale-appropriate formats for display.

---

## 17. Environment Variables

| Variable                    | Scope   | Description                               |
| --------------------------- | ------- | ----------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`  | Client  | Base URL for backend API                  |
| `NEXTAUTH_URL`              | Server  | NextAuth callback URL                     |
| `NODE_ENV`                  | Both    | `development` / `production`              |

- Client-accessible variables **must** be prefixed with `NEXT_PUBLIC_`.
- Store secrets in `.env.local` (gitignored) or via secrets manager.
- **Never commit secrets** to the repository or Dockerfile.

---

## 18. Docker & Deployment

### Dockerfile (Multi-Stage)

| Stage       | Purpose                                  |
| ----------- | ---------------------------------------- |
| `base`      | Node 22-slim + pnpm 9 via Corepack      |
| `deps`      | Install all dependencies (dev + prod)    |
| `builder`   | Build Next.js for production             |
| `prod-deps` | Install production-only dependencies     |
| `runner`    | Final production image (non-root `node`) |
| `dev`       | Development with hot reload              |

- Production build uses `output: 'standalone'` in `next.config.ts`.
- Build target: `docker build --target runner .`
- Dev target: `docker build --target dev .`

### Docker Compose

| Service     | Purpose                    | Port  | Profiles       |
| ----------- | -------------------------- | ----- | -------------- |
| `web`       | Next.js production         | 3000  | `prod`         |
| `web-dev`   | Next.js dev (hot reload)   | 3000  | `dev`          |
| `api`       | NestJS backend (placeholder)| 8080 | `dev`, `prod`  |
| `db`        | PostgreSQL 16              | 5432  | `dev`, `prod`  |
| `redis`     | Redis 7                    | 6379  | `dev`, `prod`  |
| `keycloak`  | Keycloak SSO (dev mode)    | 8081  | `dev`, `prod`  |

### CI/CD (GitHub Actions)

The `.github/workflows/deployment.yaml` pipeline:
1. Builds Docker image on push to `main`
2. Pushes to Docker Hub
3. Triggers Kubernetes rolling restart (`kubectl rollout restart`)

---

## 19. Development Workflow

### Running Locally

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server with Turbopack at http://localhost:3000
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Run ESLint
```

### Running with Docker

```bash
# Development (with hot reload + supporting services)
docker compose -f infra/docker-compose.yml --profile dev up --build web-dev

# Production
docker compose -f infra/docker-compose.yml --profile prod up --build web
```

### Adding a New Module/Feature

1. Create route directory: `app/modules/<feature-name>/`
2. Add `page.tsx` (with `"use client"` if needed) and `layout.tsx` (using
   the shared sidebar/topbar layout pattern).
3. Create feature components in `components/<feature-name>-component/`.
4. Add types in `types/<feature-name>.ts`.
5. Add API mock routes in `app/api/<feature-name>/route.ts`.
6. Register navigation in the sidebar (`components/app-sidebar/`).

### Adding a New shadcn Component

```bash
npx shadcn@latest add <component-name>
```

This places the component in `components/ui/`. Do not modify it directly.

---

## 20. Code Quality Rules

1. **TypeScript strict mode** is enabled. Do not use `any` — provide proper
   types. Use `unknown` when the type is truly unknown and narrow it.
2. **No `eslint-disable` comments** without a documented reason.
3. **No console.log in production code**. Use it only for temporary debugging
   and remove before committing.
4. **Preserve existing comments and docstrings** unrelated to your changes.
5. **Handle loading and error states** for all data-fetching components:
   ```tsx
   if (isLoading) return <Skeleton />;
   if (error) return <ErrorMessage />;
   ```
6. **Accessibility**: All interactive elements must be keyboard-navigable.
   Use semantic HTML and Radix UI primitives (which provide ARIA attributes).
7. **Responsive design**: All UI must work on mobile and desktop. Use the
   `useIsMobile()` hook and responsive Tailwind classes.

---

## 21. Git & Branching

- **Main branch**: `main` — protected, triggers CI/CD on push.
- Write clear, descriptive commit messages.
- Keep commits atomic — one logical change per commit.
- The project uses **CRLF** line endings (Windows-primary development).

---

## 22. Language & Localization

- **Code** (variable names, comments in code, component names): **English**.
- **Infrastructure comments** (Dockerfile, docker-compose.yml): Currently in
  **Bahasa Indonesia** — maintain consistency with existing comments in those
  files.
- **UI text**: English (primary language of the application interface).

---

## 23. What NOT to Do

- ❌ Do NOT install alternative icon libraries (Font Awesome, Heroicons, etc.)
- ❌ Do NOT install global state management libraries (Redux, Zustand, Jotai)
- ❌ Do NOT use CSS Modules or styled-components
- ❌ Do NOT hand-edit files in `components/ui/`
- ❌ Do NOT use `export default` for components (except `page.tsx`/`layout.tsx`)
- ❌ Do NOT use arrow functions for component definitions
- ❌ Do NOT hardcode color values in components — use theme variables
- ❌ Do NOT add `<Toaster />` outside the existing global mount
- ❌ Do NOT use `useEffect` + `fetch` for data fetching — use `useSWR`
- ❌ Do NOT commit `.env.local`, secrets, or `node_modules`
- ❌ Do NOT use `var` — use `const` and `let`
