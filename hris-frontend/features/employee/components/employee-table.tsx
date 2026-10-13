"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Users, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEmployees } from "../api/use-employees";
import { EmployeeDto, EmployeeFormValues } from "../types/employee";
import { EmployeeFormDialog } from "./employee-form-dialog";
import { EmployeeViewDialog } from "./employee-view-dialog";
import { DataTableSearch } from "@/components/ui/data-table-search";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";

export function EmployeeTable() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  const {
    employees,
    total,
    isLoading,
    mutate,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  } = useEmployees(offset, pageSize, search);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Dialog State
  const [openCreate, setOpenCreate] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<EmployeeDto | null>(null);
  const [openView, setOpenView] = React.useState(false);
  const [openDelete, setOpenDelete] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);

  const handleCreate = async (values: EmployeeFormValues) => {
    await createEmployee(values);
  };

  const handleEdit = async (values: EmployeeFormValues) => {
    if (selectedEmployee) {
      await updateEmployee(selectedEmployee.id, values);
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteEmployee(deleteId);
      setOpenDelete(false);
      setDeleteId(null);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-balance">Employee Directory</CardTitle>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pt-2">
          <div className="flex items-center gap-2">
            <DataTableSearch
              placeholder="Search by name, email, department..."
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              debounceMs={300}
              className="w-[260px] md:w-[360px]"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => mutate()}
              title="Refresh Data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setOpenCreate(true)}>Add Employee</Button>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="rounded-lg border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[60px]">ID</TableHead>
                <TableHead className="min-w-[180px]">Name</TableHead>
                <TableHead className="min-w-[200px]">Email</TableHead>
                <TableHead className="hidden md:table-cell">Position</TableHead>
                <TableHead className="hidden sm:table-cell">Department</TableHead>
                <TableHead className="w-[90px] text-center">Status</TableHead>
                <TableHead className="text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <DataTableSkeleton columnCount={7} rowCount={5} />
              ) : employees.length > 0 ? (
                employees.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-xs">#{emp.id}</TableCell>
                    <TableCell className="font-medium">
                      <button
                        type="button"
                        className="hover:underline hover:text-primary transition-colors text-left"
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setOpenView(true);
                        }}
                      >
                        {emp.firstName} {emp.lastName}
                      </button>
                    </TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{emp.position}</TableCell>
                    <TableCell className="hidden sm:table-cell">{emp.department}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={emp.status === 1 ? "default" : "secondary"}>
                        {emp.status === 1 ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setOpenView(true);
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setOpenEdit(true);
                            }}
                          >
                            Edit Employee
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setDeleteId(emp.id);
                              setOpenDelete(true);
                            }}
                          >
                            Delete Employee
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-14">
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                      <Users className="h-8 w-8 text-muted-foreground" />
                      <div className="text-sm font-medium">No employees found.</div>
                      <div className="text-xs text-muted-foreground">
                        {search ? "Try searching with a different keyword." : "Get started by adding your first employee."}
                      </div>
                      {!search && (
                        <Button size="sm" className="mt-2" onClick={() => setOpenCreate(true)}>
                          Add Employee
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={setPage}
          isLoading={isLoading}
          entityName="employees"
        />
      </CardContent>

      {/* Create Dialog */}
      <EmployeeFormDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSubmit={handleCreate}
        title="Add New Employee"
      />

      {/* Edit Dialog */}
      <EmployeeFormDialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        initialData={selectedEmployee}
        onSubmit={handleEdit}
        title="Edit Employee"
      />

      {/* View Dialog */}
      <EmployeeViewDialog
        open={openView}
        onOpenChange={setOpenView}
        employee={selectedEmployee}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this employee?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this employee record? This action cannot be undone.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:opacity-90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
