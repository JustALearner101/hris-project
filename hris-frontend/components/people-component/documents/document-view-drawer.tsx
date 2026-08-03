"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"
import type { DocumentItem } from "@/types/document"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"


type Props = {
    open: boolean
    onOpenChange: (v: boolean) => void
    doc?: DocumentItem | null
}

export function DocumentViewDrawer({ open, onOpenChange, doc }: Props) {
    if (!doc) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="!max-w-[1600px] w-[90vw] max-h-[90vh] overflow-y-auto p-6">
                <DialogHeader>
                    <DialogTitle>{doc.name}</DialogTitle>
                    <DialogDescription>Document details and metadata</DialogDescription>
                </DialogHeader>

                {/* GRID WRAPPER */}
                <div className="grid md:grid-cols-2 gap-6">

                    {/* PREVIEW */}
                    <div className="rounded-md border bg-muted/30 p-4 flex flex-col">
                        <div className="mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Preview (static)</span>
                        </div>
                        <div className="flex-1 rounded-md bg-background shadow-inner min-h-[350px] aspect-video" />
                    </div>

                    {/* DETAILS */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            {[
                                ["Category", doc.category],
                                ["Assigned To", doc.employee?.name ?? "Company-wide"],
                                ["Version", `v${doc.version}`],
                                ["Uploaded", format(new Date(doc.uploadedAt), "PP")],
                                ["Expiry", doc.expiryDate ? format(new Date(doc.expiryDate), "PP") : "-"],
                            ].map(([label, value], i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{label}</span>
                                    <span className="font-medium">{value}</span>
                                </div>
                            ))}

                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Status</span>
                                <Badge
                                    variant={
                                        doc.status === "expired"
                                            ? "destructive"
                                            : doc.status === "expiring"
                                                ? "secondary"
                                                : "default"
                                    }
                                >
                                    {doc.status === "expiring" ? "Expiring soon" : doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                </Badge>
                            </div>
                        </div>

                        <Separator />

                        <div className="flex gap-2">
                            <Button variant="outline" className="flex items-center gap-2">
                                <Download className="h-4 w-4" /> Download
                            </Button>
                            <Button variant="ghost">Replace Version</Button>
                            <Button variant="ghost" className="ml-auto">Audit Trail</Button>
                        </div>

                        <Separator />

                        <div>
                            <SheetHeader>
                                <SheetTitle>Document History</SheetTitle>
                                <SheetDescription>View audit trail of changes to this document</SheetDescription>
                            </SheetHeader>
                            <Sheet>
                                <SheetContent>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Uploaded</span>
                                        <span className="text-sm font-medium">2024-10-02</span>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}