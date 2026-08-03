"use client"
import * as React from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AttendanceCharts({ query }: { query: string }) {
    const { data } = useSWR<{ data: { status: string; department: string }[]; meta: Record<string, unknown> }>(`/api/attendance/timesheets?${query}`, fetcher)
    const rows = React.useMemo(() => data?.data ?? [], [data?.data])

    const presentVsAbsent = React.useMemo(() => {
        let present = 0
        let absent = 0
        for (const r of rows) {
            if (r.status === "absent") absent++
            else present++
        }
        return [
            { name: "Present", value: present },
            { name: "Absent", value: absent },
        ]
    }, [rows])

    const topLate = React.useMemo(() => {
        const byDept = new Map<string, number>()
        for (const r of rows) {
            if (r.status === "late") byDept.set(r.department, (byDept.get(r.department) || 0) + 1)
        }
        return Array.from(byDept.entries())
            .map(([department, count]) => ({ department, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
    }, [rows])

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Attendance Today</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer
                        config={{
                            present: { label: "Present", color: "hsl(var(--chart-1))" },
                            absent: { label: "Absent", color: "hsl(var(--chart-2))" },
                        }}
                        className="h-64"
                    >
                        <BarChart data={presentVsAbsent}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="value" fill="var(--color-present)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Top 5 Late Departments</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer
                        config={{
                            late: { label: "Late", color: "hsl(var(--chart-3))" },
                        }}
                        className="h-64"
                    >
                        <BarChart data={topLate}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="department" />
                            <YAxis allowDecimals={false} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar dataKey="count" name="Late" fill="var(--color-late)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    )
}