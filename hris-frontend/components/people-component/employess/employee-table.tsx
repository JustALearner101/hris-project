"use client"

import * as React from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Search, Users } from "lucide-react"
import type { Employee } from "@/types/employee"
import { EmployeeFormDialog } from "./employee-form-dialog"
import { EmployeeViewDialog } from "./employee-view-dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function EmployeeTableCard() {
    const { data, isLoading, mutate } = useSWR<{ data: Employee[] }>("/api/employees", fetcher)
    const items = React.useMemo(() => data?.data ?? [], [data?.data])
    const [query, setQuery] = React.useState("")
    const [page, setPage] = React.useState(1)
    const pageSize = 10

    const filtered = React.useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return items
        return items.filter((e) =>
            [e.nik, e.name, e.positionCode, e.positionName, e.department, e.email, e.phone]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q)),
        )
    }, [items, query])

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

    React.useEffect(() => {
        setPage(1)
    }, [query])

    // Dialog state
    const [openCreate, setOpenCreate] = React.useState(false)
    const [openEdit, setOpenEdit] = React.useState(false)
    const [editData, setEditData] = React.useState<Partial<Employee> | undefined>(undefined)
    const [openView, setOpenView] = React.useState(false)
    const [viewData, setViewData] = React.useState<Employee | null>(null)
    const [openDelete, setOpenDelete] = React.useState(false)
    const [deleteId, setDeleteId] = React.useState<string | null>(null)

    async function createEmployee(payload: Omit<Employee, "id">) {
        await fetch("/api/employees", { method: "POST", body: JSON.stringify(payload) })
        await mutate()
    }

    async function updateEmployee(id: string, patch: Partial<Employee>) {
        await fetch(`/api/employees/${id}`, { method: "PUT", body: JSON.stringify(patch) })
        await mutate()
    }

    async function deleteEmployee(id: string) {
        await fetch(`/api/employees/${id}`, { method: "DELETE" })
        await mutate()
    }

    return (
        <Card className="shadow-sm">
            <CardHeader className="space-y-1">
                <CardTitle className="text-balance">Employee List</CardTitle>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search employees..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-[240px] pl-8 md:w-[360px]"
                            />
                        </div>
                    </div>
                    <Button onClick={() => setOpenCreate(true)}>Add Employee</Button>
                </div>
            </CardHeader>
            <CardContent className="pt-2">
                <div className="rounded-lg border overflow-auto max-h-[480px]">
                    <Table>
                        <TableHeader>
                            <TableRow className="sticky top-0 z-10 bg-background align-middle">
                                <TableHead className="w-[112px] whitespace-nowrap align-middle">NIK</TableHead>
                                <TableHead className="min-w-[200px] align-middle">Name</TableHead>
                                <TableHead className="hidden w-[132px] truncate align-middle md:table-cell">Position Code</TableHead>
                                <TableHead className="hidden w-[180px] truncate align-middle md:table-cell">Position Name</TableHead>
                                <TableHead className="w-[160px] truncate align-middle">Department</TableHead>
                                <TableHead className="hidden w-[110px] text-center align-middle md:table-cell">Status</TableHead>
                                <TableHead className="text-right pr-4 align-middle">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                        Loading employees...
                                    </TableCell>
                                </TableRow>
                            ) : paged.length ? (
                                paged.map((e) => (
                                    <TableRow key={e.id} className="align-middle hover:bg-muted/40">
                                        <TableCell className="font-medium whitespace-nowrap">{e.nik}</TableCell>
                                        <TableCell>
                                            <button
                                                type="button"
                                                className="text hover:underline hover:text-primary transition-colors"
                                                onClick={() => {
                                                    setViewData(e)
                                                    setOpenView(true)
                                                }}
                                            >
                                                {e.name}
                                            </button>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell truncate">{e.positionCode}</TableCell>
                                        <TableCell className="hidden md:table-cell truncate">{e.positionName}</TableCell>
                                        <TableCell className="truncate">{e.department}</TableCell>
                                        <TableCell className="hidden md:table-cell text-center">
                                            <Badge
                                                variant={e.status === "active" ? "default" : "destructive"}
                                                className="px-2 py-0.5 text-[11px] rounded-full"
                                            >
                                                {e.status === "active" ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-4">
                                            <RowActions
                                                onView={() => {
                                                    setViewData(e)
                                                    setOpenView(true)
                                                }}
                                                onEdit={() => {
                                                    setEditData(e)
                                                    setOpenEdit(true)
                                                }}
                                                onDelete={() => {
                                                    setDeleteId(e.id)
                                                    setOpenDelete(true)
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-14">
                                        <div className="flex flex-col items-center justify-center gap-2 text-center">
                                            <Users className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                                            <div className="text-sm text-muted-foreground">No employees found.</div>
                                            <Button size="sm" onClick={() => setOpenCreate(true)}>
                                                Add Employee
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                        Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            aria-disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            Previous
                        </Button>
                        <div className="px-2">
                            Page {page} / {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            aria-disabled={page >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </CardContent>

            {/* Create */}
            <EmployeeFormDialog
                open={openCreate}
                onOpenChange={setOpenCreate}
                onSubmit={createEmployee}
                title="Add Employee"
            />

            {/* Edit */}
            <EmployeeFormDialog
                open={openEdit}
                onOpenChange={setOpenEdit}
                initial={editData}
                onSubmit={async (payload) => {
                    if (!editData?.id) return
                    await updateEmployee(editData.id as string, payload)
                }}
                title="Edit Employee"
            />

            {/* View */}
            <EmployeeViewDialog open={openView} onOpenChange={setOpenView} employee={viewData} />

            {/* Delete confirm */}
            <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this employee?</AlertDialogTitle>
                    </AlertDialogHeader>
                    <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:opacity-90"
                            onClick={async () => {
                                if (deleteId) await deleteEmployee(deleteId)
                                setOpenDelete(false)
                                setDeleteId(null)
                                // optional: refresh elsewhere
                                globalMutate("/api/employees")
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}

function RowActions({ onView, onEdit, onDelete }: { onView: () => void; onEdit: () => void; onDelete: () => void }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Row actions">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>View</DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}