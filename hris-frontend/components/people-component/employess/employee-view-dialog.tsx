"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { Employee } from "@/types/employee"

export function EmployeeViewDialog({
                                       open,
                                       onOpenChange,
                                       employee,
                                   }: {
    open: boolean
    onOpenChange: (v: boolean) => void
    employee?: Employee | null
}) {
    if (!employee) return null
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle className="text-pretty">Employee Details</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                    <Field label="NIK" value={employee.nik} />
                    <Field label="Name" value={employee.name} />
                    <Field label="Position Code" value={employee.positionCode} />
                    <Field label="Position Name" value={employee.positionName} />
                    <Field label="Department" value={employee.department} />
                    <Field label="Email" value={employee.email || "-"} />
                    <Field label="Phone" value={employee.phone || "-"} />
                    <Field label="Join Date" value={employee.joinDate || "-"} />
                    <div className="col-span-1 md:col-span-2">
                        <div className="mb-1 font-medium">Status</div>
                        <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                            {employee.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border p-3 bg-card">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 font-medium">{value}</div>
        </div>
    )
}