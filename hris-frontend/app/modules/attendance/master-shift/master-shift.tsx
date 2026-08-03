import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ShiftTable } from "@/components/attendance-component/shift/shift-table"

export default function ShiftPage() {
    return (
        <main className="p-4 md:p-6">
            <div className="mb-6">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="#">Attendance</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Master Shift</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-2xl font-semibold mt-2">Master Shift</h1>
                <p className="text-muted-foreground">
                    Define shift schedules used by roster, timesheet, and overtime calculation.
                </p>
            </div>

            <ShiftTable />
        </main>
    )
}