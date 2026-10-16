"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApplyForm } from "@/features/careers/components/apply-form";
import { usePublicJobBySlug } from "@/features/careers/api/use-careers";

export default function CareerApplyPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || "";
  const { job, isLoading } = usePublicJobBySlug(slug);

  if (isLoading && !job) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 animate-pulse">
        <div className="h-8 w-40 rounded bg-muted" />
        <div className="h-96 rounded-xl bg-muted" />
      </div>
    );
  }

  if (!job) {
    return (
      <Card className="mx-auto max-w-xl py-12 text-center">
        <CardContent className="space-y-4">
          <h2 className="text-xl font-semibold">Position Not Available</h2>
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t find the job posting you&apos;re trying to apply for.
          </p>
          <Button asChild variant="outline">
            <Link href="/careers">Back to Open Roles</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-2xl">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link
            href={`/careers/${encodeURIComponent(slug)}`}
            className="inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Role Details</span>
          </Link>
        </Button>
      </div>

      <ApplyForm job={job} />
    </div>
  );
}
