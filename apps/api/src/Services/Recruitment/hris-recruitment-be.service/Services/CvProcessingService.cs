using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using hris_recruitment_be.database;
using hris_recruitment_be.database.Models;
using hris_recruitment_be.lib.DefaultDTO;
using hris_recruitment_be.lib.Storage;
using hris_recruitment_be.lib.Utils;
using hris_recruitment_be.service.Events;
using hris_recruitment_be.view.DTOs.Integration;
using hris_recruitment_be.view.DTOs.Public;

namespace hris_recruitment_be.service.Services
{
    public interface IPublicJobService
    {
        Task<DefaultDtoResponse<PublicJobDto>> GetPublishedJobsAsync(DefaultDtoPagingParams paging);
        Task<DefaultDtoResponse<PublicJobDetailDto>> GetPublishedJobBySlugAsync(string slug);
        Task<DefaultDtoResponse<ApplicationStatusDto>> GetApplicationStatusByTokenAsync(string rawToken);
    }

    public class PublicJobService : IPublicJobService
    {
        private readonly IUnitOfWork _unitOfWork;

        public PublicJobService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<DefaultDtoResponse<PublicJobDto>> GetPublishedJobsAsync(DefaultDtoPagingParams paging)
        {
            var query = _unitOfWork.JobPostings
                .Queryable(j => !j.IsDeleted && j.JobStatus == AtsEnums.JobStatus.Open)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(paging.Search))
            {
                var term = paging.Search.Trim().ToLower();
                query = query.Where(j =>
                    j.Title.ToLower().Contains(term) ||
                    j.Department.ToLower().Contains(term) ||
                    j.Location.ToLower().Contains(term));
            }

            var total = await query.CountAsync();
            var limit = paging.Limit <= 0 ? 12 : paging.Limit;
            var offset = paging.Offset < 0 ? 0 : paging.Offset;

            var jobs = await query
                .OrderByDescending(j => j.PublishedAt ?? j.CreatedAt)
                .Skip(offset)
                .Take(limit)
                .ToListAsync();

            var dtos = jobs.Select(j => new PublicJobDto
            {
                Id = j.Id,
                Title = j.Title,
                Department = j.Department,
                Location = j.Location,
                EmploymentType = j.EmploymentType,
                SalaryMin = j.SalaryMin,
                SalaryMax = j.SalaryMax,
                Currency = j.Currency,
                SeoSlug = j.SeoSlug,
                SeoMetaTitle = j.SeoMetaTitle,
                SeoMetaDescription = j.SeoMetaDescription,
                PublishedAt = j.PublishedAt
            }).ToList();

            return BuildResponseUtil.Success(dtos, total);
        }

        public async Task<DefaultDtoResponse<PublicJobDetailDto>> GetPublishedJobBySlugAsync(string slug)
        {
            if (string.IsNullOrWhiteSpace(slug))
            {
                return BuildResponseUtil.Error<PublicJobDetailDto>("Job slug is required.", "ERR_NOT_FOUND");
            }

            var normalizedSlug = slug.Trim().ToLowerInvariant();
            var job = await _unitOfWork.JobPostings
                .Queryable(j => !j.IsDeleted && j.JobStatus == AtsEnums.JobStatus.Open && j.SeoSlug == normalizedSlug)
                .FirstOrDefaultAsync();

            if (job == null)
            {
                return BuildResponseUtil.Error<PublicJobDetailDto>($"Published job '{slug}' not found.", "ERR_NOT_FOUND");
            }

            var dto = new PublicJobDetailDto
            {
                Id = job.Id,
                Title = job.Title,
                Description = job.Description,
                Department = job.Department,
                Location = job.Location,
                EmploymentType = job.EmploymentType,
                Headcount = job.Headcount,
                SalaryMin = job.SalaryMin,
                SalaryMax = job.SalaryMax,
                Currency = job.Currency,
                SeoSlug = job.SeoSlug,
                SeoMetaTitle = job.SeoMetaTitle,
                SeoMetaDescription = job.SeoMetaDescription,
                LogoPath = job.LogoPath,
                Theme = job.Theme,
                PublishedAt = job.PublishedAt
            };

            return BuildResponseUtil.Success(new List<PublicJobDetailDto> { dto }, 1);
        }

