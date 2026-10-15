# HRIS Monorepo Project (`hris-project`)

Monorepo terintegrasi untuk aplikasi **Human Resource Information System (HRIS)**.

## 📁 Struktur Monorepo

```text
hris-project/
├── apps/
│   ├── web/             # Frontend (Next.js 15 + React 19 + Tailwind CSS 4)
│   ├── api/             # Backend (ASP.NET Core Web API .NET 9)
│   ├── ai/              # AI Service (Python 3.12 / FastAPI, managed with uv)
│   └── crm/             # CRM & PSA Microservice (NestJS + Prisma)
├── packages/
│   └── contracts/       # Tipe TS hasil generate dari OpenAPI backend (@hris/contracts)
├── infra/               # docker-compose.yml (+ konfigurasi infrastruktur)
├── .github/workflows/   # CI/CD Workflows (GitHub Actions)
├── docs/                # Dokumentasi & PDF Arsitektur/SRS
├── scripts/             # Automation scripts (create-service.ps1)
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
# Menjalankan dev stack (compose file ada di infra/)
docker compose -f infra/docker-compose.yml --profile dev up --build
```

---

## 🛠️ Monorepo Scripts (Root `package.json`)

| Perintah | Keterangan |
|---|---|
| `pnpm dev` | Menjalankan Frontend, Backend ASP.NET Core, dan AI service secara bersamaan |
| `pnpm dev:client` | Menjalankan Next.js Frontend saja |
| `pnpm dev:backend` | Menjalankan ASP.NET Core Web API saja |
| `pnpm dev:ai` | Menjalankan AI service (FastAPI) saja |
| `pnpm build` | Mem-build Frontend (`pnpm build:client`) dan Backend (`pnpm build:backend`) |
| `pnpm lint:client` | Menjalankan ESLint di Frontend |
| `pnpm test:ai` | Menjalankan test suite AI service |
| `pnpm create:service <Name>` | Generate 5-layer backend service baru |

---

## 📝 Catatan Development
- Folder build (`node_modules`, `.next`, `bin`, `obj`, `.vs`, `.idea`) dikecualikan dari repositori via `.gitignore`.
- Variabel lingkungan dapat dikonfigurasi dengan menyalin `.env.example` menjadi `.env`.
