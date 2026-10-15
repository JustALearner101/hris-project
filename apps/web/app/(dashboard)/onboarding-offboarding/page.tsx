import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { ProcessTable } from "@/features/onboarding/components/process-table";

export default function OnboardingOffboardingPage() {
  return (
    <main className="mx-auto max-w-[1200px] p-4 md:p-6">
      <section aria-label="Onboarding Offboarding Management" className="space-y-4">
        <header className="space-y-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Employee Management</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Onboarding / Offboarding</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-semibold tracking-tight text-pretty">
            Onboarding / Offboarding
          </h1>
          <p className="text-sm text-muted-foreground">
            Track and orchestrate employee joining and exit workflows, task checklists, and clearance statuses.
          </p>
        </header>

        <Separator className="my-4" />

        {/* Client Component Island */}
        <ProcessTable />
      </section>
    </main>
  );
}
