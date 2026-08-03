import {
    Breadcrumb,
    BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { DocumentTable } from "@/components/people-component/documents/document-table"

export default function MasterDocumentPage() {
    return (
        // <main className="px-4 pb-8 pt-4 md:px-8">
        //     <div className="mb-6">
        //         <Breadcrumb>
        //             <BreadcrumbList>
        //                 <BreadcrumbItem>Employee Management</BreadcrumbItem>
        //                 <BreadcrumbSeparator />
        //                 <BreadcrumbItem>
        //                     <BreadcrumbPage>Master Document</BreadcrumbPage>
        //                 </BreadcrumbItem>
        //             </BreadcrumbList>
        //         </Breadcrumb>
        //     </div>
        //
        //     <div className="flex flex-col gap-2">
        //         <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">Master Document</h1>
        //         <p className="text-muted-foreground">
        //             Manage all employee and company documents: upload, preview, assign, and archive.
        //         </p>
        //     </div>
        //
        //     <Separator className="my-6" />
        //
        //     <section className="space-y-4">
        //         <Suspense fallback={<div className="text-sm text-muted-foreground">Loading documents…</div>}>
        //             <DocumentTable />
        //         </Suspense>
        //     </section>
        // </main>

        <main className="mx-auto max-w-[1200px] p-4 md:p-6">
            <section aria-label="Master Document" className="space-y-4">
                <header className="space-y-2">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">Document Management</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Master Document</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <h1 className="text-2xl font-semibold tracking-tight text-pretty">Master Document</h1>
                    <p className="text-sm text-muted-foreground">Manage all employee and company documents: upload, preview, assign, and archive.
                    </p>
                </header>

                <Separator className="my-6" />

                {/* Table card */}
                <DocumentTable />
            </section>
        </main>

    )
}