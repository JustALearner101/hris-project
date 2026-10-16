using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using hris_recruitment_be.lib.DefaultDTO;
using hris_recruitment_be.lib.Utils;
using hris_recruitment_be.service.Services;
using hris_recruitment_be.view.DTOs.Public;

namespace hris_recruitment_be.Controllers
{
    [ApiController]
    [Route("api/v1/public")]
    [AllowAnonymous]
    public class PublicJobsController : ControllerBase
    {
        private readonly IPublicJobService _publicJobService;
        private readonly ICvProcessingService _cvProcessingService;

        public PublicJobsController(
            IPublicJobService publicJobService,
            ICvProcessingService cvProcessingService)
        {
            _publicJobService = publicJobService;
            _cvProcessingService = cvProcessingService;
        }

        [HttpGet("jobs")]
        public async Task<ActionResult<DefaultDtoResponse<PublicJobDto>>> GetPublishedJobs([FromQuery] DefaultDtoPagingParams paging)
        {
            var response = await _publicJobService.GetPublishedJobsAsync(paging);
            return Ok(response);
        }

        [HttpGet("jobs/{slug}")]
        public async Task<ActionResult<DefaultDtoResponse<PublicJobDetailDto>>> GetPublishedJobBySlug(string slug)
        {
            var response = await _publicJobService.GetPublishedJobBySlugAsync(slug);
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

        [HttpPost("jobs/{id:int}/applications")]
        [EnableRateLimiting("PublicUploadPolicy")]
        [RequestSizeLimit(6 * 1024 * 1024)]
        public async Task<ActionResult<DefaultDtoResponse<ApplicationAcceptedDto>>> SubmitApplication(
            int id,
            [FromForm] string fullName,
            [FromForm] string email,
            [FromForm] string? phone,
            [FromForm] string? notes,
            [FromForm] bool consentAccepted = true,
            IFormFile? cv = null,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(fullName) || string.IsNullOrWhiteSpace(email))
            {
                var err = BuildResponseUtil.Error<ApplicationAcceptedDto>("Full name and email are required.", "ERR_VALIDATION");
                return BadRequest(err);
            }

            if (!consentAccepted)
            {
                var err = BuildResponseUtil.Error<ApplicationAcceptedDto>("Data processing consent (UU PDP No. 27/2022) is required.", "ERR_CONSENT_REQUIRED");
                return BadRequest(err);
            }

            if (cv == null || cv.Length == 0)
            {
                var err = BuildResponseUtil.Error<ApplicationAcceptedDto>("A CV file (.pdf, .doc, or .docx) is required.", "ERR_UNSUPPORTED_FILE");
                return BadRequest(err);
            }

            using var ms = new MemoryStream();
            await cv.CopyToAsync(ms, cancellationToken);
            var fileBytes = ms.ToArray();

            var idempotencyKey = Request.Headers["Idempotency-Key"].ToString();
            var submitDto = new SubmitApplicationDto
            {
                FullName = fullName,
                Email = email,
                Phone = phone,
                Notes = notes,
                ConsentAccepted = consentAccepted
            };

            var response = await _cvProcessingService.SubmitApplicationAsync(
                jobPostingId: id,
                dto: submitDto,
                fileName: cv.FileName,
                fileBytes: fileBytes,
                idempotencyKey: string.IsNullOrWhiteSpace(idempotencyKey) ? null : idempotencyKey,
                cancellationToken: cancellationToken);

            if (response.Status == "FAILED")
            {
                var code = response.Message.ContainsKey("code") ? response.Message["code"]?.ToString() : null;
                if (code == "ERR_NOT_FOUND")
                {
                    return NotFound(response);
                }
                return BadRequest(response);
            }

            return StatusCode(StatusCodes.Status202Accepted, response);
        }

        [HttpGet("applications/{token}")]
        public async Task<ActionResult<DefaultDtoResponse<ApplicationStatusDto>>> GetApplicationStatus(string token)
        {
            var response = await _publicJobService.GetApplicationStatusByTokenAsync(token);
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
