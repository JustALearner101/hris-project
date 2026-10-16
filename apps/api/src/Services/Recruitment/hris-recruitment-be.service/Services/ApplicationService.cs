using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using hris_recruitment_be.database;
using hris_recruitment_be.database.Models;
using hris_recruitment_be.lib.DefaultDTO;
using hris_recruitment_be.lib.Storage;
using hris_recruitment_be.lib.Utils;
using hris_recruitment_be.service.Events;
using hris_recruitment_be.view.DTOs;
using hris_recruitment_be.view.DTOs.Integration;

namespace hris_recruitment_be.service.Services
{
    public interface IApplicationService
    {
        Task<DefaultDtoResponse<ApplicationDto>> GetApplicationsAsync(
            int? jobPostingId,
            string? stage,
            DefaultDtoPagingParams paging);
        Task<DefaultDtoResponse<ApplicationDetailDto>> GetApplicationByIdAsync(int id);
        Task<DefaultDtoResponse<ApplicationDetailDto>> MoveStageAsync(int id, MoveStageDto dto, string actor = "system");
        Task<DefaultDtoResponse<ApplicationDetailDto>> RejectApplicationAsync(int id, RejectApplicationDto dto, string actor = "system");
        Task<DefaultDtoResponse<ApplicationDetailDto>> HireApplicationAsync(int id, HireApplicationDto dto, string actor = "system");
        Task<(Stream Stream, string FileName, string MimeType)?> GetDocumentStreamAsync(int applicationId, int documentId);
    }

    public class ApplicationService : IApplicationService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IEventPublisher _eventPublisher;
        private readonly IDocumentStorage _documentStorage;

        public ApplicationService(
            IUnitOfWork unitOfWork,
            IEventPublisher eventPublisher,
            IDocumentStorage documentStorage)
        {
            _unitOfWork = unitOfWork;
            _eventPublisher = eventPublisher;
            _documentStorage = documentStorage;
        }

        public async Task<DefaultDtoResponse<ApplicationDto>> GetApplicationsAsync(
            int? jobPostingId,
            string? stage,
            DefaultDtoPagingParams paging)
        {
            var query = _unitOfWork.Applications
                .Queryable(a => !a.IsDeleted)
                .Include(a => a.JobPosting)
                .Include(a => a.Candidate)
                .Include(a => a.CurrentStage)
                .Include(a => a.Documents)
                .AsQueryable();

            if (jobPostingId.HasValue && jobPostingId.Value > 0)
            {
                query = query.Where(a => a.JobPostingId == jobPostingId.Value);
            }

            if (!string.IsNullOrWhiteSpace(stage))
            {
                var normalizedStage = stage.Trim().ToUpperInvariant();
                query = query.Where(a =>
                    (a.CurrentStage != null && a.CurrentStage.StageType == normalizedStage) ||
                    a.ApplicationStatus == normalizedStage);
            }

            if (!string.IsNullOrWhiteSpace(paging.Search))
            {
                var term = paging.Search.Trim().ToLower();
                query = query.Where(a =>
                    (a.Candidate != null && (
                        a.Candidate.FullName.ToLower().Contains(term) ||
                        a.Candidate.Email.ToLower().Contains(term))) ||
                    (a.JobPosting != null && a.JobPosting.Title.ToLower().Contains(term)));
            }

            var total = await query.CountAsync();
            var limit = paging.Limit <= 0 ? 20 : paging.Limit;
            var offset = paging.Offset < 0 ? 0 : paging.Offset;

            var items = await query
                .OrderByDescending(a => a.AppliedAt)
                .Skip(offset)
                .Take(limit)
                .ToListAsync();

            var dtos = items.Select(MapToDto).ToList();
            return BuildResponseUtil.Success(dtos, total);
        }

