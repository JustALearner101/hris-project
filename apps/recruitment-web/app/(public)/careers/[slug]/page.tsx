import type { Metadata } from "next";
import { JobDetail } from "@/features/careers/components/job-detail";
import { BASE_URL } from "@/lib/api-client";
import { PublicJobDetailDto } from "@/features/careers/types/careers";

async function fetchJobBySlug(
  slug: string
): Promise<PublicJobDetailDto | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/v1/public/jobs/${encodeURIComponent(slug)}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return null;
    const payload = await res.json();
    return payload?.data?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await fetchJobBySlug(slug);
  if (!job) {
    return {
      title: "Job Opportunity | HRIS Enterprise Careers",
    };
  }

  return {
    title: job.seoMetaTitle || `${job.title} (${job.location}) | Careers`,
    description:
      job.seoMetaDescription ||
      `Apply for the ${job.title} role in ${job.department} (${job.location}).`,
  };
}

export default async function CareerJobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await fetchJobBySlug(slug);

  const jsonLd = job
    ? {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: job.title,
        description: job.description,
        datePosted: job.publishedAt || new Date().toISOString(),
        employmentType: job.employmentType,
        hiringOrganization: {
          "@type": "Organization",
          name: "HRIS Enterprise",
        },
        jobLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: job.location,
            addressCountry: "ID",
          },
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <JobDetail slug={slug} initialJob={job} />
    </>
  );
}
