using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using hris_recruitment_be.database;
using hris_recruitment_be.database.Models;
using hris_recruitment_be.lib.DefaultDTO;
using hris_recruitment_be.lib.Utils;
using hris_recruitment_be.view.DTOs;

namespace hris_recruitment_be.service.Services
{
    public interface IJobPostingService
    {
        Task<DefaultDtoResponse<JobPostingDto>> GetJobPostingsAsync(DefaultDtoPagingParams paging, string? status = null);
        Task<DefaultDtoResponse<JobPostingDto>> GetJobPostingByIdAsync(int id);
        Task<DefaultDtoResponse<JobPostingDto>> CreateJobPostingAsync(CreateJobPostingDto dto, string actor = "system");
        Task<DefaultDtoResponse<JobPostingDto>> UpdateJobPostingAsync(int id, UpdateJobPostingDto dto, string actor = "system");
        Task<DefaultDtoResponse<JobPostingDto>> DeleteJobPostingAsync(int id, string actor = "system");
        Task<DefaultDtoResponse<JobPostingDto>> PublishJobPostingAsync(int id, string actor = "system");
        Task<DefaultDtoResponse<JobPostingDto>> UnpublishJobPostingAsync(int id, string actor = "system");
        Task<DefaultDtoResponse<JobStageDto>> GetJobStagesAsync(int jobPostingId);
        Task<DefaultDtoResponse<JobStageDto>> UpdateJobStagesAsync(int jobPostingId, PipelineStageConfigDto dto, string actor = "system");
    }

    public class JobPostingService : IJobPostingService
    {
        private readonly IUnitOfWork _unitOfWork;

        public JobPostingService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<DefaultDtoResponse<JobPostingDto>> GetJobPostingsAsync(DefaultDtoPagingParams paging, string? status = null)
        {
            var query = _unitOfWork.JobPostings
                .Queryable(j => !j.IsDeleted)
                .Include(j => j.Stages)
                .Include(j => j.Applications)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                var normalizedStatus = status.Trim().ToUpperInvariant();
                query = query.Where(j => j.JobStatus == normalizedStatus);
            }

            if (!string.IsNullOrWhiteSpace(paging.Search))
            {
                var term = paging.Search.Trim().ToLower();
                query = query.Where(j =>
                    j.Title.ToLower().Contains(term) ||
                    j.Department.ToLower().Contains(term) ||
                    j.Location.ToLower().Contains(term));
            }

            var total = await query.CountAsync();

            var limit = paging.Limit <= 0 ? 10 : paging.Limit;
            var offset = paging.Offset < 0 ? 0 : paging.Offset;

            var items = await query
                .OrderByDescending(j => j.CreatedAt)
                .Skip(offset)
                .Take(limit)
                .ToListAsync();

            var dtos = items.Select(MapToDto).ToList();
            return BuildResponseUtil.Success(dtos, total);
        }

        public async Task<DefaultDtoResponse<JobPostingDto>> GetJobPostingByIdAsync(int id)
        {
            var job = await _unitOfWork.JobPostings
                .Queryable(j => j.Id == id && !j.IsDeleted)
                .Include(j => j.Stages)
                .Include(j => j.Applications)
                .FirstOrDefaultAsync();

            if (job == null)
            {
                return BuildResponseUtil.Error<JobPostingDto>($"Job posting with ID {id} not found.", "ERR_NOT_FOUND");
            }

            return BuildResponseUtil.Success(new List<JobPostingDto> { MapToDto(job) }, 1);
        }

        public async Task<DefaultDtoResponse<JobPostingDto>> CreateJobPostingAsync(CreateJobPostingDto dto, string actor = "system")
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
            {
                return BuildResponseUtil.Error<JobPostingDto>("Job title is required.", "ERR_VALIDATION");
            }

            var baseSlug = SlugUtil.GenerateSlug(dto.Title, dto.SeoSlug);
            var slug = await EnsureUniqueSlugAsync(baseSlug);

            var now = DateTime.UtcNow;
            var job = new JobPosting
            {
                Title = dto.Title.Trim(),
                Description = HtmlSanitizerUtil.Sanitize(dto.Description) ?? string.Empty,
                Department = dto.Department.Trim(),
                Location = dto.Location.Trim(),
                EmploymentType = NormalizeEmploymentType(dto.EmploymentType),
                JobStatus = AtsEnums.JobStatus.Draft,
                Headcount = Math.Max(1, dto.Headcount),
                SalaryMin = dto.SalaryMin,
                SalaryMax = dto.SalaryMax,
                Currency = string.IsNullOrWhiteSpace(dto.Currency) ? "IDR" : dto.Currency.Trim().ToUpperInvariant(),
                SeoSlug = slug,
                SeoMetaTitle = HtmlSanitizerUtil.Sanitize(dto.SeoMetaTitle) ?? dto.Title.Trim(),
                SeoMetaDescription = HtmlSanitizerUtil.Sanitize(dto.SeoMetaDescription),
                LogoPath = dto.LogoPath,
                Theme = HtmlSanitizerUtil.Sanitize(dto.Theme),
                OpenedAt = now,
                CreatedBy = actor,
                CreatedAt = now,
                Status = 1,
                IsDeleted = false
            };

