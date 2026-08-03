"use client"
import useSWR from "swr"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Department, DepartmentAuditLog } from "@/types/department"

type PathItem = Pick<Department, 'id' | 'name'>

type Props = { id?: string; open: boolean; onOpenChange: (v: boolean) => void }

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function DepartmentViewDrawer({ id, open, onOpenChange }: Props) {
    const { data } = useSWR(open && id ? `/api/departments/${id}` : null, fetcher)
    const d = data?.data
    const path = data?.path || []

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-xl">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        {d?.name}
                        {d?.status ? (
                            <Badge variant={d.status === "ACTIVE" ? "default" : d.status === "INACTIVE" ? "secondary" : "outline"}>
                                {d.status.toLowerCase()}
                            </Badge>
                        ) : null}
                    </SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-6">
                    <div className="text-sm text-muted-foreground">
                        Code: <span className="text-foreground">{d?.code}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Hierarchy:
                        <div className="mt-1 text-foreground">
                            {path.map((p: PathItem, i: number) => (
                                <span key={p.id}>
                  {p.name}
                                    {i < path.length - 1 ? " / " : ""}
                </span>
                            ))}
                        </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-muted-foreground">Head</div>
                            <div className="text-foreground">{d?.headEmployeeId ? d.headEmployeeId : "-"}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Location</div>
                            <div className="text-foreground">{d?.locationId || "-"}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Valid From</div>
                            <div className="text-foreground">{d?.validFrom}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Valid To</div>
                            <div className="text-foreground">{d?.validTo}</div>
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <div className="font-medium mb-2">Audit Trail</div>
                        <div className="space-y-3">
                            {d?.audit
                                ?.slice()
                                .reverse()
                                .map((a: DepartmentAuditLog) => (
                                    <div key={a.id} className="text-sm">
                                        <div className="text-foreground">
                                            {a.action} — {new Date(a.changedAt).toLocaleString()}
                                        </div>
                                        <div className="text-muted-foreground">by {a.changedBy}</div>
                                    </div>
                                )) || <div className="text-sm text-muted-foreground">No changes yet.</div>}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}