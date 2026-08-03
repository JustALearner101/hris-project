# HRIS Monorepo Project (`hris-project`)

Monorepo terintegrasi untuk aplikasi **Human Resource Information System (HRIS)**.

## 📁 Struktur Monorepo

```text
hris-project/
├── .github/workflows/   # CI/CD Workflows (GitHub Actions)
├── docs/                # Dokumentasi & PDF Arsitektur/SRS
├── hris-backend/        # Backend (ASP.NET Core Web API .NET 9)
├── hris-frontend/       # Frontend (Next.js 15 + React 19 + Tailwind CSS 4)
├── docker-compose.yml   # Orchestration Docker (Frontend, Backend, DB, Redis, Keycloak)
├── package.json         # Root scripts & orchestration (pnpm + concurrently)
└── .env.example         # Environment template
```

---

## 🚀 Panduan Memulai (Quick Start)

### 1. Menginstal Dependensi
Di root monorepo:
```bash
pnpm install
```

### 2. Menjalankan Mode Development

#### A. Opsi 1: Menjalankan Frontend & Backend Bersamaan (Root Command)
```bash
pnpm dev
```
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8080` (Swagger UI: `http://localhost:8080/swagger`)

#### B. Opsi 2: Menjalankan Secara Terpisah
- **Frontend Saja**:
  ```bash
  pnpm dev:client
  ```
- **Backend Saja**:
  ```bash
  pnpm dev:backend
  ```

#### C. Opsi 3: Menggunakan Docker Compose Stack (Lengkap dengan Postgres, Redis, Keycloak)
```bash
# Menjalankan dev stack
docker compose --profile dev up --build
```

---

## 🛠️ Monorepo Scripts (Root `package.json`)

| Perintah | Keterangan |
|---|---|
| `pnpm dev` | Menjalankan Frontend dan Backend ASP.NET Core secara bersamaan |
| `pnpm dev:client` | Menjalankan Next.js Frontend saja |
| `pnpm dev:backend` | Menjalankan ASP.NET Core Web API saja |
| `pnpm build` | Mem-build Frontend (`pnpm build:client`) dan Backend (`pnpm build:backend`) |
| `pnpm lint:client` | Menjalankan ESLint di Frontend |

---

## 📝 Catatan Development
- Folder build (`node_modules`, `.next`, `bin`, `obj`, `.vs`, `.idea`) dikecualikan dari repositori via `.gitignore`.
- Variabel lingkungan dapat dikonfigurasi dengan menyalin `.env.example` menjadi `.env`.
