using FluentValidation;
using HR.Application.Features.Payroll.DTOs;

namespace HR.Application.Features.Payroll.Validators;

public class ProcessPayrollRequestValidator : AbstractValidator<ProcessPayrollRequest>
{
    public ProcessPayrollRequestValidator()
    {
        RuleFor(x => x.Year).InclusiveBetween(2000, 2100);
        RuleFor(x => x.Month).InclusiveBetween(1, 12);
    }
}
