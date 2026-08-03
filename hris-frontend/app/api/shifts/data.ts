import type { Shift, ShiftFilters, ShiftType } from "@/types/shift"

let seedInitialized = false
const store: Shift[] = []

function seed() {
    if (seedInitialized) return
    const now = new Date()
    const iso = (d: Date) => d.toISOString()
    const mk = (
        i: number,
        p: Partial<Shift> = {},
        t: ShiftType = ["FIXED", "ROTATING", "SPLIT"][i % 3] as ShiftType,
    ): Shift => ({
        id: crypto.randomUUID(),
        tenantId: "tenant-demo",
        entityId: "entity-demo",
        code: `SHIFT-${String(i + 1).padStart(3, "0")}`,
        name: ["Morning", "Evening", "Night"][i % 3] + " Shift",
        type: t,
        startTime: ["08:00", "16:00", "00:00"][i % 3],
        endTime: ["16:00", "00:00", "08:00"][i % 3],
        breakDurationMin: 60,
        gracePeriodMin: 10,
        workingHours: 8,
        validFrom: "2024-01-01",
        validTo: undefined,
        isDefault: i === 0,
        active: i !== 5,
        version: 1,
        createdAt: iso(now),
        updatedAt: iso(now),
        ...p,
    })
    for (let i = 0; i < 12; i++) store.push(mk(i))
    seedInitialized = true
}

export function listShifts(params: ShiftFilters): { data: Shift[]; total: number } {
    seed()
    const { search = "", type = "ALL", active = "all", page = 1, pageSize = 10 } = params

    let rows = [...store]

    if (search) {
        const s = search.toLowerCase()
        rows = rows.filter((r) => r.name.toLowerCase().includes(s) || r.code.toLowerCase().includes(s))
    }

    if (type !== "ALL") {
        rows = rows.filter((r) => r.type === type)
    }

    if (active !== "all") {
        const flag = active === "true"
        rows = rows.filter((r) => r.active === flag)
    }

    const total = rows.length
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const data = rows.slice(start, end)

    return { data, total }
}

export function getShift(id: string): Shift | undefined {
    seed()
    return store.find((s) => s.id === id)
}

export function createShift(payload: Omit<Shift, "id" | "createdAt" | "updatedAt" | "version">): Shift {
    seed()
    if (store.some((s) => s.code === payload.code)) {
        throw new Error("Duplicate code")
    }
    const nowIso = new Date().toISOString()
    const item: Shift = {
        ...payload,
        id: crypto.randomUUID(),
        createdAt: nowIso,
        updatedAt: nowIso,
        version: 1,
    }
    store.unshift(item)
    return item
}

export function updateShift(id: string, changes: Partial<Shift>): Shift {
    seed()
    const idx = store.findIndex((s) => s.id === id)
    if (idx === -1) throw new Error("Not found")
    const updated: Shift = {
        ...store[idx],
        ...changes,
        version: store[idx].version + 1,
        updatedAt: new Date().toISOString(),
    }
    store[idx] = updated
    return updated
}

export function softDeleteShift(id: string): Shift {
    return updateShift(id, { active: false })
}

export function hardDeleteShift(id: string): boolean {
    seed()
    const idx = store.findIndex((s) => s.id === id)
    if (idx === -1) return false
    store.splice(idx, 1)
    return true
}