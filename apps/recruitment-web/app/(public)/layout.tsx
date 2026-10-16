import * as React from "react";
import Link from "next/link";
import { Briefcase, ShieldCheck, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicCareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/careers" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-base">
                HRIS Enterprise
              </span>
              <span className="ml-2 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Careers
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/careers">Open Roles</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/recruitment" className="inline-flex items-center gap-1">
                <span>Recruiter Portal</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto max-w-6xl px-4 py-10">
        {children}
      </main>

      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>
              Protected under Indonesian Personal Data Protection Law (UU PDP No.
              27 Tahun 2022)
            </span>
          </div>
          <p>© {new Date().getFullYear()} HRIS Enterprise Talent Acquisition.</p>
        </div>
      </footer>
    </div>
  );
}
