using System;
using System.Collections.Generic;

namespace hris_recruitment_be.database.Models
{
    public class JobPosting : AuditableEntity
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string EmploymentType { get; set; } = AtsEnums.EmploymentType.FullTime;
        public string JobStatus { get; set; } = AtsEnums.JobStatus.Draft;
        public int Headcount { get; set; } = 1;
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public string Currency { get; set; } = "IDR";
        public string SeoSlug { get; set; } = string.Empty;
        public string? SeoMetaTitle { get; set; }
        public string? SeoMetaDescription { get; set; }
        public string? LogoPath { get; set; }
        public string? Theme { get; set; }
        public DateTime? OpenedAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        public DateTime? PublishedAt { get; set; }

        public List<JobStage> Stages { get; set; } = new List<JobStage>();
        public List<Application> Applications { get; set; } = new List<Application>();
    }

    public class JobStage : AuditableEntity
    {
        public int JobPostingId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string StageType { get; set; } = AtsEnums.PipelineStageType.Sourcing;
        public int Sequence { get; set; }
        public bool IsActive { get; set; } = true;

        public JobPosting? JobPosting { get; set; }
    }

    public class Candidate : AuditableEntity
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string Source { get; set; } = "CAREER_PORTAL";
        public bool ConsentGiven { get; set; } = true;
        public DateTime? ConsentTimestamp { get; set; } = DateTime.UtcNow;

        public List<Application> Applications { get; set; } = new List<Application>();
    }

    public class Application : AuditableEntity
    {
        public int JobPostingId { get; set; }
        public int CandidateId { get; set; }
        public int CurrentStageId { get; set; }
        public string ApplicationStatus { get; set; } = AtsEnums.ApplicationStatus.Applied;
        public DateTime AppliedAt { get; set; } = DateTime.UtcNow;
        public decimal? Score { get; set; }
        public string? Notes { get; set; }
        public DateTime? HiredAt { get; set; }
        public string TrackingTokenHash { get; set; } = string.Empty;

        public JobPosting? JobPosting { get; set; }
        public Candidate? Candidate { get; set; }
        public JobStage? CurrentStage { get; set; }
        public List<ApplicationDocument> Documents { get; set; } = new List<ApplicationDocument>();
        public List<Interview> Interviews { get; set; } = new List<Interview>();
        public List<Offer> Offers { get; set; } = new List<Offer>();
    }

    public class ApplicationDocument : AuditableEntity
    {
        public int ApplicationId { get; set; }
        public string DocType { get; set; } = "CV";
        public string FileName { get; set; } = string.Empty;
        public string StoragePath { get; set; } = string.Empty;
        public string MimeType { get; set; } = "application/pdf";
        public long SizeBytes { get; set; }
        public string ContentHash { get; set; } = string.Empty;
        public string ParseStatus { get; set; } = AtsEnums.UploadParseStatus.Pending;
        public string? ExtractedText { get; set; }
        public string? ParsedJson { get; set; }
        public string? ErrorCode { get; set; }
        public int AttemptCount { get; set; } = 0;

        public Application? Application { get; set; }
    }

    public class Interview : AuditableEntity
    {
        public int ApplicationId { get; set; }
        public int StageId { get; set; }
        public DateTime ScheduledAt { get; set; }
        public int DurationMin { get; set; } = 60;
        public string Mode { get; set; } = "ONLINE";
        public string? CalendarProvider { get; set; }
        public string? CalendarEventId { get; set; }
        public string? InterviewerEmails { get; set; }
        public string InterviewStatus { get; set; } = AtsEnums.InterviewStatus.Scheduled;

        public Application? Application { get; set; }
        public JobStage? Stage { get; set; }
    }

    public class Offer : AuditableEntity
    {
        public int ApplicationId { get; set; }
        public string? TemplateId { get; set; }
        public string? Content { get; set; }
        public decimal Salary { get; set; }
        public string Currency { get; set; } = "IDR";
        public string OfferStatus { get; set; } = AtsEnums.OfferStatus.Draft;
        public string? EsignRef { get; set; }
        public DateTime? SentAt { get; set; }
        public DateTime? RespondedAt { get; set; }

        public Application? Application { get; set; }
    }

    public class ApplicationSubmission
    {
        public int Id { get; set; }
        public string IdempotencyKey { get; set; } = string.Empty;
        public int ApplicationId { get; set; }
        public string RequestHash { get; set; } = string.Empty;
        public string ResponseJson { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Application? Application { get; set; }
    }
}
