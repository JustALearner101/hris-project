"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmployeeDto } from "../types/employee";

interface EmployeeViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeDto | null;
}

export function EmployeeViewDialog({
  open,
  onOpenChange,
  employee,
}: EmployeeViewDialogProps) {
  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Employee Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-muted-foreground">ID:</span>
            <span>#{employee.id}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-muted-foreground">Full Name:</span>
            <span className="font-semibold">{employee.firstName} {employee.lastName}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-muted-foreground">Email:</span>
            <span>{employee.email}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-muted-foreground">Phone:</span>
            <span>{employee.phoneNumber || "-"}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-muted-foreground">Date of Birth:</span>
            <span>{employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString("id-ID", { dateStyle: "medium" }) : "-"}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-muted-foreground">Position:</span>
            <span>{employee.position}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium text-muted-foreground">Department:</span>
            <span>{employee.department}</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="font-medium text-muted-foreground">Status:</span>
            <Badge variant={employee.status === 1 ? "default" : "secondary"}>
              {employee.status === 1 ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
