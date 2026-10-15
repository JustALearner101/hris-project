using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using hris_be.lib.DefaultDTO;
using hris_be.service.Services;
using hris_be.view.DTOs;
using hris_be.view.ViewModels;

namespace hris_be.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class EmployeeController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;

        public EmployeeController(IEmployeeService employeeService)
        {
            _employeeService = employeeService;
        }

        [HttpGet]
        public async Task<ActionResult<DefaultDtoResponse<EmployeeDto>>> GetEmployees([FromQuery] DefaultDtoPagingParams paging)
        {
            var response = await _employeeService.GetEmployeesAsync(paging);
            return Ok(response);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DefaultDtoResponse<EmployeeDto>>> GetEmployee(int id)
        {
            var response = await _employeeService.GetEmployeeByIdAsync(id);
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
        public async Task<ActionResult<DefaultDtoResponse<EmployeeDto>>> CreateEmployee([FromBody] CreateEmployeeDto dto)
        {
            var response = await _employeeService.CreateEmployeeAsync(dto);
            if (response.Status == "FAILED" || response.Data.Count == 0)
            {
                return BadRequest(response);
            }
            return CreatedAtAction(nameof(GetEmployee), new { id = response.Data[0].Id }, response);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<DefaultDtoResponse<EmployeeDto>>> UpdateEmployee(int id, [FromBody] UpdateEmployeeDto dto)
        {
            var response = await _employeeService.UpdateEmployeeAsync(id, dto);
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

        [HttpDelete("{id}")]
        public async Task<ActionResult<DefaultDtoResponse<EmployeeDto>>> DeleteEmployee(int id)
        {
            var response = await _employeeService.DeleteEmployeeAsync(id);
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
