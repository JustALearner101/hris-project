using AutoMapper;
using Hris.Application.DTOs;
using Hris.Application.Interfaces;
using Hris.Domain.Entities;
using Hris.Domain.Interfaces;

namespace Hris.Application.Services
{
    public class EmployeeService : IEmployeeService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IGenericRepository<Employee> _employeeRepository;
        private readonly IMapper _mapper;

        public EmployeeService(IUnitOfWork unitOfWork, IGenericRepository<Employee> employeeRepository, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _employeeRepository = employeeRepository;
            _mapper = mapper;
        }

        public async Task<IReadOnlyList<EmployeeDto>> GetAllEmployeesAsync()
        {
            var employees = await _employeeRepository.GetAllAsync();
            return _mapper.Map<IReadOnlyList<EmployeeDto>>(employees);
        }

        public async Task<EmployeeDto?> GetEmployeeByIdAsync(int id)
        {
            var employee = await _employeeRepository.GetByIdAsync(id);
            return _mapper.Map<EmployeeDto>(employee);
        }

        public async Task<EmployeeDto> CreateEmployeeAsync(EmployeeDto employeeDto)
        {
            var employee = _mapper.Map<Employee>(employeeDto);
            await _employeeRepository.AddAsync(employee);
            await _unitOfWork.CompleteAsync();
            return _mapper.Map<EmployeeDto>(employee);
        }

        public async Task UpdateEmployeeAsync(EmployeeDto employeeDto)
        {
            var employee = await _employeeRepository.GetByIdAsync(employeeDto.Id);
            if (employee != null)
            {
                _mapper.Map(employeeDto, employee);
                await _employeeRepository.UpdateAsync(employee);
                await _unitOfWork.CompleteAsync();
            }
        }

        public async Task DeleteEmployeeAsync(int id)
        {
            var employee = await _employeeRepository.GetByIdAsync(id);
            if (employee != null)
            {
                await _employeeRepository.DeleteAsync(employee);
                await _unitOfWork.CompleteAsync();
            }
        }
    }
}
