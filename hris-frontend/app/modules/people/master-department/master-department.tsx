import DepartmentTable from "@/components/people-component/department/department-table"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {Separator} from "@/components/ui/separator";

export default function MasterDepartmentPage() {
    return (
        <main className="p-4 md:p-6 space-y-6">
            <div className="space-y-1">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="#">People</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Master Department</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-2xl font-semibold tracking-tight text-balance">Master Department</h1>
                <p className="text-muted-foreground">Manage organizational departments, heads, and hierarchy.</p>
            </div>

            <Separator className="my-6" />

            <DepartmentTable />
        </main>
    )
}