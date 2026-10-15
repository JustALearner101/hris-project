"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Search } from "lucide-react";
import type { ProcessType } from "../types/onboarding";
import { computeProgress } from "../types/onboarding";
import { useProcesses } from "../api/use-onboarding";
import { ProcessStartDialog } from "./process-start-dialog";
import { ProcessViewDrawer, statusBadge } from "./process-view-drawer";

async function deleteReq(url: string) {
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed");
  return res.json();
}

export function ProcessTable() {
  const { data, mutate } = useProcesses();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | ProcessType>("all");
  const [status, setStatus] = useState<"all" | "in_progress" | "completed" | "overdue">("all");
  const [drawerId, setDrawerId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return (data ?? [])
      .filter((p) => (type === "all" ? true : p.type === type))
      .filter((p) => (status === "all" ? true : p.status === status))
      .filter((p) =>
        !q ? true : [p.employeeName, p.department, p.positionName].some((v) => (v ?? "").toLowerCase().includes(q))
      );
  }, [data, query, type, status]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-pretty">Onboarding / Offboarding</CardTitle>
            <p className="text-sm text-muted-foreground">Manage employee onboarding and offboarding workflows and checklists.</p>
          </div>
          <div className="flex items-center gap-2">
            <ProcessStartDialog type="onboarding" />
            <ProcessStartDialog type="offboarding" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full sm:w-80 items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employee or department..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={type} onValueChange={(v: "all" | ProcessType) => setType(v)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="offboarding">Offboarding</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(v: "all" | "in_progress" | "completed" | "overdue") => setStatus(v)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border bg-card overflow-hidden">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="hidden sm:table-cell">Department</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="w-[200px]">Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[48px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const progress = computeProgress(p.tasks);
                  const dateStr = p.type === "onboarding" ? p.startDate : p.endDate;
                  return (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => setDrawerId(p.id)}>
                      <TableCell className="font-medium">
                        <div>{p.employeeName}</div>
                        {p.positionName && (
                          <div className="text-xs text-muted-foreground font-normal">{p.positionName}</div>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{p.department ?? "-"}</TableCell>
                      <TableCell className="hidden sm:table-cell capitalize">{p.type}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {dateStr ? new Date(dateStr).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          <Progress value={progress} />
                          <div className="text-xs text-muted-foreground">{progress}% completed</div>
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>{statusBadge(p.status)}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDrawerId(p.id)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={async () => {
                                await deleteReq(`/api/processes/${p.id}`);
                                mutate();
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                      No processes found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ProcessViewDrawer id={drawerId} open={Boolean(drawerId)} onOpenChange={(v) => !v && setDrawerId(null)} />
    </>
  );
}
