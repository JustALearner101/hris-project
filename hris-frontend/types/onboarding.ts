export type ProcessType = "onboarding" | "offboarding"
export type TaskStatus = "pending" | "in_progress" | "done" | "overdue"
export type ProcessStatus = "in_progress" | "completed" | "overdue"

export interface ChecklistTask {
    id: string
    department: "HR" | "IT" | "Finance" | "Manager"
    title: string
    status: TaskStatus
    pic?: string
    dueDate?: string // ISO
    note?: string
}

export interface Process {
    id: string
    type: ProcessType
    employeeId?: string
    employeeName: string
    positionName?: string
    department?: string
    startDate?: string // onboarding
    endDate?: string // offboarding
    createdAt: string
    updatedAt: string
    status: ProcessStatus
    tasks: ChecklistTask[]
}

export function computeProgress(tasks: ChecklistTask[]): number {
    if (!tasks?.length) return 0
    const done = tasks.filter((t) => t.status === "done").length
    return Math.round((done / tasks.length) * 100)
}

export function deriveStatus(tasks: ChecklistTask[]): ProcessStatus {
    const allDone = tasks.length > 0 && tasks.every((t) => t.status === "done")
    if (allDone) return "completed"
    const anyOverdue = tasks.some((t) => t.status === "overdue")
    return anyOverdue ? "overdue" : "in_progress"
}

export function defaultTasks(type: ProcessType): ChecklistTask[] {
    const base = (department: ChecklistTask["department"], title: string): ChecklistTask => ({
        id: crypto.randomUUID(),
        department,
        title,
        status: "pending",
    })

    if (type === "onboarding") {
        return [
            base("HR", "Kontrak kerja ditandatangani"),
            base("IT", "Buat akun email/SSO"),
            base("IT", "Siapkan laptop & akses tools"),
            base("Finance", "Aktifkan payroll"),
            base("Manager", "Jadwalkan induction/training"),
        ]
    }
    // offboarding
    return [
        base("IT", "Cabut akses sistem & SSO"),
        base("Finance", "Final payroll & benefit"),
        base("HR", "Exit interview"),
        base("HR", "Dokumen clearance"),
        base("Manager", "Serah terima pekerjaan"),
        base("IT", "Pengembalian asset (laptop/ID card)"),
    ]
}