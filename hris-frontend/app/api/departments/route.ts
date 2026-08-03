import { NextResponse } from "next/server"
import { listDepartments, createDepartment, getTree, getChildren } from "./data"
import type { DepartmentSortBy, SortDir } from "@/types/department"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    // In real app this comes from auth/session
    const tenantId = searchParams.get("tenantId") || "00000000-0000-0000-0000-000000000001"

    const mode = searchParams.get("mode") // tree | children | list (default)
    if (mode === "tree") {
        const rootId = searchParams.get("rootId") || undefined
        const depth = Number(searchParams.get("depth") || "5")
        const tree = getTree(tenantId, rootId, depth)
        return NextResponse.json({ data: tree })
    }
    if (mode === "children") {
        const parentId = searchParams.get("parentId")
        const rows = getChildren(parentId, tenantId)
        return NextResponse.json({ data: rows })
    }

    const resp = listDepartments({
        tenantId,
        q: searchParams.get("q") || undefined,
        status: searchParams.get("status") || undefined,
        parentId: searchParams.get("parentId") || undefined,
        headId: searchParams.get("headId") || undefined,
        validAt: searchParams.get("validAt") || undefined,
        page: Number(searchParams.get("page") || "1"),
        pageSize: Number(searchParams.get("pageSize") || "10"),
        sortBy: (searchParams.get("sortBy") || "name") as DepartmentSortBy,
        sortDir: (searchParams.get("sortDir") || "asc") as SortDir,
    })
    return NextResponse.json(resp)
}

export async function POST(req: Request) {
    const body = await req.json()
    const tenantId = body.tenantId || "00000000-0000-0000-0000-000000000001"
    const dept = createDepartment({ ...body, tenantId })
    return NextResponse.json(dept, { status: 201 })
}