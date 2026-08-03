"use client"

import * as React from "react"
import useSWR from "swr"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent } from "@/components/ui/card"
import { AttendanceTable } from "@/components/attendance-component/attendance/attendance-table"
import { AttendanceCharts } from "@/components/attendance-component/attendance/attendance-charts"
import { AttendanceFilters, type AttendanceFilterState } from "@/components/attendance-component/attendance/attendance-filters"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function buildQuery(filters: AttendanceFilterState) {
    const sp = new URLSearchParams()
    if (filters.range?.from) sp.set("start", filters.range.from.toISOString().slice(0, 10))
    if (filters.range?.to) sp.set("end", filters.range.to.toISOString().slice(0, 10))
    if (filters.department) sp.set("department", filters.department)
    if (filters.shift) sp.set("shift", filters.shift)
    if (filters.status) sp.set("status", filters.status)
    return sp.toString()
}

export default function AttendanceMonitoringPage() {
    // top-level filters feed charts; table manages its own pagination
    const [filters, setFilters] = React.useState<AttendanceFilterState>({ status: "all" })
    const query = buildQuery(filters)
    // Prefetch to keep charts feeling responsive (optional)
    useSWR(`/api/attendance/timesheets?${query}`, fetcher)

    return (
        <main className="flex flex-col gap-6">
            <div className="space-y-1">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="#">Attendance Management</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Attendance Monitoring</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-2xl font-semibold tracking-tight text-pretty">Attendance Monitoring</h1>
                <p className="text-muted-foreground">
                    Monitor real-time attendance, timesheets, and shifts. Export data and drill into details per employee.
                </p>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <AttendanceFilters
                        value={filters}
                        onChange={setFilters}
                        departments={["Engineering", "Human Resources", "Finance", "Operations"]}
                        shifts={["Shift A", "Shift B", "Shift C"]}
                    />
                    <div className="mt-4">
                        <AttendanceCharts query={query} />
                    </div>
                </CardContent>
            </Card>

            <AttendanceTable />
        </main>
    )
}