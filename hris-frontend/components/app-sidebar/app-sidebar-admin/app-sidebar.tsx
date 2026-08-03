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
    Users,         // Employee Management
    UserPlus,      // Onboarding / Offboarding
    FileText,      // Master Document, Payslip
    CalendarDays,  // Attendance, Leave
    Briefcase,     // Recruitment
    Wallet,        // Payroll / Finance (transfer, reimbursement)
    Receipt,       // Expense Claims
    FileCheck,     // Compliance / Policy
    ShieldCheck,   // Approvals / Compliance OK
    Settings,      // System Settings
    FileBarChart,
    Megaphone,      // Announcements
    Building, Clock,       // Master Department
} from "lucide-react";


export function AppSidebar() {
    const pathname = usePathname()

    const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href))

    return (
        <TooltipProvider>
            <UISidebar
                variant="sidebar"
                collapsible="icon"
                className="border-r border-sidebar-border sidebar-scroll">
                <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                            <Link href="/modules/dashboard" className="flex items-center gap-2">
                                {/* Logo gede buat expanded */}
                                <Image
                                    src="/assets/bg.png"
                                    alt="AnglerFish Logo"
                                    width={40}
                                    height={40}
                                    className="group-data-[collapsible=icon]:hidden"
                                />

                                {/* Logo kecil buat collapsed */}
                                <Image
                                    src="/assets/bg.png"
                                    alt="AnglerFish Logo"
                                    width={40}
                                    height={20}
                                    className="hidden group-data-[collapsible=icon]:block"
                                />

                                {/* Text cuma muncul kalau expanded */}
                                <span className="font-medium group-data-[collapsible=icon]:hidden align-middle" style={{ display: 'inline-block', textAlign: 'center', width: '100%' }}>AnglerFish</span>                            </Link>
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
                                <SidebarMenuButton asChild isActive={isActive("/dashboard/dashboard-admin")}>
                                    <Link href="/modules/dashboard/dashboard-admin" className="flex items-center gap-2">
                                        <LayoutGrid />
                                        <span>Dashboard</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator />

                {/* People (Accordion) */}
                <Collapsible defaultOpen className="group/collapsible">
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger className="flex w-full items-center">
                                <Users className="mr-2 size-4" />
                                Employee Management
                                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild isActive={isActive("/master-employee")}>
                                            <Link href="/modules/people/master-employee">
                                                <Users className="mr-2 size-4" />
                                                <span>Master Employee</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild isActive={isActive("/master-document")}>
                                            <Link href="/modules/people/master-document">
                                                <FileText className="mr-2 size-4" />
                                                <span>Master Document</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild isActive={isActive("/master-announcement")}>
                                            <Link href="/modules/people/master-announcement">
                                                <Megaphone className="mr-2 size-4" />
                                                <span>Master Announcement</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>


                                    {/*<SidebarMenuItem>*/}
                                    {/*    <SidebarMenuButton asChild isActive={isActive("/master-setting")}>*/}
                                    {/*        <Link href="/people/master-setting">*/}
                                    {/*            <Cog className="mr-2 size-4" />*/}
                                    {/*            <span>Master Setting</span>*/}
                                    {/*        </Link>*/}
                                    {/*    </SidebarMenuButton>*/}
                                    {/*</SidebarMenuItem>*/}

                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild isActive={isActive("/master-department")}>
                                            <Link href="/modules/people/master-department">
                                                <Building className="mr-2 size-4" />
                                                <span>Master Department</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild isActive={isActive("/onboarding-offboarding")}>
                                            <Link href="/modules/people/onboarding-offboarding">
                                                <UserPlus className="mr-2 size-4" />
                                                <span>Onboarding / Offboarding</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>

                <SidebarSeparator />

                {/* Attendance & Leave (Accordion) */}
                <Collapsible defaultOpen className="group/collapsible">
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger className="flex w-full items-center">
                                <CalendarDays className="mr-2 size-4" />
                                Attendance Management
                                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild isActive={isActive("/attendance/master-attendance-monitoring")}>
                                            <Link href="/modules/attendance/master-attendance-monitoring">
                                                <CalendarDays className="mr-2 size-4" />
                                                <span>Attendance Monitoring</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild isActive={isActive("/attendance/master-shift")}>
                                            <Link href="/modules/attendance/master-shift">
                                                <Clock className="mr-2 size-4" />
                                                <span>Shift Management</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    {/*<SidebarMenuItem>*/}

                                    {/*    <SidebarMenuButton asChild isActive={isActive("/leave")}>*/}
                                    {/*        <Link href="/leave">*/}
                                    {/*            <FileCheck className="mr-2 size-4" />*/}
                                    {/*            <span>Leave Management</span>*/}
                                    {/*        </Link>*/}
                                    {/*    </SidebarMenuButton>*/}
                                    {/*</SidebarMenuItem>*/}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>

                <SidebarSeparator />

                {/*Leave Management (Accordion) */}
                <Collapsible defaultOpen className="group/collapsible">
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger className="flex w-full items-center">
                                <CalendarDays className="mr-2 size-4" />
                                Leave Management
                                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarGroupContent>
                                <SidebarMenu>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild isActive={isActive("/leave")}>
                                            <Link href="/leave">
                                                <FileCheck className="mr-2 size-4" />
                                                <span>Leave Management</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>

                <SidebarSeparator />

                {/* Payroll (Accordion) */}
                <Collapsible defaultOpen className="group/collapsible">
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger className="flex w-full items-center">
                                <Wallet className="mr-2 size-4" />
                                Payroll
                                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild isActive={isActive("/payroll")}>
                                            <Link href="/payroll">
                                                <Wallet />
                                                <span>Run Payroll</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link href="/payroll/requests">
                                                <Receipt />
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

                {/* Recruitment & Performance (Accordion) */}
                <Collapsible defaultOpen className="group/collapsible">
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger className="flex w-full items-center">
                                <Briefcase className="mr-2 size-4" />
                                Recruitment & Performance
                                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild isActive={isActive("/recruitment")}>
                                            <Link href="/recruitment">
                                                <Briefcase className="mr-2 size-4" />
                                                <span>Recruitment</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild isActive={isActive("/performance")}>
                                            <Link href="/performance">
                                                <FileCheck className="mr-2 size-4" />
                                                <span>Performance & Goals</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>

                <SidebarSeparator />

                {/* Compliance & Approvals (Accordion) */}
                <Collapsible defaultOpen className="group/collapsible">
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger className="flex w-full items-center">
                                <ShieldCheck className="mr-2 size-4" />
                                Compliance & Approvals
                                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild isActive={isActive("/compliance")}>
                                            <Link href="/compliance">
                                                <ShieldCheck className="mr-2 size-4" />
                                                <span>Compliance</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild isActive={isActive("/approvals")}>
                                            <Link href="/approvals">
                                                <ShieldCheck className="mr-2 size-4" />
                                                <span>Approvals Center</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>

                <SidebarSeparator />

                {/* Reports (Accordion) */}
                <Collapsible className="group/collapsible">
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger className="flex w-full items-center">
                                <FileBarChart className="mr-2 size-4" />
                                Reports
                                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild isActive={isActive("/reports")}>
                                            <Link href="/reports">
                                                <FileBarChart />
                                                <span>Analytics</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/settings")}>
                            <Link href="/settings">
                                <Settings />
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
