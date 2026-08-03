import { type Process, defaultTasks, deriveStatus } from "@/types/onboarding"

let processes: Process[] = [
    {
        id: crypto.randomUUID(),
        type: "onboarding",
        employeeName: "Alya N.",
        positionName: "Software Engineer",
        department: "Engineering",
        startDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "in_progress",
        tasks: defaultTasks("onboarding"),
    },
    {
        id: crypto.randomUUID(),
        type: "offboarding",
        employeeName: "Bima P.",
        positionName: "HR Generalist",
        department: "Human Resources",
        endDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "in_progress",
        tasks: defaultTasks("offboarding"),
    },
]

// Simple helpers
export function listProcesses() {
    return processes
}

export function getProcess(id: string) {
    return processes.find((p) => p.id === id)
}

export function createProcess(input: Omit<Process, "id" | "createdAt" | "updatedAt" | "status">) {
    const now = new Date().toISOString()
    const tasks = input.tasks?.length ? input.tasks : defaultTasks(input.type)
    const record: Process = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        tasks,
        status: deriveStatus(tasks),
    }
    processes = [record, ...processes]
    return record
}

export function updateProcess(id: string, patch: Partial<Process>) {
    const idx = processes.findIndex((p) => p.id === id)
    if (idx === -1) return null
    const merged: Process = {
        ...processes[idx],
        ...patch,
        tasks: patch.tasks ?? processes[idx].tasks,
    }
    merged.status = deriveStatus(merged.tasks)
    merged.updatedAt = new Date().toISOString()
    processes[idx] = merged
    return merged
}

export function deleteProcess(id: string) {
    processes = processes.filter((p) => p.id !== id)
    return true
}