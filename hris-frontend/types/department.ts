export type DepartmentStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED"

export type DeptAuditAction = "CREATE" | "UPDATE" | "STATUS_CHANGE" | "ARCHIVE"

export interface DepartmentAuditLog {
    id: string
    action: DeptAuditAction
    changedBy: string
    changedAt: string // ISO
    oldValues?: Partial<Department>
    newValues?: Partial<Department>
}

export interface Department {
    id: string
    tenantId: string
    entityId?: string
    code: string
    name: string
    description?: string
    parentDepartmentId?: string
    headEmployeeId?: string
    locationId?: string
    status: DepartmentStatus
    validFrom: string // ISO date
    validTo: string // ISO date
    version: number
    createdAt: string // ISO
    updatedAt: string // ISO
    audit: DepartmentAuditLog[]
}

export interface DepartmentListResponse {
    data: Department[]
    total: number
    page: number
    pageSize: number
}

export interface DepartmentTreeNode {
    id: string
    code: string
    name: string
    status: DepartmentStatus
    children?: DepartmentTreeNode[]
}

export type DepartmentSortBy = "name" | "code" | "createdAt"
export type SortDir = "asc" | "desc"