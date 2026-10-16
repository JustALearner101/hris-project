"use client";

import * as React from "react";
import {
  Globe,
  EyeOff,
  Pencil,
  Trash2,
  Users,
  ExternalLink,
  Search,
} from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JobPostingDto } from "../types/recruitment";

export interface JobPostingTableProps {
  data: JobPostingDto[];
  isLoading?: boolean;
  onEdit: (job: JobPostingDto) => void;
  onPublishToggle: (job: JobPostingDto) => void;
  onDelete: (job: JobPostingDto) => void;
  onSelectPipeline?: (job: JobPostingDto) => void;
}

export function JobPostingTable({
  data,
  onEdit,
  onPublishToggle,
  onDelete,
  onSelectPipeline,
}: JobPostingTableProps) {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (job) =>
        job.title.toLowerCase().includes(q) ||
        job.department.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q)
    );
  }, [data, search]);

  const renderStatusBadge = (status: string) => {
    if (status === "PUBLISHED") {
      return (
        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">
          PUBLISHED
        </Badge>
      );
    }
    if (status === "CLOSED") {
      return <Badge variant="destructive">CLOSED</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filter job postings by title or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applicants</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No job postings found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((job) => {
                const isPublished = job.status === "PUBLISHED";
                return (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground">
                          {job.title}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          /careers/{job.seoSlug}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{job.department}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {job.location}
                      </span>
                    </TableCell>
                    <TableCell>{renderStatusBadge(job.status)}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 font-medium"
                        onClick={() => onSelectPipeline?.(job)}
                      >
                        <Users className="h-3.5 w-3.5 text-primary" />
                        <span>{job.applicantCount}</span>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant={isPublished ? "outline" : "default"}
                          size="sm"
                          onClick={() => onPublishToggle(job)}
                        >
                          {isPublished ? (
                            <>
                              <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Globe className="mr-1.5 h-3.5 w-3.5" />
                              Publish
                            </>
                          )}
                        </Button>

                        {isPublished && (
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            title="View live career page"
                          >
                            <Link
                              href={`/careers/${job.seoSlug}`}
                              target="_blank"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${job.title}`}
                          onClick={() => onEdit(job)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Delete ${job.title}`}
                          onClick={() => onDelete(job)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
