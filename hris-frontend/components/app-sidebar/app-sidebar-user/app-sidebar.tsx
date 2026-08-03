"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
    Sidebar as UISidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    ChevronDown,
    LayoutGrid,
    User,
    CalendarDays,
    FileText,
    Wallet,
    Receipt,
    BarChart3,
    GraduationCap,
    Megaphone,
    Settings,
    ShieldCheck,
} from "lucide-react"

export function EmployeeSidebar() {
    const pathname = usePathname()
    const isActive = (href: string) =>
        href === "/dashboard" ? pathname === href : pathname.startsWith(href)

    return (
        <TooltipProvider>
            <UISidebar
                variant="sidebar"
                collapsible="icon"
                className="border-r border-sidebar-border sidebar-scroll"
            >
                {/* Header */}
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                                <Link href="/modules/dashboard" className="flex items-center gap-2">
                                    {/* Logo besar ketika expanded */}
                                    <Image
                                        src="/assets/bg.png"
                                        alt="AnglerFish Logo"
                                        width={40}
                                        height={40}
                                        className="group-data-[collapsible=icon]:hidden"
                                    />

                                    {/* Logo kecil ketika collapsed */}
                                    <Image
                                        src="/assets/bg.png"
                                        alt="AnglerFish Logo"
                                        width={40}
                                        height={20}
                                        className="hidden group-data-[collapsible=icon]:block"
                                    />

                                    {/* Text hanya muncul jika expanded */}
                                    <span className="font-medium group-data-[collapsible=icon]:hidden align-middle">
                    AnglerFish
                  </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent className="disable-scroll-x">
                    {/* Overview */}
                    <SidebarGroup>
                        <SidebarGroupLabel className="flex items-center gap-2">
                            <LayoutGrid className="size-4" />
                            Overview
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                                        <Link href="/modules/dashboard">
                                            <LayoutGrid className="mr-2 size-4" />
                                            <span>Dashboard</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    <SidebarSeparator />

                    {/* Profil */}
                    <SidebarGroup>
                        <SidebarGroupLabel className="flex items-center gap-2">
                            <User className="size-4" />
                            My Profile
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={isActive("/profile")}>
                                        <Link href="/profile">
                                            <User className="mr-2 size-4" />
                                            <span>Profile & Documents</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    <SidebarSeparator />

                    {/* Attendance & Leave */}
                    <Collapsible defaultOpen className="group/collapsible">
                        <SidebarGroup>
                            <SidebarGroupLabel asChild>
                                <CollapsibleTrigger className="flex w-full items-center">
                                    <CalendarDays className="mr-2 size-4" />
                                    Attendance & Leave
                                    <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                </CollapsibleTrigger>
                            </SidebarGroupLabel>
                            <CollapsibleContent>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        <SidebarMenuItem>
                                            <SidebarMenuButton asChild isActive={isActive("/attendance")}>
                                                <Link href="/modules/attendance">
                                                    <CalendarDays className="mr-2 size-4" />
                                                    <span>Attendance</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <SidebarMenuButton asChild isActive={isActive("/leave")}>
                                                <Link href="/leave">
                                                    <FileText className="mr-2 size-4" />
                                                    <span>Leave Request</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </CollapsibleContent>
                        </SidebarGroup>
                    </Collapsible>

                    <SidebarSeparator />

                    {/* Payroll */}
                    <Collapsible defaultOpen className="group/collapsible">
                        <SidebarGroup>
                            <SidebarGroupLabel asChild>
                                <CollapsibleTrigger className="flex w-full items-center">
                                    <Wallet className="mr-2 size-4" />
                                    Payroll & Finance
                                    <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                </CollapsibleTrigger>
                            </SidebarGroupLabel>
                            <CollapsibleContent>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        <SidebarMenuItem>
                                            <SidebarMenuButton asChild isActive={isActive("/payslip")}>
                                                <Link href="/payslip">
                                                    <Wallet className="mr-2 size-4" />
                                                    <span>My Payslip</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <SidebarMenuButton asChild isActive={isActive("/reimbursement")}>
                                                <Link href="/reimbursement">
                                                    <Receipt className="mr-2 size-4" />
                                                    <span>Reimbursements</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </CollapsibleContent>
                        </SidebarGroup>
                    </Collapsible>

                    <SidebarSeparator />

                    {/* Performance & Learning */}
                    <Collapsible defaultOpen className="group/collapsible">
                        <SidebarGroup>
                            <SidebarGroupLabel asChild>
                                <CollapsibleTrigger className="flex w-full items-center">
                                    <BarChart3 className="mr-2 size-4" />
                                    Performance & Learning
                                    <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                </CollapsibleTrigger>
                            </SidebarGroupLabel>
                            <CollapsibleContent>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        <SidebarMenuItem>
                                            <SidebarMenuButton asChild isActive={isActive("/performance")}>
                                                <Link href="/performance">
                                                    <BarChart3 className="mr-2 size-4" />
                                                    <span>My Performance</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                        <SidebarMenuItem>
                                            <SidebarMenuButton asChild isActive={isActive("/learning")}>
                                                <Link href="/learning">
                                                    <GraduationCap className="mr-2 size-4" />
                                                    <span>Learning & Training</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </CollapsibleContent>
                        </SidebarGroup>
                    </Collapsible>

                    <SidebarSeparator />

                    {/* Announcements */}
                    <SidebarGroup>
                        <SidebarGroupLabel className="flex items-center gap-2">
                            <Megaphone className="size-4" />
                            Announcements
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={isActive("/announcements")}>
                                        <Link href="/announcements">
                                            <Megaphone className="mr-2 size-4" />
                                            <span>Company News</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                {/* Footer */}
                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isActive("/settings")}>
                                <Link href="/settings">
                                    <Settings className="mr-2 size-4" />
                                    <span>Settings</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>

                    <div className="rounded-lg bg-sidebar-accent p-3 group-data-[collapsible=icon]:hidden">
                        <p className="text-xs text-sidebar-accent-foreground/80">Compliance</p>
                        <p className="text-sm font-medium text-sidebar-accent-foreground flex items-center gap-2">
                            <ShieldCheck className="size-4" /> SOC 2 • ISO 27001
                        </p>
                    </div>

                    <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="size-8 rounded-md bg-sidebar-accent grid place-items-center">
                                    <ShieldCheck className="size-4 text-sidebar-accent-foreground" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" align="center">
                                <span className="text-xs">Compliance: SOC 2 • ISO 27001</span>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </SidebarFooter>

                <SidebarRail />
            </UISidebar>
        </TooltipProvider>
    )
}