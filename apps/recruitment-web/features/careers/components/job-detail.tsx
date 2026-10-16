"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  Users,
  Calendar,
  Banknote,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePublicJobBySlug } from "../api/use-careers";
import { PublicJobDetailDto } from "../types/careers";

export interface JobDetailProps {
  slug: string;
  initialJob?: PublicJobDetailDto | null;
}

export function JobDetail({ slug, initialJob }: JobDetailProps) {
  const { job: fetchedJob, isLoading } = usePublicJobBySlug(slug);
  const job = fetchedJob || initialJob;

  if (isLoading && !job) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-12 w-2/3 rounded bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    );
  }

  if (!job) {
    return (
      <Card className="py-12 text-center">
        <CardContent className="space-y-4">
          <h2 className="text-xl font-semibold">Position Not Found</h2>
          <p className="text-sm text-muted-foreground">
            This job posting may have been closed or is no longer available.
          </p>
          <Button asChild variant="outline">
            <Link href="/careers">Back to Open Positions</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatSalary = () => {
    if (!job.salaryMin && !job.salaryMax) return null;
    const fmt = (n: number) =>
      new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: job.currency || "IDR",
        maximumFractionDigits: 0,
      }).format(n);
    if (job.salaryMin && job.salaryMax) {
      return `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`;
    }
    if (job.salaryMin) return `From ${fmt(job.salaryMin)}`;
    if (job.salaryMax) return `Up to ${fmt(job.salaryMax)}`;
    return null;
  };

  const salaryText = formatSalary();

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/careers" className="inline-flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            <span>All Open Positions</span>
          </Link>
        </Button>
      </div>

      <div className="flex flex-col justify-between gap-6 border-b pb-8 md:flex-row md:items-start">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{job.department}</Badge>
            <Badge variant="outline">
              {job.employmentType.replace("_", " ")}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {job.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-primary" />
              {job.department}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" />
              {job.headcount} {job.headcount > 1 ? "Openings" : "Opening"}
            </span>
            {job.publishedAt && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" />
                Posted {new Date(job.publishedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button asChild size="lg" className="shadow-sm">
            <Link href={`/careers/${job.seoSlug}/apply`}>
              Apply for this Role
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Role Overview & Requirements</CardTitle>
              <CardDescription>
                What you&apos;ll build and the qualifications we look for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate dark:prose-invert max-w-none whitespace-pre-line text-sm leading-relaxed">
                {job.description}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                <span>Fast-Track AI Application</span>
              </CardTitle>
              <CardDescription>
                Upload your CV in PDF or DOCX format. Our AI engine automatically
                extracts your skills and experience for rapid review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {salaryText && (
                <div className="rounded-lg bg-background p-3 border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Banknote className="h-4 w-4 text-emerald-600" />
                    <span>Compensation Range</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold">{salaryText}</p>
                </div>
              )}

              <div className="rounded-lg bg-background p-3 border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span>Employment Type</span>
                </div>
                <p className="mt-1 text-sm font-semibold">
                  {job.employmentType.replace("_", " ")}
                </p>
              </div>

              <Button asChild className="w-full" size="lg">
                <Link href={`/careers/${job.seoSlug}/apply`}>
                  Submit Application Now
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
