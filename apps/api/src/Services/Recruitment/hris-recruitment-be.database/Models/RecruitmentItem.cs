using System;

namespace hris_recruitment_be.database.Models
{
    public abstract class AuditableEntity
    {
        public int Id { get; set; }
        public int Status { get; set; } = 1;
        public string CreatedBy { get; set; } = "system";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? ModifiedBy { get; set; }
        public DateTime? ModifiedAt { get; set; }
        public bool IsDeleted { get; set; } = false;
    }

    public static class AtsEnums
    {
        public static class EmploymentType
        {
            public const string FullTime = "FULL_TIME";
            public const string PartTime = "PART_TIME";
            public const string Contract = "CONTRACT";
            public const string Intern = "INTERN";
        }

        public static class JobStatus
        {
            public const string Draft = "DRAFT";
            public const string Open = "OPEN";
            public const string Closed = "CLOSED";
            public const string Archived = "ARCHIVED";
        }

        public static class PipelineStageType
        {
            public const string Sourcing = "SOURCING";
            public const string Screening = "SCREENING";
            public const string Interview = "INTERVIEW";
            public const string Offer = "OFFER";
            public const string Hired = "HIRED";

            public static readonly string[] DefaultSequence =
            {
                Sourcing,
                Screening,
                Interview,
                Offer,
                Hired
            };
        }

        public static class ApplicationStatus
        {
            public const string Applied = "APPLIED";
            public const string Screening = "SCREENING";
            public const string Interview = "INTERVIEW";
            public const string Offer = "OFFER";
            public const string Hired = "HIRED";
            public const string Rejected = "REJECTED";
            public const string Withdrawn = "WITHDRAWN";
        }

        public static class UploadParseStatus
        {
            public const string Pending = "PENDING";
            public const string Processing = "PROCESSING";
            public const string Ready = "READY";
            public const string Failed = "FAILED";
        }

        public static class InterviewStatus
        {
            public const string Scheduled = "SCHEDULED";
            public const string Rescheduled = "RESCHEDULED";
            public const string Completed = "COMPLETED";
            public const string Cancelled = "CANCELLED";
        }

        public static class OfferStatus
        {
            public const string Draft = "DRAFT";
            public const string Sent = "SENT";
            public const string Accepted = "ACCEPTED";
            public const string Declined = "DECLINED";
            public const string Expired = "EXPIRED";
        }
    }
}
