import { NextResponse } from "next/server"
import { deleteProcess, getProcess, updateProcess } from "../data"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const found = getProcess(id)
    if (!found) return NextResponse.json({ message: "Not found" }, { status: 404 })
    return NextResponse.json(found)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const patch = await req.json()
    const updated = updateProcess(id, patch)
    if (!updated) return NextResponse.json({ message: "Not found" }, { status: 404 })
    return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    deleteProcess(id)
    return NextResponse.json({ ok: true })
}