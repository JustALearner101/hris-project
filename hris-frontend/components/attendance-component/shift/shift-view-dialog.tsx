"use client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { Shift } from "@/types/shift"
import { type ReactNode, useState } from "react"

export function ShiftViewDialog({ trigger, item }: { trigger: ReactNode; item: Shift }) {
    const [open, setOpen] = useState(false)
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle>Shift Detail — {item.code}</DialogTitle>
                    <DialogDescription>{item.name}</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <span className="font-medium">Type:</span> {item.type}
                    </div>
                    <div>
                        <span className="font-medium">Active:</span>{" "}
                        <Badge variant={item.active ? "default" : "secondary"}>{item.active ? "Active" : "Inactive"}</Badge>
                    </div>
                    <div>
                        <span className="font-medium">Start:</span> {item.startTime}
                    </div>
                    <div>
                        <span className="font-medium">End:</span> {item.endTime}
                    </div>
                    <div>
                        <span className="font-medium">Break:</span> {item.breakDurationMin} min
                    </div>
                    <div>
                        <span className="font-medium">Grace:</span> {item.gracePeriodMin} min
                    </div>
                    <div>
                        <span className="font-medium">Valid From:</span> {item.validFrom || "-"}
                    </div>
                    <div>
                        <span className="font-medium">Valid To:</span> {item.validTo || "-"}
                    </div>
                    <div>
                        <span className="font-medium">Default:</span> {item.isDefault ? "Yes" : "No"}
                    </div>
                    <div>
                        <span className="font-medium">Version:</span> {item.version}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}