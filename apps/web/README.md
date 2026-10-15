# HRIS Client

A modern Human Resource Information System (HRIS) web client built with Next.js, React, Tailwind CSS, and Radix UI. It provides employee self-service and admin features such as dashboards, attendance, requests, and people management.

## Features

- Employee Dashboard
  - Clock In / Clock Out with confirmation dialog
  - Attendance status and daily shift overview
  - Leave balance and benefits summary
  - Monthly payroll summary with slip access (UI placeholder)
  - Announcements, Performance, and Learning progress
  - Calendar & Events
- Request Workflows
  - Create requests from the dashboard (UI dialog)
- People Management (Admin sections)
  - Master Employee
  - Master Document
  - Onboarding & Offboarding
- UI/UX
  - Responsive layout with cards, dialogs, sidebar, and topbar
  - Radix UI components and Lucide icons
  - Tailwind CSS styling

## Tech Stack

- Next.js 15 (App Router) with Turbopack for dev/build
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI primitives (@radix-ui/*)
- Lucide React icons
- date-fns, react-day-picker (Calendar)

## Prerequisites

- Node.js 18.18+ or 20+ (recommended)
- Package manager: pnpm or npm
  - The repo contains a pnpm-lock.yaml; pnpm is recommended.

## Getting Started (Setup)

1. Clone the repository
   - Using HTTPS: `git clone https://your-repo-url/HRIS/hris-client.git`
   - Or download and extract the source
2. Change into the project directory
   - Windows PowerShell: `cd D:\HRIS\hris-client`
3. Install dependencies (choose one)
   - pnpm: `pnpm install`
   - npm: `npm install`

If your environment is behind a proxy or uses a private registry, configure it before installing.

## Environment Variables

The current UI does not require mandatory environment variables for basic local development. If you later integrate APIs, create a `.env.local` file in the project root and add variables in `NEXT_PUBLIC_...` format as needed. Example:

```
# .env.local
# NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

## How to Run

- Development (with Turbopack)
  - pnpm: `pnpm dev`
  - npm: `npm run dev`
  - Default URL: http://localhost:3000

- Production build
  1. Build the app
     - pnpm: `pnpm build`
     - npm: `npm run build`
  2. Start the production server
     - pnpm: `pnpm start`
     - npm: `npm start`

- Lint
  - pnpm: `pnpm lint`
  - npm: `npm run lint`

## Project Structure (Key Folders)

- `app/` — Next.js App Router pages, layouts, and routes
- `components/` — Reusable UI components (cards, dialogs, sidebar, etc.)
- `public/` — Static assets (e.g., images)
- `hooks/`, `lib/`, `types/` — Utilities and shared types

## Notes

- Tested primarily on Windows with PowerShell. Commands above work cross‑platform; adjust paths if needed.
- Some features (e.g., payroll slip view, external APIs) may be placeholders pending backend integration.

## Troubleshooting

- If port 3000 is in use, set `PORT=3001` before running (PowerShell):
  - `$env:PORT=3001; pnpm dev`
- If styles don’t load after dependency updates, stop the dev server, clear `.next/`, and restart.
- Ensure your Node version matches the required range (Node 18.18+ or 20+).

## License

This project is open source
