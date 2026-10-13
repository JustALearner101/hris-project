"use client";

import { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { EmployeeLeaveView } from "@/features/leave/components/employee-leave-view";
import { AdminLeaveView } from "@/features/leave/components/admin-leave-view";

export default function LeavePage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole") || "admin";
    setRole(storedRole);
  }, []);

  const title = role === "user" ? "My Leave Request Center" : "Leave & Absence Management";
  const subtitle = role === "user"
    ? "Submit leave request forms, upload medical certificates, and trace historical balances."
    : "Monitor company-wide absenteeism, manage pending approvals queue, and audit ledger history.";

  return (
    <main className="mx-auto max-w-[1200px] p-4 md:p-6">
      <section aria-label="Leave Management Overview" className="space-y-4">
        <header className="space-y-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Overview</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Leave Requests</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-semibold tracking-tight text-pretty">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {subtitle}
          </p>
        </header>

        <Separator className="my-4" />

        {/* Client Component Island */}
        {role === "user" ? <EmployeeLeaveView /> : <AdminLeaveView />}
      </section>
    </main>
  );
}
