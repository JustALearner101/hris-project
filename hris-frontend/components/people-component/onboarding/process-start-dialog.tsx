"use client"

import { useState } from "react"
import useSWRMutation from "swr/mutation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, FilePlus2 } from "lucide-react"
import { defaultTasks, type Process, type ProcessType } from "@/types/onboarding"
import { useToast } from "@/hooks/use-toast"

async function createProcessRequest(url: string, { arg }: { arg: Partial<Process> }) {
    const res = await fetch(url, { method: "POST", body: JSON.stringify(arg) })
    if (!res.ok) throw new Error("Failed to create process")
    return res.json()
}

export function ProcessStartDialog({ type = "onboarding" as ProcessType }: { type?: ProcessType }) {
    const { toast } = useToast()
    const [open, setOpen] = useState(false)
    const [form, setForm] = useState({
        type,
        employeeName: "",
        department: "",
        startDate: "",
        endDate: "",
        template: "default",
    })

    const { trigger, isMutating } = useSWRMutation("/api/processes", createProcessRequest)

    const onSubmit = async () => {
        const payload: Partial<Process> = {
            type: form.type as ProcessType,
            employeeName: form.employeeName,
            department: form.department,
            startDate: form.type === "onboarding" ? form.startDate : undefined,
            endDate: form.type === "offboarding" ? form.endDate : undefined,
            tasks: defaultTasks(form.type as ProcessType),
            positionName: undefined,
        }
        await trigger(payload)
        toast({ title: "Saved", description: "Process created." })
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    {form.type === "onboarding" ? "Start Onboarding" : "Start Offboarding"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{form.type === "onboarding" ? "Start Onboarding" : "Start Offboarding"}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label>Process Type</Label>
                        <Select value={form.type} onValueChange={(v) => setForm((s) => ({ ...s, type: v as ProcessType }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="onboarding">Onboarding</SelectItem>
                                <SelectItem value="offboarding">Offboarding</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Employee</Label>
                        <Input
                            placeholder="Employee name"
                            value={form.employeeName}
                            onChange={(e) => setForm((s) => ({ ...s, employeeName: e.target.value }))}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Department</Label>
                        <Input
                            placeholder="Department"
                            value={form.department}
                            onChange={(e) => setForm((s) => ({ ...s, department: e.target.value }))}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>{form.type === "onboarding" ? "Start date" : "Termination date"}</Label>
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={form.type === "onboarding" ? form.startDate : form.endDate}
                                    onChange={(e) =>
                                        setForm((s) =>
                                            s.type === "onboarding" ? { ...s, startDate: e.target.value } : { ...s, endDate: e.target.value },
                                        )
                                    }
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Template Checklist</Label>
                            <Select value={form.template} onValueChange={(v) => setForm((s) => ({ ...s, template: v }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select template" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">Default</SelectItem>
                                    <SelectItem value="engineering">Engineering</SelectItem>
                                    <SelectItem value="corporate">Corporate</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={onSubmit} disabled={isMutating}>
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}