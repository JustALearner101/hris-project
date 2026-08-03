"use client"

import * as React from "react"
import useSWR from "swr"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import type { Department, DepartmentStatus } from "@/types/department"

type EmployeeListResponse = { data: Array<{ id: string; name: string }> } | Array<{ id: string; name: string }>

type Props = {
    trigger?: React.ReactNode
    department?: Department
    onSaved?: (d: Department) => void
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function DepartmentFormDialog({ trigger, department, onSaved }: Props) {
    const isEdit = !!department
    const [open, setOpen] = React.useState(false)
    const { toast } = useToast()

    const { data: deptOptions } = useSWR<{ data: Department[] }>(open ? "/api/departments?mode=children" : null, fetcher)

    const { data: employeesResp } = useSWR<EmployeeListResponse>(open ? "/api/employees" : null, fetcher)
    const employees: Array<{ id: string; name: string }> = employeesResp && 'data' in employeesResp ? employeesResp.data : (employeesResp ?? [])

    const [form, setForm] = React.useState({
        name: department?.name || "",
        description: department?.description || "",
        parentDepartmentId: department?.parentDepartmentId || "none",
        headEmployeeId: department?.headEmployeeId || "unassigned",
        status: department?.status || "ACTIVE",
        validFrom: department?.validFrom || "",
        validTo: department?.validTo || "",
        version: department?.version || 1,
    })

    function onChange<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
        setForm((s) => ({ ...s, [key]: value }))
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        const payload = {
            ...form,
            parentDepartmentId: form.parentDepartmentId === "none" ? undefined : form.parentDepartmentId,
            headEmployeeId: form.headEmployeeId === "unassigned" ? undefined : form.headEmployeeId,
        }
        const res = await fetch(isEdit ? `/api/departments/${department!.id}` : "/api/departments", {
            method: isEdit ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(isEdit ? { ...payload, version: form.version } : { ...payload }),
        })
        if (!res.ok) {
            toast({ title: "Failed", description: "Could not save department." })
            return
        }
        const data = await res.json()
        toast({ title: isEdit ? "Department updated" : "Department created" })
        onSaved?.(isEdit ? data : data)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Department" : "Add Department"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={form.name}
                            onChange={(e) => onChange("name", e.target.value)}
                            required
                            maxLength={150}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={form.description}
                            onChange={(e) => onChange("description", e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Parent Department</Label>
                            <Select value={form.parentDepartmentId} onValueChange={(v) => onChange("parentDepartmentId", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {deptOptions?.data?.map((d: Department) => (
                                        <SelectItem key={d.id} value={d.id}>
                                            {d.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Head (Employee)</Label>
                            <Select value={form.headEmployeeId} onValueChange={(v) => onChange("headEmployeeId", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Unassigned" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {employees?.map((e) => (
                                        <SelectItem key={e.id} value={e.id}>
                                            {e.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={(v) => onChange("status", v as DepartmentStatus)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Valid From</Label>
                            <Input type="date" value={form.validFrom} onChange={(e) => onChange("validFrom", e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Valid To</Label>
                            <Input type="date" value={form.validTo} onChange={(e) => onChange("validTo", e.target.value)} />
                        </div>
                    </div>

                    <Separator />
                    <DialogFooter>
                        <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">{isEdit ? "Save Changes" : "Create Department"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}