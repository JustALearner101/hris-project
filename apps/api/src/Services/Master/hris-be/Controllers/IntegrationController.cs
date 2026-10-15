using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using hris_be.lib.DefaultDTO;
using hris_be.service.Services.Integration;
using hris_be.view.DTOs.Integration;

namespace hris_be.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class IntegrationController : ControllerBase
    {
        private readonly IIntegrationService _integrationService;

        public IntegrationController(IIntegrationService integrationService)
        {
            _integrationService = integrationService;
        }

        [HttpGet("connectors")]
        public async Task<ActionResult<DefaultDtoResponse<IntegrationConnectorDto>>> GetConnectors()
        {
            var result = await _integrationService.GetConnectorsAsync();
            return Ok(result);
        }

        [HttpGet("logs")]
        public async Task<ActionResult<DefaultDtoResponse<IntegrationSyncLogDto>>> GetLogs()
        {
            var result = await _integrationService.GetLogsAsync();
            return Ok(result);
        }

        /// <summary>
        /// Outbound: Push data karyawan HRIS ke Coupa Users API
        /// </summary>
        [HttpPost("coupa/sync-users")]
        public async Task<ActionResult<DefaultDtoResponse<IntegrationSyncLogDto>>> SyncEmployeesToCoupa()
        {
            var result = await _integrationService.SyncEmployeesToCoupaAsync();
            return Ok(result);
        }

        /// <summary>
        /// Inbound: Tarik approved expense reports dari Coupa ke HRIS
        /// </summary>
        [HttpPost("coupa/pull-expenses")]
        public async Task<ActionResult<DefaultDtoResponse<CoupaExpenseReportDto>>> PullCoupaExpenses()
        {
            var result = await _integrationService.PullCoupaExpensesAsync();
            return Ok(result);
        }

        /// <summary>
        /// Testing Error Handling: Simulasi error (401_UNAUTHORIZED atau 422_VALIDATION)
        /// </summary>
        [HttpPost("coupa/simulate-error")]
        public async Task<ActionResult<DefaultDtoResponse<IntegrationSyncLogDto>>> SimulateCoupaError([FromQuery] string errorType = "401_UNAUTHORIZED")
        {
            var result = await _integrationService.SimulateCoupaErrorAsync(errorType);
            return Ok(result);
        }
    }
}
