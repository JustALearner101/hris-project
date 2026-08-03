// Simple in-memory store for demo purposes only.
import { randomUUID } from "crypto"
import type {
    Department,
    DepartmentAuditLog,
    DepartmentListResponse,
    DepartmentTreeNode,
    DepartmentSortBy,
    SortDir,
} from "@/types/department"

// Seed data
const departments: Department[] = []

function seed(): void {
    const now = new Date().toISOString()
    const tenant = "00000000-0000-0000-0000-000000000001"
    const hrId = randomUUID()
    const itId = randomUUID()
    const engId = randomUUID()
    const subEngId = randomUUID()

    const base: Omit<Department, "id" | "code" | "name" | "parentDepartmentId"> = {
        tenantId: tenant,
        status: "ACTIVE",
        validFrom: now.slice(0, 10),
        validTo: "9999-12-31",
        description: "",
        entityId: undefined,
        headEmployeeId: undefined,
        locationId: undefined,
        version: 1,
        createdAt: now,
        updatedAt: now,
        audit: [],
    }

    departments.push(makeDept(hrId, tenant, "Human Resources", undefined, base))
    departments.push(makeDept(itId, tenant, "Information Technology", undefined, base))
    departments.push(makeDept(engId, tenant, "Engineering", undefined, base))
    departments.push(makeDept(subEngId, tenant, "Platform Engineering", engId, base))
}

function initialsFromName(name: string) {
    return name
        .split(/\s+/)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("")
        .slice(0, 2)
}

function nextCode(tenantId: string, name: string) {
    const n = departments.filter((d) => d.tenantId === tenantId).length + 1
    const suffix = initialsFromName(name)
    return `DEP-${String(n).padStart(4, "0")}${suffix}`
}

function makeDept(
    id: string,
    tenantId: string,
    name: string,
    parentDepartmentId: string | undefined,
    base: Omit<Department, "id" | "code" | "name" | "parentDepartmentId">,
): Department {
    return {
        ...base,
        id,
        tenantId,
        name,
        code: nextCode(tenantId, name),
        parentDepartmentId,
    }
}

seed()

export type ListParams = {
    q?: string
    status?: string
    parentId?: string
    headId?: string
    validAt?: string // date
    page?: number
    pageSize?: number
    sortBy?: DepartmentSortBy
    sortDir?: SortDir
    tenantId: string
}

export function listDepartments(params: ListParams): DepartmentListResponse {
    const {
        q,
        status,
        parentId,
        headId,
        validAt,
        page = 1,
        pageSize = 10,
        sortBy = "name",
        sortDir = "asc",
        tenantId,
    } = params

    let rows = departments.filter((d) => d.tenantId === tenantId)

    if (q) {
        const s = q.toLowerCase()
        rows = rows.filter(
            (d) =>
                d.name.toLowerCase().includes(s) ||
                d.code.toLowerCase().includes(s) ||
                (d.description || "").toLowerCase().includes(s),
        )
    }
    if (status) rows = rows.filter((d) => d.status === status)
    if (parentId) rows = rows.filter((d) => d.parentDepartmentId === parentId)
    if (headId) rows = rows.filter((d) => d.headEmployeeId === headId)
    if (validAt) {
        rows = rows.filter((d) => d.validFrom <= validAt && validAt <= d.validTo)
    }

    rows.sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1
        const va = sortBy === "name" ? a.name : sortBy === "code" ? a.code : a.createdAt
        const vb = sortBy === "name" ? b.name : sortBy === "code" ? b.code : b.createdAt
        return va < vb ? -1 * dir : va > vb ? 1 * dir : 0
    })

    const total = rows.length
    const start = (page - 1) * pageSize
    const data = rows.slice(start, start + pageSize)
    return { data, total, page, pageSize }
}

export function getDepartment(id: string) {
    return departments.find((d) => d.id === id) || null
}

