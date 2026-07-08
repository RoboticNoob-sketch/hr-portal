using FluentValidation;
using HR.Application.Features.Attendance.DTOs;

namespace HR.Application.Features.Attendance.Validators;

public class UpdateAttendanceRequestValidator : AbstractValidator<UpdateAttendanceRequest>
{
    public UpdateAttendanceRequestValidator()
    {
        RuleFor(x => x.Notes).MaximumLength(500);
        RuleFor(x => x.ShiftName).MaximumLength(100);
        RuleFor(x => x)
            .Must(x => x.ClockIn.HasValue || x.ClockOut.HasValue || !string.IsNullOrWhiteSpace(x.Notes))
            .WithMessage("At least one field must be provided.");
    }
}
