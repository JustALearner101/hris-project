using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using hris_recruitment_be.database.Models;

namespace hris_recruitment_be.database
{
    public class RecruitmentDbContext : DbContext
    {
        public RecruitmentDbContext(DbContextOptions<RecruitmentDbContext> options)
            : base(options)
        {
        }

        public DbSet<JobPosting> JobPostings { get; set; } = null!;
        public DbSet<JobStage> JobStages { get; set; } = null!;
        public DbSet<Candidate> Candidates { get; set; } = null!;
        public DbSet<Application> Applications { get; set; } = null!;
        public DbSet<ApplicationDocument> ApplicationDocuments { get; set; } = null!;
        public DbSet<Interview> Interviews { get; set; } = null!;
        public DbSet<Offer> Offers { get; set; } = null!;
        public DbSet<ApplicationSubmission> ApplicationSubmissions { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.HasDefaultSchema("ats");

            modelBuilder.Entity<JobPosting>(entity =>
            {
                entity.ToTable("tblt_job_postings");
                ConfigureAuditable(entity);

                entity.Property(e => e.Title).IsRequired().HasMaxLength(200).HasColumnName("title");
                entity.Property(e => e.Description).IsRequired().HasColumnName("description");
                entity.Property(e => e.Department).IsRequired().HasMaxLength(120).HasColumnName("department");
                entity.Property(e => e.Location).IsRequired().HasMaxLength(150).HasColumnName("location");
                entity.Property(e => e.EmploymentType).IsRequired().HasMaxLength(40).HasColumnName("employment_type");
                entity.Property(e => e.JobStatus).IsRequired().HasMaxLength(40).HasColumnName("job_status");
                entity.Property(e => e.Headcount).HasDefaultValue(1).HasColumnName("headcount");
                entity.Property(e => e.SalaryMin).HasColumnName("salary_min");
                entity.Property(e => e.SalaryMax).HasColumnName("salary_max");
                entity.Property(e => e.Currency).IsRequired().HasMaxLength(10).HasDefaultValue("IDR").HasColumnName("currency");
                entity.Property(e => e.SeoSlug).IsRequired().HasMaxLength(220).HasColumnName("seo_slug");
                entity.Property(e => e.SeoMetaTitle).HasMaxLength(200).HasColumnName("seo_meta_title");
                entity.Property(e => e.SeoMetaDescription).HasMaxLength(500).HasColumnName("seo_meta_description");
                entity.Property(e => e.LogoPath).HasMaxLength(500).HasColumnName("logo_path");
                entity.Property(e => e.Theme).HasMaxLength(100).HasColumnName("theme");
                entity.Property(e => e.OpenedAt).HasColumnName("opened_at");
                entity.Property(e => e.ClosedAt).HasColumnName("closed_at");
                entity.Property(e => e.PublishedAt).HasColumnName("published_at");

                entity.HasIndex(e => e.SeoSlug).IsUnique();
            });

            modelBuilder.Entity<JobStage>(entity =>
            {
                entity.ToTable("tblt_job_stages");
                ConfigureAuditable(entity);

                entity.Property(e => e.JobPostingId).HasColumnName("job_posting_id");
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100).HasColumnName("name");
                entity.Property(e => e.StageType).IsRequired().HasMaxLength(40).HasColumnName("stage_type");
                entity.Property(e => e.Sequence).HasColumnName("sequence");
                entity.Property(e => e.IsActive).HasDefaultValue(true).HasColumnName("is_active");

                entity.HasOne(e => e.JobPosting)
                    .WithMany(j => j.Stages)
                    .HasForeignKey(e => e.JobPostingId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => new { e.JobPostingId, e.Sequence }).IsUnique();
            });

            modelBuilder.Entity<Candidate>(entity =>
            {
                entity.ToTable("tblt_candidates");
                ConfigureAuditable(entity);

                entity.Property(e => e.FullName).IsRequired().HasMaxLength(160).HasColumnName("full_name");
                entity.Property(e => e.Email).IsRequired().HasMaxLength(160).HasColumnName("email");
                entity.Property(e => e.Phone).HasMaxLength(40).HasColumnName("phone");
                entity.Property(e => e.Source).IsRequired().HasMaxLength(60).HasColumnName("source");
                entity.Property(e => e.ConsentGiven).HasDefaultValue(true).HasColumnName("consent_given");
                entity.Property(e => e.ConsentTimestamp).HasColumnName("consent_timestamp");

                entity.HasIndex(e => e.Email)
                    .IsUnique()
                    .HasFilter("is_deleted = false");

                entity.HasIndex(e => e.Phone);
            });

            modelBuilder.Entity<Application>(entity =>
            {
                entity.ToTable("tblt_applications");
                ConfigureAuditable(entity);

                entity.Property(e => e.JobPostingId).HasColumnName("job_posting_id");
                entity.Property(e => e.CandidateId).HasColumnName("candidate_id");
                entity.Property(e => e.CurrentStageId).HasColumnName("current_stage_id");
                entity.Property(e => e.ApplicationStatus).IsRequired().HasMaxLength(40).HasColumnName("application_status");
                entity.Property(e => e.AppliedAt).HasColumnName("applied_at");
                entity.Property(e => e.Score).HasColumnName("score");
                entity.Property(e => e.Notes).HasColumnName("notes");
                entity.Property(e => e.HiredAt).HasColumnName("hired_at");
                entity.Property(e => e.TrackingTokenHash).IsRequired().HasMaxLength(128).HasColumnName("tracking_token_hash");

                entity.HasOne(e => e.JobPosting)
                    .WithMany(j => j.Applications)
                    .HasForeignKey(e => e.JobPostingId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Candidate)
                    .WithMany(c => c.Applications)
                    .HasForeignKey(e => e.CandidateId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.CurrentStage)
                    .WithMany()
                    .HasForeignKey(e => e.CurrentStageId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => new { e.JobPostingId, e.CandidateId }).IsUnique();
                entity.HasIndex(e => new { e.JobPostingId, e.ApplicationStatus });
                entity.HasIndex(e => e.TrackingTokenHash);
            });

