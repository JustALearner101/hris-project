"use client";

import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock Data
const headcountData = [
  { month: "Apr", headcount: 1172, overtime: 420 },
  { month: "May", headcount: 1189, overtime: 380 },
  { month: "Jun", headcount: 1204, overtime: 512 },
  { month: "Jul", headcount: 1220, overtime: 488 },
  { month: "Aug", headcount: 1264, overtime: 545 },
  { month: "Sep", headcount: 1284, overtime: 571 },
];

const attendanceData = [
  { month: "Apr", Present: 95.0, Late: 3.2, Absent: 1.8 },
  { month: "May", Present: 96.1, Late: 2.4, Absent: 1.5 },
  { month: "Jun", Present: 94.2, Late: 3.8, Absent: 2.0 },
  { month: "Jul", Present: 95.8, Late: 2.7, Absent: 1.5 },
  { month: "Aug", Present: 96.4, Late: 2.5, Absent: 1.1 },
  { month: "Sep", Present: 96.6, Late: 2.1, Absent: 1.3 },
];

const departmentData = [
  { name: "Technology", value: 449, color: "var(--chart-1)" },
  { name: "Sales & Marketing", value: 321, color: "var(--chart-2)" },
  { name: "Finance", value: 192, color: "var(--chart-3)" },
  { name: "Operations", value: 192, color: "var(--chart-4)" },
  { name: "Human Resources", value: 130, color: "var(--chart-5)" },
];

export function DashboardCharts() {
  const [activeTab, setActiveTab] = useState("headcount");

  return (
    <Card className="col-span-1 lg:col-span-2 shadow-sm border-border bg-card">
      <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">Analytics Center</CardTitle>
          <CardDescription>Visual data reporting across core HR metrics</CardDescription>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-3 w-full sm:w-[320px]">
            <TabsTrigger value="headcount" className="text-xs">Headcount</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs">Attendance</TabsTrigger>
            <TabsTrigger value="departments" className="text-xs">Departments</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="pt-4">
        {activeTab === "headcount" && (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={headcountData} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHeadcount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorOvertime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} dy={10} />
                <YAxis tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} dx={-10} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                    borderRadius: "var(--radius)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="headcount"
                  stroke="var(--chart-1)"
                  fill="url(#colorHeadcount)"
                  strokeWidth={2.5}
                  name="Employees Count"
                />
                <Area
                  type="monotone"
                  dataKey="overtime"
                  stroke="var(--chart-3)"
                  fill="url(#colorOvertime)"
                  strokeWidth={2}
                  name="Overtime (hrs)"
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} dy={10} />
                <YAxis tickLine={false} axisLine={false} stroke="var(--muted-foreground)" fontSize={12} unit="%" dx={-10} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                    borderRadius: "var(--radius)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  }}
                  formatter={(value) => [`${value}%`]}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="Present" stackId="a" fill="var(--chart-2)" radius={[0, 0, 0, 0]} name="On Time" />
                <Bar dataKey="Late" stackId="a" fill="var(--chart-3)" radius={[0, 0, 0, 0]} name="Late" />
                <Bar dataKey="Absent" stackId="a" fill="var(--chart-5)" radius={[4, 4, 0, 0]} name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === "departments" && (
          <div className="h-[280px] w-full flex flex-col md:flex-row items-center justify-around">
            <div className="h-[240px] w-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                      borderRadius: "var(--radius)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mt-4 md:mt-0">
              {departmentData.map((dept, index) => (
                <div key={dept.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }} />
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">{dept.name}</span>
                    <span className="font-semibold text-sm">{dept.value} staff</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