        public async Task<DefaultDtoResponse<ApplicationDetailDto>> GetApplicationByIdAsync(int id)
        {
            var app = await _unitOfWork.Applications
                .Queryable(a => a.Id == id && !a.IsDeleted)
                .Include(a => a.JobPosting)
                .Include(a => a.Candidate)
                .Include(a => a.CurrentStage)
                .Include(a => a.Documents)
                .FirstOrDefaultAsync();

            if (app == null)
            {
                return BuildResponseUtil.Error<ApplicationDetailDto>($"Application with ID {id} not found.", "ERR_NOT_FOUND");
            }

            return BuildResponseUtil.Success(new List<ApplicationDetailDto> { MapToDetailDto(app) }, 1);
        }

        public async Task<DefaultDtoResponse<ApplicationDetailDto>> MoveStageAsync(int id, MoveStageDto dto, string actor = "system")
        {
            var app = await _unitOfWork.Applications
                .Queryable(a => a.Id == id && !a.IsDeleted)
                .Include(a => a.JobPosting)
                .Include(a => a.Candidate)
                .Include(a => a.CurrentStage)
                .Include(a => a.Documents)
                .FirstOrDefaultAsync();

            if (app == null)
            {
                return BuildResponseUtil.Error<ApplicationDetailDto>($"Application with ID {id} not found.", "ERR_NOT_FOUND");
            }

            if (app.ApplicationStatus == AtsEnums.ApplicationStatus.Rejected ||
                app.ApplicationStatus == AtsEnums.ApplicationStatus.Withdrawn)
            {
                return BuildResponseUtil.Error<ApplicationDetailDto>(
                    $"Cannot move stage for an application in '{app.ApplicationStatus}' state.",
                    "ERR_INVALID_TRANSITION");
            }

            if (app.ApplicationStatus == AtsEnums.ApplicationStatus.Hired)
            {
                return BuildResponseUtil.Error<ApplicationDetailDto>(
                    "Cannot move stage for an already hired application.",
                    "ERR_INVALID_TRANSITION");
            }

            JobStage? targetStage = null;
            if (dto.TargetStageId.HasValue && dto.TargetStageId.Value > 0)
            {
                targetStage = await _unitOfWork.JobStages
                    .Queryable(s => s.Id == dto.TargetStageId.Value && s.JobPostingId == app.JobPostingId && !s.IsDeleted)
                    .FirstOrDefaultAsync();
            }
            else if (!string.IsNullOrWhiteSpace(dto.TargetStageType))
            {
                var normalizedType = dto.TargetStageType.Trim().ToUpperInvariant();
                targetStage = await _unitOfWork.JobStages
                    .Queryable(s => s.JobPostingId == app.JobPostingId && s.StageType == normalizedType && !s.IsDeleted)
                    .OrderBy(s => s.Sequence)
                    .FirstOrDefaultAsync();
            }

            if (targetStage == null)
            {
                return BuildResponseUtil.Error<ApplicationDetailDto>("Target stage is invalid for this job posting.", "ERR_INVALID_STAGE");
            }

            if (targetStage.StageType == AtsEnums.PipelineStageType.Hired)
            {
                return await HireApplicationAsync(id, new HireApplicationDto { Notes = dto.Notes }, actor);
            }

            app.CurrentStageId = targetStage.Id;
            app.CurrentStage = targetStage;
            app.ApplicationStatus = MapStageTypeToApplicationStatus(targetStage.StageType);

            if (!string.IsNullOrWhiteSpace(dto.Notes))
            {
                app.Notes = HtmlSanitizerUtil.Sanitize(dto.Notes);
            }

            app.ModifiedBy = actor;
            app.ModifiedAt = DateTime.UtcNow;

            await _unitOfWork.Applications.UpdateAsync(app);
            return BuildResponseUtil.Success(new List<ApplicationDetailDto> { MapToDetailDto(app) }, 1, "info", "Stage updated.");
        }

