using Microsoft.AspNetCore.Mvc;

namespace hris_recruitment_be.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class RecruitmentController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new { status = "SUCCESS", message = "Service Recruitment is working!" });
        }
    }
}
