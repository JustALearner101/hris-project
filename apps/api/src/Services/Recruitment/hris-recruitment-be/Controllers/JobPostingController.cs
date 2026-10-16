using System.Security.Claims;
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
    public class JobPostingController : ControllerBase
    {
        private readonly IJobPostingService _jobPostingService;

        public JobPostingController(IJobPostingService jobPostingService)
        {
            _jobPostingService = jobPostingService;
        }

        private string GetActor() =>
            User?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User?.FindFirstValue(ClaimTypes.Email)
            ?? "hr-admin";

        [HttpGet]
        public async Task<ActionResult<DefaultDtoResponse<JobPostingDto>>> GetJobPostings(
            [FromQuery] DefaultDtoPagingParams paging,
            [FromQuery] string? status = null)
        {
            var response = await _jobPostingService.GetJobPostingsAsync(paging, status);
            return Ok(response);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<DefaultDtoResponse<JobPostingDto>>> GetJobPosting(int id)
        {
            var response = await _jobPostingService.GetJobPostingByIdAsync(id);
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

        [HttpPost]
        public async Task<ActionResult<DefaultDtoResponse<JobPostingDto>>> CreateJobPosting([FromBody] CreateJobPostingDto dto)
        {
            var response = await _jobPostingService.CreateJobPostingAsync(dto, GetActor());
            if (response.Status == "FAILED" || response.Data.Count == 0)
            {
                return BadRequest(response);
            }
            return CreatedAtAction(nameof(GetJobPosting), new { id = response.Data[0].Id }, response);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<DefaultDtoResponse<JobPostingDto>>> UpdateJobPosting(int id, [FromBody] UpdateJobPostingDto dto)
        {
            var response = await _jobPostingService.UpdateJobPostingAsync(id, dto, GetActor());
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

        [HttpDelete("{id:int}")]
        public async Task<ActionResult<DefaultDtoResponse<JobPostingDto>>> DeleteJobPosting(int id)
        {
            var response = await _jobPostingService.DeleteJobPostingAsync(id, GetActor());
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

        [HttpPost("{id:int}/publish")]
        public async Task<ActionResult<DefaultDtoResponse<JobPostingDto>>> PublishJobPosting(int id)
        {
            var response = await _jobPostingService.PublishJobPostingAsync(id, GetActor());
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

        [HttpPost("{id:int}/unpublish")]
        public async Task<ActionResult<DefaultDtoResponse<JobPostingDto>>> UnpublishJobPosting(int id)
        {
            var response = await _jobPostingService.UnpublishJobPostingAsync(id, GetActor());
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

        [HttpGet("{id:int}/stages")]
        public async Task<ActionResult<DefaultDtoResponse<JobStageDto>>> GetJobStages(int id)
        {
            var response = await _jobPostingService.GetJobStagesAsync(id);
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

        [HttpPut("{id:int}/stages")]
        public async Task<ActionResult<DefaultDtoResponse<JobStageDto>>> UpdateJobStages(int id, [FromBody] PipelineStageConfigDto dto)
        {
            var response = await _jobPostingService.UpdateJobStagesAsync(id, dto, GetActor());
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
