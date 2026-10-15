using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using hris_be.database;
using hris_be.database.Models;
using hris_be.lib.DefaultDTO;
using hris_be.lib.Utils;
using hris_be.view.DTOs;
using hris_be.view.ViewModels;

namespace hris_be.service.Services
{
    public class EmployeeService : IEmployeeService
    {
        private readonly IUnitOfWork _unitOfWork;

        public EmployeeService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        private static EmployeeDto MapToDto(Employee employee)
        {
            return new EmployeeDto
            {
                Id = employee.Id,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                Email = employee.Email,
                PhoneNumber = employee.PhoneNumber,
                DateOfBirth = employee.DateOfBirth,
                Position = employee.Position,
                Department = employee.Department,
                Status = employee.Status,
                CreatedAt = employee.CreatedAt
            };
        }

        public async Task<DefaultDtoResponse<EmployeeDto>> GetEmployeesAsync(DefaultDtoPagingParams paging)
        {
            var query = _unitOfWork.Employees.Queryable(e => !e.IsDeleted);

            int total = await query.CountAsync();

            var employees = await query
                .Skip(paging.Offset)
                .Take(paging.Limit > 0 ? paging.Limit : 10)
                .ToListAsync();

            var dtos = employees.Select(MapToDto).ToList();

            return BuildResponseUtil.Success(dtos, total);
        }

        public async Task<DefaultDtoResponse<EmployeeDto>> GetEmployeeByIdAsync(int id)
        {
            var employee = await _unitOfWork.Employees.GetAsync(id);

            if (employee == null || employee.IsDeleted)
            {
                return BuildResponseUtil.Error<EmployeeDto>("Employee not found", "ERR_NOT_FOUND");
            }

            return BuildResponseUtil.Success(new List<EmployeeDto> { MapToDto(employee) }, 1);
        }

        public async Task<DefaultDtoResponse<EmployeeDto>> CreateEmployeeAsync(CreateEmployeeDto dto)
        {
            // Validation: Check for duplicate email
            var existingEmployee = await _unitOfWork.Employees.GetByEmailAsync(dto.Email);
            if (existingEmployee != null)
            {
                return BuildResponseUtil.Error<EmployeeDto>("Email address is already in use by another active employee", "ERR_DUPLICATE_EMAIL");
            }

            var employee = new Employee
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                DateOfBirth = dto.DateOfBirth,
                Position = dto.Position,
                Department = dto.Department,
                CreatedAt = DateTime.UtcNow,
                Status = 1,
                CreatedBy = "system"
            };

            await _unitOfWork.Employees.AddAsync(employee);

            return BuildResponseUtil.Success(new List<EmployeeDto> { MapToDto(employee) }, 1, "info", "Employee created successfully");
        }

        public async Task<DefaultDtoResponse<EmployeeDto>> UpdateEmployeeAsync(int id, UpdateEmployeeDto dto)
        {
            var employee = await _unitOfWork.Employees.GetAsync(id);

            if (employee == null || employee.IsDeleted)
            {
                return BuildResponseUtil.Error<EmployeeDto>("Employee not found", "ERR_NOT_FOUND");
            }

            // Validation: Check for duplicate email if it is being modified
            if (!string.IsNullOrEmpty(dto.Email) && !dto.Email.Equals(employee.Email, StringComparison.OrdinalIgnoreCase))
            {
                var existingEmployee = await _unitOfWork.Employees.GetByEmailAsync(dto.Email);
                if (existingEmployee != null)
                {
                    return BuildResponseUtil.Error<EmployeeDto>("Email address is already in use by another active employee", "ERR_DUPLICATE_EMAIL");
                }
                employee.Email = dto.Email;
            }

            // Partial Updates
            if (dto.FirstName != null) employee.FirstName = dto.FirstName;
            if (dto.LastName != null) employee.LastName = dto.LastName;
            if (dto.PhoneNumber != null) employee.PhoneNumber = dto.PhoneNumber;
            if (dto.DateOfBirth != null) employee.DateOfBirth = dto.DateOfBirth;
            if (dto.Position != null) employee.Position = dto.Position;
            if (dto.Department != null) employee.Department = dto.Department;
            if (dto.Status != null) employee.Status = dto.Status.Value;

            employee.ModifiedBy = "system";
            employee.ModifiedAt = DateTime.UtcNow;

            await _unitOfWork.Employees.UpdateAsync(employee);

            return BuildResponseUtil.Success(new List<EmployeeDto> { MapToDto(employee) }, 1, "info", "Employee updated successfully");
        }

        public async Task<DefaultDtoResponse<EmployeeDto>> DeleteEmployeeAsync(int id)
        {
            var employee = await _unitOfWork.Employees.GetAsync(id);

            if (employee == null || employee.IsDeleted)
            {
                return BuildResponseUtil.Error<EmployeeDto>("Employee not found", "ERR_NOT_FOUND");
            }

            // Soft delete
            employee.IsDeleted = true;
            employee.Status = 0; // Inactive
            employee.ModifiedBy = "system";
            employee.ModifiedAt = DateTime.UtcNow;

            await _unitOfWork.Employees.UpdateAsync(employee);

            return BuildResponseUtil.Success(new List<EmployeeDto> { MapToDto(employee) }, 1, "info", "Employee deleted successfully");
        }
    }
}
