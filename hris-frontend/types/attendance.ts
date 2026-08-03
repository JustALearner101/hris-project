export type AttendanceStatus = "on-time" | "late" | "absent"

export type AttendanceEventType = "CLOCK_IN" | "CLOCK_OUT"

export interface AttendanceEvent {
    id: string
    tenantId: string
    entityId: string
    employeeId: string
    type: AttendanceEventType
    occurredAt: string // ISO
    source: "device" | "web" | "mobile"
    geo?: { lat: number; lng: number }
}

export interface TimesheetRow {
    id: string
    tenantId: string
    entityId: string
    employeeId: string
    employeeName: string
    department: string
    shift: string
    date: string // yyyy-MM-dd
    clockIn?: string // ISO
    clockOut?: string // ISO
    totalHours: number
    overtimeHours: number
    status: AttendanceStatus
    absenceReason?: string
}

export interface PageMeta {
    page: number
    pageSize: number
    total: number
}

export interface PagedResponse<T> {
    data: T[]
    meta: PageMeta
}

export type TimesheetFilters = {
    start?: string // ISO date
    end?: string // ISO date
    date?: string // yyyy-MM-dd
    department?: string
    shift?: string
    status?: AttendanceStatus | "all"
    page?: number
    pageSize?: number
    sort?: string // e.g. "clockIn:desc"
}