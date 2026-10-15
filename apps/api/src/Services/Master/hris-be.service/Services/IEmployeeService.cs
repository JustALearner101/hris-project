using System.Threading.Tasks;
using hris_be.lib.DefaultDTO;
using hris_be.view.DTOs;
using hris_be.view.ViewModels;

namespace hris_be.service.Services
{
    public interface IEmployeeService
    {
        Task<DefaultDtoResponse<EmployeeDto>> GetEmployeesAsync(DefaultDtoPagingParams paging);
        Task<DefaultDtoResponse<EmployeeDto>> GetEmployeeByIdAsync(int id);
        Task<DefaultDtoResponse<EmployeeDto>> CreateEmployeeAsync(CreateEmployeeDto dto);
        Task<DefaultDtoResponse<EmployeeDto>> UpdateEmployeeAsync(int id, UpdateEmployeeDto dto);
        Task<DefaultDtoResponse<EmployeeDto>> DeleteEmployeeAsync(int id);
    }
}
