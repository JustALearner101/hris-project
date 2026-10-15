using System.Collections.Generic;
using System.Threading.Tasks;
using hris_be.lib.DefaultDTO;
using hris_be.view.DTOs.Integration;

namespace hris_be.service.Services.Integration
{
    public interface IIntegrationService
    {
        Task<DefaultDtoResponse<IntegrationConnectorDto>> GetConnectorsAsync();
        Task<DefaultDtoResponse<IntegrationSyncLogDto>> GetLogsAsync();
        Task<DefaultDtoResponse<IntegrationSyncLogDto>> SyncEmployeesToCoupaAsync();
        Task<DefaultDtoResponse<CoupaExpenseReportDto>> PullCoupaExpensesAsync();
        Task<DefaultDtoResponse<IntegrationSyncLogDto>> SimulateCoupaErrorAsync(string errorType);
    }
}
