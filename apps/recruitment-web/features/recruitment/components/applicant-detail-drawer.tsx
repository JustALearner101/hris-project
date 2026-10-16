"use client";

import * as React from "react";
import {
  Download,
  Sparkles,
  Briefcase,
  GraduationCap,
  FileText,
  UserCheck,
  XCircle,
  Mail,
  Phone,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getDocumentDownloadUrl,
  useApplicationDetail,
} from "../api/use-recruitment";
import { ApplicationDto, parseCvJsonSafe } from "../types/recruitment";

export interface ApplicantDetailDrawerProps {
  application: ApplicationDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHire: (app: ApplicationDto) => void;
  onReject: (app: ApplicationDto) => void;
}

export function ApplicantDetailDrawer({
  application,
  open,
  onOpenChange,
  onHire,
  onReject,
}: ApplicantDetailDrawerProps) {
  const { application: detail, isLoading } = useApplicationDetail(
    open && application ? application.id : null
  );

  const activeApp = detail || application;
  const primaryDoc = detail?.documents?.[0] ?? null;
  const parsedProfile = React.useMemo(
    () => parseCvJsonSafe(primaryDoc?.parsedJson),
    [primaryDoc?.parsedJson]
  );

  if (!activeApp) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DialogTitle className="text-2xl">
              {activeApp.candidateName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{activeApp.currentStageName}</Badge>
              <Badge variant="outline">
                CV: {primaryDoc?.parseStatus || activeApp.cvParseStatus}
              </Badge>
            </div>
          </div>
          <DialogDescription className="flex flex-wrap items-center gap-4 pt-1 text-xs">
            <span>Role: {activeApp.jobTitle}</span>
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {activeApp.candidateEmail}
            </span>
            {activeApp.candidatePhone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {activeApp.candidatePhone}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {primaryDoc && (
            <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3.5">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{primaryDoc.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {(primaryDoc.sizeBytes / 1024).toFixed(1)} KB •{" "}
                    {primaryDoc.mimeType}
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <a
                  href={getDocumentDownloadUrl(activeApp.id, primaryDoc.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  Download Original CV
                </a>
              </Button>
            </div>
          )}

          {isLoading && !detail ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-6 w-48 rounded bg-muted" />
              <div className="h-24 rounded-xl bg-muted" />
            </div>
          ) : parsedProfile ? (
            <div className="space-y-5 rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Sparkles className="h-4 w-4" />
                <span>AI-Extracted Candidate Profile</span>
              </div>

              {parsedProfile.summary && (
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                    Executive Summary
                  </h4>
                  <p className="text-sm leading-relaxed">
                    {parsedProfile.summary}
                  </p>
                </div>
              )}

              {parsedProfile.skills && parsedProfile.skills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                    Extracted Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedProfile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {parsedProfile.experience &&
                parsedProfile.experience.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
                      <Briefcase className="h-3.5 w-3.5" />
                      <span>Work Experience</span>
                    </h4>
                    <div className="space-y-2">
                      {parsedProfile.experience.map((exp, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border bg-muted/20 p-3 text-xs"
                        >
                          <div className="flex justify-between font-semibold">
                            <span>
                              {exp.role} {exp.company ? `@ ${exp.company}` : ""}
                            </span>
                            {exp.period && (
                              <span className="text-muted-foreground">
                                {exp.period}
                              </span>
                            )}
                          </div>
                          {exp.description && (
                            <p className="mt-1 text-muted-foreground">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {parsedProfile.education &&
                parsedProfile.education.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
                      <GraduationCap className="h-3.5 w-3.5" />
                      <span>Education</span>
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {parsedProfile.education.map((edu, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border bg-muted/20 p-3 text-xs"
                        >
                          <div className="font-semibold">{edu.degree}</div>
                          <div className="text-muted-foreground">
                            {edu.institution}{" "}
                            {edu.year ? `(${edu.year})` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              {primaryDoc?.extractedText ? (
                <div className="text-left space-y-2">
                  <p className="font-semibold text-foreground">
                    Extracted Raw CV Text
                  </p>
                  <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs">
                    {primaryDoc.extractedText}
                  </pre>
                </div>
              ) : (
                <p>
                  Structured AI CV profile is not yet available (Status:{" "}
                  <strong>{activeApp.cvParseStatus}</strong>).
                </p>
              )}
            </div>
          )}

          {activeApp.status !== "HIRED" && activeApp.status !== "REJECTED" && (
            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  onReject(activeApp);
                  onOpenChange(false);
                }}
              >
                <XCircle className="mr-1.5 h-4 w-4" />
                Reject Candidate
              </Button>
              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  onHire(activeApp);
                  onOpenChange(false);
                }}
              >
                <UserCheck className="mr-1.5 h-4 w-4" />
                Hire & Trigger Onboarding
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
