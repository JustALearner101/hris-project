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
import { AdminDashboard } from "@/features/dashboard/components/admin-dashboard";
import { EmployeeDashboard } from "@/features/dashboard/components/employee-dashboard";

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole") || "admin";
    setRole(storedRole);
  }, []);

  const title = role === "user" ? "Employee Portal" : "Executive Dashboard";
  const subtitle = role === "user"
    ? "Welcome to your personal workspace. View your shifts, request log, and clock-in status."
    : "Overview of headcount metrics, attendance summary, payroll totals, and open requests.";

  return (
    <main className="mx-auto max-w-[1200px] p-4 md:p-6">
      <section aria-label="Dashboard Overview" className="space-y-4">
        <header className="space-y-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Overview</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
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
        {role === "user" ? <EmployeeDashboard /> : <AdminDashboard />}
      </section>
    </main>
  );
}
