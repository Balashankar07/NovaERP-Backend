using FluentValidation;
using NovaERP.Application.Features.HR.DTOs;

namespace NovaERP.Application.Features.HR.Validators;

public class CreateDepartmentDtoValidator : AbstractValidator<CreateDepartmentDto>
{
    public CreateDepartmentDtoValidator()
    {
        RuleFor(x => x.DepartmentCode)
            .NotEmpty().WithMessage("Department Code is required.")
            .MaximumLength(20).WithMessage("Department Code cannot exceed 20 characters.");

        RuleFor(x => x.DepartmentName)
            .NotEmpty().WithMessage("Department Name is required.")
            .MaximumLength(100).WithMessage("Department Name cannot exceed 100 characters.");
    }
}

public class CreateEmployeeProfileDtoValidator : AbstractValidator<CreateEmployeeProfileDto>
{
    public CreateEmployeeProfileDtoValidator()
    {
        RuleFor(x => x.UserId).NotEmpty().WithMessage("User ID is required.");
        RuleFor(x => x.EmployeeCode).NotEmpty().WithMessage("Employee Code is required.");
        RuleFor(x => x.DepartmentId).NotEmpty().WithMessage("Department is required.");
        RuleFor(x => x.Designation).NotEmpty().WithMessage("Designation is required.");
        RuleFor(x => x.BaseSalary).GreaterThanOrEqualTo(0).WithMessage("Base Salary must be non-negative.");
    }
}

public class CreateAttendanceRecordDtoValidator : AbstractValidator<CreateAttendanceRecordDto>
{
    public CreateAttendanceRecordDtoValidator()
    {
        RuleFor(x => x.EmployeeId).NotEmpty().WithMessage("Employee ID is required.");
        RuleFor(x => x.AttendanceDate).NotEmpty().WithMessage("Attendance Date is required.");
        RuleFor(x => x)
            .Must(x => !x.CheckIn.HasValue || !x.CheckOut.HasValue || x.CheckOut >= x.CheckIn)
            .WithMessage("Checkout time cannot precede check-in time.");
    }
}

public class CreateLeaveRequestDtoValidator : AbstractValidator<CreateLeaveRequestDto>
{
    public CreateLeaveRequestDtoValidator()
    {
        RuleFor(x => x.EmployeeId).NotEmpty().WithMessage("Employee ID is required.");
        RuleFor(x => x.LeaveTypeId).NotEmpty().WithMessage("Leave Type ID is required.");
        RuleFor(x => x.Reason).NotEmpty().WithMessage("Reason is required.");
        RuleFor(x => x)
            .Must(x => x.EndDate >= x.StartDate)
            .WithMessage("Leave end date cannot precede start date.");
    }
}

public class CreatePayrollPeriodDtoValidator : AbstractValidator<CreatePayrollPeriodDto>
{
    public CreatePayrollPeriodDtoValidator()
    {
        RuleFor(x => x.PeriodName).NotEmpty().WithMessage("Period Name is required.");
        RuleFor(x => x)
            .Must(x => x.PeriodEnd >= x.PeriodStart)
            .WithMessage("Period end date cannot precede start date.");
    }
}
