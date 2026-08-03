"use client"
import useSWR from "swr"
import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import type { ShiftListResponse, ShiftType } from "@/types/shift"
import { ShiftFormDialog } from "./shift-form-dialog"
import { ShiftViewDialog } from "./shift-view-dialog"
import { MoreHorizontal } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function ShiftTable() {
    const [search, setSearch] = useState("")
    const [type, setType] = useState<ShiftType | "ALL">("ALL")
    const [status, setStatus] = useState<"all" | "true" | "false">("all")
    const [page, setPage] = useState(1)
    const pageSize = 10

    const query = useMemo(() => {
        const searchParams = new URLSearchParams()
        if (search) searchParams.set("search", search)
        if (type) searchParams.set("type", String(type))
        if (status) searchParams.set("active", status)
        searchParams.set("page", String(page))
        searchParams.set("pageSize", String(pageSize))
        return `/api/shifts?${searchParams.toString()}`
    }, [search, type, status, page])

    const { data, isLoading, mutate } = useSWR<ShiftListResponse>(query, fetcher)

    function onRefresh() {
        mutate()
        toast({ title: "Refreshed" })
    }

    const total = data?.total ?? 0
    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    async function deactivate(id: string) {
        const res = await fetch(`/api/shifts/${id}`, { method: "DELETE" })
        if (res.ok) {
            toast({ title: "Shift deactivated" })
            mutate()
        } else {
            toast({ title: "Failed to deactivate" })
        }
    }

    return (
        <Card>
            <CardHeader className="flex gap-4">
                <div className="flex-1">
                    <CardTitle>Shift List</CardTitle>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Input
                        placeholder="Search by code or name..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                    />
                    <Select
                        value={type}
                        onValueChange={(v) => {
                            setType(v as ShiftType | "ALL")
                            setPage(1)
                        }}
                    >
                        <SelectTrigger className="min-w-[140px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Types</SelectItem>
                            <SelectItem value="FIXED">FIXED</SelectItem>
                            <SelectItem value="ROTATING">ROTATING</SelectItem>
                            <SelectItem value="SPLIT">SPLIT</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={status}
                        onValueChange={(v) => {
                            setStatus(v as "all" | "true" | "false")
                            setPage(1)
                        }}
                    >
                        <SelectTrigger className="min-w-[140px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="true">Active</SelectItem>
                            <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={onRefresh}>
                        Refresh
                    </Button>
                    <ShiftFormDialog mode="create" onSaved={() => mutate()} trigger={<Button>Add Shift</Button>} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Start</TableHead>
                                <TableHead>End</TableHead>
                                <TableHead>Break</TableHead>
                                <TableHead>Grace</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead className="w-12 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                        Loading shifts...
                                    </TableCell>
                                </TableRow>
                            )}
                            {!isLoading && (data?.data?.length ?? 0) === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8">
                                        No shifts defined yet
                                    </TableCell>
                                </TableRow>
                            )}
                            {data?.data?.map((s) => (
                                <TableRow key={s.id}>
                                    <TableCell className="font-medium">{s.code}</TableCell>
                                    <TableCell>{s.name}</TableCell>
                                    <TableCell>{s.type}</TableCell>
                                    <TableCell>{s.startTime}</TableCell>
                                    <TableCell>{s.endTime}</TableCell>
                                    <TableCell>{s.breakDurationMin} min</TableCell>
                                    <TableCell>{s.gracePeriodMin} min</TableCell>
                                    <TableCell>
                                        <Badge variant={s.active ? "default" : "secondary"}>{s.active ? "Active" : "Inactive"}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="icon" variant="ghost" aria-label="More">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <ShiftViewDialog item={s} trigger={<DropdownMenuItem>View</DropdownMenuItem>} />
                                                <ShiftFormDialog
                                                    mode="edit"
                                                    initial={s}
                                                    onSaved={() => mutate()}
                                                    trigger={<DropdownMenuItem>Edit</DropdownMenuItem>}
                                                />
                                                {!s.active ? null : (
                                                    <DropdownMenuItem onClick={() => deactivate(s.id)}>Deactivate</DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
                    <div>
                        Showing {data?.data?.length ?? 0} of {total} items
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                            Previous
                        </Button>
                        <div className="px-2">
                            Page {page} / {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}