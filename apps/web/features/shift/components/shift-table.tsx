"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { MoreHorizontal, Plus } from "lucide-react";
import type { ShiftType } from "../types/shift";
import { useShifts } from "../api/use-shift";
import { ShiftFormDialog } from "./shift-form-dialog";
import { ShiftViewDialog } from "./shift-view-dialog";

export function ShiftTable() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<ShiftType | "ALL">("ALL");
  const [status, setStatus] = useState<"all" | "true" | "false">("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const query = useMemo(() => {
    const searchParams = new URLSearchParams();
    if (search) searchParams.set("search", search);
    if (type && type !== "ALL") searchParams.set("type", String(type));
    if (status && status !== "all") searchParams.set("active", status);
    searchParams.set("page", String(page));
    searchParams.set("pageSize", String(pageSize));
    return `/api/shifts?${searchParams.toString()}`;
  }, [search, type, status, page]);

  const { data, total, isLoading, mutate } = useShifts(query);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function deactivate(id: string) {
    const res = await fetch(`/api/shifts/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Shift deactivated" });
      mutate();
    } else {
      toast({ title: "Failed to deactivate" });
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>Shift List</CardTitle>
          <p className="text-sm text-muted-foreground">Manage work shift schedules, working hours, and grace periods.</p>
        </div>
        <ShiftFormDialog mode="create" trigger={<Button><Plus className="mr-2 h-4 w-4" /> Add Shift</Button>} onSaved={() => mutate()} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <Input
            placeholder="Search by code or name..."
            className="w-full sm:max-w-xs"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <div className="flex gap-2">
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v as ShiftType | "ALL");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
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
                setStatus(v as "all" | "true" | "false");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-[120px]">Code</TableHead>
                <TableHead>Shift Name</TableHead>
                <TableHead className="w-[120px]">Type</TableHead>
                <TableHead className="w-[140px]">Working Hours</TableHead>
                <TableHead className="w-[100px]">Grace (m)</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.code}</TableCell>
                  <TableCell>
                    <span className="font-medium">{s.name}</span>
                    {s.isDefault && <Badge variant="outline" className="ml-2 text-xs">Default</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{s.type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.startTime} - {s.endTime}
                  </TableCell>
                  <TableCell className="text-sm">{s.gracePeriodMin}m</TableCell>
                  <TableCell>
                    <Badge variant={s.active ? "default" : "secondary"}>
                      {s.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <ShiftViewDialog trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}>View Details</DropdownMenuItem>} item={s} />
                        <ShiftFormDialog mode="edit" initial={s} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>} onSaved={() => mutate()} />
                        {s.active && (
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deactivate(s.id)}>
                            Deactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                    No shifts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
