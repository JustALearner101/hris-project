"use client"

import { useMemo } from "react"
import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { computeProgress, type Process, type ChecklistTask } from "@/types/onboarding"
import { useToast } from "@/hooks/use-toast"

const fetcher = (u: string) => fetch(u).then((r) => r.json())
async function patcher(url: string, { arg }: { arg: Partial<Process> }) {
    const res = await fetch(url, { method: "PATCH", body: JSON.stringify(arg) })
    if (!res.ok) throw new Error("Failed to update")
    return res.json()
}

export function statusBadge(status: Process["status"]) {
    const map: Record<Process["status"], string> = {
        in_progress: "bg-blue-100 text-blue-700",
        completed: "bg-green-100 text-green-700",
        overdue: "bg-red-100 text-red-700",
    }
    return (
        <Badge className={map[status]} variant="secondary">
            {status.replace("_", " ")}
        </Badge>
    )
}

export function ProcessViewDrawer({
                                      id,
                                      open,
                                      onOpenChange,
                                  }: { id: string | null; open: boolean; onOpenChange: (v: boolean) => void }) {
    const { data } = useSWR(id ? `/api/processes/${id}` : null, fetcher)
    const { toast } = useToast()
    const { trigger, isMutating } = useSWRMutation(id ? `/api/processes/${id}` : "", patcher)

    const progress = useMemo(() => computeProgress(data?.tasks ?? []), [data])

    const toggleTask = async (task: ChecklistTask, checked: boolean) => {
        if (!data) return
        const next = data.tasks.map((t: ChecklistTask) =>
            t.id === task.id ? { ...t, status: checked ? "done" : "pending" } : t,
        )
        await trigger({ tasks: next })
        toast({ title: "Updated", description: "Task status updated." })
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl">
                <SheetHeader>
                    <SheetTitle>Process Detail</SheetTitle>
                </SheetHeader>

                {data && (
                    <div className="mt-4 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-sm text-muted-foreground">
                                    {data.type === "onboarding" ? "Onboarding" : "Offboarding"}
                                </div>
                                <div className="text-lg font-medium">{data.employeeName}</div>
                                <div className="text-sm text-muted-foreground">
                                    {data.positionName ?? "-"} • {data.department ?? "-"}
                                </div>
                            </div>
                            <div>{statusBadge(data.status)}</div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">Overall Progress</div>
                                <div className="text-sm font-medium">{progress}%</div>
                            </div>
                            <Progress value={progress} />
                        </div>

                        <Separator />

                        <Accordion type="multiple" className="w-full">
                            {["HR", "IT", "Finance", "Manager"].map((dept) => (
                                <AccordionItem key={dept} value={dept}>
                                    <AccordionTrigger>{dept}</AccordionTrigger>
                                    <AccordionContent className="space-y-3">
                                        {data.tasks
                                            .filter((t: ChecklistTask) => t.department === dept)
                                            .map((task: ChecklistTask) => (
                                                <div key={task.id} className="flex items-center gap-3">
                                                    <Checkbox
                                                        checked={task.status === "done"}
                                                        onCheckedChange={(v) => toggleTask(task, Boolean(v))}
                                                        disabled={isMutating}
                                                    />
                                                    <Label className="text-sm">{task.title}</Label>
                                                    {task.status === "overdue" && (
                                                        <Badge variant="destructive" className="ml-auto">
                                                            Overdue
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        {data.tasks.filter((t: ChecklistTask) => t.department === dept).length === 0 && (
                                            <div className="text-sm text-muted-foreground">No tasks for {dept}</div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>

                        <div className="flex justify-end">
                            <Button
                                size="sm"
                                onClick={async () => {
                                    await trigger({ status: "completed" })
                                    toast({ title: "Completed", description: "Process marked as completed." })
                                }}
                            >
                                Mark Completed
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}