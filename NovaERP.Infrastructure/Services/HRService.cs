using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Common.Models;
using NovaERP.Application.Features.Finance.DTOs;
using NovaERP.Application.Features.HR.DTOs;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Services;

public class HRService : IHRService
{
    private readonly AppDbContext _context;
    private readonly IAuditLogger _auditLogger;
    private readonly IFinanceService _financeService;

    public HRService(AppDbContext context, IAuditLogger auditLogger, IFinanceService financeService)
    {
        _context = context;
        _auditLogger = auditLogger;
        _financeService = financeService;
    }

    // ==========================================
    // OVERVIEW & REPORTS
    // ==========================================

    public async Task<HROverviewDto> GetOverviewAsync(CancellationToken cancellationToken = default)
    {
        var totalEmployees = await _context.EmployeeProfiles.CountAsync(cancellationToken);
        var activeEmployees = await _context.EmployeeProfiles.CountAsync(e => e.Status == EmploymentStatus.Active, cancellationToken);
        var totalDepartments = await _context.Departments.CountAsync(d => d.IsActive, cancellationToken);

        var nowUtc = DateTime.UtcNow;
        var today = DateTime.SpecifyKind(nowUtc.Date, DateTimeKind.Utc);
        var tomorrow = today.AddDays(1);

        var presentToday = await _context.AttendanceRecords.CountAsync(a => a.AttendanceDate >= today && a.AttendanceDate < tomorrow && a.Status == AttendanceStatus.Present, cancellationToken);
        var onLeaveToday = await _context.AttendanceRecords.CountAsync(a => a.AttendanceDate >= today && a.AttendanceDate < tomorrow && a.Status == AttendanceStatus.Leave, cancellationToken);
        var pendingLeaveRequests = await _context.LeaveRequests.CountAsync(l => l.Status == LeaveStatus.PendingApproval, cancellationToken);

        var currentMonthStart = DateTime.SpecifyKind(new DateTime(today.Year, today.Month, 1), DateTimeKind.Utc);
        var monthlyPayrollExpense = await _context.PayrollEntries
            .Where(p => p.CreatedAt >= currentMonthStart && (p.Status == PayrollStatus.Approved || p.Status == PayrollStatus.Paid))
            .SumAsync(p => (decimal?)p.GrossPay, cancellationToken) ?? 0m;

        return new HROverviewDto
        {
            TotalEmployees = totalEmployees,
            ActiveEmployees = activeEmployees,
            TotalDepartments = totalDepartments,
            PresentToday = presentToday,
            OnLeaveToday = onLeaveToday,
            PendingLeaveRequests = pendingLeaveRequests,
            MonthlyPayrollExpense = monthlyPayrollExpense
        };
    }

    public async Task<HRReportsSummaryDto> GetReportsSummaryAsync(CancellationToken cancellationToken = default)
    {
        var deptHeadcounts = await _context.Departments
            .Where(d => d.IsActive)
            .Select(d => new DepartmentHeadcountDto
            {
                DepartmentName = d.DepartmentName,
                EmployeeCount = d.Employees.Count(e => e.Status == EmploymentStatus.Active),
                TotalBaseSalary = d.Employees.Where(e => e.Status == EmploymentStatus.Active).Sum(e => e.BaseSalary)
            })
            .ToListAsync(cancellationToken);

        var attendanceSummary = await _context.AttendanceRecords
            .GroupBy(a => a.Status)
            .Select(g => new AttendanceSummaryItemDto
            {
                Status = g.Key.ToString(),
                Count = g.Count()
            })
            .ToListAsync(cancellationToken);

        var payrollSummary = await _context.PayrollPeriods
            .OrderByDescending(p => p.PeriodStart)
            .Take(6)
            .Select(p => new PayrollSummaryItemDto
            {
                PeriodName = p.PeriodName,
                TotalGrossPay = p.Entries.Sum(e => e.GrossPay),
                TotalNetPay = p.Entries.Sum(e => e.NetPay),
                Status = p.Status.ToString()
            })
            .ToListAsync(cancellationToken);

        return new HRReportsSummaryDto
        {
            DepartmentHeadcounts = deptHeadcounts,
            AttendanceSummary = attendanceSummary,
            PayrollSummary = payrollSummary
        };
    }

    // ==========================================
    // DEPARTMENTS
    // ==========================================