        public async Task<DefaultDtoResponse<ApplicationStatusDto>> GetApplicationStatusByTokenAsync(string rawToken)
        {
            if (string.IsNullOrWhiteSpace(rawToken))
            {
                return BuildResponseUtil.Error<ApplicationStatusDto>("Tracking token is required.", "ERR_NOT_FOUND");
            }

            var tokenHash = TrackingTokenUtil.HashToken(rawToken);
            var app = await _unitOfWork.Applications
                .Queryable(a => !a.IsDeleted && a.TrackingTokenHash == tokenHash)
                .Include(a => a.JobPosting)
                .Include(a => a.Candidate)
                .Include(a => a.CurrentStage)
                .Include(a => a.Documents)
                .FirstOrDefaultAsync();

            if (app == null)
            {
                return BuildResponseUtil.Error<ApplicationStatusDto>("Application tracking token not found.", "ERR_NOT_FOUND");
            }

            var latestDoc = app.Documents?
                .Where(d => !d.IsDeleted)
                .OrderByDescending(d => d.CreatedAt)
                .FirstOrDefault();

            var dto = new ApplicationStatusDto
            {
                ApplicationId = app.Id,
                JobTitle = app.JobPosting?.Title ?? string.Empty,
                Department = app.JobPosting?.Department ?? string.Empty,
                Location = app.JobPosting?.Location ?? string.Empty,
                CandidateName = MaskCandidateName(app.Candidate?.FullName),
                ApplicationStatus = app.ApplicationStatus,
                CurrentStageName = app.CurrentStage?.Name ?? "Sourcing",
                CvParseStatus = latestDoc?.ParseStatus ?? AtsEnums.UploadParseStatus.Pending,
                AppliedAt = app.AppliedAt,
                UpdatedAt = app.ModifiedAt ?? latestDoc?.ModifiedAt ?? app.AppliedAt
            };

            return BuildResponseUtil.Success(new List<ApplicationStatusDto> { dto }, 1);
        }

        private static string MaskCandidateName(string? fullName)
        {
            if (string.IsNullOrWhiteSpace(fullName))
            {
                return "Applicant";
            }

            var parts = fullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 1)
            {
                return parts[0];
            }