        public async Task<DefaultDtoResponse<ApplicationDetailDto>> RejectApplicationAsync(int id, RejectApplicationDto dto, string actor = "system")
        {
            var app = await _unitOfWork.Applications
                .Queryable(a => a.Id == id && !a.IsDeleted)
                .Include(a => a.JobPosting)
                .Include(a => a.Candidate)
                .Include(a => a.CurrentStage)
                .Include(a => a.Documents)
                .FirstOrDefaultAsync();

            if (app == null)
            {
                return BuildResponseUtil.Error<ApplicationDetailDto>($"Application with ID {id} not found.", "ERR_NOT_FOUND");
            }

            if (app.ApplicationStatus == AtsEnums.ApplicationStatus.Hired)
            {
                return BuildResponseUtil.Error<ApplicationDetailDto>("Cannot reject an already hired application.", "ERR_INVALID_TRANSITION");
            }

            app.ApplicationStatus = AtsEnums.ApplicationStatus.Rejected;
            if (!string.IsNullOrWhiteSpace(dto.Reason))
            {
                app.Notes = HtmlSanitizerUtil.Sanitize(dto.Reason);
            }

            app.ModifiedBy = actor;
            app.ModifiedAt = DateTime.UtcNow;

            await _unitOfWork.Applications.UpdateAsync(app);
            return BuildResponseUtil.Success(new List<ApplicationDetailDto> { MapToDetailDto(app) }, 1, "info", "Application rejected.");
        }

        public async Task<DefaultDtoResponse<ApplicationDetailDto>> HireApplicationAsync(int id, HireApplicationDto dto, string actor = "system")
        {
            var app = await _unitOfWork.Applications
                .Queryable(a => a.Id == id && !a.IsDeleted)
                .Include(a => a.JobPosting)
                .Include(a => a.Candidate)
                .Include(a => a.CurrentStage)
                .Include(a => a.Documents)
                .FirstOrDefaultAsync();

            if (app == null)
            {
                return BuildResponseUtil.Error<ApplicationDetailDto>($"Application with ID {id} not found.", "ERR_NOT_FOUND");
            }

            if (app.HiredAt.HasValue || app.ApplicationStatus == AtsEnums.ApplicationStatus.Hired)
            {
                return BuildResponseUtil.Error<ApplicationDetailDto>("Application has already been hired.", "ERR_ALREADY_HIRED");
            }

            if (app.ApplicationStatus == AtsEnums.ApplicationStatus.Rejected ||
                app.ApplicationStatus == AtsEnums.ApplicationStatus.Withdrawn)
            {
                return BuildResponseUtil.Error<ApplicationDetailDto>(
                    $"Cannot hire an application in '{app.ApplicationStatus}' state.",
                    "ERR_INVALID_TRANSITION");
            }

            var hiredStage = await _unitOfWork.JobStages
                .Queryable(s => s.JobPostingId == app.JobPostingId && s.StageType == AtsEnums.PipelineStageType.Hired && !s.IsDeleted)
                .FirstOrDefaultAsync();

            if (hiredStage != null)
            {
                app.CurrentStageId = hiredStage.Id;
                app.CurrentStage = hiredStage;
            }

            var now = DateTime.UtcNow;
            app.ApplicationStatus = AtsEnums.ApplicationStatus.Hired;
            app.HiredAt = now;
            if (!string.IsNullOrWhiteSpace(dto.Notes))
            {
                app.Notes = HtmlSanitizerUtil.Sanitize(dto.Notes);
            }
            app.ModifiedBy = actor;
            app.ModifiedAt = now;

            // Persist hired_at first before emitting candidate.hired
            await _unitOfWork.Applications.UpdateAsync(app);

            await _eventPublisher.PublishAsync(
                streamName: "candidate.hired",
                eventType: "candidate.hired",
                entityId: app.Id.ToString(),
                data: new CandidateHiredEventData
                {
                    ApplicationId = app.Id,
                    CandidateId = app.CandidateId,
                    JobPostingId = app.JobPostingId,
                    HiredAt = now.ToString("O")
                });

            return BuildResponseUtil.Success(new List<ApplicationDetailDto> { MapToDetailDto(app) }, 1, "info", "Candidate hired and event emitted.");
        }

