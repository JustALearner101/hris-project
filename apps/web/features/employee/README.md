# Employee Feature Module (Next.js 15 Best Practice Architecture)

Panduan ini berisi penjelasan arsitektur dan prinsip-prinsip *Best Practice* Next.js 15 (App Router) yang digunakan pada modul **Master Employee**. Gunakan panduan ini sebagai acuan saat membuat modul-modul CRUD lainnya di `apps/web`.

---

## 🏛️ Arsitektur Berbasis Fitur (Feature-Driven Architecture)

Struktur folder modul `employee` dipisahkan secara modular di bawah `features/employee/`:

```text
features/employee/
├── api/
│   └── use-employees.ts      # Custom SWR hook untuk Data Fetching & Mutations
├── components/
│   ├── employee-table.tsx    # Komponen utama tabel & pagination
│   ├── employee-form-dialog.tsx # Dialog Tambah & Edit dengan Zod
│   └── employee-view-dialog.tsx # Modal detail read-only
├── types/
│   └── employee.ts           # Type DTO & Skema Validasi Zod
└── README.md                 # Dokumentasi acuan belajar
```

### Kenapa Pola Ini Diterapkan?
1. **Penataan Rapi & Cohesive**: Seluruh tipe data, API hook, dan UI komponen yang berhubungan dengan Employee terkumpul di 1 tempat.
2. **Mudah Di-maintain**: Jika ada perubahan pada fitur Employee, Anda tidak perlu melompat-lompat antar folder `components/` global atau `app/modules/`.

---

## ⚡ 4 Pilar Utama Best Practice Next.js 15 yang Diterapkan

### 1. Server Component vs Client Component (Komponensasi Terpisah)
- **`app/(dashboard)/employees/page.tsx`** adalah **Server Component** (tanpa `"use client"`).
  - Mengirim HTML awal dari server untuk Breadcrumb & Judul Halaman (kecepatan render maksimum & zero JS bundle).
- **`employee-table.tsx`** adalah **Client Component** (menggunakan `"use client"`).
  - Mengisolasi bagian yang butuh interaktivitas (State, Event Handler, SWR Fetching).

### 2. Centralized API Client (`lib/api-client.ts`)
- Semua panggilan HTTP dikirim melalui `apiClient<T>()` yang otomatis:
  - Mengarahkan request ke `NEXT_PUBLIC_API_BASE_URL` (`http://localhost:8080`).
  - Memahami wrapper DTO backend: `DefaultDtoResponse<T>` (`status`, `data`, `message`, `total`).

### 3. Server-Side Pagination & Searching
- **Jangan mengunduh seluruh data ke memori browser.**
- Di `use-employees.ts`, query parameter dikirim ke backend:
  ```ts
  GET /api/v1/Employee?Offset=0&Limit=10&Search=john
  ```
- Backend ASP.NET Core yang melakukan pencarian & pagination cepat di Database PostgreSQL.

### 4. Validasi Form menggunakan Zod (`types/employee.ts`)
- Menggunakan `zod` schema untuk memastikan data yang diinput user valid sebelum dikirim ke server:
  ```ts
  export const employeeFormSchema = z.object({
    firstName: z.string().min(2, "First name is required"),
    email: z.string().email("Invalid email"),
    ...
  });
  ```

---

## 🚀 Cara Menambah Modul Baru (Contoh: `Attendance` atau `Payroll`)

Jika Anda ingin membuat modul CRUD baru di masa depan:
1. Buat folder baru `features/<nama-fitur>/`.
2. Buat `types/<nama-fitur>.ts` untuk TypeScript DTO & Zod schema.
3. Buat `api/use-<nama-fitur>.ts` menggunakan SWR hook.
4. Buat komponen tabel & form di `components/`.
5. Panggil komponen fitur dari `app/(dashboard)/<nama-fitur>/page.tsx` (Server Component).
