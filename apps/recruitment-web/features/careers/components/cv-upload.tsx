"use client";

import * as React from "react";
import { UploadCloud, FileText, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  ACCEPTED_CV_EXTENSIONS,
  MAX_CV_SIZE_BYTES,
  isAllowedCvFile,
} from "../types/careers";

export interface CvUploadProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  uploadProgress?: number;
  isUploading?: boolean;
  error?: string;
  disabled?: boolean;
}

export function CvUpload({
  value,
  onChange,
  uploadProgress = 0,
  isUploading = false,
  error,
  disabled = false,
}: CvUploadProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const validateAndSelect = (file: File | null | undefined) => {
    setLocalError(null);
    if (!file) {
      onChange(null);
      return;
    }

    if (!isAllowedCvFile(file)) {
      setLocalError(
        `Unsupported file format. Allowed formats: ${ACCEPTED_CV_EXTENSIONS.join(
          ", "
        )}`
      );
      return;
    }

    if (file.size > MAX_CV_SIZE_BYTES) {
      setLocalError("File exceeds maximum allowed size of 5 MB.");
      return;
    }

    onChange(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const droppedFile = event.dataTransfer.files?.[0];
    validateAndSelect(droppedFile);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  const displayError = localError || error;

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload CV or Resume file"
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !isUploading) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && !isUploading) {
            inputRef.current?.click();
          }
        }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled && !isUploading) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/60 hover:bg-muted/30",
          displayError && "border-destructive/60 bg-destructive/5",
          (disabled || isUploading) && "opacity-60 cursor-not-allowed"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          data-testid="cv-file-input"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          disabled={disabled || isUploading}
          onChange={(e) => {
            const selected = e.target.files?.[0];
            validateAndSelect(selected);
          }}
        />

        {!value ? (
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Click to upload or drag and drop your CV
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, DOC, or DOCX (Max 5 MB) — Scanned PDFs supported via AI OCR
              </p>
            </div>
          </div>
        ) : (
          <div
            className="flex w-full items-center justify-between gap-3 rounded-lg bg-background p-3 border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{value.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(value.size)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled || isUploading}
              aria-label="Remove selected CV file"
              onClick={() => {
                if (inputRef.current) inputRef.current.value = "";
                onChange(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {isUploading && (
        <div className="space-y-1.5" aria-live="polite">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Uploading CV & queueing AI parser...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {displayError && (
        <div
          role="alert"
          className="flex items-center gap-1.5 text-xs font-medium text-destructive"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
