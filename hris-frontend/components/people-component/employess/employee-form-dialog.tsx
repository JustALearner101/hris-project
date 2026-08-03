"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Employee, EmployeeStatus } from "@/types/employee"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Partial<Employee> // when editing
  onSubmit: (payload: Omit<Employee, "id">) => Promise<void>
  title?: string
}

export function EmployeeFormDialog({ open, onOpenChange, initial, onSubmit, title = "Add Employee" }: Props) {
  const [submitting, setSubmitting] = React.useState(false)
  const [form, setForm] = React.useState<Omit<Employee, "id">>({
    nik: initial?.nik || "",
    name: initial?.name || "",
    positionCode: initial?.positionCode || "",
    positionName: initial?.positionName || "",
    department: initial?.department || "",
    email: initial?.email || "",
    phone: initial?.phone || "",
    joinDate: initial?.joinDate || new Date().toISOString().slice(0, 10),
    status: (initial?.status as EmployeeStatus) || "active",
  })

  React.useEffect(() => {
    setForm({
      nik: initial?.nik || "",
      name: initial?.name || "",
      positionCode: initial?.positionCode || "",
      positionName: initial?.positionName || "",
      department: initial?.department || "",
      email: initial?.email || "",
      phone: initial?.phone || "",
      joinDate: initial?.joinDate || new Date().toISOString().slice(0, 10),
      status: (initial?.status as EmployeeStatus) || "active",
    })
  }, [initial])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(form)
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  function set<K extends keyof Omit<Employee, "id">>(key: K, value: Omit<Employee, "id">[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle className="text-pretty">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nik">NIK</Label>
            <Input id="nik" value={form.nik} onChange={(e) => set("nik", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="positionCode">Position Code</Label>
            <Input
              id="positionCode"
              value={form.positionCode}
              onChange={(e) => set("positionCode", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="positionName">Position Name</Label>
            <Input
              id="positionName"
              value={form.positionName}
              onChange={(e) => set("positionName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="joinDate">Join Date</Label>
            <Input
              id="joinDate"
              type="date"
              value={form.joinDate || ""}
              onChange={(e) => set("joinDate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={form.status || "active"} onValueChange={(v) => set("status", v as EmployeeStatus)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="col-span-1 md:col-span-2 mt-2">
            <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}