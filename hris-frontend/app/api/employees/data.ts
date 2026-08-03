import type { Employee } from "@/types/employee"

let seeded = false
let employees: Employee[] = []

function seed() {
    if (seeded) return
    employees = [
        {
            id: crypto.randomUUID(),
            nik: "EMP-0001",
            name: "Alya N.",
            positionCode: "ENG2",
            positionName: "Software Engineer",
            department: "Engineering",
            email: "alya@example.com",
            phone: "+62 812-0000-0001",
            joinDate: "2023-05-14",
            status: "active",
        },
        {
            id: crypto.randomUUID(),
            nik: "EMP-0002",
            name: "Bima P.",
            positionCode: "HR1",
            positionName: "HR Generalist",
            department: "Human Resources",
            email: "bima@example.com",
            phone: "+62 812-0000-0002",
            joinDate: "2022-09-01",
            status: "active",
        },
        {
            id: crypto.randomUUID(),
            nik: "EMP-0003",
            name: "Citra K.",
            positionCode: "FIN2",
            positionName: "Accountant",
            department: "Finance",
            email: "citra@example.com",
            phone: "+62 812-0000-0003",
            joinDate: "2021-02-11",
            status: "inactive",
        },
    ]
    seeded = true
}

export function getAll(): Employee[] {
    seed()
    return employees
}

export function getById(id: string): Employee | undefined {
    seed()
    return employees.find((e) => e.id === id)
}

export function create(emp: Omit<Employee, "id">): Employee {
    seed()
    const item: Employee = { ...emp, id: crypto.randomUUID() }
    employees.unshift(item)
    return item
}

export function update(id: string, patch: Partial<Employee>): Employee | undefined {
    seed()
    const idx = employees.findIndex((e) => e.id === id)
    if (idx === -1) return undefined
    employees[idx] = { ...employees[idx], ...patch, id }
    return employees[idx]
}

export function remove(id: string): boolean {
    seed()
    const before = employees.length
    employees = employees.filter((e) => e.id !== id)
    return employees.length < before
}