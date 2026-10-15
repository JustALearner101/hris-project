import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { DepartmentTable } from "@/features/department/components/department-table";

export default function DepartmentPage() {
  return (
    <main className="mx-auto max-w-[1200px] p-4 md:p-6">
      <section aria-label="Master Department" className="space-y-4">
        <header className="space-y-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Organization</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Master Department</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-semibold tracking-tight text-pretty">
            Master Department
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage company departments, parent-child hierarchies, and department heads.
          </p>
        </header>

        <Separator className="my-4" />

        {/* Client Component Island */}
        <DepartmentTable />
      </section>
    </main>
  );
}