export function createDepartment(input: Partial<Department> & { tenantId: string; name: string }) {
    const now = new Date().toISOString()
    const id = randomUUID()
    const code = input.code || nextCode(input.tenantId, input.name)
    const dept: Department = {
        id,
        code,
        tenantId: input.tenantId,
        entityId: input.entityId,
        name: input.name,
        description: input.description,
        parentDepartmentId: input.parentDepartmentId,
        headEmployeeId: input.headEmployeeId,
        locationId: input.locationId,
        status: (input.status as Department["status"]) || "ACTIVE",        validFrom: input.validFrom || now.slice(0, 10),
        validTo: input.validTo || "9999-12-31",
        version: 1,
        createdAt: now,
        updatedAt: now,
        audit: [],
    }
    // Avoid circular reference in audit logs by not storing the original object reference
    const safeNewValues: Partial<Department> = { ...dept, audit: [] }
    const log: DepartmentAuditLog = {
        id: randomUUID(),
        action: "CREATE",
        changedAt: now,
        changedBy: "changedBy" in input ? (input.changedBy as string) : "system",        newValues: safeNewValues,
    }
    dept.audit.push(log)
    departments.unshift(dept)
    return dept
}

export function updateDepartment(id: string, payload: Partial<Department> & { version: number; changedBy?: string }) {
    const idx = departments.findIndex((d) => d.id === id)
    if (idx === -1) return { error: "NOT_FOUND" as const }
    const current = departments[idx]
    if (payload.version !== current.version) return { error: "VERSION_MISMATCH" as const }

    const now = new Date().toISOString()
    const oldValues: Partial<Department> = {}
    const newValues: Partial<Department> = {}

    const fields: (keyof Department)[] = [
        "name",
        "description",
        "parentDepartmentId",
        "headEmployeeId",
        "locationId",
        "status",
        "validFrom",
        "validTo",
    ]
    function assignIfChanged<K extends keyof Department>(key: K) {
        const val = payload[key]
        if (val !== undefined && val !== current[key]) {
            oldValues[key] = current[key]
            current[key] = val as Department[K]
            newValues[key] = val
        }
    }
    fields.forEach((f) => assignIfChanged(f))

    current.updatedAt = now
    current.version += 1

    const log: DepartmentAuditLog = {
        id: randomUUID(),
        action: "UPDATE",
        changedAt: now,
        changedBy: payload.changedBy || "system",
        oldValues,
        newValues,
    }
    current.audit.push(log)

    departments[idx] = current
    return { data: current }
}

export function archiveDepartment(id: string, changedBy = "system") {
    const d = departments.find((x) => x.id === id)
    if (!d) return { error: "NOT_FOUND" as const }
    d.status = "ARCHIVED"
    d.updatedAt = new Date().toISOString()
    d.version += 1
    d.audit.push({
        id: randomUUID(),
        action: "ARCHIVE",
        changedAt: d.updatedAt,
        changedBy,
        oldValues: { status: "ACTIVE" },
        newValues: { status: "ARCHIVED" },
    })
    return { data: d }
}

// Hierarchy helpers
export function getChildren(parentId: string | null, tenantId: string): Department[] {
    return departments.filter(
        (d) => d.tenantId === tenantId && (parentId ? d.parentDepartmentId === parentId : !d.parentDepartmentId),
    )
}

export function getPath(id: string): Department[] {
    const path: Department[] = []
    let cur = departments.find((d) => d.id === id) || null
    while (cur) {
        path.unshift(cur)
        cur = cur.parentDepartmentId ? departments.find((d) => d.id === cur!.parentDepartmentId!) || null : null
    }
    return path
}

export function getTree(tenantId: string, rootId?: string, depth = 5): DepartmentTreeNode[] {
    function build(parentId: string | undefined | null, level: number): DepartmentTreeNode[] {
        if (level > depth) return []
        return departments
            .filter((d) => d.tenantId === tenantId && (parentId ? d.parentDepartmentId === parentId : !d.parentDepartmentId))
            .map<DepartmentTreeNode>((d) => ({
                id: d.id,
                code: d.code,
                name: d.name,
                status: d.status,
                children: build(d.id, level + 1),
            }))
    }
    if (rootId) {
        const root = departments.find((d) => d.id === rootId && d.tenantId === tenantId)
        if (!root) return []
        return [
            {
                id: root.id,
                code: root.code,
                name: root.name,
                status: root.status,
                children: build(root.id, 2),
            },
        ]
    }
    return build(null, 1)
}