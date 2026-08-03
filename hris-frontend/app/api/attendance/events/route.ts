import { NextResponse } from "next/server"
import type { AttendanceEvent } from "@/types/attendance"

let seeded = false
const events: AttendanceEvent[] = []

function seed() {
    if (seeded) return
    const now = new Date()
    const baseEmployees = [
        { id: "emp-1", name: "Alya N." },
        { id: "emp-2", name: "Bima P." },
        { id: "emp-3", name: "Citra K." },
        { id: "emp-4", name: "Dimas R." },
        { id: "emp-5", name: "Eka S." },
    ]
    for (let i = 0; i < 25; i++) {
        const e = baseEmployees[i % baseEmployees.length]
        const type = Math.random() > 0.5 ? "CLOCK_IN" : "CLOCK_OUT"
        const occurredAt = new Date(now.getTime() - i * 15 * 60 * 1000).toISOString()
        events.push({
            id: crypto.randomUUID(),
            tenantId: "demo-tenant",
            entityId: "demo-entity",
            employeeId: e.id,
            type,
            occurredAt,
            source: Math.random() > 0.6 ? "device" : Math.random() > 0.5 ? "web" : "mobile",
            geo: { lat: -6.2 + Math.random() / 10, lng: 106.8 + Math.random() / 10 },
        })
    }
    seeded = true
}

export async function GET() {
    seed()
    return NextResponse.json({ data: events.slice(0, 50) })
}