            await _unitOfWork.JobPostings.AddAsync(job);

            var stageConfigs = dto.Stages != null && dto.Stages.Count > 0
                ? dto.Stages
                : GetDefaultStages();

            var sequence = 1;
            foreach (var stageItem in stageConfigs.OrderBy(s => s.Sequence <= 0 ? sequence : s.Sequence))
            {
                var stage = new JobStage
                {
                    JobPostingId = job.Id,
                    Name = string.IsNullOrWhiteSpace(stageItem.Name) ? stageItem.StageType : stageItem.Name.Trim(),
                    StageType = NormalizeStageType(stageItem.StageType),
                    Sequence = sequence++,
                    IsActive = stageItem.IsActive,
                    CreatedBy = actor,
                    CreatedAt = now
                };
                await _unitOfWork.JobStages.AddAsync(stage);
                if (!job.Stages.Contains(stage))
                {
                    job.Stages.Add(stage);
                }
            }

            return BuildResponseUtil.Success(new List<JobPostingDto> { MapToDto(job) }, 1, "info", "Job posting created successfully.");
        }

        public async Task<DefaultDtoResponse<JobPostingDto>> UpdateJobPostingAsync(int id, UpdateJobPostingDto dto, string actor = "system")
        {
            var job = await _unitOfWork.JobPostings
                .Queryable(j => j.Id == id && !j.IsDeleted)
                .Include(j => j.Stages)
                .Include(j => j.Applications)
                .FirstOrDefaultAsync();

            if (job == null)
            {
                return BuildResponseUtil.Error<JobPostingDto>($"Job posting with ID {id} not found.", "ERR_NOT_FOUND");
            }

            job.Title = dto.Title.Trim();
            job.Description = HtmlSanitizerUtil.Sanitize(dto.Description) ?? string.Empty;
            job.Department = dto.Department.Trim();
            job.Location = dto.Location.Trim();
            job.EmploymentType = NormalizeEmploymentType(dto.EmploymentType);
            job.Headcount = Math.Max(1, dto.Headcount);
            job.SalaryMin = dto.SalaryMin;
            job.SalaryMax = dto.SalaryMax;
            job.Currency = string.IsNullOrWhiteSpace(dto.Currency) ? "IDR" : dto.Currency.Trim().ToUpperInvariant();
            job.SeoMetaTitle = HtmlSanitizerUtil.Sanitize(dto.SeoMetaTitle) ?? job.Title;
            job.SeoMetaDescription = HtmlSanitizerUtil.Sanitize(dto.SeoMetaDescription);
            job.LogoPath = dto.LogoPath;
            job.Theme = HtmlSanitizerUtil.Sanitize(dto.Theme);

            if (!string.IsNullOrWhiteSpace(dto.SeoSlug))
            {
                var requestedSlug = SlugUtil.GenerateSlug(dto.Title, dto.SeoSlug);
                if (!string.Equals(requestedSlug, job.SeoSlug, StringComparison.OrdinalIgnoreCase))
                {
                    job.SeoSlug = await EnsureUniqueSlugAsync(requestedSlug, job.Id);
                }
            }

            if (!string.IsNullOrWhiteSpace(dto.Status))
            {
                job.JobStatus = dto.Status.Trim().ToUpperInvariant();
            }

            job.ModifiedBy = actor;
            job.ModifiedAt = DateTime.UtcNow;

            await _unitOfWork.JobPostings.UpdateAsync(job);
            return BuildResponseUtil.Success(new List<JobPostingDto> { MapToDto(job) }, 1, "info", "Job posting updated successfully.");
        }

        public async Task<DefaultDtoResponse<JobPostingDto>> DeleteJobPostingAsync(int id, string actor = "system")
        {
            var job = await _unitOfWork.JobPostings
                .Queryable(j => j.Id == id && !j.IsDeleted)
                .FirstOrDefaultAsync();

            if (job == null)
            {
                return BuildResponseUtil.Error<JobPostingDto>($"Job posting with ID {id} not found.", "ERR_NOT_FOUND");
            }

            job.IsDeleted = true;
            job.Status = 0;
            job.JobStatus = AtsEnums.JobStatus.Archived;
            job.ModifiedBy = actor;
            job.ModifiedAt = DateTime.UtcNow;

            await _unitOfWork.JobPostings.UpdateAsync(job);
            return BuildResponseUtil.Success(new List<JobPostingDto> { MapToDto(job) }, 1, "info", "Job posting deleted.");
        }

        public async Task<DefaultDtoResponse<JobPostingDto>> PublishJobPostingAsync(int id, string actor = "system")
        {
            var job = await _unitOfWork.JobPostings
                .Queryable(j => j.Id == id && !j.IsDeleted)
                .Include(j => j.Stages)
                .Include(j => j.Applications)
                .FirstOrDefaultAsync();

            if (job == null)
            {
                return BuildResponseUtil.Error<JobPostingDto>($"Job posting with ID {id} not found.", "ERR_NOT_FOUND");
            }

            var now = DateTime.UtcNow;
            job.JobStatus = AtsEnums.JobStatus.Open;
            job.PublishedAt = now;
            job.OpenedAt ??= now;
            job.ClosedAt = null;
            job.ModifiedBy = actor;
            job.ModifiedAt = now;

            await _unitOfWork.JobPostings.UpdateAsync(job);
            return BuildResponseUtil.Success(new List<JobPostingDto> { MapToDto(job) }, 1, "info", "Job posting published.");
        }

        public async Task<DefaultDtoResponse<JobPostingDto>> UnpublishJobPostingAsync(int id, string actor = "system")
        {
            var job = await _unitOfWork.JobPostings
                .Queryable(j => j.Id == id && !j.IsDeleted)
                .Include(j => j.Stages)
                .Include(j => j.Applications)
                .FirstOrDefaultAsync();

            if (job == null)
            {
                return BuildResponseUtil.Error<JobPostingDto>($"Job posting with ID {id} not found.", "ERR_NOT_FOUND");
            }

            var now = DateTime.UtcNow;
            job.JobStatus = AtsEnums.JobStatus.Closed;
            job.ClosedAt = now;
            job.ModifiedBy = actor;
            job.ModifiedAt = now;

            await _unitOfWork.JobPostings.UpdateAsync(job);
            return BuildResponseUtil.Success(new List<JobPostingDto> { MapToDto(job) }, 1, "info", "Job posting unpublished.");
        }

        public async Task<DefaultDtoResponse<JobStageDto>> GetJobStagesAsync(int jobPostingId)
        {
            var jobExists = await _unitOfWork.JobPostings
                .Queryable(j => j.Id == jobPostingId && !j.IsDeleted)
                .AnyAsync();

            if (!jobExists)
            {
                return BuildResponseUtil.Error<JobStageDto>($"Job posting with ID {jobPostingId} not found.", "ERR_NOT_FOUND");
            }

            var stages = await _unitOfWork.JobStages
                .Queryable(s => s.JobPostingId == jobPostingId && !s.IsDeleted)
                .OrderBy(s => s.Sequence)
                .ToListAsync();

            var dtos = stages.Select(MapStageToDto).ToList();
            return BuildResponseUtil.Success(dtos, dtos.Count);
        }

        public async Task<DefaultDtoResponse<JobStageDto>> UpdateJobStagesAsync(int jobPostingId, PipelineStageConfigDto dto, string actor = "system")
        {
            var job = await _unitOfWork.JobPostings
                .Queryable(j => j.Id == jobPostingId && !j.IsDeleted)
                .FirstOrDefaultAsync();

            if (job == null)
            {
                return BuildResponseUtil.Error<JobStageDto>($"Job posting with ID {jobPostingId} not found.", "ERR_NOT_FOUND");
            }

            if (dto.Stages == null || dto.Stages.Count == 0)
            {
                return BuildResponseUtil.Error<JobStageDto>("At least one pipeline stage is required.", "ERR_INVALID_STAGE");
            }

            foreach (var item in dto.Stages)
            {
                if (!AtsEnums.PipelineStageType.DefaultSequence.Contains(item.StageType.Trim().ToUpperInvariant()))
                {
                    return BuildResponseUtil.Error<JobStageDto>($"Invalid stage type '{item.StageType}'.", "ERR_INVALID_STAGE");
                }
            }

            var existingStages = await _unitOfWork.JobStages
                .Queryable(s => s.JobPostingId == jobPostingId && !s.IsDeleted)
                .OrderBy(s => s.Sequence)
                .ToListAsync();

            // Two-phase sequence update to avoid unique constraint collision on (job_posting_id, sequence)
            var tempSeq = 1000;
            foreach (var existing in existingStages)
            {
                existing.Sequence = tempSeq++;
                await _unitOfWork.JobStages.UpdateAsync(existing);
            }

            var now = DateTime.UtcNow;
            var updatedStages = new List<JobStage>();
            var seq = 1;

            foreach (var item in dto.Stages)
            {
                var normalizedType = NormalizeStageType(item.StageType);
                var match = existingStages.FirstOrDefault(s => s.StageType == normalizedType && !updatedStages.Contains(s));
                if (match != null)
                {
                    match.Name = item.Name.Trim();
                    match.Sequence = seq++;
                    match.IsActive = item.IsActive;
                    match.ModifiedBy = actor;
                    match.ModifiedAt = now;
                    await _unitOfWork.JobStages.UpdateAsync(match);
                    updatedStages.Add(match);
                }
                else
                {
                    var newStage = new JobStage
                    {
                        JobPostingId = jobPostingId,
                        Name = item.Name.Trim(),
                        StageType = normalizedType,
                        Sequence = seq++,
                        IsActive = item.IsActive,
                        CreatedBy = actor,
                        CreatedAt = now
                    };
                    await _unitOfWork.JobStages.AddAsync(newStage);
                    updatedStages.Add(newStage);
                }
            }

            var dtos = updatedStages.OrderBy(s => s.Sequence).Select(MapStageToDto).ToList();
            return BuildResponseUtil.Success(dtos, dtos.Count);
        }

        private async Task<string> EnsureUniqueSlugAsync(string baseSlug, int? excludeJobId = null)
        {
            var candidateSlug = baseSlug;
            var suffix = 1;
            while (await _unitOfWork.JobPostings
                .Queryable(j => j.SeoSlug == candidateSlug && (!excludeJobId.HasValue || j.Id != excludeJobId.Value))
                .AnyAsync())
            {
                candidateSlug = $"{baseSlug}-{suffix++}";
            }
            return candidateSlug;
        }

        private static string NormalizeEmploymentType(string? type)
        {
            var upper = (type ?? AtsEnums.EmploymentType.FullTime).Trim().ToUpperInvariant();
            return upper switch
            {
                AtsEnums.EmploymentType.FullTime or
                AtsEnums.EmploymentType.PartTime or
                AtsEnums.EmploymentType.Contract or
                AtsEnums.EmploymentType.Intern => upper,
                _ => AtsEnums.EmploymentType.FullTime
            };
        }

        private static string NormalizeStageType(string? stageType)
        {
            var upper = (stageType ?? AtsEnums.PipelineStageType.Sourcing).Trim().ToUpperInvariant();
            return AtsEnums.PipelineStageType.DefaultSequence.Contains(upper)
                ? upper
                : AtsEnums.PipelineStageType.Sourcing;
        }

        private static List<PipelineStageItemDto> GetDefaultStages() => new()
        {
            new PipelineStageItemDto { Name = "Sourcing", StageType = AtsEnums.PipelineStageType.Sourcing, Sequence = 1, IsActive = true },
            new PipelineStageItemDto { Name = "Screening", StageType = AtsEnums.PipelineStageType.Screening, Sequence = 2, IsActive = true },
            new PipelineStageItemDto { Name = "Interview", StageType = AtsEnums.PipelineStageType.Interview, Sequence = 3, IsActive = true },
            new PipelineStageItemDto { Name = "Offer", StageType = AtsEnums.PipelineStageType.Offer, Sequence = 4, IsActive = true },
            new PipelineStageItemDto { Name = "Hired", StageType = AtsEnums.PipelineStageType.Hired, Sequence = 5, IsActive = true }
        };

        private static JobStageDto MapStageToDto(JobStage stage) => new()
        {
            Id = stage.Id,
            JobPostingId = stage.JobPostingId,
            Name = stage.Name,
            StageType = stage.StageType,
            Sequence = stage.Sequence,
            IsActive = stage.IsActive
        };

        private static JobPostingDto MapToDto(JobPosting job) => new()
        {
            Id = job.Id,
            Title = job.Title,
            Description = job.Description,
            Department = job.Department,
            Location = job.Location,
            EmploymentType = job.EmploymentType,
            Status = job.JobStatus,
            Headcount = job.Headcount,
            SalaryMin = job.SalaryMin,
            SalaryMax = job.SalaryMax,
            Currency = job.Currency,
            SeoSlug = job.SeoSlug,
            SeoMetaTitle = job.SeoMetaTitle,
            SeoMetaDescription = job.SeoMetaDescription,
            LogoPath = job.LogoPath,
            Theme = job.Theme,
            OpenedAt = job.OpenedAt,
            ClosedAt = job.ClosedAt,
            PublishedAt = job.PublishedAt,
            ApplicantCount = job.Applications?.Count(a => !a.IsDeleted) ?? 0,
            CreatedAt = job.CreatedAt,
            Stages = job.Stages?
                .Where(s => !s.IsDeleted)
                .OrderBy(s => s.Sequence)
                .Select(MapStageToDto)
                .ToList() ?? new List<JobStageDto>()
        };
    }
}