    public async Task<PagedResult<DepartmentDto>> GetDepartmentsAsync(int pageNumber = 1, int pageSize = 10, string? search = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Departments.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.Trim().ToLower();
            query = query.Where(d => d.DepartmentCode.ToLower().Contains(searchLower) || d.DepartmentName.ToLower().Contains(searchLower));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(d => d.DepartmentCode)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new DepartmentDto
            {
                Id = d.Id,
                DepartmentCode = d.DepartmentCode,
                DepartmentName = d.DepartmentName,
                Description = d.Description,
                ManagerUserId = d.ManagerUserId,
                ManagerUserName = d.ManagerUser != null ? (d.ManagerUser.FirstName + " " + d.ManagerUser.LastName).Trim() : null,
                IsActive = d.IsActive,
                EmployeeCount = d.Employees.Count(e => e.Status == EmploymentStatus.Active),
                CreatedAt = d.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<DepartmentDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<DepartmentDto> GetDepartmentByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var d = await _context.Departments
            .AsNoTracking()
            .Include(x => x.ManagerUser)
            .Include(x => x.Employees)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new InvalidOperationException($"Department with ID '{id}' was not found.");

        return new DepartmentDto
        {
            Id = d.Id,
            DepartmentCode = d.DepartmentCode,
            DepartmentName = d.DepartmentName,
            Description = d.Description,
            ManagerUserId = d.ManagerUserId,
            ManagerUserName = d.ManagerUser != null ? (d.ManagerUser.FirstName + " " + d.ManagerUser.LastName).Trim() : null,
            IsActive = d.IsActive,
            EmployeeCount = d.Employees.Count(e => e.Status == EmploymentStatus.Active),
            CreatedAt = d.CreatedAt
        };
    }

    public async Task<DepartmentDto> CreateDepartmentAsync(CreateDepartmentDto dto, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var codeUpper = dto.DepartmentCode.Trim().ToUpper();
        if (await _context.Departments.AnyAsync(d => d.DepartmentCode.ToUpper() == codeUpper, cancellationToken))
        {
            throw new InvalidOperationException($"Department Code '{dto.DepartmentCode}' already exists.");
        }

        var nameTrim = dto.DepartmentName.Trim();
        if (await _context.Departments.AnyAsync(d => d.DepartmentName.ToLower() == nameTrim.ToLower(), cancellationToken))
        {
            throw new InvalidOperationException($"Department Name '{dto.DepartmentName}' already exists.");
        }

        if (dto.ManagerUserId.HasValue)
        {
            var userExists = await _context.Users.AnyAsync(u => u.Id == dto.ManagerUserId.Value, cancellationToken);
            if (!userExists) throw new InvalidOperationException($"Manager User ID '{dto.ManagerUserId}' does not exist.");
        }

        var dept = new Department
        {
            DepartmentCode = codeUpper,
            DepartmentName = nameTrim,
            Description = dto.Description,
            ManagerUserId = dto.ManagerUserId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = currentUserId
        };

        await _context.Departments.AddAsync(dept, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("CreateDepartment", "Department", dept.Id.ToString(), "", dept.DepartmentName);

        return await GetDepartmentByIdAsync(dept.Id, cancellationToken);
    }

    public async Task<DepartmentDto> UpdateDepartmentAsync(Guid id, UpdateDepartmentDto dto, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var dept = await _context.Departments.FirstOrDefaultAsync(d => d.Id == id, cancellationToken)
            ?? throw new InvalidOperationException($"Department with ID '{id}' was not found.");

        var nameTrim = dto.DepartmentName.Trim();
        if (await _context.Departments.AnyAsync(d => d.Id != id && d.DepartmentName.ToLower() == nameTrim.ToLower(), cancellationToken))
        {
            throw new InvalidOperationException($"Department Name '{dto.DepartmentName}' already exists.");
        }

        if (dto.ManagerUserId.HasValue)
        {
            var userExists = await _context.Users.AnyAsync(u => u.Id == dto.ManagerUserId.Value, cancellationToken);
            if (!userExists) throw new InvalidOperationException($"Manager User ID '{dto.ManagerUserId}' does not exist.");
        }

        var oldValues = $"Name={dept.DepartmentName}, Active={dept.IsActive}";

        dept.DepartmentName = nameTrim;
        dept.Description = dto.Description;
        dept.ManagerUserId = dto.ManagerUserId;
        dept.IsActive = dto.IsActive;
        dept.UpdatedAt = DateTime.UtcNow;
        dept.UpdatedBy = currentUserId;

        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("UpdateDepartment", "Department", dept.Id.ToString(), oldValues, $"Name={dept.DepartmentName}, Active={dept.IsActive}");

        return await GetDepartmentByIdAsync(dept.Id, cancellationToken);
    }

    // ==========================================
    // EMPLOYEES
    // ==========================================

    public async Task<PagedResult<EmployeeProfileDto>> GetEmployeesAsync(int pageNumber = 1, int pageSize = 10, string? search = null, Guid? departmentId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.EmployeeProfiles
            .AsNoTracking()
            .Include(e => e.User)
            .Include(e => e.Department)
            .AsQueryable();

        if (departmentId.HasValue)
        {
            query = query.Where(e => e.DepartmentId == departmentId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.Trim().ToLower();
            query = query.Where(e => e.EmployeeCode.ToLower().Contains(searchLower) ||
                                     e.Designation.ToLower().Contains(searchLower) ||
                                     (e.User != null && (e.User.Email.ToLower().Contains(searchLower) || e.User.FirstName.ToLower().Contains(searchLower) || e.User.LastName.ToLower().Contains(searchLower))));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(e => e.EmployeeCode)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new EmployeeProfileDto
            {
                Id = e.Id,
                UserId = e.UserId,
                UserEmail = e.User != null ? e.User.Email : string.Empty,
                UserName = e.User != null ? (e.User.FirstName + " " + e.User.LastName).Trim() : string.Empty,
                EmployeeCode = e.EmployeeCode,
                DepartmentId = e.DepartmentId,
                DepartmentCode = e.Department != null ? e.Department.DepartmentCode : string.Empty,
                DepartmentName = e.Department != null ? e.Department.DepartmentName : string.Empty,
                Designation = e.Designation,
                EmploymentType = e.EmploymentType,
                Status = e.Status,
                DateOfJoining = e.DateOfJoining,
                Phone = e.Phone,
                Address = e.Address,
                EmergencyContact = e.EmergencyContact,
                BaseSalary = e.BaseSalary,
                BankName = e.BankName,
                AccountNumber = e.AccountNumber,
                CreatedAt = e.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<EmployeeProfileDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<EmployeeProfileDto> GetEmployeeByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var e = await _context.EmployeeProfiles
            .AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.Department)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new InvalidOperationException($"Employee Profile with ID '{id}' was not found.");

        return new EmployeeProfileDto
        {
            Id = e.Id,
            UserId = e.UserId,
            UserEmail = e.User != null ? e.User.Email : string.Empty,
            UserName = e.User != null ? (e.User.FirstName + " " + e.User.LastName).Trim() : string.Empty,
            EmployeeCode = e.EmployeeCode,
            DepartmentId = e.DepartmentId,
            DepartmentCode = e.Department != null ? e.Department.DepartmentCode : string.Empty,
            DepartmentName = e.Department != null ? e.Department.DepartmentName : string.Empty,
            Designation = e.Designation,
            EmploymentType = e.EmploymentType,
            Status = e.Status,
            DateOfJoining = e.DateOfJoining,
            Phone = e.Phone,
            Address = e.Address,
            EmergencyContact = e.EmergencyContact,
            BaseSalary = e.BaseSalary,
            BankName = e.BankName,
            AccountNumber = e.AccountNumber,
            CreatedAt = e.CreatedAt
        };
    }

    public async Task<EmployeeProfileDto> GetEmployeeByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var e = await _context.EmployeeProfiles
            .AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.Department)
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken)
            ?? throw new InvalidOperationException($"No Employee Profile linked to User ID '{userId}'.");

        return new EmployeeProfileDto
        {
            Id = e.Id,
            UserId = e.UserId,
            UserEmail = e.User != null ? e.User.Email : string.Empty,
            UserName = e.User != null ? (e.User.FirstName + " " + e.User.LastName).Trim() : string.Empty,
            EmployeeCode = e.EmployeeCode,
            DepartmentId = e.DepartmentId,
            DepartmentCode = e.Department != null ? e.Department.DepartmentCode : string.Empty,
            DepartmentName = e.Department != null ? e.Department.DepartmentName : string.Empty,
            Designation = e.Designation,
            EmploymentType = e.EmploymentType,
            Status = e.Status,
            DateOfJoining = e.DateOfJoining,
            Phone = e.Phone,
            Address = e.Address,
            EmergencyContact = e.EmergencyContact,
            BaseSalary = e.BaseSalary,
            BankName = e.BankName,
            AccountNumber = e.AccountNumber,
            CreatedAt = e.CreatedAt
        };
    }

    public async Task<EmployeeProfileDto> CreateEmployeeAsync(CreateEmployeeProfileDto dto, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == dto.UserId, cancellationToken)
            ?? throw new InvalidOperationException($"User with ID '{dto.UserId}' does not exist.");

        if (await _context.EmployeeProfiles.AnyAsync(e => e.UserId == dto.UserId, cancellationToken))
        {
            throw new InvalidOperationException($"User '{user.Email}' already has an active Employee Profile.");
        }

        var codeUpper = dto.EmployeeCode.Trim().ToUpper();
        if (await _context.EmployeeProfiles.AnyAsync(e => e.EmployeeCode.ToUpper() == codeUpper, cancellationToken))
        {
            throw new InvalidOperationException($"Employee Code '{dto.EmployeeCode}' already exists.");
        }

        var dept = await _context.Departments.FirstOrDefaultAsync(d => d.Id == dto.DepartmentId && d.IsActive, cancellationToken)
            ?? throw new InvalidOperationException($"Department with ID '{dto.DepartmentId}' is invalid or inactive.");

        var emp = new EmployeeProfile
        {
            UserId = dto.UserId,
            EmployeeCode = codeUpper,
            DepartmentId = dto.DepartmentId,
            Designation = dto.Designation.Trim(),
            EmploymentType = dto.EmploymentType,
            Status = EmploymentStatus.Active,
            DateOfJoining = dto.DateOfJoining.Kind == DateTimeKind.Utc ? dto.DateOfJoining : DateTime.SpecifyKind(dto.DateOfJoining, DateTimeKind.Utc),
            Phone = dto.Phone,
            Address = dto.Address,
            EmergencyContact = dto.EmergencyContact,
            BaseSalary = dto.BaseSalary,
            BankName = dto.BankName,
            AccountNumber = dto.AccountNumber,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = currentUserId
        };

        await _context.EmployeeProfiles.AddAsync(emp, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("CreateEmployeeProfile", "EmployeeProfile", emp.Id.ToString(), "", $"Code={emp.EmployeeCode}, User={user.Email}");

        return await GetEmployeeByIdAsync(emp.Id, cancellationToken);
    }

    public async Task<EmployeeProfileDto> UpdateEmployeeAsync(Guid id, UpdateEmployeeProfileDto dto, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var emp = await _context.EmployeeProfiles.FirstOrDefaultAsync(e => e.Id == id, cancellationToken)
            ?? throw new InvalidOperationException($"Employee Profile with ID '{id}' was not found.");

        var dept = await _context.Departments.FirstOrDefaultAsync(d => d.Id == dto.DepartmentId && d.IsActive, cancellationToken)
            ?? throw new InvalidOperationException($"Department with ID '{dto.DepartmentId}' is invalid or inactive.");

        var oldValues = $"Dept={emp.DepartmentId}, Status={emp.Status}, BaseSalary={emp.BaseSalary}";

        emp.DepartmentId = dto.DepartmentId;
        emp.Designation = dto.Designation.Trim();
        emp.EmploymentType = dto.EmploymentType;
        emp.Status = dto.Status;
        emp.Phone = dto.Phone;
        emp.Address = dto.Address;
        emp.EmergencyContact = dto.EmergencyContact;
        emp.BaseSalary = dto.BaseSalary;
        emp.BankName = dto.BankName;
        emp.AccountNumber = dto.AccountNumber;
        emp.UpdatedAt = DateTime.UtcNow;
        emp.UpdatedBy = currentUserId;

        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("UpdateEmployeeProfile", "EmployeeProfile", emp.Id.ToString(), oldValues, $"Dept={emp.DepartmentId}, Status={emp.Status}, BaseSalary={emp.BaseSalary}");

        return await GetEmployeeByIdAsync(emp.Id, cancellationToken);
    }

    // ==========================================
    // ATTENDANCE
    // ==========================================

    public async Task<PagedResult<AttendanceRecordDto>> GetAttendanceRecordsAsync(int pageNumber = 1, int pageSize = 10, Guid? employeeId = null, DateTime? date = null, CancellationToken cancellationToken = default)
    {
        var query = _context.AttendanceRecords
            .AsNoTracking()
            .Include(a => a.Employee)
                .ThenInclude(e => e!.User)
            .Include(a => a.Employee)
                .ThenInclude(e => e!.Department)
            .AsQueryable();

        if (employeeId.HasValue)
        {
            query = query.Where(a => a.EmployeeId == employeeId.Value);
        }

        if (date.HasValue)
        {
            var targetDate = date.Value.Date;
            query = query.Where(a => a.AttendanceDate.Date == targetDate);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(a => a.AttendanceDate)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AttendanceRecordDto
            {
                Id = a.Id,
                EmployeeId = a.EmployeeId,
                EmployeeCode = a.Employee != null ? a.Employee.EmployeeCode : string.Empty,
                EmployeeName = a.Employee != null && a.Employee.User != null ? (a.Employee.User.FirstName + " " + a.Employee.User.LastName).Trim() : string.Empty,
                DepartmentName = a.Employee != null && a.Employee.Department != null ? a.Employee.Department.DepartmentName : string.Empty,
                AttendanceDate = a.AttendanceDate,
                CheckIn = a.CheckIn,
                CheckOut = a.CheckOut,
                Status = a.Status,
                WorkHours = a.WorkHours,
                Remarks = a.Remarks,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<AttendanceRecordDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<AttendanceRecordDto> RecordAttendanceAsync(CreateAttendanceRecordDto dto, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var emp = await _context.EmployeeProfiles.FirstOrDefaultAsync(e => e.Id == dto.EmployeeId, cancellationToken)
            ?? throw new InvalidOperationException($"Employee with ID '{dto.EmployeeId}' was not found.");

        if (emp.Status != EmploymentStatus.Active)
        {
            throw new InvalidOperationException($"Attendance cannot be recorded for inactive employee '{emp.EmployeeCode}'.");
        }

        var attDate = dto.AttendanceDate.Kind == DateTimeKind.Utc ? dto.AttendanceDate.Date : DateTime.SpecifyKind(dto.AttendanceDate.Date, DateTimeKind.Utc);

        var exists = await _context.AttendanceRecords.AnyAsync(a => a.EmployeeId == dto.EmployeeId && a.AttendanceDate.Date == attDate, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException($"Attendance record already exists for employee '{emp.EmployeeCode}' on '{attDate:yyyy-MM-dd}'.");
        }

        if (dto.CheckIn.HasValue && dto.CheckOut.HasValue && dto.CheckOut < dto.CheckIn)
        {
            throw new InvalidOperationException("Checkout time cannot precede check-in time.");
        }

        decimal workHours = 0m;
        if (dto.CheckIn.HasValue && dto.CheckOut.HasValue)
        {
            workHours = (decimal)(dto.CheckOut.Value - dto.CheckIn.Value).TotalHours;
            if (workHours < 0) workHours = 0;
        }

        var record = new AttendanceRecord
        {
            EmployeeId = dto.EmployeeId,
            AttendanceDate = attDate,
            CheckIn = dto.CheckIn,
            CheckOut = dto.CheckOut,
            Status = dto.Status,
            WorkHours = Math.Round(workHours, 2),
            Remarks = dto.Remarks,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = currentUserId
        };

        await _context.AttendanceRecords.AddAsync(record, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("RecordAttendance", "AttendanceRecord", record.Id.ToString(), "", $"Emp={emp.EmployeeCode}, Date={attDate:yyyy-MM-dd}, Status={dto.Status}");

        return (await GetAttendanceRecordsAsync(1, 10, dto.EmployeeId, attDate, cancellationToken)).Items.First();
    }

    public async Task<AttendanceRecordDto> UpdateAttendanceAsync(Guid id, UpdateAttendanceRecordDto dto, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var record = await _context.AttendanceRecords.FirstOrDefaultAsync(a => a.Id == id, cancellationToken)
            ?? throw new InvalidOperationException($"Attendance record with ID '{id}' was not found.");

        if (dto.CheckIn.HasValue && dto.CheckOut.HasValue && dto.CheckOut < dto.CheckIn)
        {
            throw new InvalidOperationException("Checkout time cannot precede check-in time.");
        }

        decimal workHours = 0m;
        if (dto.CheckIn.HasValue && dto.CheckOut.HasValue)
        {
            workHours = (decimal)(dto.CheckOut.Value - dto.CheckIn.Value).TotalHours;
            if (workHours < 0) workHours = 0;
        }

        var oldValues = $"CheckIn={record.CheckIn}, CheckOut={record.CheckOut}, Status={record.Status}";

        record.CheckIn = dto.CheckIn;
        record.CheckOut = dto.CheckOut;
        record.Status = dto.Status;
        record.WorkHours = Math.Round(workHours, 2);
        record.Remarks = dto.Remarks;
        record.UpdatedAt = DateTime.UtcNow;
        record.UpdatedBy = currentUserId;

        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("UpdateAttendance", "AttendanceRecord", record.Id.ToString(), oldValues, $"CheckIn={record.CheckIn}, CheckOut={record.CheckOut}, Status={record.Status}");

        return (await GetAttendanceRecordsAsync(1, 10, record.EmployeeId, record.AttendanceDate, cancellationToken)).Items.First();
    }

    // ==========================================
    // LEAVE MANAGEMENT
    // ==========================================

    public async Task<List<LeaveTypeDto>> GetLeaveTypesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.LeaveTypes
            .AsNoTracking()
            .Where(l => l.IsActive)
            .OrderBy(l => l.Name)
            .Select(l => new LeaveTypeDto
            {
                Id = l.Id,
                Name = l.Name,
                Description = l.Description,
                DefaultDaysPerYear = l.DefaultDaysPerYear,
                IsActive = l.IsActive
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<LeaveTypeDto> CreateLeaveTypeAsync(CreateLeaveTypeDto dto, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var nameTrim = dto.Name.Trim();
        if (await _context.LeaveTypes.AnyAsync(l => l.Name.ToLower() == nameTrim.ToLower(), cancellationToken))
        {
            throw new InvalidOperationException($"Leave Type '{dto.Name}' already exists.");
        }

        var leaveType = new LeaveType
        {
            Name = nameTrim,
            Description = dto.Description,
            DefaultDaysPerYear = dto.DefaultDaysPerYear,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = currentUserId
        };

        await _context.LeaveTypes.AddAsync(leaveType, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("CreateLeaveType", "LeaveType", leaveType.Id.ToString(), "", leaveType.Name);

        return new LeaveTypeDto
        {
            Id = leaveType.Id,
            Name = leaveType.Name,
            Description = leaveType.Description,
            DefaultDaysPerYear = leaveType.DefaultDaysPerYear,
            IsActive = leaveType.IsActive
        };
    }

    public async Task<PagedResult<LeaveRequestDto>> GetLeaveRequestsAsync(int pageNumber = 1, int pageSize = 10, Guid? employeeId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.LeaveRequests
            .AsNoTracking()
            .Include(l => l.Employee)
                .ThenInclude(e => e!.User)
            .Include(l => l.LeaveType)
            .Include(l => l.ApproverUser)
            .AsQueryable();

        if (employeeId.HasValue)
        {
            query = query.Where(l => l.EmployeeId == employeeId.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new LeaveRequestDto
            {
                Id = l.Id,
                EmployeeId = l.EmployeeId,
                EmployeeCode = l.Employee != null ? l.Employee.EmployeeCode : string.Empty,
                EmployeeName = l.Employee != null && l.Employee.User != null ? (l.Employee.User.FirstName + " " + l.Employee.User.LastName).Trim() : string.Empty,
                LeaveTypeId = l.LeaveTypeId,
                LeaveTypeName = l.LeaveType != null ? l.LeaveType.Name : string.Empty,
                StartDate = l.StartDate,
                EndDate = l.EndDate,
                NumberOfDays = l.NumberOfDays,
                Reason = l.Reason,
                Status = l.Status,
                ApproverUserId = l.ApproverUserId,
                ApproverUserName = l.ApproverUser != null ? (l.ApproverUser.FirstName + " " + l.ApproverUser.LastName).Trim() : null,
                DecisionDate = l.DecisionDate,
                DecisionRemarks = l.DecisionRemarks,
                CreatedAt = l.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<LeaveRequestDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<LeaveRequestDto> GetLeaveRequestByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var l = await _context.LeaveRequests
            .AsNoTracking()
            .Include(x => x.Employee).ThenInclude(e => e!.User)
            .Include(x => x.LeaveType)
            .Include(x => x.ApproverUser)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new InvalidOperationException($"Leave request with ID '{id}' was not found.");

        return new LeaveRequestDto
        {
            Id = l.Id,
            EmployeeId = l.EmployeeId,
            EmployeeCode = l.Employee != null ? l.Employee.EmployeeCode : string.Empty,
            EmployeeName = l.Employee != null && l.Employee.User != null ? (l.Employee.User.FirstName + " " + l.Employee.User.LastName).Trim() : string.Empty,
            LeaveTypeId = l.LeaveTypeId,
            LeaveTypeName = l.LeaveType != null ? l.LeaveType.Name : string.Empty,
            StartDate = l.StartDate,
            EndDate = l.EndDate,
            NumberOfDays = l.NumberOfDays,
            Reason = l.Reason,
            Status = l.Status,
            ApproverUserId = l.ApproverUserId,
            ApproverUserName = l.ApproverUser != null ? (l.ApproverUser.FirstName + " " + l.ApproverUser.LastName).Trim() : null,
            DecisionDate = l.DecisionDate,
            DecisionRemarks = l.DecisionRemarks,
            CreatedAt = l.CreatedAt
        };
    }

    public async Task<LeaveRequestDto> CreateLeaveRequestAsync(CreateLeaveRequestDto dto, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var emp = await _context.EmployeeProfiles.FirstOrDefaultAsync(e => e.Id == dto.EmployeeId, cancellationToken)
            ?? throw new InvalidOperationException($"Employee with ID '{dto.EmployeeId}' was not found.");

        if (emp.Status == EmploymentStatus.Terminated || emp.Status == EmploymentStatus.Inactive)
        {
            throw new InvalidOperationException($"Leave request cannot be submitted for employee in '{emp.Status}' status.");
        }

        var leaveType = await _context.LeaveTypes.FirstOrDefaultAsync(lt => lt.Id == dto.LeaveTypeId && lt.IsActive, cancellationToken)
            ?? throw new InvalidOperationException($"Leave Type with ID '{dto.LeaveTypeId}' is invalid or inactive.");

        var startDate = dto.StartDate.Kind == DateTimeKind.Utc ? dto.StartDate.Date : DateTime.SpecifyKind(dto.StartDate.Date, DateTimeKind.Utc);
        var endDate = dto.EndDate.Kind == DateTimeKind.Utc ? dto.EndDate.Date : DateTime.SpecifyKind(dto.EndDate.Date, DateTimeKind.Utc);

        if (endDate < startDate)
        {
            throw new InvalidOperationException("Leave End Date cannot precede Start Date.");
        }

        // Check for overlapping active/pending leave requests
        var hasOverlap = await _context.LeaveRequests.AnyAsync(l =>
            l.EmployeeId == dto.EmployeeId &&
            l.Status != LeaveStatus.Rejected && l.Status != LeaveStatus.Cancelled &&
            l.StartDate <= endDate && l.EndDate >= startDate, cancellationToken);

        if (hasOverlap)
        {
            throw new InvalidOperationException("Leave request dates overlap with an existing pending or approved leave request.");
        }

        var days = (decimal)(endDate - startDate).TotalDays + 1m;

        var request = new LeaveRequest
        {
            EmployeeId = dto.EmployeeId,
            LeaveTypeId = dto.LeaveTypeId,
            StartDate = startDate,
            EndDate = endDate,
            NumberOfDays = days,
            Reason = dto.Reason,
            Status = LeaveStatus.PendingApproval,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = currentUserId
        };

        await _context.LeaveRequests.AddAsync(request, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("CreateLeaveRequest", "LeaveRequest", request.Id.ToString(), "", $"Emp={emp.EmployeeCode}, Type={leaveType.Name}, Days={days}");

        return await GetLeaveRequestByIdAsync(request.Id, cancellationToken);
    }

    public async Task<LeaveRequestDto> ApproveLeaveRequestAsync(Guid id, LeaveDecisionDto dto, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var req = await _context.LeaveRequests.Include(l => l.Employee).FirstOrDefaultAsync(l => l.Id == id, cancellationToken)
            ?? throw new InvalidOperationException($"Leave request with ID '{id}' was not found.");

        if (req.Status != LeaveStatus.PendingApproval)
        {
            throw new InvalidOperationException($"Leave request in status '{req.Status}' cannot be approved.");
        }

        req.Status = LeaveStatus.Approved;
        req.ApproverUserId = currentUserId;
        req.DecisionDate = DateTime.UtcNow;
        req.DecisionRemarks = dto.Remarks;
        req.UpdatedAt = DateTime.UtcNow;
        req.UpdatedBy = currentUserId;

        // Auto-create/update Attendance records as 'Leave' for approved days
        for (var dt = req.StartDate.Date; dt <= req.EndDate.Date; dt = dt.AddDays(1))
        {
            var existingAtt = await _context.AttendanceRecords.FirstOrDefaultAsync(a => a.EmployeeId == req.EmployeeId && a.AttendanceDate.Date == dt, cancellationToken);
            if (existingAtt != null)
            {
                existingAtt.Status = AttendanceStatus.Leave;
                existingAtt.Remarks = $"Approved Leave ({req.Reason})";
            }
            else
            {
                _context.AttendanceRecords.Add(new AttendanceRecord
                {
                    EmployeeId = req.EmployeeId,
                    AttendanceDate = dt,
                    Status = AttendanceStatus.Leave,
                    WorkHours = 0,
                    Remarks = $"Approved Leave ({req.Reason})",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = currentUserId
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("ApproveLeaveRequest", "LeaveRequest", req.Id.ToString(), "Status=PendingApproval", "Status=Approved");

        return await GetLeaveRequestByIdAsync(req.Id, cancellationToken);
    }

    public async Task<LeaveRequestDto> RejectLeaveRequestAsync(Guid id, LeaveDecisionDto dto, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var req = await _context.LeaveRequests.FirstOrDefaultAsync(l => l.Id == id, cancellationToken)
            ?? throw new InvalidOperationException($"Leave request with ID '{id}' was not found.");

        if (req.Status != LeaveStatus.PendingApproval)
        {
            throw new InvalidOperationException($"Leave request in status '{req.Status}' cannot be rejected.");
        }

        req.Status = LeaveStatus.Rejected;
        req.ApproverUserId = currentUserId;
        req.DecisionDate = DateTime.UtcNow;
        req.DecisionRemarks = dto.Remarks;
        req.UpdatedAt = DateTime.UtcNow;
        req.UpdatedBy = currentUserId;

        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("RejectLeaveRequest", "LeaveRequest", req.Id.ToString(), "Status=PendingApproval", "Status=Rejected");

        return await GetLeaveRequestByIdAsync(req.Id, cancellationToken);
    }

    // ==========================================
    // PAYROLL
    // ==========================================

    public async Task<PagedResult<PayrollPeriodDto>> GetPayrollPeriodsAsync(int pageNumber = 1, int pageSize = 10, CancellationToken cancellationToken = default)
    {
        var query = _context.PayrollPeriods
            .AsNoTracking()
            .Include(p => p.Entries)
            .AsQueryable();

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(p => p.PeriodStart)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PayrollPeriodDto
            {
                Id = p.Id,
                PeriodName = p.PeriodName,
                PeriodStart = p.PeriodStart,
                PeriodEnd = p.PeriodEnd,
                Status = p.Status,
                TotalEntries = p.Entries.Count,
                TotalGrossPay = p.Entries.Sum(e => e.GrossPay),
                TotalNetPay = p.Entries.Sum(e => e.NetPay),
                CreatedAt = p.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<PayrollPeriodDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<PayrollPeriodDto> CreatePayrollPeriodAsync(CreatePayrollPeriodDto dto, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var nameTrim = dto.PeriodName.Trim();
        if (await _context.PayrollPeriods.AnyAsync(p => p.PeriodName.ToLower() == nameTrim.ToLower(), cancellationToken))
        {
            throw new InvalidOperationException($"Payroll Period Name '{dto.PeriodName}' already exists.");
        }

        var start = dto.PeriodStart.Kind == DateTimeKind.Utc ? dto.PeriodStart.Date : DateTime.SpecifyKind(dto.PeriodStart.Date, DateTimeKind.Utc);
        var end = dto.PeriodEnd.Kind == DateTimeKind.Utc ? dto.PeriodEnd.Date : DateTime.SpecifyKind(dto.PeriodEnd.Date, DateTimeKind.Utc);

        if (end < start)
        {
            throw new InvalidOperationException("Payroll Period End Date cannot precede Start Date.");
        }

        var period = new PayrollPeriod
        {
            PeriodName = nameTrim,
            PeriodStart = start,
            PeriodEnd = end,
            Status = PayrollStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = currentUserId
        };

        await _context.PayrollPeriods.AddAsync(period, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("CreatePayrollPeriod", "PayrollPeriod", period.Id.ToString(), "", period.PeriodName);

        return new PayrollPeriodDto
        {
            Id = period.Id,
            PeriodName = period.PeriodName,
            PeriodStart = period.PeriodStart,
            PeriodEnd = period.PeriodEnd,
            Status = period.Status,
            TotalEntries = 0,
            TotalGrossPay = 0,
            TotalNetPay = 0,
            CreatedAt = period.CreatedAt
        };
    }

    public async Task<PagedResult<PayrollEntryDto>> GetPayrollEntriesAsync(int pageNumber = 1, int pageSize = 10, Guid? periodId = null, Guid? employeeId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.PayrollEntries
            .AsNoTracking()
            .Include(e => e.Period)
            .Include(e => e.Employee).ThenInclude(emp => emp!.User)
            .Include(e => e.Employee).ThenInclude(emp => emp!.Department)
            .AsQueryable();

        if (periodId.HasValue)
        {
            query = query.Where(e => e.PeriodId == periodId.Value);
        }

        if (employeeId.HasValue)
        {
            query = query.Where(e => e.EmployeeId == employeeId.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(e => e.Employee != null ? e.Employee.EmployeeCode : string.Empty)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new PayrollEntryDto
            {
                Id = e.Id,
                PeriodId = e.PeriodId,
                PeriodName = e.Period != null ? e.Period.PeriodName : string.Empty,
                EmployeeId = e.EmployeeId,
                EmployeeCode = e.Employee != null ? e.Employee.EmployeeCode : string.Empty,
                EmployeeName = e.Employee != null && e.Employee.User != null ? (e.Employee.User.FirstName + " " + e.Employee.User.LastName).Trim() : string.Empty,
                DepartmentName = e.Employee != null && e.Employee.Department != null ? e.Employee.Department.DepartmentName : string.Empty,
                BaseSalary = e.BaseSalary,
                Allowances = e.Allowances,
                Deductions = e.Deductions,
                GrossPay = e.GrossPay,
                NetPay = e.NetPay,
                Status = e.Status,
                ApprovalJournalEntryId = e.ApprovalJournalEntryId,
                PaymentJournalEntryId = e.PaymentJournalEntryId,
                CreatedAt = e.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<PayrollEntryDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<List<PayrollEntryDto>> ProcessPayrollForPeriodAsync(Guid periodId, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var period = await _context.PayrollPeriods.Include(p => p.Entries).FirstOrDefaultAsync(p => p.Id == periodId, cancellationToken)
            ?? throw new InvalidOperationException($"Payroll Period with ID '{periodId}' was not found.");

        if (period.Status == PayrollStatus.Approved || period.Status == PayrollStatus.Paid)
        {
            throw new InvalidOperationException($"Finalized payroll period in status '{period.Status}' cannot be re-processed.");
        }

        var activeEmployees = await _context.EmployeeProfiles
            .Include(e => e.User)
            .Include(e => e.Department)
            .Where(e => e.Status == EmploymentStatus.Active)
            .ToListAsync(cancellationToken);

        if (!activeEmployees.Any())
        {
            throw new InvalidOperationException("No active employees found to process payroll.");
        }

        foreach (var emp in activeEmployees)
        {
            var existingEntry = period.Entries.FirstOrDefault(e => e.EmployeeId == emp.Id);
            if (existingEntry == null)
            {
                var baseSalary = emp.BaseSalary;
                var allowances = 0m;
                var deductions = 0m;
                var gross = baseSalary + allowances;
                var net = gross - deductions;

                var entry = new PayrollEntry
                {
                    PeriodId = periodId,
                    EmployeeId = emp.Id,
                    BaseSalary = baseSalary,
                    Allowances = allowances,
                    Deductions = deductions,
                    GrossPay = gross,
                    NetPay = net,
                    Status = PayrollStatus.Processed,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = currentUserId
                };
                _context.PayrollEntries.Add(entry);
            }
            else
            {
                existingEntry.BaseSalary = emp.BaseSalary;
                existingEntry.GrossPay = existingEntry.BaseSalary + existingEntry.Allowances;
                existingEntry.NetPay = existingEntry.GrossPay - existingEntry.Deductions;
                existingEntry.Status = PayrollStatus.Processed;
                existingEntry.UpdatedAt = DateTime.UtcNow;
                existingEntry.UpdatedBy = currentUserId;
            }
        }

        period.Status = PayrollStatus.Processed;
        period.UpdatedAt = DateTime.UtcNow;
        period.UpdatedBy = currentUserId;

        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("ProcessPayroll", "PayrollPeriod", period.Id.ToString(), "", $"Processed {activeEmployees.Count} employees for period {period.PeriodName}");

        return (await GetPayrollEntriesAsync(1, 100, periodId, null, cancellationToken)).Items.ToList();
    }

    public async Task<PayrollPeriodDto> ApprovePayrollPeriodAsync(Guid periodId, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var period = await _context.PayrollPeriods.Include(p => p.Entries).FirstOrDefaultAsync(p => p.Id == periodId, cancellationToken)
            ?? throw new InvalidOperationException($"Payroll Period with ID '{periodId}' was not found.");

        if (period.Status != PayrollStatus.Processed)
        {
            throw new InvalidOperationException($"Payroll period in status '{period.Status}' cannot be approved. It must be Processed first.");
        }

        if (!period.Entries.Any())
        {
            throw new InvalidOperationException("Cannot approve a payroll period with zero entries.");
        }

        var totalGross = period.Entries.Sum(e => e.GrossPay);

        // Integrate with Finance Module: Post GL Journal Entry for Salary Expense / Payable
        // Resolve Accounts: 6000 (Operating Expenses) & 2000 (Accounts Payable)
        var coaList = await _financeService.GetChartOfAccountsAsync(cancellationToken);
        var expenseAcc = coaList.FirstOrDefault(a => a.AccountCode == "6000") ?? coaList.FirstOrDefault(a => a.Type == Domain.Enums.AccountType.Expense);
        var payableAcc = coaList.FirstOrDefault(a => a.AccountCode == "2000") ?? coaList.FirstOrDefault(a => a.Type == Domain.Enums.AccountType.Liability);

        Guid? createdJournalId = null;

        if (expenseAcc != null && payableAcc != null && totalGross > 0)
        {
            var journalDto = new CreateJournalEntryDto
            {
                EntryDate = DateTime.UtcNow,
                Description = $"Payroll Approval Expense & Liability - Period: {period.PeriodName}",
                Lines = new List<CreateJournalEntryLineDto>
                {
                    new() { AccountId = expenseAcc.Id, Debit = totalGross, Credit = 0, Description = $"Payroll Gross Expense - {period.PeriodName}" },
                    new() { AccountId = payableAcc.Id, Debit = 0, Credit = totalGross, Description = $"Salary Payable Liability - {period.PeriodName}" }
                }
            };

            var journal = await _financeService.CreateJournalEntryAsync(journalDto, currentUserId, cancellationToken);
            var postedJournal = await _financeService.PostJournalEntryAsync(journal.Id, currentUserId, cancellationToken);
            createdJournalId = postedJournal.Id;
        }

        period.Status = PayrollStatus.Approved;
        period.UpdatedAt = DateTime.UtcNow;
        period.UpdatedBy = currentUserId;

        foreach (var entry in period.Entries)
        {
            entry.Status = PayrollStatus.Approved;
            entry.ApprovalJournalEntryId = createdJournalId;
            entry.UpdatedAt = DateTime.UtcNow;
            entry.UpdatedBy = currentUserId;
        }

        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("ApprovePayrollPeriod", "PayrollPeriod", period.Id.ToString(), "Status=Processed", $"Status=Approved, JournalId={createdJournalId}");

        return new PayrollPeriodDto
        {
            Id = period.Id,
            PeriodName = period.PeriodName,
            PeriodStart = period.PeriodStart,
            PeriodEnd = period.PeriodEnd,
            Status = period.Status,
            TotalEntries = period.Entries.Count,
            TotalGrossPay = period.Entries.Sum(e => e.GrossPay),
            TotalNetPay = period.Entries.Sum(e => e.NetPay),
            CreatedAt = period.CreatedAt
        };
    }

    public async Task<PayrollPeriodDto> PayPayrollPeriodAsync(Guid periodId, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var period = await _context.PayrollPeriods.Include(p => p.Entries).FirstOrDefaultAsync(p => p.Id == periodId, cancellationToken)
            ?? throw new InvalidOperationException($"Payroll Period with ID '{periodId}' was not found.");

        if (period.Status != PayrollStatus.Approved)
        {
            throw new InvalidOperationException($"Payroll period in status '{period.Status}' cannot be marked as Paid. It must be Approved first.");
        }

        var totalNet = period.Entries.Sum(e => e.NetPay);

        // Integrate with Finance Module: Post GL Journal Entry for Salary Payment (Debit Salary Payable, Credit Cash)
        var coaList = await _financeService.GetChartOfAccountsAsync(cancellationToken);
        var payableAcc = coaList.FirstOrDefault(a => a.AccountCode == "2000") ?? coaList.FirstOrDefault(a => a.Type == Domain.Enums.AccountType.Liability);
        var cashAcc = coaList.FirstOrDefault(a => a.AccountCode == "1010") ?? coaList.FirstOrDefault(a => a.Type == Domain.Enums.AccountType.Asset);

        Guid? paymentJournalId = null;

        if (payableAcc != null && cashAcc != null && totalNet > 0)
        {
            var journalDto = new CreateJournalEntryDto
            {
                EntryDate = DateTime.UtcNow,
                Description = $"Payroll Salary Disbursement - Period: {period.PeriodName}",
                Lines = new List<CreateJournalEntryLineDto>
                {
                    new() { AccountId = payableAcc.Id, Debit = totalNet, Credit = 0, Description = $"Discharge Salary Payable - {period.PeriodName}" },
                    new() { AccountId = cashAcc.Id, Debit = 0, Credit = totalNet, Description = $"Cash Outflow for Payroll - {period.PeriodName}" }
                }
            };

            var journal = await _financeService.CreateJournalEntryAsync(journalDto, currentUserId, cancellationToken);
            var postedJournal = await _financeService.PostJournalEntryAsync(journal.Id, currentUserId, cancellationToken);
            paymentJournalId = postedJournal.Id;
        }

        period.Status = PayrollStatus.Paid;
        period.UpdatedAt = DateTime.UtcNow;
        period.UpdatedBy = currentUserId;

        foreach (var entry in period.Entries)
        {
            entry.Status = PayrollStatus.Paid;
            entry.PaymentJournalEntryId = paymentJournalId;
            entry.UpdatedAt = DateTime.UtcNow;
            entry.UpdatedBy = currentUserId;
        }

        await _context.SaveChangesAsync(cancellationToken);

        await _auditLogger.LogAsync("PayPayrollPeriod", "PayrollPeriod", period.Id.ToString(), "Status=Approved", $"Status=Paid, JournalId={paymentJournalId}");

        return new PayrollPeriodDto
        {
            Id = period.Id,
            PeriodName = period.PeriodName,
            PeriodStart = period.PeriodStart,
            PeriodEnd = period.PeriodEnd,
            Status = period.Status,
            TotalEntries = period.Entries.Count,
            TotalGrossPay = period.Entries.Sum(e => e.GrossPay),
            TotalNetPay = period.Entries.Sum(e => e.NetPay),
            CreatedAt = period.CreatedAt
        };
    }
}
