"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PublicJobDetailDto,
  applyApplicationSchema,
} from "../types/careers";
import { submitPublicApplication } from "../api/use-careers";
import { CvUpload } from "./cv-upload";

export interface ApplyFormProps {
  job: PublicJobDetailDto;
  onSuccess?: (trackingToken: string) => void;
}

interface FieldErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  notes?: string;
  consentAccepted?: string;
  cv?: string;
}

export function ApplyForm({ job, onSuccess }: ApplyFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [consentAccepted, setConsentAccepted] = React.useState(false);
  const [cvFile, setCvFile] = React.useState<File | null>(null);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const parsed = applyApplicationSchema.safeParse({
      fullName,
      email,
      phone,
      notes: notes || undefined,
      consentAccepted,
      cv: cvFile,
    });

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(5);
    try {
      const values = parsed.data;
      const response = await submitPublicApplication({
        jobId: job.id,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        notes: values.notes,
        consentAccepted: values.consentAccepted,
        cv: values.cv,
        onProgress: (pct) => setUploadProgress(pct),
      });

      const accepted = response.data?.[0];
      const token = accepted?.trackingToken;

      toast.success(
        "Application received! Your CV has been queued for AI parsing."
      );

      if (onSuccess && token) {
        onSuccess(token);
      } else if (token) {
        router.push(`/careers/application/${encodeURIComponent(token)}`);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to submit application. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto max-w-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Apply for {job.title}</CardTitle>
        <CardDescription>
          {job.department} • {job.location} ({job.employmentType.replace("_", " ")})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="space-y-2">
            <Label htmlFor="apply-full-name">Full Name *</Label>
            <Input
              id="apply-full-name"
              placeholder="e.g. Budi Santoso"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isSubmitting}
            />
            {errors.fullName && (
              <p className="text-xs font-medium text-destructive">
                {errors.fullName}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="apply-email">Email Address *</Label>
              <Input
                id="apply-email"
                type="email"
                placeholder="budi.santoso@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-xs font-medium text-destructive">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="apply-phone">Phone / WhatsApp Number *</Label>
              <Input
                id="apply-phone"
                type="tel"
                placeholder="+62 812 3456 7890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
              />
              {errors.phone && (
                <p className="text-xs font-medium text-destructive">
                  {errors.phone}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>CV / Resume (PDF, DOC, DOCX — Max 5 MB) *</Label>
            <CvUpload
              value={cvFile}
              onChange={(file) => setCvFile(file)}
              isUploading={isSubmitting}
              uploadProgress={uploadProgress}
              error={errors.cv}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apply-notes">
              Cover Note / Portfolio Links (Optional)
            </Label>
            <Textarea
              id="apply-notes"
              rows={4}
              placeholder="Share your LinkedIn, GitHub, portfolio URL, or a brief introduction..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
            />
            {errors.notes && (
              <p className="text-xs font-medium text-destructive">
                {errors.notes}
              </p>
            )}
          </div>

          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <input
                id="pdp-consent-checkbox"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                checked={consentAccepted}
                onChange={(e) => setConsentAccepted(e.target.checked)}
                disabled={isSubmitting}
              />
              <div className="space-y-1 text-sm">
                <Label
                  htmlFor="pdp-consent-checkbox"
                  className="flex items-center gap-1.5 font-medium cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>
                    Personal Data Protection Consent (UU PDP No. 27 Tahun 2022) *
                  </span>
                </Label>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  I hereby consent to the collection, automated AI parsing, and
                  processing of my personal data and CV strictly for recruitment
                  evaluation purposes in compliance with Indonesia&apos;s
                  Personal Data Protection Law (UU No. 27 Tahun 2022).
                </p>
                {errors.consentAccepted && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.consentAccepted}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
