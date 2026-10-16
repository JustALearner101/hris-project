using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using hris_recruitment_be.lib.DefaultDTO;
using hris_recruitment_be.lib.Utils;
using hris_recruitment_be.service.Services;
using hris_recruitment_be.view.DTOs;

namespace hris_recruitment_be.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(Roles = "HR Admin")]
    public class ApplicationController : ControllerBase
    {
        private readonly IApplicationService _applicationService;

        public ApplicationController(IApplicationService applicationService)
        {
            _applicationService = applicationService;
        }

        private string GetActor() =>
            User?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User?.FindFirstValue(ClaimTypes.Email)
            ?? "hr-admin";

        [HttpGet]
        public async Task<ActionResult<DefaultDtoResponse<ApplicationDto>>> GetApplications(
            [FromQuery] int? JobPostingId,
            [FromQuery] string? Stage,
            [FromQuery] DefaultDtoPagingParams paging)
        {
            var response = await _applicationService.GetApplicationsAsync(JobPostingId, Stage, paging);
            return Ok(response);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<DefaultDtoResponse<ApplicationDetailDto>>> GetApplication(int id)
        {
            var response = await _applicationService.GetApplicationByIdAsync(id);
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

        [HttpPost("{id:int}/move-stage")]
        public async Task<ActionResult<DefaultDtoResponse<ApplicationDetailDto>>> MoveStage(int id, [FromBody] MoveStageDto dto)
        {
            var response = await _applicationService.MoveStageAsync(id, dto, GetActor());
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

        [HttpPost("{id:int}/reject")]
        public async Task<ActionResult<DefaultDtoResponse<ApplicationDetailDto>>> RejectApplication(int id, [FromBody] RejectApplicationDto dto)
        {
            var response = await _applicationService.RejectApplicationAsync(id, dto, GetActor());
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

        [HttpPost("{id:int}/hire")]
        public async Task<ActionResult<DefaultDtoResponse<ApplicationDetailDto>>> HireApplication(int id, [FromBody] HireApplicationDto dto)
        {
            var response = await _applicationService.HireApplicationAsync(id, dto, GetActor());
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

        [HttpGet("{applicationId:int}/documents/{documentId:int}")]
        public async Task<IActionResult> DownloadDocument(int applicationId, int documentId)
        {
            var fileResult = await _applicationService.GetDocumentStreamAsync(applicationId, documentId);
            if (fileResult == null)
            {
                var err = BuildResponseUtil.Error<object>("Requested document not found.", "ERR_NOT_FOUND");
                return NotFound(err);
            }

            Response.Headers["X-Content-Type-Options"] = "nosniff";
            Response.Headers["Content-Security-Policy"] = "default-src 'none'";
            return File(fileResult.Value.Stream, fileResult.Value.MimeType, fileResult.Value.FileName);
        }
    }
}
