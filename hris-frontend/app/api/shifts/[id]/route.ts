import { type NextRequest, NextResponse } from "next/server"
import { getShift, updateShift, softDeleteShift, hardDeleteShift } from "../data"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const item = getShift(id)
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(item)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    try {
        const body = await req.json()
        const updated = updateShift(id, body)
        return NextResponse.json(updated)
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to update"
        return NextResponse.json({ error: message }, { status: 400 })
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const mode = new URL(req.url).searchParams.get("mode") // "soft" | "hard"
    if (mode === "hard") {
        const ok = hardDeleteShift(id)
        return NextResponse.json({ ok })
    }
    const updated = softDeleteShift(id)
    return NextResponse.json(updated)
}