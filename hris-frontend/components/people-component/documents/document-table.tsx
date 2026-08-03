"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
    MoreHorizontal,
    Search,
    Filter,
    Download,
    Eye,
    Trash2,
    Pencil,
    FileText,
    FileImage,
    File,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format, differenceInDays } from "date-fns"
import { DocumentUploadDialog } from "./document-upload-dialog"
import { DocumentViewDrawer } from "./document-view-drawer"
import type { DocumentItem, DocumentStatus, DocumentCategory } from "@/types/document"

const PAGE_SIZE = 8

const INITIAL_DATA: DocumentItem[] = [
    {
        id: "DOC-0001",
        name: "Employment Contract - Alya N.",
        category: "Contract",
        employee: { id: "EMP-0001", name: "Alya N." },
        uploadedAt: "2024-10-02",
        expiryDate: "2026-10-01",
        status: "active",
        version: 1,
        fileType: "pdf",
        sizeKB: 482,
    },
    {
        id: "DOC-0002",
        name: "Passport - Bima P.",
        category: "ID",
        employee: { id: "EMP-0002", name: "Bima P." },
        uploadedAt: "2023-05-13",
        expiryDate: "2025-11-12",
        status: "expiring",
        version: 2,
        fileType: "image",
        sizeKB: 1290,
    },
    {
        id: "DOC-0003",
        name: "HR Policy 2025",
        category: "Policy",
        employee: null,
        uploadedAt: "2025-01-05",
        expiryDate: undefined,
        status: "active",
        version: 5,
        fileType: "pdf",
        sizeKB: 920,
    },
    {
        id: "DOC-0004",
        name: "Medical Certificate - Citra K.",
        category: "Certificate",
        employee: { id: "EMP-0003", name: "Citra K." },
        uploadedAt: "2025-06-11",
        expiryDate: "2025-07-05",
        status: "expired",
        version: 1,
        fileType: "image",
        sizeKB: 320,
    },
    {
        id: "DOC-0005",
        name: "Offer Letter - Dewa G.",
        category: "Contract",
        employee: { id: "EMP-0005", name: "Dewa G." },
        uploadedAt: "2025-08-02",
        status: "active",
        version: 1,
        fileType: "pdf",
        sizeKB: 256,
    },
]

function FileIcon({ type }: { type: DocumentItem["fileType"] }) {
    if (type === "pdf") return <FileText className="h-4 w-4 text-muted-foreground" />
    if (type === "image") return <FileImage className="h-4 w-4 text-muted-foreground" />
    return <File className="h-4 w-4 text-muted-foreground" />
}

function StatusBadge({ status }: { status: DocumentStatus }) {
    if (status === "expired") return <Badge variant="destructive">Expired</Badge>
    if (status === "expiring") return <Badge variant="secondary">Expiring</Badge>
    if (status === "archived") return <Badge variant="outline">Archived</Badge>
    return <Badge>Active</Badge>
}

