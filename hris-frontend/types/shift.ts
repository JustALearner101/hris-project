export type ShiftType = "FIXED" | "ROTATING" | "SPLIT"

export interface Shift {
    id: string
    tenantId: string
    entityId: string
    code: string
    name: string
    type: ShiftType
    startTime: string // "HH:mm"
    endTime: string // "HH:mm"
    breakDurationMin: number
    gracePeriodMin: number
    workingHours?: number
    validFrom?: string // "YYYY-MM-DD"
    validTo?: string // "YYYY-MM-DD"
    isDefault?: boolean
    active: boolean
    version: number
    createdAt: string
    updatedAt: string
    createdBy?: string
    updatedBy?: string
}

export interface ShiftListResponse {
    data: Shift[]
    total: number
    page: number
    pageSize: number
}

export interface ShiftFilters {
    search?: string
    type?: ShiftType | "ALL"
    active?: "all" | "true" | "false"
    page?: number
    pageSize?: number
}