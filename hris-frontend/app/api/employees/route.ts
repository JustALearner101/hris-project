import { NextResponse } from "next/server"
import { create, getAll } from "./data"
import type { Employee } from "@/types/employee"

export async function GET() {
    const items = getAll()
    return NextResponse.json({ data: items })
}

export async function POST(req: Request) {
    const body = (await req.json()) as Partial<Employee>
    if (!body?.nik || !body?.name || !body?.positionCode || !body?.positionName || !body?.department) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    const item = create({
        nik: body.nik!,
        name: body.name!,
        positionCode: body.positionCode!,
        positionName: body.positionName!,
        department: body.department!,
        email: body.email,
        phone: body.phone,
        joinDate: body.joinDate || new Date().toISOString().slice(0, 10),
        status: body.status || "active",
    })
    return NextResponse.json({ data: item }, { status: 201 })
}