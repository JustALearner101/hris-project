import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/api-client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/careers`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  try {
    const res = await fetch(
      `${BASE_URL}/api/v1/public/jobs?Offset=0&Limit=100`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const payload = await res.json();
      const jobs: Array<{ seoSlug?: string; slug?: string; publishedAt?: string }> =
        payload?.data ?? [];
      for (const job of jobs) {
        const slug = job.seoSlug || job.slug;
        if (slug) {
          entries.push({
            url: `${SITE_URL}/careers/${slug}`,
            lastModified: job.publishedAt
              ? new Date(job.publishedAt)
              : new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
          });
        }
      }
    }
  } catch {
    // Graceful fallback during offline/CI builds when backend is not running
  }

  return entries;
}
