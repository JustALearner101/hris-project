"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Search } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function Topbar() {
    return (
        <header
            className="sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
            role="banner"
        >
            <div className="px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between">
                {/* Left */}
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="mr-1" />
                </div>

                {/* Center */}
                <form
                    className="relative w-1/2"
                    role="search"
                    aria-label="Global"
                >
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <label htmlFor="global-search" className="sr-only">
                        Search employees, requests, and more
                    </label>
                    <Input
                        id="global-search"
                        placeholder="Search employees, requests, and more"
                        className="pl-8"
                    />
                </form>

                {/* Right */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" aria-label="Notifications">
                        <Bell className="size-5" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="gap-2 px-1">
                                <Avatar className="size-8">
                                    <AvatarImage alt="User" src="/corporate-avatar.jpg" />
                                    <AvatarFallback>AN</AvatarFallback>
                                </Avatar>
                                <span className="hidden md:inline text-sm">Admin</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Profile</DropdownMenuItem>
                            <DropdownMenuItem>Preferences</DropdownMenuItem>
                            <DropdownMenuItem>Billing</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Sign out
                                {/*<button onClick={logout} className="ml-auto text-red-600 focus:text-red-600">*/}
                                {/*    Logout*/}
                                {/*</button>*/}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}