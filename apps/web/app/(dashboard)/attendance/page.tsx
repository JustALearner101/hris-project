import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { AttendanceTable } from "@/features/attendance/components/attendance-table";

export default function AttendancePage() {
  return (
    <main className="mx-auto max-w-[1200px] p-4 md:p-6">
      <section aria-label="Attendance Monitoring" className="space-y-4">
        <header className="space-y-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Attendance Management</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Attendance Monitoring</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-semibold tracking-tight text-pretty">
            Attendance Monitoring
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor real-time attendance, timesheets, and shift logs across all company departments.
          </p>
        </header>

        <Separator className="my-4" />

        {/* Client Component Island */}
        <AttendanceTable />
      </section>
    </main>
  );
}
