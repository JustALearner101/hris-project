import { NextResponse } from "next/server"
import type { TimesheetRow, AttendanceStatus, PagedResponse } from "@/types/attendance"

// in-memory seed
let seeded = false
const rows: TimesheetRow[] = []

function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function formatDate(d: Date) {
    return d.toISOString().slice(0, 10)
}

function addDays(base: Date, days: number) {
    const d = new Date(base)
    d.setDate(d.getDate() + days)
    return d
}

function seed() {
    if (seeded) return
    const today = new Date()
    const people = [
        { id: "emp-1", name: "Alya N.", dept: "Engineering", shift: "Shift A" },
        { id: "emp-2", name: "Bima P.", dept: "Human Resources", shift: "Shift A" },
        { id: "emp-3", name: "Citra K.", dept: "Finance", shift: "Shift B" },
        { id: "emp-4", name: "Dimas R.", dept: "Engineering", shift: "Shift B" },
        { id: "emp-5", name: "Eka S.", dept: "Operations", shift: "Shift C" },
    ]

    // generate 14 days of timesheets
    const days = Array.from({ length: 14 }, (_, i) => addDays(today, -i))
    for (const p of people) {
        for (const d of days) {
            const dateStr = formatDate(d)
            const random = Math.random()
            let status: AttendanceStatus = "on-time"
            let clockIn: string | undefined
            let clockOut: string | undefined
            let totalHours = 0
            let overtimeHours = 0
            let absenceReason: string | undefined

            if (random < 0.12) {
                status = "absent"
                absenceReason = Math.random() < 0.5 ? "Sick Leave" : "Uninformed"
            } else {
                const start = new Date(d)
                start.setHours(9, randInt(0, 59), 0, 0)
                const lateBy = randInt(0, 40)
                if (lateBy > 15 && random < 0.55) status = "late"
                start.setMinutes(start.getMinutes() + (status === "late" ? lateBy : 0))
                const end = new Date(start)
                end.setHours(18, randInt(0, 20), 0, 0)
                totalHours = Math.max(0, (end.getTime() - start.getTime()) / 36e5)
                if (totalHours > 8) overtimeHours = +(totalHours - 8).toFixed(1)
                clockIn = start.toISOString()
                clockOut = end.toISOString()
            }

            rows.push({
                id: crypto.randomUUID(),
                tenantId: "demo-tenant",
                entityId: "demo-entity",
                employeeId: p.id,
                employeeName: p.name,
                department: p.dept,
                shift: p.shift,
                date: dateStr,
                clockIn,
                clockOut,
                totalHours: +totalHours.toFixed(1),
                overtimeHours,
                status,
                absenceReason,
            })
        }
    }
    seeded = true
}

function applyFilters(data: TimesheetRow[], searchParams: URLSearchParams) {
    const date = searchParams.get("date") || undefined
    const start = searchParams.get("start") || undefined
    const end = searchParams.get("end") || undefined
    const department = searchParams.get("department") || undefined
    const shift = searchParams.get("shift") || undefined
    const status = (searchParams.get("status") || undefined) as AttendanceStatus | "all" | undefined

    let result = data.slice()

    if (date) result = result.filter((r) => r.date === date)
    if (start) result = result.filter((r) => r.date >= start)
    if (end) result = result.filter((r) => r.date <= end)
    if (department) result = result.filter((r) => r.department === department)
    if (shift) result = result.filter((r) => r.shift === shift)
    if (status && status !== "all") result = result.filter((r) => r.status === status)

    const sort = (searchParams.get("sort") || "").trim() // e.g. "clockIn:desc"
    if (sort) {
        const [key, order] = sort.split(":")
        result.sort((a: TimesheetRow, b: TimesheetRow) => {
            const av = a[key as keyof TimesheetRow]
            const bv = b[key as keyof TimesheetRow]
            if (av == null && bv == null) return 0
            if (av == null) return 1
            if (bv == null) return -1
            return order === "desc" ? (av > bv ? -1 : av < bv ? 1 : 0) : av > bv ? 1 : av < bv ? -1 : 0
        })
    }

    return result
}

export async function GET(req: Request) {
    seed()
    const url = new URL(req.url)
    const sp = url.searchParams

    const page = Math.max(1, Number(sp.get("page") || "1"))
    const pageSize = Math.max(1, Math.min(100, Number(sp.get("page_size") || "10")))

    const filtered = applyFilters(rows, sp)
    const total = filtered.length
    const startIdx = (page - 1) * pageSize
    const endIdx = startIdx + pageSize
    const paged = filtered.slice(startIdx, endIdx)

    const body: PagedResponse<TimesheetRow> = {
        data: paged,
        meta: { page, pageSize, total },
    }

    return NextResponse.json(body, { status: 200 })
}