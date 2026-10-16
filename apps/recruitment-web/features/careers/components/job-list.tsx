"use client";

import * as React from "react";
import Link from "next/link";
import {
  Briefcase,
  MapPin,
  Search,
  Building2,
  ArrowRight,
  Banknote,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePublicJobs } from "../api/use-careers";
import { PublicJobDto } from "../types/careers";

export interface JobListProps {
  initialJobs?: PublicJobDto[];
}

export function JobList({ initialJobs }: JobListProps) {
  const [search, setSearch] = React.useState("");
  const [department, setDepartment] = React.useState("ALL");
  const [location, setLocation] = React.useState("ALL");

  const { jobs, allJobs, isLoading } = usePublicJobs({
    search: search.trim() || undefined,
    department,
    location,
  });

  const displayJobs = jobs.length > 0 || !initialJobs ? jobs : initialJobs;
  const sourceForFacets = allJobs.length > 0 ? allJobs : initialJobs || [];

  const departments = React.useMemo(() => {
    const set = new Set<string>();
    sourceForFacets.forEach((j) => {
      if (j.department) set.add(j.department);
    });
    return Array.from(set).sort();
  }, [sourceForFacets]);

  const locations = React.useMemo(() => {
    const set = new Set<string>();
    sourceForFacets.forEach((j) => {
      if (j.location) set.add(j.location);
    });
    return Array.from(set).sort();
  }, [sourceForFacets]);

  const formatSalary = (job: PublicJobDto) => {
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

  return (
    <div className="space-y-8">
      <div className="grid gap-4 rounded-2xl border bg-card p-4 shadow-sm md:grid-cols-12">
        <div className="relative md:col-span-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by job title, skill, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search open positions"
          />
        </div>

        <div className="md:col-span-3">
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger aria-label="Filter by department">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-3">
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger aria-label="Filter by location">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && displayJobs.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-5 w-2/3 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-12 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayJobs.length === 0 ? (
        <Card className="border-dashed py-12 text-center">
          <CardContent className="space-y-3">
            <Briefcase className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No matching positions</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              We couldn&apos;t find any open roles matching your current filters.
              Try clearing your search or selecting another department.
            </p>
            {(search || department !== "ALL" || location !== "ALL") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setDepartment("ALL");
                  setLocation("ALL");
                }}
              >
                Reset Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {displayJobs.map((job) => {
            const salaryLabel = formatSalary(job);
            return (
              <Card
                key={job.id}
                className="group flex flex-col justify-between transition-all hover:border-primary/50 hover:shadow-md"
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="font-medium">
                      {job.department}
                    </Badge>
                    <Badge variant="outline">
                      {job.employmentType.replace("_", " ")}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    <Link href={`/careers/${job.seoSlug}`}>{job.title}</Link>
                  </CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {job.department}
                    </span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2">
                  { job.seoMetaDescription && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {job.seoMetaDescription}
                    </p>
                  )}
                  {salaryLabel && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <Banknote className="h-3.5 w-3.5" />
                      <span>{salaryLabel}</span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-2">
                  <Button asChild className="w-full justify-between" variant="secondary">
                    <Link href={`/careers/${job.seoSlug}`}>
                      <span>View Role & Apply</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
