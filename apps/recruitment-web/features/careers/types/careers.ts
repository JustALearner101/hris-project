import { z } from "zod";

export const MAX_CV_SIZE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_CV_EXTENSIONS = [".pdf", ".doc", ".docx"] as const;
export const ACCEPTED_CV_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export interface PublicJobDto {
  id: number;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency: string;
  seoSlug: string;
  seoMetaTitle?: string | null;
  seoMetaDescription?: string | null;
  publishedAt?: string | null;
}

export interface PublicJobDetailDto extends PublicJobDto {
  description: string;
  headcount: number;
  logoPath?: string | null;
  theme?: string | null;
}

export interface ApplicationAcceptedDto {
  applicationId: number;
  trackingToken: string;
  status: string;
}

export interface ApplicationStatusDto {
  applicationId: number;
  jobTitle: string;
  department: string;
  location: string;
  candidateName: string;
  applicationStatus: "APPLIED" | "IN_REVIEW" | "HIRED" | "REJECTED" | string;
  currentStageName: string;
  cvParseStatus: "PENDING" | "PROCESSING" | "PARSED" | "FAILED" | string;
  appliedAt: string;
  updatedAt: string;
}

export function isAllowedCvFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = ACCEPTED_CV_EXTENSIONS.some((ext) =>
    lowerName.endsWith(ext)
  );
  const hasAllowedMime =
    !file.type ||
    (ACCEPTED_CV_MIME_TYPES as readonly string[]).includes(file.type);
  return hasAllowedExtension && hasAllowedMime;
}

export const applyApplicationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(160, "Full name must be at most 160 characters"),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z
    .string()
    .trim()
    .min(8, "Phone number must be at least 8 digits")
    .max(40, "Phone number is too long"),
  notes: z
    .string()
    .max(2000, "Cover note must be under 2000 characters")
    .optional(),
  consentAccepted: z.boolean().refine((val) => val === true, {
    message:
      "You must consent to personal data processing under UU PDP No. 27/2022 to submit your application.",
  }),
  cv: z
    .custom<File>((val) => typeof File !== "undefined" && val instanceof File, {
      message: "Please attach your CV / resume file.",
    })
    .refine((file) => file && isAllowedCvFile(file), {
      message: "Only PDF, DOC, or DOCX files are supported.",
    })
    .refine((file) => file && file.size <= MAX_CV_SIZE_BYTES, {
      message: "File size must not exceed 5 MB.",
    }),
});

export type ApplyApplicationFormValues = z.infer<typeof applyApplicationSchema>;
