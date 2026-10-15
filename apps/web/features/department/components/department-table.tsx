"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import type { Department } from "../types/department";
import { useDepartments } from "../api/use-department";
import { DepartmentFormDialog } from "./department-form-dialog";
import { DepartmentViewDrawer } from "./department-view-drawer";

export function DepartmentTable() {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const { toast } = useToast();

  const { data, total, isLoading, mutate } = useDepartments({ q, status, page, pageSize });

  const [drawerId, setDrawerId] = React.useState<string | undefined>(undefined);
  const [editDept, setEditDept] = React.useState<Department | undefined>(undefined);

  async function archive(id: string) {
    const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Department archived" });
      mutate();
    } else {
      toast({ title: "Failed to archive" });
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>Department List</CardTitle>
          <p className="text-sm text-muted-foreground">Manage company departments and hierarchy.</p>
        </div>
        <DepartmentFormDialog onSaved={() => mutate()} trigger={<Button>Add Department</Button>} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex items-center gap-2 w-full md:max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by code or name..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={status} onValueChange={(v) => setStatus(v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-[140px]">Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-[220px]">Parent</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((d) => (
                <TableRow key={d.id} className="align-top">
                  <TableCell className="font-medium">{d.code}</TableCell>
                  <TableCell>
                    <button className="text-left hover:underline font-medium" onClick={() => setDrawerId(d.id)}>
                      {d.name}
                    </button>
                    <div className="text-xs text-muted-foreground">
                      Valid {d.validFrom} → {d.validTo}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {d.parentDepartmentId ? "Child department" : "Root"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={d.status === "ACTIVE" ? "default" : d.status === "INACTIVE" ? "secondary" : "outline"}
                    >
                      {d.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => setDrawerId(d.id)}>View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditDept(d)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => archive(d.id)}
                          >
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No departments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, total)} of {total}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * pageSize >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>

        {editDept ? (
          <DepartmentFormDialog
            department={editDept}
            onSaved={() => {
              setEditDept(undefined);
              mutate();
            }}
          />
        ) : null}
        <DepartmentViewDrawer id={drawerId} open={!!drawerId} onOpenChange={(o) => !o && setDrawerId(undefined)} />
      </CardContent>
    </Card>
  );
}
