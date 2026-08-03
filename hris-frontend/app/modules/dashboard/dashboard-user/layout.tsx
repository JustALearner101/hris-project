import type { ReactNode } from "react"
import { EmployeeSidebar } from "@/components/app-sidebar/app-sidebar-user/app-sidebar"
import { Topbar } from "@/components/topbar/topbar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "sonner"


export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <SidebarProvider>
            <EmployeeSidebar />
            <SidebarInset>
                <Topbar />
                <main className="flex-1 min-w-0">
                    <Toaster position="top-right" richColors />
                    <div className="px-4 md:px-6 lg:px-8 py-6">{children}</div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
