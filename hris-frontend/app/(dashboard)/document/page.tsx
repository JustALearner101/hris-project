import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { DocumentTable } from "@/features/document/components/document-table";
export default function DocumentPage() {
    return (
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
                    <h1 className="text-2xl font-semibold tracking-tight text-pretty">
                        Master Document
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage all document records: create, view, edit, and delete.
                    </p>
                </header>

                <Separator className="my-4" />

                {/*  Datatable */}
                <DocumentTable />
            </section>
        </main>
    )
}