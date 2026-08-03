using AutoMapper;
using Hris.Application.DTOs;
using Hris.Domain.Entities;

namespace Hris.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Employee, EmployeeDto>().ReverseMap();
        }
    }
}