        public async Task<(Stream Stream, string FileName, string MimeType)?> GetDocumentStreamAsync(int applicationId, int documentId)
        {
            var doc = await _unitOfWork.ApplicationDocuments
                .Queryable(d => d.Id == documentId && d.ApplicationId == applicationId && !d.IsDeleted)
                .FirstOrDefaultAsync();

            if (doc == null)
            {
                return null;
            }

            var (stream, fileName) = await _documentStorage.OpenReadAsync(doc.StoragePath, doc.FileName);
            return (stream, fileName, doc.MimeType);
        }

        public static string MapStageTypeToApplicationStatus(string stageType)
        {
            return stageType.Trim().ToUpperInvariant() switch
            {
                AtsEnums.PipelineStageType.Sourcing => AtsEnums.ApplicationStatus.Applied,
                AtsEnums.PipelineStageType.Screening => AtsEnums.ApplicationStatus.Screening,
                AtsEnums.PipelineStageType.Interview => AtsEnums.ApplicationStatus.Interview,
                AtsEnums.PipelineStageType.Offer => AtsEnums.ApplicationStatus.Offer,
                AtsEnums.PipelineStageType.Hired => AtsEnums.ApplicationStatus.Hired,
                _ => AtsEnums.ApplicationStatus.Applied
            };
        }

        public static ApplicationDto MapToDto(Application app)
        {
            var latestDoc = app.Documents?
                .Where(d => !d.IsDeleted)
                .OrderByDescending(d => d.CreatedAt)
                .FirstOrDefault();

            return new ApplicationDto
            {
                Id = app.Id,
                JobPostingId = app.JobPostingId,
                JobTitle = app.JobPosting?.Title ?? string.Empty,
                CandidateId = app.CandidateId,
                CandidateName = app.Candidate?.FullName ?? string.Empty,
                CandidateEmail = app.Candidate?.Email ?? string.Empty,
                CandidatePhone = app.Candidate?.Phone,
                CurrentStageId = app.CurrentStageId,
                CurrentStageName = app.CurrentStage?.Name ?? "Sourcing",
                CurrentStageType = app.CurrentStage?.StageType ?? AtsEnums.PipelineStageType.Sourcing,
                Status = app.ApplicationStatus,
                AppliedAt = app.AppliedAt,
                Score = app.Score,
                Notes = app.Notes,
                HiredAt = app.HiredAt,
                CvParseStatus = latestDoc?.ParseStatus ?? AtsEnums.UploadParseStatus.Pending
            };
        }

        public static ApplicationDetailDto MapToDetailDto(Application app)
        {
            var baseDto = MapToDto(app);
            return new ApplicationDetailDto
            {
                Id = baseDto.Id,
                JobPostingId = baseDto.JobPostingId,
                JobTitle = baseDto.JobTitle,
                CandidateId = baseDto.CandidateId,
                CandidateName = baseDto.CandidateName,
                CandidateEmail = baseDto.CandidateEmail,
                CandidatePhone = baseDto.CandidatePhone,
                CurrentStageId = baseDto.CurrentStageId,
                CurrentStageName = baseDto.CurrentStageName,
                CurrentStageType = baseDto.CurrentStageType,
                Status = baseDto.Status,
                AppliedAt = baseDto.AppliedAt,
                Score = baseDto.Score,
                Notes = baseDto.Notes,
                HiredAt = baseDto.HiredAt,
                CvParseStatus = baseDto.CvParseStatus,
                Documents = app.Documents?
                    .Where(d => !d.IsDeleted)
                    .OrderByDescending(d => d.CreatedAt)
                    .Select(d => new ApplicationDocumentDto
                    {
                        Id = d.Id,
                        ApplicationId = d.ApplicationId,
                        DocType = d.DocType,
                        FileName = d.FileName,
                        MimeType = d.MimeType,
                        SizeBytes = d.SizeBytes,
                        ParseStatus = d.ParseStatus,
                        ExtractedText = d.ExtractedText,
                        ParsedJson = d.ParsedJson,
                        ErrorCode = d.ErrorCode,
                        AttemptCount = d.AttemptCount,
                        CreatedAt = d.CreatedAt
                    })
                    .ToList() ?? new List<ApplicationDocumentDto>()
            };
        }
    }
}
