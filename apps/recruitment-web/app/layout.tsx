import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "AnglerFish ATS — Careers & Recruitment",
  description:
    "Enterprise Applicant Tracking System & Public Career Portal for AnglerFish HRIS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}
        suppressHydrationWarning
      >
        <Suspense fallback={null}>{children}</Suspense>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
