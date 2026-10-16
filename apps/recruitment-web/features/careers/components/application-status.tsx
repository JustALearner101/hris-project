"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  FileSearch,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Building2,
  MapPin,
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
import { useApplicationStatus } from "../api/use-careers";

export interface ApplicationStatusProps {
  token: string;
}

const PIPELINE_STEPS = [
  "Sourcing",
  "HR Screening",
  "Technical Interview",
  "Offer",
  "Hired",
];

export function ApplicationStatus({ token }: ApplicationStatusProps) {
  const { application, isLoading, isError } = useApplicationStatus(token);

  if (isLoading && !application) {
    return (
      <Card className="mx-auto max-w-2xl animate-pulse">
        <CardHeader className="space-y-3">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-24 rounded-xl bg-muted" />
          <div className="h-20 rounded-xl bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !application) {
    return (
      <Card className="mx-auto max-w-2xl py-10 text-center">
        <CardContent className="space-y-4">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <h2 className="text-xl font-semibold">Tracking Link Not Found</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            We couldn&apos;t locate an application with tracking token{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              {token}
            </code>
            . Please double-check your confirmation URL.
          </p>
          <Button asChild variant="outline">
            <Link href="/careers">Browse Open Roles</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const renderParseBadge = (status: string) => {
    switch (status) {
      case "PARSED":
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            AI CV Parsed
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            Manual Review Queued
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3.5 w-3.5 animate-spin" />
            AI Parsing ({status})
          </Badge>
        );
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/careers" className="inline-flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Careers</span>
          </Link>
        </Button>
      </div>

      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="space-y-3 border-b bg-muted/20">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              Token: {token}
            </Badge>
            {renderParseBadge(application.cvParseStatus)}
          </div>
          <CardTitle className="text-2xl">{application.jobTitle}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {application.department}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {application.location}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Candidate</p>
              <p className="mt-0.5 font-medium">{application.candidateName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Application Status</p>
              <p className="mt-0.5 font-semibold text-primary">
                {application.applicationStatus}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Stage</p>
              <p className="mt-0.5 font-medium">
                {application.currentStageName}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Hiring Pipeline Progress</h3>
            <div className="grid gap-2 sm:grid-cols-5">
              {PIPELINE_STEPS.map((step, idx) => {
                const isCurrent =
                  application.currentStageName.toLowerCase() ===
                  step.toLowerCase();
                return (
                  <div
                    key={step}
                    className={`rounded-lg border p-2.5 text-center text-xs transition-colors ${
                      isCurrent
                        ? "border-primary bg-primary/10 font-semibold text-primary"
                        : "bg-muted/20 text-muted-foreground"
                    }`}
                  >
                    <div className="text-[10px] uppercase opacity-75">
                      Step {idx + 1}
                    </div>
                    <div className="mt-0.5 truncate">{step}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border bg-primary/5 p-4 text-xs leading-relaxed text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI Resume Screening Status</span>
            </div>
            {application.cvParseStatus === "PARSED" ? (
              <p>
                Your CV has been successfully analyzed by our AI recruitment
                engine and your profile is ready for the hiring team in the{" "}
                <strong>{application.currentStageName}</strong> stage.
              </p>
            ) : application.cvParseStatus === "FAILED" ? (
              <p>
                Automated extraction encountered an issue with your document
                formatting, so our recruitment team has queued your CV for direct
                manual review.
              </p>
            ) : (
              <p className="flex items-center gap-2">
                <FileSearch className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  Our AI worker is currently extracting skills and experience
                  from your uploaded CV. This page updates automatically.
                </span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
