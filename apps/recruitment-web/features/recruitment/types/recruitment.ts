import { z } from "zod";

export const JOB_POSTING_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "CLOSED",
  "ARCHIVED",
] as const;
export type JobPostingStatus = (typeof JOB_POSTING_STATUSES)[number] | string;

export const EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number] | string;

export const PIPELINE_STAGE_TYPES = [
  "SOURCING",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
] as const;
export type PipelineStageType = (typeof PIPELINE_STAGE_TYPES)[number] | string;

export interface JobStageDto {
  id: number;
  jobPostingId: number;
  name: string;
  stageType: PipelineStageType;
  sequence: number;
  isActive: boolean;
}

export interface JobPostingDto {
  id: number;
  title: string;
  description: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  status: JobPostingStatus;
  headcount: number;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency: string;
  seoSlug: string;
  seoMetaTitle?: string | null;
  seoMetaDescription?: string | null;
  logoPath?: string | null;
  theme?: string | null;
  openedAt?: string | null;
  closedAt?: string | null;
  publishedAt?: string | null;
  applicantCount: number;
  createdAt: string;
  stages: JobStageDto[];
}

export interface ApplicationDocumentDto {
  id: number;
  applicationId: number;
  docType: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  parseStatus: "PENDING" | "PROCESSING" | "PARSED" | "FAILED" | string;
  extractedText?: string | null;
  parsedJson?: string | null;
  errorCode?: string | null;
  attemptCount: number;
  createdAt: string;
}

export interface ParsedCvProfile {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  summary?: string | null;
  skills?: string[];
  experience?: Array<{
    company?: string;
    role?: string;
    period?: string;
    description?: string;
  }>;
  education?: Array<{
    institution?: string;
    degree?: string;
    year?: string;
  }>;
  languages?: string[];
}

export interface ApplicationDto {
  id: number;
  jobPostingId: number;
  jobTitle: string;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string | null;
  currentStageId: number;
  currentStageName: string;
  currentStageType: PipelineStageType;
  status: "APPLIED" | "IN_REVIEW" | "HIRED" | "REJECTED" | string;
  appliedAt: string;
  score?: number | null;
  notes?: string | null;
  hiredAt?: string | null;
  cvParseStatus: "PENDING" | "PROCESSING" | "PARSED" | "FAILED" | string;
}

export interface ApplicationDetailDto extends ApplicationDto {
  documents: ApplicationDocumentDto[];
}

export interface CandidateDto {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  source: string;
  consentGiven: boolean;
  applicationsCount: number;
  createdAt: string;
}

export interface MoveStageDto {
  targetStageId?: number;
  targetStageType?: string;
  notes?: string;
}

export interface RejectApplicationDto {
  reason?: string;
}

export interface HireApplicationDto {
  notes?: string;
}

export const jobPostingFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Job title must be at least 3 characters")
    .max(200, "Job title must be at most 200 characters"),
  department: z
    .string()
    .trim()
    .min(2, "Department is required")
    .max(120, "Department is too long"),
  location: z
    .string()
    .trim()
    .min(2, "Location is required")
    .max(150, "Location is too long"),
  employmentType: z.string().min(1, "Employment type is required"),
  headcount: z.coerce
    .number()
    .int()
    .min(1, "Headcount must be at least 1")
    .max(500, "Headcount cannot exceed 500"),
  salaryMin: z.coerce.number().min(0).optional(),
  salaryMax: z.coerce.number().min(0).optional(),
  currency: z.string().default("IDR"),
  description: z
    .string()
    .trim()
    .min(10, "Job description must be at least 10 characters"),
  seoSlug: z.string().optional(),
  seoMetaTitle: z.string().max(160).optional(),
  seoMetaDescription: z.string().max(320).optional(),
});

export type JobPostingFormValues = z.infer<typeof jobPostingFormSchema>;

export function parseCvJsonSafe(raw?: string | null): ParsedCvProfile | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as ParsedCvProfile;
    }
    return null;
  } catch {
    return null;
  }
}
