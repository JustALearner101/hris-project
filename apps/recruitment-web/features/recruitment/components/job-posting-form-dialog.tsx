"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EMPLOYMENT_TYPES,
  JobPostingDto,
  JobPostingFormValues,
  jobPostingFormSchema,
} from "../types/recruitment";

export interface JobPostingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: JobPostingDto | null;
  onSubmit: (values: JobPostingFormValues) => Promise<void>;
}

export function JobPostingFormDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: JobPostingFormDialogProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [department, setDepartment] = React.useState("Engineering");
  const [location, setLocation] = React.useState("Jakarta (Hybrid)");
  const [employmentType, setEmploymentType] = React.useState("FULL_TIME");
  const [headcount, setHeadcount] = React.useState("1");
  const [salaryMin, setSalaryMin] = React.useState("");
  const [salaryMax, setSalaryMax] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [seoMetaTitle, setSeoMetaTitle] = React.useState("");
  const [seoMetaDescription, setSeoMetaDescription] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    setErrors({});
    if (initialData) {
      setTitle(initialData.title);
      setDepartment(initialData.department);
      setLocation(initialData.location);
      setEmploymentType(String(initialData.employmentType || "FULL_TIME"));
      setHeadcount(String(initialData.headcount || 1));
      setSalaryMin(
        initialData.salaryMin !== undefined && initialData.salaryMin !== null
          ? String(initialData.salaryMin)
          : ""
      );
      setSalaryMax(
        initialData.salaryMax !== undefined && initialData.salaryMax !== null
          ? String(initialData.salaryMax)
          : ""
      );
      setDescription(initialData.description || "");
      setSeoMetaTitle(initialData.seoMetaTitle || "");
      setSeoMetaDescription(initialData.seoMetaDescription || "");
    } else {
      setTitle("");
      setDepartment("Engineering");
      setLocation("Jakarta (Hybrid)");
      setEmploymentType("FULL_TIME");
      setHeadcount("1");
      setSalaryMin("");
      setSalaryMax("");
      setDescription("");
      setSeoMetaTitle("");
      setSeoMetaDescription("");
    }
  }, [initialData, open]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const parsed = jobPostingFormSchema.safeParse({
      title,
      department,
      location,
      employmentType,
      headcount: Number(headcount),
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryMax: salaryMax ? Number(salaryMax) : undefined,
      currency: "IDR",
      description,
      seoMetaTitle: seoMetaTitle || undefined,
      seoMetaDescription: seoMetaDescription || undefined,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || "form");
        if (!nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit(parsed.data);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Job Posting" : "Create New Job Posting"}
          </DialogTitle>
          <DialogDescription>
            Configure the job details, compensation range, and SEO metadata for
            the public career portal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="job-title">Job Title *</Label>
            <Input
              id="job-title"
              placeholder="e.g. Senior Backend Engineer (.NET)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="job-dept">Department *</Label>
              <Input
                id="job-dept"
                placeholder="Engineering"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
              {errors.department && (
                <p className="text-xs text-destructive">{errors.department}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="job-location">Location *</Label>
              <Input
                id="job-location"
                placeholder="Jakarta / Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              {errors.location && (
                <p className="text-xs text-destructive">{errors.location}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Employment Type *</Label>
              <Select
                value={employmentType}
                onValueChange={setEmploymentType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="job-headcount">Headcount *</Label>
              <Input
                id="job-headcount"
                type="number"
                min={1}
                value={headcount}
                onChange={(e) => setHeadcount(e.target.value)}
              />
              {errors.headcount && (
                <p className="text-xs text-destructive">{errors.headcount}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="job-salary-min">Min Salary (IDR)</Label>
              <Input
                id="job-salary-min"
                type="number"
                placeholder="15000000"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="job-salary-max">Max Salary (IDR)</Label>
              <Input
                id="job-salary-max"
                type="number"
                placeholder="25000000"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="job-desc">
              Role Description & Qualifications *
            </Label>
            <Textarea
              id="job-desc"
              rows={5}
              placeholder="Describe responsibilities, required skills, and benefits..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="job-seo-title">SEO Meta Title (Optional)</Label>
              <Input
                id="job-seo-title"
                placeholder="Auto-generated if left blank"
                value={seoMetaTitle}
                onChange={(e) => setSeoMetaTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="job-seo-desc">
                SEO Meta Description (Optional)
              </Label>
              <Input
                id="job-seo-desc"
                placeholder="Brief summary for search engines"
                value={seoMetaDescription}
                onChange={(e) => setSeoMetaDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Save Changes" : "Create Job Posting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
