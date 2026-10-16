using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using hris_recruitment_be.lib.DefaultDTO;
using hris_recruitment_be.service.Services;
using hris_recruitment_be.view.DTOs;

namespace hris_recruitment_be.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(Roles = "HR Admin")]
    public class CandidateController : ControllerBase
    {
        private readonly ICandidateService _candidateService;

        public CandidateController(ICandidateService candidateService)
        {
            _candidateService = candidateService;
        }

        [HttpGet]
        public async Task<ActionResult<DefaultDtoResponse<CandidateDto>>> GetCandidates([FromQuery] DefaultDtoPagingParams paging)
        {
            var response = await _candidateService.GetCandidatesAsync(paging);
            return Ok(response);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<DefaultDtoResponse<CandidateDto>>> GetCandidate(int id)
        {
            var response = await _candidateService.GetCandidateByIdAsync(id);
            if (response.Status == "FAILED")
            {
                if (response.Message.ContainsKey("code") && response.Message["code"]?.ToString() == "ERR_NOT_FOUND")
                {
                    return NotFound(response);
                }
                return BadRequest(response);
            }
            return Ok(response);
        }
    }
}
