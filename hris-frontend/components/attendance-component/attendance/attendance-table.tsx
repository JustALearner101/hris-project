"use client"
import * as React from "react"
import useSWR from "swr"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, RefreshCw, Eye } from "lucide-react"
import { AttendanceFilters, type AttendanceFilterState } from "./attendance-filters"
import { useToast } from "@/hooks/use-toast"

type TimesheetRow = {
    id: string
    employeeName: string
    department: string
    shift: string
    date: string
    clockIn?: string
    clockOut?: string
    totalHours: number
    overtimeHours: number
    status: "on-time" | "late" | "absent"
    absenceReason?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function buildQuery(filters: AttendanceFilterState, page: number, pageSize: number, sort: string) {
    const sp = new URLSearchParams()
    if (filters.range?.from) sp.set("start", filters.range.from.toISOString().slice(0, 10))
    if (filters.range?.to) sp.set("end", filters.range.to.toISOString().slice(0, 10))
    if (filters.department) sp.set("department", filters.department)
    if (filters.shift) sp.set("shift", filters.shift)
    if (filters.status) sp.set("status", filters.status)
    sp.set("page", String(page))
    sp.set("page_size", String(pageSize))
    if (sort) sp.set("sort", sort)
    return sp.toString()
}

export function AttendanceTable() {
    const { toast } = useToast()
    const [filters, setFilters] = React.useState<AttendanceFilterState>({ status: "all" })
    const [page, setPage] = React.useState(1)
    const [pageSize] = React.useState(10)
    const [sort] = React.useState("date:desc")
    const [auto, setAuto] = React.useState(false)

    const query = buildQuery(filters, page, pageSize, sort)
    const { data, isLoading, mutate } = useSWR<{
        data: TimesheetRow[]
        meta: { page: number; pageSize: number; total: number }
    }>(`/api/attendance/timesheets?${query}`, fetcher)

    // auto refresh every 20s when enabled
    React.useEffect(() => {
        if (!auto) return
        const id = setInterval(() => mutate(), 20000)
        return () => clearInterval(id)
    }, [auto, mutate])

    const rows = React.useMemo(() => data?.data ?? [], [data?.data])
    const departments = React.useMemo(() => Array.from(new Set(rows.map((r) => r.department))).sort(), [rows])
    const shifts = React.useMemo(() => Array.from(new Set(rows.map((r) => r.shift))).sort(), [rows])

    function exportCsv() {
        const header = [
            "Employee Name",
            "Department",
            "Shift",
            "Date",
            "Clock In",
            "Clock Out",
            "Status",
            "Duration",
            "Overtime",
        ]
        const body = rows.map((r) => [
            r.employeeName,
            r.department,
            r.shift,
            r.date,
            r.clockIn ? new Date(r.clockIn).toLocaleTimeString() : "",
            r.clockOut ? new Date(r.clockOut).toLocaleTimeString() : "",
            r.status,
            r.totalHours,
            r.overtimeHours,
        ])
        const csv = [header, ...body].map((a) => a.join(",")).join("\n")
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `attendance_${Date.now()}.csv`
        link.click()
        URL.revokeObjectURL(url)
        toast({ title: "Exported CSV", description: "Your attendance export is ready." })
    }

    return (
        <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-pretty">Attendance Monitoring</CardTitle>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => mutate()} className="gap-2">
                        <RefreshCw className="size-4" /> Refresh
                    </Button>
                    <Button size="sm" onClick={exportCsv} className="gap-2">
                        <Download className="size-4" /> Export CSV
                    </Button>
                    <Button variant={auto ? "default" : "outline"} size="sm" onClick={() => setAuto((v) => !v)}>
                        {auto ? "Auto Refresh: On" : "Auto Refresh: Off"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <AttendanceFilters
                    value={filters}
                    onChange={(next) => {
                        setFilters(next)
                        setPage(1)
                    }}
                    departments={departments}
                    shifts={shifts}
                />
                <Separator />
                {/* Desktop Table */}
                <div className="hidden md:block">
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[180px]">Employee Name</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Shift</TableHead>
                                    <TableHead>Clock-In</TableHead>
                                    <TableHead>Clock-Out</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Duration</TableHead>
                                    <TableHead className="text-right">Overtime</TableHead>
                                    <TableHead className="w-[80px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading &&
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <TableRow key={`s-${i}`}>
                                            <TableCell colSpan={9}>
                                                <Skeleton className="h-6 w-full" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                {!isLoading && rows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                                            No data found for selected filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!isLoading &&
                                    rows.map((r) => (
                                        <TableRow key={r.id}>
                                            <TableCell className="font-medium">{r.employeeName}</TableCell>
                                            <TableCell>{r.department}</TableCell>
                                            <TableCell>{r.shift}</TableCell>
                                            <TableCell>{r.clockIn ? format(new Date(r.clockIn), "HH:mm") : "-"}</TableCell>
                                            <TableCell>{r.clockOut ? format(new Date(r.clockOut), "HH:mm") : "-"}</TableCell>
                                            <TableCell>
                                                {r.status === "on-time" && <Badge className="bg-emerald-500 text-white">On-time</Badge>}
                                                {r.status === "late" && <Badge className="bg-red-500 text-white">Late</Badge>}
                                                {r.status === "absent" && <Badge variant="secondary">Absent</Badge>}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">{r.totalHours.toFixed(1)}h</TableCell>
                                            <TableCell className="text-right tabular-nums">{r.overtimeHours.toFixed(1)}h</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="gap-1">
                                                    <Eye className="size-4" /> View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Mobile list */}
                <div className="grid gap-3 md:hidden">
                    {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={`m-s-${i}`} className="h-20 w-full" />)}
                    {!isLoading && rows.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground">No data found for selected filters.</p>
                    )}
                    {!isLoading &&
                        rows.map((r) => (
                            <div key={r.id} className="rounded-lg border p-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium">{r.employeeName}</p>
                                        <p className="text-muted-foreground text-xs">
                                            {r.department} • {r.shift}
                                        </p>
                                    </div>
                                    {r.status === "on-time" && <Badge className="bg-emerald-500 text-white">On-time</Badge>}
                                    {r.status === "late" && <Badge className="bg-red-500 text-white">Late</Badge>}
                                    {r.status === "absent" && <Badge variant="secondary">Absent</Badge>}
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                    <div>In: {r.clockIn ? format(new Date(r.clockIn), "HH:mm") : "-"}</div>
                                    <div>Out: {r.clockOut ? format(new Date(r.clockOut), "HH:mm") : "-"}</div>
                                    <div className="text-right">Dur: {r.totalHours.toFixed(1)}h</div>
                                    <div className="text-right">OT: {r.overtimeHours.toFixed(1)}h</div>
                                </div>
                            </div>
                        ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
                    <div>
                        Showing {(data?.meta.page || 1 - 1) * (data?.meta.pageSize || 10) + 1}-
                        {Math.min((data?.meta.page || 1) * (data?.meta.pageSize || 10), data?.meta.total || 0)} of{" "}
                        {data?.meta.total || 0}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={(data?.meta.page || 1) <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={(data?.meta.page || 1) * (data?.meta.pageSize || 10) >= (data?.meta.total || 0)}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}