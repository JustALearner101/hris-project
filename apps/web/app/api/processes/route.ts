import { NextResponse } from "next/server"
import { createProcess, listProcesses } from "./data"

export async function GET() {
    return NextResponse.json(listProcesses())
}

export async function POST(req: Request) {
    const body = await req.json()
    const created = createProcess(body)
    return NextResponse.json(created, { status: 201 })
}