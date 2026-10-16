import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { JobList } from "@/features/careers/components/job-list";
import { BASE_URL } from "@/lib/api-client";
import { PublicJobDto } from "@/features/careers/types/careers";

export const metadata: Metadata = {
  title: "Careers & Open Positions | HRIS Enterprise",
  description:
    "Explore open engineering, product, and operations roles at HRIS Enterprise. Apply with AI-assisted resume screening.",
};

async function getInitialPublishedJobs(): Promise<PublicJobDto[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/public/jobs?Limit=50`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    const payload = await res.json();
    return Array.isArray(payload?.data) ? payload.data : [];
  } catch {
    return [];
  }
}

export default async function CareersPage() {
  const initialJobs = await getInitialPublishedJobs();

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-background p-8 md:p-12">
        <div className="max-w-3xl space-y-4">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>We&apos;re Hiring Across Indonesia & Remote</span>
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            Build the future of enterprise workforce intelligence.
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Join our engineering, product, and people operations teams. Upload
            your CV once and let our AI-assisted talent pipeline match your
            strengths in minutes.
          </p>
        </div>
      </section>

      <JobList initialJobs={initialJobs} />
    </div>
  );
}
