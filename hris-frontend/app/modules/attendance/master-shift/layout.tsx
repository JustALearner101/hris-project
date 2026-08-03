import type { ReactNode } from "react"
import { AppSidebar } from "@/components/app-sidebar/app-sidebar-admin/app-sidebar"
import { Topbar } from "@/components/topbar/topbar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <Topbar />
                <main className="flex-1 min-w-0">
                    <div className="px-4 md:px-6 lg:px-8 py-6">{children}</div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}