using FluentValidation;
using HR.Application.Features.Leave.DTOs;

namespace HR.Application.Features.Leave.Validators;

public class CreateLeaveRequestValidator : AbstractValidator<CreateLeaveRequest>
{
    public CreateLeaveRequestValidator()
    {
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(1000);
        RuleFor(x => x.StartDate).NotEmpty();
        RuleFor(x => x.EndDate).NotEmpty().GreaterThanOrEqualTo(x => x.StartDate);
        RuleFor(x => x.LeaveType).IsInEnum();
    }
}

public class ReviewLeaveRequestValidator : AbstractValidator<ReviewLeaveRequest>
{
    public ReviewLeaveRequestValidator()
    {
        RuleFor(x => x.ReviewNotes).MaximumLength(500);
    }
}
