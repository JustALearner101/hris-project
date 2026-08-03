"use client"

import { useState } from "react"
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { CalendarIcon, Upload } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import type { DocumentCategory } from "@/types/document"

type Props = {
    onSubmitted?: (payload: {
        name: string
        category: DocumentCategory
        employeeName?: string
        expiryDate?: Date
        requireESign: boolean
        file?: File | null
    }) => void
}

export function DocumentUploadDialog({ onSubmitted }: Props) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [category, setCategory] = useState<DocumentCategory>("Contract")
    const [employeeName, setEmployeeName] = useState("")
    const [expiry, setExpiry] = useState<Date | undefined>(undefined)
    const [file, setFile] = useState<File | null>(null)
    const [requireESign, setRequireESign] = useState(false)
    const { toast } = useToast()

    function submit() {
        onSubmitted?.({ name, category, employeeName: employeeName || undefined, expiryDate: expiry, requireESign, file })
        toast({ title: "Document queued", description: "Your document has been added to the list (demo)." })
        setOpen(false)
        // reset minimal fields
        setName("")
        setEmployeeName("")
        setFile(null)
        setExpiry(undefined)
        setRequireESign(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogDescription>Fill metadata and attach a file. This is a design-only demo.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="doc-name">Document Name</Label>
                        <Input
                            id="doc-name"
                            placeholder="e.g., Employment Contract - John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Category</Label>
                            <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ID">ID</SelectItem>
                                    <SelectItem value="Contract">Contract</SelectItem>
                                    <SelectItem value="Certificate">Certificate</SelectItem>
                                    <SelectItem value="Policy">Policy</SelectItem>
                                    <SelectItem value="Template">Template</SelectItem>
                                    <SelectItem value="Agreement">Agreement</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="employee">Assign To (optional)</Label>
                            <Input
                                id="employee"
                                placeholder="Employee name or leave empty for company-wide"
                                value={employeeName}
                                onChange={(e) => setEmployeeName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Expiry Date (optional)</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn("w-full justify-start text-left font-normal", !expiry && "text-muted-foreground")}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {expiry ? format(expiry, "PPP") : "Pick a date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={expiry} onSelect={setExpiry} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="grid gap-2">
                            <Label>Require e-sign?</Label>
                            <div className="flex items-center gap-2">
                                <input
                                    id="esign"
                                    type="checkbox"
                                    checked={requireESign}
                                    onChange={(e) => setRequireESign(e.target.checked)}
                                    className="h-4 w-4 rounded border"
                                />
                                <Label htmlFor="esign" className="font-normal text-sm text-muted-foreground">
                                    Ask signer to sign digitally
                                </Label>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>File</Label>
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed p-6 text-center hover:bg-muted/50">
                            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                            <Upload className="mb-2 h-5 w-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                {file ? file.name : "Drag & drop or click to upload"}
              </span>
                        </label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={!name}>
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}