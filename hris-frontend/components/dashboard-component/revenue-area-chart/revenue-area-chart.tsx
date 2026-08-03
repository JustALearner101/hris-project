"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
    { month: "Apr", headcount: 1172, overtime: 420 },
    { month: "May", headcount: 1189, overtime: 380 },
    { month: "Jun", headcount: 1204, overtime: 512 },
    { month: "Jul", headcount: 1220, overtime: 488 },
    { month: "Aug", headcount: 1264, overtime: 545 },
    { month: "Sep", headcount: 1284, overtime: 571 },
]

export function RevenueAreaChart() {
    // Use CSS variables from theme to keep consistent with the login palette
    const color1 = "var(--chart-1)" // primary line
    const color2 = "var(--chart-3)" // secondary line
    const grid = "var(--muted)"

    return (
        <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                    <defs>
                        <linearGradient id="fillA" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="5%" stopColor={color1} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={color1} stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="fillB" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="5%" stopColor={color2} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={color2} stopOpacity={0.04} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} stroke={grid} fontSize={12} />
                    <YAxis width={36} tickLine={false} axisLine={false} stroke={grid} fontSize={12} />
                    <Tooltip
                        contentStyle={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            color: "var(--foreground)",
                            borderRadius: "var(--radius)",
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="headcount"
                        stroke={color1}
                        fill="url(#fillA)"
                        strokeWidth={2}
                        name="Headcount"
                    />
                    <Area
                        type="monotone"
                        dataKey="overtime"
                        stroke={color2}
                        fill="url(#fillB)"
                        strokeWidth={2}
                        name="Overtime (hrs)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
