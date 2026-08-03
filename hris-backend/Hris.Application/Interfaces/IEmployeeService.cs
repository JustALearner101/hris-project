using Hris.Application.DTOs;

namespace Hris.Application.Interfaces
{
    public interface IEmployeeService
    {
        Task<IReadOnlyList<EmployeeDto>> GetAllEmployeesAsync();
        Task<EmployeeDto?> GetEmployeeByIdAsync(int id);
        Task<EmployeeDto> CreateEmployeeAsync(EmployeeDto employeeDto);
        Task UpdateEmployeeAsync(EmployeeDto employeeDto);
        Task DeleteEmployeeAsync(int id);
    }
}