export function DocumentTable() {
    const [query, setQuery] = useState("")
    const [category, setCategory] = useState<DocumentCategory | "all">("all")
    const [status, setStatus] = useState<DocumentStatus | "all">("all")
    const [selected, setSelected] = useState<Record<string, boolean>>({})
    const [data, setData] = useState<DocumentItem[]>(INITIAL_DATA)
    const [page, setPage] = useState(1)
    const [viewDoc, setViewDoc] = useState<DocumentItem | null>(null)
    const [openView, setOpenView] = useState(false)
    const { toast } = useToast()

    const filtered = useMemo(() => {
        return data.filter((d) => {
            const matchesQuery =
                query.length === 0 ||
                d.name.toLowerCase().includes(query.toLowerCase()) ||
                d.employee?.name.toLowerCase().includes(query.toLowerCase()) ||
                d.id.toLowerCase().includes(query.toLowerCase())
            const matchesCategory = category === "all" || d.category === category
            const matchesStatus = status === "all" || d.status === status
            return matchesQuery && matchesCategory && matchesStatus
        })
    }, [data, query, category, status])

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    function toggleAll(v: boolean) {
        const next: Record<string, boolean> = {}
        pageData.forEach((d) => (next[d.id] = v))
        setSelected((prev) => ({ ...prev, ...next }))
    }
    function countSelected() {
        return Object.values(selected).filter(Boolean).length
    }

    function onUpload(payload: {
        name: string
        category: DocumentCategory
        employeeName?: string
        expiryDate?: Date
        requireESign: boolean
        file?: File | null
    }) {
        const now = new Date()
        const exp = payload.expiryDate
        let status: DocumentStatus = "active"
        if (exp) {
            const diff = differenceInDays(exp, now)
            status = diff < 0 ? "expired" : diff <= 30 ? "expiring" : "active"
        }
        const newDoc: DocumentItem = {
            id: `DOC-${String(data.length + 1).padStart(4, "0")}`,
            name: payload.name,
            category: payload.category,
            employee: payload.employeeName ? { id: "EMP-NEW", name: payload.employeeName } : null,
            uploadedAt: now.toISOString(),
            expiryDate: exp?.toISOString(),
            status,
            version: 1,
            fileType: "pdf",
            sizeKB: Math.round((payload.file?.size ?? 200_000) / 1024),
        }
        setData((d) => [newDoc, ...d])
    }

    return (
        <>
            <Card>
                <CardHeader className="space-y-1">
                    <CardTitle>Document List</CardTitle>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex w-full flex-1 items-center gap-2">
                            <div className="relative w-full max-w-md">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value)
                                        setPage(1)
                                    }}
                                    placeholder="Search by name, id, employee..."
                                    className="pl-9"
                                />
                            </div>

                            <Select
                                value={category}
                                onValueChange={(v) => {
                                    setCategory(v as DocumentCategory | "all")
                                    setPage(1)
                                }}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="ID">ID</SelectItem>
                                    <SelectItem value="Contract">Contract</SelectItem>
                                    <SelectItem value="Certificate">Certificate</SelectItem>
                                    <SelectItem value="Policy">Policy</SelectItem>
                                    <SelectItem value="Template">Template</SelectItem>
                                    <SelectItem value="Agreement">Agreement</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={status}
                                onValueChange={(v) => {
                                    setStatus(v as DocumentStatus | "all")
                                    setPage(1)
                                }}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="expiring">Expiring</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button variant="outline" className="hidden md:inline-flex bg-transparent">
                                <Filter className="mr-2 h-4 w-4" />
                                More Filters
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" disabled={countSelected() === 0}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Bulk Actions {countSelected() ? `(${countSelected()})` : ""}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => toast({ title: "Downloading...", description: "This is a design demo." })}
                                    >
                                        Download
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => toast({ title: "Assigned", description: "Bulk assign simulated." })}>
                                        Assign to...
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => toast({ title: "Deleted", description: "Removed from list (demo)." })}
                                    >
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DocumentUploadDialog onSubmitted={onUpload} />
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="overflow-x-auto">
                        <div className="min-w-[960px]">
                            <Table>
                                <TableHeader className="sticky top-0 z-10 bg-card">
                                    <TableRow>
                                        <TableHead className="w-10">
                                            <Checkbox
                                                checked={pageData.length > 0 && pageData.every((d) => selected[d.id])}
                                                onCheckedChange={(v) => toggleAll(Boolean(v))}
                                                aria-label="Select all"
                                            />
                                        </TableHead>
                                        <TableHead className="w-[34%]">Document</TableHead>
                                        <TableHead className="w-[12%]">Category</TableHead>
                                        <TableHead className="w-[18%]">Employee</TableHead>
                                        <TableHead className="w-[12%]">Uploaded</TableHead>
                                        <TableHead className="w-[12%]">Expiry</TableHead>
                                        <TableHead className="w-[12%]">Status</TableHead>
                                        <TableHead className="w-10 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pageData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                                                No documents found. Try adjusting filters or upload a new one.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        pageData.map((doc) => {
                                            return (
                                                <TableRow key={doc.id} className="hover:bg-muted/50">
                                                    <TableCell className="align-middle">
                                                        <Checkbox
                                                            checked={!!selected[doc.id]}
                                                            onCheckedChange={(v) => setSelected((s) => ({ ...s, [doc.id]: Boolean(v) }))}
                                                            aria-label={`Select ${doc.name}`}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="align-middle">
                                                        <div className="flex items-center gap-3">
                                                            <FileIcon type={doc.fileType} />
                                                            <div className="min-w-0">
                                                                <div
                                                                    className="cursor-pointer truncate font-medium hover:underline"
                                                                    onClick={() => {
                                                                        setViewDoc(doc)
                                                                        setOpenView(true)
                                                                    }}
                                                                >
                                                                    {doc.name}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {doc.id} • v{doc.version}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="align-middle">{doc.category}</TableCell>
                                                    <TableCell className="align-middle">
                                                        {doc.employee?.name ?? <span className="text-muted-foreground">Company-wide</span>}
                                                    </TableCell>
                                                    <TableCell className="align-middle">{format(new Date(doc.uploadedAt), "PP")}</TableCell>
                                                    <TableCell className="align-middle">
                                                        {doc.expiryDate ? format(new Date(doc.expiryDate), "PP") : "-"}
                                                    </TableCell>
                                                    <TableCell className="align-middle">
                                                        <StatusBadge status={doc.status} />
                                                    </TableCell>
                                                    <TableCell className="align-middle text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-40">
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setViewDoc(doc)
                                                                        setOpenView(true)
                                                                    }}
                                                                >
                                                                    <Eye className="mr-2 h-4 w-4" /> View
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => toast({ title: "Edit", description: "Open edit dialog (demo)" })}
                                                                >
                                                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => toast({ title: "Download", description: "Downloading (demo)" })}
                                                                >
                                                                    <Download className="mr-2 h-4 w-4" /> Download
                                                                </DropdownMenuItem>
                                                                <Separator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={() => setData((arr) => arr.filter((d) => d.id !== doc.id))}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                            </Button>
                            <div className="text-sm">
                                Page {page} / {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <DocumentViewDrawer open={openView} onOpenChange={setOpenView} doc={viewDoc} />
        </>
    )
}