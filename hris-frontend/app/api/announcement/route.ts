import { NextResponse } from "next/server"
import { getAnnouncements, createAnnouncement } from "./data"

export async function GET() {
    const data = getAnnouncements()
    return NextResponse.json({ data })
}

export async function POST(req: Request) {
    const body = await req.json()
    const created = createAnnouncement(body)
    return NextResponse.json({ data: created }, { status: 201 })
}