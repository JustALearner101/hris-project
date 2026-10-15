import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { ShiftTable } from "@/features/shift/components/shift-table";

export default function ShiftPage() {
  return (
    <main className="mx-auto max-w-[1200px] p-4 md:p-6">
      <section aria-label="Shift Management" className="space-y-4">
        <header className="space-y-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Attendance Management</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Shift Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-semibold tracking-tight text-pretty">
            Shift Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure work shifts, start and end times, break durations, and grace periods.
          </p>
        </header>

        <Separator className="my-4" />

        {/* Client Component Island */}
        <ShiftTable />
      </section>
    </main>
  );
}
