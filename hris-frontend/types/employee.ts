export type EmployeeStatus = "active" | "inactive"

export interface Employee {
    id: string
    nik: string
    name: string
    positionCode: string
    positionName: string
    department: string
    email?: string
    phone?: string
    joinDate?: string // ISO date string
    status?: EmployeeStatus
}