using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace hris_recruitment_be.view.DTOs
{
    public class JobStageDto
    {
        public int Id { get; set; }
        public int JobPostingId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string StageType { get; set; } = "SOURCING";
        public int Sequence { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class PipelineStageItemDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string StageType { get; set; } = "SOURCING";

        public int Sequence { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class PipelineStageConfigDto
    {
        [Required]
        public List<PipelineStageItemDto> Stages { get; set; } = new List<PipelineStageItemDto>();
    }

    public class JobPostingDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string EmploymentType { get; set; } = "FULL_TIME";
        public string Status { get; set; } = "DRAFT";
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
        public int ApplicantCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<JobStageDto> Stages { get; set; } = new List<JobStageDto>();
    }

    public class CreateJobPostingDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MaxLength(120)]
        public string Department { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string Location { get; set; } = string.Empty;

        public string EmploymentType { get; set; } = "FULL_TIME";
        public int Headcount { get; set; } = 1;
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public string Currency { get; set; } = "IDR";
        public string? SeoSlug { get; set; }
        public string? SeoMetaTitle { get; set; }
        public string? SeoMetaDescription { get; set; }
        public string? LogoPath { get; set; }
        public string? Theme { get; set; }
        public List<PipelineStageItemDto>? Stages { get; set; }
    }

    public class UpdateJobPostingDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MaxLength(120)]
        public string Department { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string Location { get; set; } = string.Empty;

        public string EmploymentType { get; set; } = "FULL_TIME";
        public string? Status { get; set; }
        public int Headcount { get; set; } = 1;
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public string Currency { get; set; } = "IDR";
        public string? SeoSlug { get; set; }
        public string? SeoMetaTitle { get; set; }
        public string? SeoMetaDescription { get; set; }
        public string? LogoPath { get; set; }
        public string? Theme { get; set; }
    }

    public class ApplicationDocumentDto
    {
        public int Id { get; set; }
        public int ApplicationId { get; set; }
        public string DocType { get; set; } = "CV";
        public string FileName { get; set; } = string.Empty;
        public string MimeType { get; set; } = "application/pdf";
        public long SizeBytes { get; set; }
        public string ParseStatus { get; set; } = "PENDING";
        public string? ExtractedText { get; set; }
        public string? ParsedJson { get; set; }
        public string? ErrorCode { get; set; }
        public int AttemptCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ApplicationDto
    {
        public int Id { get; set; }
        public int JobPostingId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public int CandidateId { get; set; }
        public string CandidateName { get; set; } = string.Empty;
        public string CandidateEmail { get; set; } = string.Empty;
        public string? CandidatePhone { get; set; }
        public int CurrentStageId { get; set; }
        public string CurrentStageName { get; set; } = string.Empty;
        public string CurrentStageType { get; set; } = "SOURCING";
        public string Status { get; set; } = "APPLIED";
        public DateTime AppliedAt { get; set; }
        public decimal? Score { get; set; }
        public string? Notes { get; set; }
        public DateTime? HiredAt { get; set; }
        public string CvParseStatus { get; set; } = "PENDING";
    }

    public class ApplicationDetailDto : ApplicationDto
    {
        public List<ApplicationDocumentDto> Documents { get; set; } = new List<ApplicationDocumentDto>();
    }

    public class MoveStageDto
    {
        public int? TargetStageId { get; set; }
        public string? TargetStageType { get; set; }
        public string? Notes { get; set; }
    }

    public class RejectApplicationDto
    {
        public string? Reason { get; set; }
    }

    public class HireApplicationDto
    {
        public string? Notes { get; set; }
    }

    public class CandidateDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string Source { get; set; } = "CAREER_PORTAL";
        public bool ConsentGiven { get; set; }
        public int ApplicationsCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class LoginRequestDto
    {
        [Required]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;

        public string? Role { get; set; } = "HR Admin";
    }

    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = "HR Admin";
        public DateTime ExpiresAt { get; set; }
    }
}
