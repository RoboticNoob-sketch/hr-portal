using FluentValidation;
using HR.Application.Features.Positions.DTOs;

namespace HR.Application.Features.Positions.Validators;

public class CreatePositionRequestValidator : AbstractValidator<CreatePositionRequest>
{
    public CreatePositionRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(150);
        RuleFor(x => x.DepartmentId).NotEmpty();
        RuleFor(x => x.MinSalary).GreaterThanOrEqualTo(0);
        RuleFor(x => x.MaxSalary).GreaterThanOrEqualTo(x => x.MinSalary);
    }
}

public class UpdatePositionRequestValidator : AbstractValidator<UpdatePositionRequest>
{
    public UpdatePositionRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(150);
        RuleFor(x => x.DepartmentId).NotEmpty();
        RuleFor(x => x.MinSalary).GreaterThanOrEqualTo(0);
        RuleFor(x => x.MaxSalary).GreaterThanOrEqualTo(x => x.MinSalary);
    }
}
