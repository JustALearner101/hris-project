"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  ExternalLink,
  LogOut,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { clearAuthToken } from "@/lib/api-client";

const MAIN_HRIS_URL =
  process.env.NEXT_PUBLIC_MAIN_HRIS_URL || "http://localhost:3000";

export default function RecruitmentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleSignOut = () => {
    clearAuthToken();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/recruitment" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold tracking-tight">HRIS ATS</span>
                <Badge variant="secondary" className="ml-2 text-[11px]">
                  Recruitment Microservice
                </Badge>
              </div>
            </Link>

            <Button asChild variant="ghost" size="sm" className="hidden md:flex">
              <a href={MAIN_HRIS_URL}>
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Back to Core HRIS
              </a>
            </Button>
          </div>

          <div className="flex items-center gap-2.5">
            <Badge
              variant="outline"
              className="hidden sm:inline-flex items-center gap-1 text-xs"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>HR Admin</span>
            </Badge>

            <Button asChild variant="outline" size="sm">
              <Link href="/careers" target="_blank">
                <span>Public Career Portal</span>
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
            >
              <LogOut className="mr-1.5 h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