            modelBuilder.Entity<ApplicationDocument>(entity =>
            {
                entity.ToTable("tblt_application_documents");
                ConfigureAuditable(entity);

                entity.Property(e => e.ApplicationId).HasColumnName("application_id");
                entity.Property(e => e.DocType).IsRequired().HasMaxLength(40).HasColumnName("doc_type");
                entity.Property(e => e.FileName).IsRequired().HasMaxLength(260).HasColumnName("file_name");
                entity.Property(e => e.StoragePath).IsRequired().HasMaxLength(500).HasColumnName("storage_path");
                entity.Property(e => e.MimeType).IsRequired().HasMaxLength(140).HasColumnName("mime_type");
                entity.Property(e => e.SizeBytes).HasColumnName("size_bytes");
                entity.Property(e => e.ContentHash).IsRequired().HasMaxLength(128).HasColumnName("content_hash");
                entity.Property(e => e.ParseStatus).IsRequired().HasMaxLength(40).HasColumnName("parse_status");
                entity.Property(e => e.ExtractedText).HasColumnName("extracted_text");
                entity.Property(e => e.ParsedJson).HasColumnName("parsed_json");
                entity.Property(e => e.ErrorCode).HasMaxLength(80).HasColumnName("error_code");
                entity.Property(e => e.AttemptCount).HasDefaultValue(0).HasColumnName("attempt_count");

                entity.HasOne(e => e.Application)
                    .WithMany(a => a.Documents)
                    .HasForeignKey(e => e.ApplicationId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.ApplicationId);
            });

            modelBuilder.Entity<Interview>(entity =>
            {
                entity.ToTable("tblt_interviews");
                ConfigureAuditable(entity);

                entity.Property(e => e.ApplicationId).HasColumnName("application_id");
                entity.Property(e => e.StageId).HasColumnName("stage_id");
                entity.Property(e => e.ScheduledAt).HasColumnName("scheduled_at");
                entity.Property(e => e.DurationMin).HasDefaultValue(60).HasColumnName("duration_min");
                entity.Property(e => e.Mode).IsRequired().HasMaxLength(40).HasColumnName("mode");
                entity.Property(e => e.CalendarProvider).HasMaxLength(60).HasColumnName("calendar_provider");
                entity.Property(e => e.CalendarEventId).HasMaxLength(160).HasColumnName("calendar_event_id");
                entity.Property(e => e.InterviewerEmails).HasColumnName("interviewer_emails");
                entity.Property(e => e.InterviewStatus).IsRequired().HasMaxLength(40).HasColumnName("interview_status");

                entity.HasOne(e => e.Application)
                    .WithMany(a => a.Interviews)
                    .HasForeignKey(e => e.ApplicationId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Stage)
                    .WithMany()
                    .HasForeignKey(e => e.StageId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.ApplicationId);
                entity.HasIndex(e => e.ScheduledAt);
            });

            modelBuilder.Entity<Offer>(entity =>
            {
                entity.ToTable("tblt_offers");
                ConfigureAuditable(entity);

                entity.Property(e => e.ApplicationId).HasColumnName("application_id");
                entity.Property(e => e.TemplateId).HasMaxLength(100).HasColumnName("template_id");
                entity.Property(e => e.Content).HasColumnName("content");
                entity.Property(e => e.Salary).HasColumnName("salary");
                entity.Property(e => e.Currency).IsRequired().HasMaxLength(10).HasColumnName("currency");
                entity.Property(e => e.OfferStatus).IsRequired().HasMaxLength(40).HasColumnName("offer_status");
                entity.Property(e => e.EsignRef).HasMaxLength(160).HasColumnName("esign_ref");
                entity.Property(e => e.SentAt).HasColumnName("sent_at");
                entity.Property(e => e.RespondedAt).HasColumnName("responded_at");

                entity.HasOne(e => e.Application)
                    .WithMany(a => a.Offers)
                    .HasForeignKey(e => e.ApplicationId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.ApplicationId);
            });

            modelBuilder.Entity<ApplicationSubmission>(entity =>
            {
                entity.ToTable("tblt_application_submissions");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.IdempotencyKey).IsRequired().HasMaxLength(140).HasColumnName("idempotency_key");
                entity.Property(e => e.ApplicationId).HasColumnName("application_id");
                entity.Property(e => e.RequestHash).IsRequired().HasMaxLength(128).HasColumnName("request_hash");
                entity.Property(e => e.ResponseJson).IsRequired().HasColumnName("response_json");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");

                entity.HasOne(e => e.Application)
                    .WithMany()
                    .HasForeignKey(e => e.ApplicationId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.IdempotencyKey).IsUnique();
            });
        }

        private static void ConfigureAuditable<T>(EntityTypeBuilder<T> entity) where T : AuditableEntity
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Status).HasDefaultValue(1).HasColumnName("status");
            entity.Property(e => e.CreatedBy).IsRequired().HasMaxLength(100).HasColumnName("created_by");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.ModifiedBy).HasMaxLength(100).HasColumnName("modified_by");
            entity.Property(e => e.ModifiedAt).HasColumnName("modified_at");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false).HasColumnName("is_deleted");
        }
    }
}
