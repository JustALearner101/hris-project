// This page uses your existing layout (sidebar/topbar). No new nav/topbar is created.
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ProcessTable } from "@/components/people-component/onboarding/process-table"
import {Separator} from "@/components/ui/separator";

export default function OnboardingOffboardingPage() {
    return (
        // <main className="flex flex-col gap-4">
        //     <div className="space-y-2">
        //         <Breadcrumb>
        //             <BreadcrumbList>
        //                 <BreadcrumbItem>
        //                     <BreadcrumbLink href="#">Employee Management</BreadcrumbLink>
        //                 </BreadcrumbItem>
        //                 <BreadcrumbSeparator />
        //                 <BreadcrumbItem>
        //                     <BreadcrumbPage>Onboarding / Offboarding</BreadcrumbPage>
        //                 </BreadcrumbItem>
        //             </BreadcrumbList>
        //         </Breadcrumb>
        //         <div>
        //             <h1 className="text-2xl font-semibold text-pretty">Onboarding / Offboarding</h1>
        //             <p className="text-sm text-muted-foreground">Track cross-department checklists for new hires and exits.</p>
        //         </div>
        //     </div>
        //
        //     <section>
        //         <ProcessTable />
        //     </section>
        // </main>

        <main className="mx-auto max-w-[1200px] p-4 md:p-6">
            <section aria-label="Onboarding / Offboarding" className="space-y-4">
                <header className="space-y-2">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">Onboarding / Offboarding</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Onboarding / Offboarding</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <h1 className="text-2xl font-semibold tracking-tight text-pretty">Onboarding / Offboarding</h1>
                    <p className="text-sm text-muted-foreground">Track cross-department checklists for new hires and exits.</p>
                </header>

                <Separator className="my-6" />

                {/* Table card */}
                <ProcessTable />
            </section>
        </main>

    )
}