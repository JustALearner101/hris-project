"use client";

import * as React from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  XCircle,
  Mail,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ApplicationDto,
  PIPELINE_STAGE_TYPES,
  PipelineStageType,
} from "../types/recruitment";

export interface PipelineBoardProps {
  applications: ApplicationDto[];
  onMoveStage: (app: ApplicationDto, targetStageType: PipelineStageType) => void;
  onSelectApplication: (app: ApplicationDto) => void;
  onHire: (app: ApplicationDto) => void;
  onReject: (app: ApplicationDto) => void;
}

const STAGE_LABELS: Record<string, string> = {
  SOURCING: "Sourcing",
  SCREENING: "HR Screening",
  INTERVIEW: "Technical Interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

const NEXT_STAGE_MAP: Record<string, PipelineStageType | null> = {
  SOURCING: "SCREENING",
  SCREENING: "INTERVIEW",
  INTERVIEW: "OFFER",
  OFFER: "HIRED",
  HIRED: null,
  REJECTED: null,
};

export function PipelineBoard({
  applications,
  onMoveStage,
  onSelectApplication,
  onHire,
  onReject,
}: PipelineBoardProps) {
  const renderParseBadge = (status: string) => {
    if (status === "PARSED") {
      return (
        <Badge
          variant="secondary"
          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] gap-1"
        >
          <CheckCircle2 className="h-3 w-3" />
          PARSED
        </Badge>
      );
    }
    if (status === "FAILED") {
      return (
        <Badge variant="destructive" className="text-[10px] gap-1">
          <AlertTriangle className="h-3 w-3" />
          FAILED
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] gap-1">
        <Clock className="h-3 w-3" />
        {status || "PENDING"}
      </Badge>
    );
  };

  return (
    <div
      className="grid gap-4 md:grid-cols-3 xl:grid-cols-6"
      data-testid="pipeline-kanban-board"
    >
      {PIPELINE_STAGE_TYPES.map((stageType) => {
        const columnApps = applications.filter(
          (app) =>
            (app.currentStageType || "SOURCING").toUpperCase() === stageType
        );
        const nextStage = NEXT_STAGE_MAP[stageType];

        return (
          <div
            key={stageType}
            data-testid={`pipeline-column-${stageType}`}
            className="flex flex-col rounded-xl border bg-muted/30 p-3 min-h-[420px]"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {STAGE_LABELS[stageType] || stageType}
              </h3>
              <Badge variant="secondary" className="text-xs font-semibold">
                {columnApps.length}
              </Badge>
            </div>

            <div className="flex-1 space-y-2.5">
              {columnApps.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                  No candidates
                </div>
              ) : (
                columnApps.map((app) => (
                  <Card
                    key={app.id}
                    className="shadow-xs transition-all hover:border-primary/50"
                  >
                    <CardHeader className="p-3 pb-2 space-y-1.5">
                      <div className="flex items-start justify-between gap-1">
                        <CardTitle
                          className="text-sm font-semibold hover:text-primary cursor-pointer"
                          onClick={() => onSelectApplication(app)}
                        >
                          {app.candidateName}
                        </CardTitle>
                        {renderParseBadge(app.cvParseStatus)}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {app.jobTitle}
                      </p>
                      <p className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span>{app.candidateEmail}</span>
                      </p>
                    </CardHeader>

                    <CardContent className="p-3 pt-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2 flex-1"
                          onClick={() => onSelectApplication(app)}
                        >
                          Inspect CV
                        </Button>

                        {nextStage && nextStage !== "HIRED" && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs px-2"
                            aria-label={`Advance ${app.candidateName} to ${STAGE_LABELS[nextStage]}`}
                            onClick={() => onMoveStage(app, nextStage)}
                          >
                            <span>Advance</span>
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      {stageType !== "HIRED" && stageType !== "REJECTED" && (
                        <div className="flex items-center gap-1 pt-1 border-t">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[11px] px-2 text-emerald-600 hover:text-emerald-700 flex-1"
                            onClick={() => onHire(app)}
                          >
                            <UserCheck className="mr-1 h-3 w-3" />
                            Hire
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[11px] px-2 text-destructive hover:text-destructive flex-1"
                            onClick={() => onReject(app)}
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
