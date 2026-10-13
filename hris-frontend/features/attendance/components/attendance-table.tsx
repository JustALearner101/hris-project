"use client";

import * as React from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAttendance } from "../api/use-attendance";
import { AttendanceFilters, type AttendanceFilterState } from "./attendance-filters";
import { AttendanceCharts } from "./attendance-charts";

function buildQuery(filters: AttendanceFilterState, page: number, pageSize: number, sort: string) {
  const sp = new URLSearchParams();
  if (filters.range?.from) sp.set("start", filters.range.from.toISOString().slice(0, 10));
  if (filters.range?.to) sp.set("end", filters.range.to.toISOString().slice(0, 10));
  if (filters.department && filters.department !== "all") sp.set("department", filters.department);
  if (filters.shift && filters.shift !== "all") sp.set("shift", filters.shift);
  if (filters.status && filters.status !== "all") sp.set("status", filters.status);
  sp.set("page", String(page));
  sp.set("page_size", String(pageSize));
  if (sort) sp.set("sort", sort);
  return sp.toString();
}

export function AttendanceTable() {
  const { toast } = useToast();
  const [filters, setFilters] = React.useState<AttendanceFilterState>({ status: "all" });
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [sort] = React.useState("date:desc");
  const [auto] = React.useState(false);

  const query = buildQuery(filters, page, pageSize, sort);
  const { data: rows, meta, isLoading, mutate } = useAttendance(query);

  React.useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => mutate(), 20000);
    return () => clearInterval(id);
  }, [auto, mutate]);

  const departments = React.useMemo(() => Array.from(new Set(rows.map((r) => r.department))).sort(), [rows]);
  const shifts = React.useMemo(() => Array.from(new Set(rows.map((r) => r.shift))).sort(), [rows]);

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
    ];
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
    ]);
    const csv = [header, ...body].map((a) => a.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported CSV", description: "Your attendance export is ready." });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <AttendanceFilters
            value={filters}
            onChange={setFilters}
            departments={departments.length > 0 ? departments : ["Engineering", "Human Resources", "Finance", "Operations"]}
            shifts={shifts.length > 0 ? shifts : ["Shift A", "Shift B", "Shift C"]}
          />
          <div className="mt-4">
            <AttendanceCharts query={query} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Attendance Timesheets</CardTitle>
            <p className="text-sm text-muted-foreground">View detailed employee clock-in and clock-out logs.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => mutate()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6">
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.employeeName}</TableCell>
                      <TableCell>{r.department}</TableCell>
                      <TableCell>{r.shift}</TableCell>
                      <TableCell>{r.date}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.clockIn ? format(new Date(r.clockIn), "HH:mm:ss") : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.clockOut ? format(new Date(r.clockOut), "HH:mm:ss") : "-"}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold">{r.totalHours} hrs</span>
                        {r.overtimeHours > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">(+{r.overtimeHours} OT)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.status === "on-time" ? "default" : r.status === "late" ? "secondary" : "destructive"}>
                          {r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                {!isLoading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                      No attendance records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, meta.total)} of {meta.total}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * pageSize >= meta.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
