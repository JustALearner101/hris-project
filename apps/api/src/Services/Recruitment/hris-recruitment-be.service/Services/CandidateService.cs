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
    public interface ICandidateService
    {
        Task<DefaultDtoResponse<CandidateDto>> GetCandidatesAsync(DefaultDtoPagingParams paging);
        Task<DefaultDtoResponse<CandidateDto>> GetCandidateByIdAsync(int id);
    }

    public class CandidateService : ICandidateService
    {
        private readonly IUnitOfWork _unitOfWork;

        public CandidateService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<DefaultDtoResponse<CandidateDto>> GetCandidatesAsync(DefaultDtoPagingParams paging)
        {
            var query = _unitOfWork.Candidates
                .Queryable(c => !c.IsDeleted)
                .Include(c => c.Applications)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(paging.Search))
            {
                var term = paging.Search.Trim().ToLower();
                query = query.Where(c =>
                    c.FullName.ToLower().Contains(term) ||
                    c.Email.ToLower().Contains(term) ||
                    (c.Phone != null && c.Phone.ToLower().Contains(term)));
            }

            var total = await query.CountAsync();
            var limit = paging.Limit <= 0 ? 20 : paging.Limit;
            var offset = paging.Offset < 0 ? 0 : paging.Offset;

            var items = await query
                .OrderByDescending(c => c.CreatedAt)
                .Skip(offset)
                .Take(limit)
                .ToListAsync();

            var dtos = items.Select(MapToDto).ToList();
            return BuildResponseUtil.Success(dtos, total);
        }

        public async Task<DefaultDtoResponse<CandidateDto>> GetCandidateByIdAsync(int id)
        {
            var candidate = await _unitOfWork.Candidates
                .Queryable(c => c.Id == id && !c.IsDeleted)
                .Include(c => c.Applications)
                .FirstOrDefaultAsync();

            if (candidate == null)
            {
                return BuildResponseUtil.Error<CandidateDto>($"Candidate with ID {id} not found.", "ERR_NOT_FOUND");
            }

            return BuildResponseUtil.Success(new List<CandidateDto> { MapToDto(candidate) }, 1);
        }

        private static CandidateDto MapToDto(Candidate candidate) => new()
        {
            Id = candidate.Id,
            FullName = candidate.FullName,
            Email = candidate.Email,
            Phone = candidate.Phone,
            Source = candidate.Source,
            ConsentGiven = candidate.ConsentGiven,
            ApplicationsCount = candidate.Applications?.Count(a => !a.IsDeleted) ?? 0,
            CreatedAt = candidate.CreatedAt
        };
    }
}
