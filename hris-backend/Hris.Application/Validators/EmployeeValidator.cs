using FluentValidation;
using Hris.Application.DTOs;

namespace Hris.Application.Validators
{
    public class EmployeeValidator : AbstractValidator<EmployeeDto>
    {
        public EmployeeValidator()
        {
            RuleFor(x => x.FirstName).NotEmpty().MaximumLength(50);
            RuleFor(x => x.LastName).NotEmpty().MaximumLength(50);
            RuleFor(x => x.Email).NotEmpty().EmailAddress();
            RuleFor(x => x.Position).NotEmpty();
            RuleFor(x => x.Department).NotEmpty();
        }
    }
}