            return $"{parts[0]} {parts[^1][0]}.";
        }
    }

    public interface ICvProcessingService
    {
        Task<DefaultDtoResponse<ApplicationAcceptedDto>> SubmitApplicationAsync(
            int jobPostingId,
            SubmitApplicationDto dto,
            string fileName,
            byte[] fileBytes,
            string? idempotencyKey = null,
            CancellationToken cancellationToken = default);

        Task<bool> HandleCvParsedAsync(CvParsedEventData data, CancellationToken cancellationToken = default);
        Task<bool> HandleCvFailedAsync(CvFailedEventData data, CancellationToken cancellationToken = default);
    }

    public class CvProcessingService : ICvProcessingService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IDocumentStorage _documentStorage;
        private readonly IEventPublisher _eventPublisher;

        public CvProcessingService(
            IUnitOfWork unitOfWork,
            IDocumentStorage documentStorage,
            IEventPublisher eventPublisher)
        {
            _unitOfWork = unitOfWork;
            _documentStorage = documentStorage;
            _eventPublisher = eventPublisher;
        }

        public async Task<DefaultDtoResponse<ApplicationAcceptedDto>> SubmitApplicationAsync(
            int jobPostingId,
            SubmitApplicationDto dto,
            string fileName,
            byte[] fileBytes,
            string? idempotencyKey = null,
            CancellationToken cancellationToken = default)
        {
            if (!string.IsNullOrWhiteSpace(idempotencyKey))
            {
                var existingSubmission = await _unitOfWork.ApplicationSubmissions
                    .Queryable(s => s.IdempotencyKey == idempotencyKey.Trim())
                    .FirstOrDefaultAsync(cancellationToken);

                if (existingSubmission != null && !string.IsNullOrWhiteSpace(existingSubmission.ResponseJson))
                {
                    var cachedResponse = JsonSerializer.Deserialize<DefaultDtoResponse<ApplicationAcceptedDto>>(existingSubmission.ResponseJson);
                    if (cachedResponse != null)
                    {
                        return cachedResponse;
                    }
                }
            }

            var job = await _unitOfWork.JobPostings
                .Queryable(j => j.Id == jobPostingId && !j.IsDeleted)
                .Include(j => j.Stages)
                .FirstOrDefaultAsync(cancellationToken);

            if (job == null)
            {
                return BuildResponseUtil.Error<ApplicationAcceptedDto>($"Job posting with ID {jobPostingId} not found.", "ERR_NOT_FOUND");
            }

            if (job.JobStatus != AtsEnums.JobStatus.Open)
            {
                return BuildResponseUtil.Error<ApplicationAcceptedDto>("This job posting is not currently accepting applications.", "ERR_JOB_NOT_PUBLISHED");
            }

            // Pre-validate CV file magic bytes & size before DB mutations
            try
            {
                LocalDiskStorage.ValidateAndSniffFile(fileName, fileBytes);
            }
            catch (DocumentValidationException ex)
            {
                return BuildResponseUtil.Error<ApplicationAcceptedDto>(ex.Message, ex.ErrorCode);
            }

            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
            var normalizedPhone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim();

            // Silently reuse existing candidate on duplicate email/phone to prevent enumeration
            var candidate = await _unitOfWork.Candidates
                .Queryable(c => !c.IsDeleted && (
                    c.Email.ToLower() == normalizedEmail ||
                    (normalizedPhone != null && c.Phone == normalizedPhone)))
                .FirstOrDefaultAsync(cancellationToken);

            var now = DateTime.UtcNow;
            if (candidate == null)
            {
                candidate = new Candidate
                {
                    FullName = dto.FullName.Trim(),
                    Email = normalizedEmail,
                    Phone = normalizedPhone,
                    Source = "CAREER_PORTAL",
                    ConsentGiven = dto.ConsentAccepted,
                    ConsentTimestamp = now,
                    CreatedBy = "candidate",
                    CreatedAt = now
                };
                await _unitOfWork.Candidates.AddAsync(candidate);
            }
            else
            {
                candidate.FullName = dto.FullName.Trim();
                if (normalizedPhone != null)
                {
                    candidate.Phone = normalizedPhone;
                }
                candidate.ConsentGiven = dto.ConsentAccepted;
                candidate.ConsentTimestamp = now;
                candidate.ModifiedBy = "candidate";
                candidate.ModifiedAt = now;
                await _unitOfWork.Candidates.UpdateAsync(candidate);
            }

            var sourcingStage = job.Stages
                .Where(s => !s.IsDeleted)
                .OrderBy(s => s.Sequence)
                .FirstOrDefault();

            if (sourcingStage == null)
            {
                sourcingStage = new JobStage
                {
                    JobPostingId = job.Id,
                    Name = "Sourcing",
                    StageType = AtsEnums.PipelineStageType.Sourcing,
                    Sequence = 1,
                    IsActive = true,
                    CreatedBy = "system",
                    CreatedAt = now
                };
                await _unitOfWork.JobStages.AddAsync(sourcingStage);
            }

            var existingApplication = await _unitOfWork.Applications
                .Queryable(a => a.JobPostingId == job.Id && a.CandidateId == candidate.Id && !a.IsDeleted)
                .FirstOrDefaultAsync(cancellationToken);

            var (rawToken, tokenHash) = TrackingTokenUtil.GenerateToken();

            Application application;
            if (existingApplication == null)
            {
                application = new Application
                {
                    JobPostingId = job.Id,
                    CandidateId = candidate.Id,
                    CurrentStageId = sourcingStage.Id,
                    ApplicationStatus = AtsEnums.ApplicationStatus.Applied,
                    AppliedAt = now,
                    Notes = HtmlSanitizerUtil.Sanitize(dto.Notes),
                    TrackingTokenHash = tokenHash,
                    CreatedBy = "candidate",
                    CreatedAt = now
                };
                await _unitOfWork.Applications.AddAsync(application);
            }
            else
            {
                application = existingApplication;
                application.TrackingTokenHash = tokenHash;
                application.Notes = HtmlSanitizerUtil.Sanitize(dto.Notes) ?? application.Notes;
                application.ModifiedBy = "candidate";
                application.ModifiedAt = now;
                await _unitOfWork.Applications.UpdateAsync(application);
            }

            var storedFile = await _documentStorage.SaveCvAsync(
                application.Id,
                fileName,
                fileBytes,
                cancellationToken);

            var document = new ApplicationDocument
            {
                ApplicationId = application.Id,
                DocType = "CV",
                FileName = fileName,
                StoragePath = storedFile.RelativePath,
                MimeType = storedFile.DetectedMimeType,
                SizeBytes = storedFile.SizeBytes,
                ContentHash = storedFile.ContentHash,
                ParseStatus = AtsEnums.UploadParseStatus.Pending,
                AttemptCount = 1,
                CreatedBy = "candidate",
                CreatedAt = now
            };

            await _unitOfWork.ApplicationDocuments.AddAsync(document);

            var acceptedDto = new ApplicationAcceptedDto
            {
                ApplicationId = application.Id,
                TrackingToken = rawToken,
                Status = "RECEIVED"
            };

            var response = BuildResponseUtil.Success(new List<ApplicationAcceptedDto> { acceptedDto }, 1, "info", "Application received and queued for CV parsing.");

            if (!string.IsNullOrWhiteSpace(idempotencyKey))
            {
                var reqHashBytes = SHA256.HashData(Encoding.UTF8.GetBytes($"{jobPostingId}:{normalizedEmail}:{storedFile.ContentHash}"));
                var submission = new ApplicationSubmission
                {
                    IdempotencyKey = idempotencyKey.Trim(),
                    ApplicationId = application.Id,
                    RequestHash = Convert.ToHexString(reqHashBytes).ToLowerInvariant(),
                    ResponseJson = JsonSerializer.Serialize(response),
                    CreatedAt = now
                };
                await _unitOfWork.ApplicationSubmissions.AddAsync(submission);
            }

            await _eventPublisher.PublishAsync(
                streamName: "candidate.cv.uploaded",
                eventType: "candidate.cv.uploaded",
                entityId: application.Id.ToString(),
                data: new CvUploadedEventData
                {
                    ApplicationId = application.Id,
                    DocumentId = document.Id,
                    StoragePath = storedFile.RelativePath,
                    MimeType = storedFile.DetectedMimeType,
                    Attempt = 1
                },
                cancellationToken: cancellationToken);

            return response;
        }

        public async Task<bool> HandleCvParsedAsync(CvParsedEventData data, CancellationToken cancellationToken = default)
        {
            var doc = await _unitOfWork.ApplicationDocuments
                .Queryable(d => d.Id == data.DocumentId && !d.IsDeleted)
                .FirstOrDefaultAsync(cancellationToken);

            if (doc == null)
            {
                return false;
            }

            // Idempotent guard: if already READY with same content, no-op
            if (doc.ParseStatus == AtsEnums.UploadParseStatus.Ready && !string.IsNullOrWhiteSpace(doc.ParsedJson))
            {
                return true;
            }

            doc.ParseStatus = AtsEnums.UploadParseStatus.Ready;
            doc.ParsedJson = data.ParsedJson;
            doc.ExtractedText = data.ExtractedText;
            doc.ErrorCode = null;
            doc.ModifiedBy = "cv-worker";
            doc.ModifiedAt = DateTime.UtcNow;

            await _unitOfWork.ApplicationDocuments.UpdateAsync(doc);
            return true;
        }

        public async Task<bool> HandleCvFailedAsync(CvFailedEventData data, CancellationToken cancellationToken = default)
        {
            var doc = await _unitOfWork.ApplicationDocuments
                .Queryable(d => d.Id == data.DocumentId && !d.IsDeleted)
                .FirstOrDefaultAsync(cancellationToken);

            if (doc == null)
            {
                return false;
            }

            doc.ParseStatus = AtsEnums.UploadParseStatus.Failed;
            doc.ErrorCode = string.IsNullOrWhiteSpace(data.ErrorCode) ? "ERR_PARSE_FAILED" : data.ErrorCode;
            doc.AttemptCount = Math.Max(doc.AttemptCount, data.Attempt);
            doc.ModifiedBy = "cv-worker";
            doc.ModifiedAt = DateTime.UtcNow;

            await _unitOfWork.ApplicationDocuments.UpdateAsync(doc);
            return true;
        }
    }
}
