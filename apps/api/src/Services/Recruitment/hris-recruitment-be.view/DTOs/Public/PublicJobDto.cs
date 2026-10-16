using System;
using System.ComponentModel.DataAnnotations;

namespace hris_recruitment_be.view.DTOs.Public
{
    public class PublicJobDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string EmploymentType { get; set; } = "FULL_TIME";
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public string Currency { get; set; } = "IDR";
        public string SeoSlug { get; set; } = string.Empty;
        public string? SeoMetaTitle { get; set; }
        public string? SeoMetaDescription { get; set; }
        public DateTime? PublishedAt { get; set; }
    }

    public class PublicJobDetailDto : PublicJobDto
    {
        public string Description { get; set; } = string.Empty;
        public int Headcount { get; set; } = 1;
        public string? LogoPath { get; set; }
        public string? Theme { get; set; }
    }

    public class SubmitApplicationDto
    {
        [Required]
        [MaxLength(160)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(160)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(40)]
        public string? Phone { get; set; }

        public string? Notes { get; set; }

        public bool ConsentAccepted { get; set; } = true;
    }

    public class ApplicationAcceptedDto
    {
        public int ApplicationId { get; set; }
        public string TrackingToken { get; set; } = string.Empty;
        public string Status { get; set; } = "RECEIVED";
    }

    public class ApplicationStatusDto
    {
        public int ApplicationId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string CandidateName { get; set; } = string.Empty;
        public string ApplicationStatus { get; set; } = "APPLIED";
        public string CurrentStageName { get; set; } = "Sourcing";
        public string CvParseStatus { get; set; } = "PENDING";
        public DateTime AppliedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
