using Microsoft.EntityFrameworkCore;
using NovaERP.Application.Common.Models;
using NovaERP.Application.DTOs.ProductionOperations;
using NovaERP.Application.Interfaces.Services;
using NovaERP.Domain.Entities;
using NovaERP.Domain.Enums;
using NovaERP.Infrastructure.Persistence.Context;

namespace NovaERP.Infrastructure.Services;

public class ProductionOperationsService : IProductionOperationsService
{
    private readonly AppDbContext _context;
    private readonly IAuditLogger _auditLogger;

    public ProductionOperationsService(AppDbContext context, IAuditLogger auditLogger)
    {
        _context = context;
        _auditLogger = auditLogger;
    }

    // --- STAGE A: WORK CENTERS ---
    public async Task<PagedResult<WorkCenterDto>> GetWorkCentersAsync(int pageNumber = 1, int pageSize = 10, string? search = null)
    {
        var query = _context.WorkCenters
            .Include(w => w.Department)
            .Include(w => w.Warehouse)
            .Include(w => w.Machines)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(w => w.Code.ToLower().Contains(s) || w.Name.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(w => w.Code)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(w => new WorkCenterDto
            {
                Id = w.Id,
                Code = w.Code,
                Name = w.Name,
                Description = w.Description,
                DepartmentId = w.DepartmentId,
                DepartmentName = w.Department != null ? w.Department.DepartmentName : null,
                WarehouseId = w.WarehouseId,
                WarehouseName = w.Warehouse != null ? w.Warehouse.WarehouseName : null,
                Capacity = w.Capacity,
                IsActive = w.IsActive,
                ActiveMachineCount = w.Machines.Count(m => m.IsActive),
                CreatedAt = w.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<WorkCenterDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<WorkCenterDto> CreateWorkCenterAsync(CreateWorkCenterDto dto, Guid? currentUserId = null)
    {
        if (string.IsNullOrWhiteSpace(dto.Code) || string.IsNullOrWhiteSpace(dto.Name))
            throw new ArgumentException("Work Center Code and Name are required.");

        var codeUpper = dto.Code.Trim().ToUpper();
        if (await _context.WorkCenters.AnyAsync(w => w.Code == codeUpper))
            throw new InvalidOperationException($"Work Center Code '{codeUpper}' already exists.");

        if (dto.Capacity <= 0)
            throw new ArgumentException("Capacity must be greater than zero.");

        var workCenter = new WorkCenter
        {
            Code = codeUpper,
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            DepartmentId = dto.DepartmentId,
            WarehouseId = dto.WarehouseId,
            Capacity = dto.Capacity,
            IsActive = true
        };

        _context.WorkCenters.Add(workCenter);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("WorkCenter.Create", "WorkCenter", workCenter.Id.ToString(), newValues: $"Created Work Center '{workCenter.Code}' ({workCenter.Name})");

        return (await GetWorkCentersAsync(1, 1, workCenter.Code)).Items.First();
    }

    public async Task<WorkCenterDto> UpdateWorkCenterAsync(Guid id, UpdateWorkCenterDto dto, Guid? currentUserId = null)
    {
        var wc = await _context.WorkCenters.FirstOrDefaultAsync(w => w.Id == id)
            ?? throw new KeyNotFoundException($"Work Center '{id}' not found.");

        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new ArgumentException("Work Center Name is required.");

        if (dto.Capacity <= 0)
            throw new ArgumentException("Capacity must be greater than zero.");

        wc.Name = dto.Name.Trim();
        wc.Description = dto.Description?.Trim();
        wc.DepartmentId = dto.DepartmentId;
        wc.WarehouseId = dto.WarehouseId;
        wc.Capacity = dto.Capacity;
        wc.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("WorkCenter.Update", "WorkCenter", wc.Id.ToString(), newValues: $"Updated Work Center '{wc.Code}'");

        return (await GetWorkCentersAsync(1, 1, wc.Code)).Items.First();
    }

    // --- STAGE B: MACHINES ---
    public async Task<PagedResult<MachineDto>> GetMachinesAsync(int pageNumber = 1, int pageSize = 10, Guid? workCenterId = null, MachineStatus? status = null)
    {
        var query = _context.Machines
            .Include(m => m.WorkCenter)
            .AsNoTracking();

        if (workCenterId.HasValue)
            query = query.Where(m => m.WorkCenterId == workCenterId.Value);

        if (status.HasValue)
            query = query.Where(m => m.Status == status.Value);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(m => m.MachineCode)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new MachineDto
            {
                Id = m.Id,
                MachineCode = m.MachineCode,
                MachineName = m.MachineName,
                WorkCenterId = m.WorkCenterId,
                WorkCenterCode = m.WorkCenter.Code,
                WorkCenterName = m.WorkCenter.Name,
                MachineType = m.MachineType,
                Status = m.Status,
                Capacity = m.Capacity,
                Location = m.Location,
                IsActive = m.IsActive,
                CreatedAt = m.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<MachineDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<MachineDto> CreateMachineAsync(CreateMachineDto dto, Guid? currentUserId = null)
    {
        if (string.IsNullOrWhiteSpace(dto.MachineCode) || string.IsNullOrWhiteSpace(dto.MachineName))
            throw new ArgumentException("Machine Code and Name are required.");

        var codeUpper = dto.MachineCode.Trim().ToUpper();
        if (await _context.Machines.AnyAsync(m => m.MachineCode == codeUpper))
            throw new InvalidOperationException($"Machine Code '{codeUpper}' already exists.");

        var wc = await _context.WorkCenters.FirstOrDefaultAsync(w => w.Id == dto.WorkCenterId)
            ?? throw new KeyNotFoundException($"Work Center '{dto.WorkCenterId}' not found.");

        if (dto.Capacity <= 0)
            throw new ArgumentException("Machine capacity must be greater than zero.");

        var machine = new Machine
        {
            MachineCode = codeUpper,
            MachineName = dto.MachineName.Trim(),
            WorkCenterId = dto.WorkCenterId,
            MachineType = string.IsNullOrWhiteSpace(dto.MachineType) ? "Standard" : dto.MachineType.Trim(),
            Status = MachineStatus.Available,
            Capacity = dto.Capacity,
            Location = dto.Location?.Trim(),
            IsActive = true
        };

        _context.Machines.Add(machine);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Machine.Create", "Machine", machine.Id.ToString(), newValues: $"Created Machine '{machine.MachineCode}' ({machine.MachineName})");

        return (await GetMachinesAsync(1, 1, null, null)).Items.First(m => m.Id == machine.Id);
    }

    public async Task<MachineDto> UpdateMachineAsync(Guid id, UpdateMachineDto dto, Guid? currentUserId = null)
    {
        var machine = await _context.Machines.FirstOrDefaultAsync(m => m.Id == id)
            ?? throw new KeyNotFoundException($"Machine '{id}' not found.");

        if (string.IsNullOrWhiteSpace(dto.MachineName))
            throw new ArgumentException("Machine Name is required.");

        var wc = await _context.WorkCenters.FirstOrDefaultAsync(w => w.Id == dto.WorkCenterId)
            ?? throw new KeyNotFoundException($"Work Center '{dto.WorkCenterId}' not found.");

        if (dto.Capacity <= 0)
            throw new ArgumentException("Capacity must be greater than zero.");

        machine.MachineName = dto.MachineName.Trim();
        machine.WorkCenterId = dto.WorkCenterId;
        machine.MachineType = string.IsNullOrWhiteSpace(dto.MachineType) ? "Standard" : dto.MachineType.Trim();
        machine.Status = dto.Status;
        machine.Capacity = dto.Capacity;
        machine.Location = dto.Location?.Trim();
        machine.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Machine.Update", "Machine", machine.Id.ToString(), newValues: $"Updated Machine '{machine.MachineCode}' status to {machine.Status}");

        return (await GetMachinesAsync(1, 1, null, null)).Items.First(m => m.Id == machine.Id);
    }

    // --- STAGE C: ROUTINGS ---
    public async Task<PagedResult<ProductionRoutingDto>> GetRoutingsAsync(int pageNumber = 1, int pageSize = 10, Guid? productId = null)
    {
        var query = _context.ProductionRoutings
            .Include(r => r.Product)
            .Include(r => r.Operations)
                .ThenInclude(o => o.WorkCenter)
            .Include(r => r.Operations)
                .ThenInclude(o => o.Machine)
            .AsNoTracking();

        if (productId.HasValue)
            query = query.Where(r => r.ProductId == productId.Value);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(r => r.Product.Name)
            .ThenByDescending(r => r.Version)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new ProductionRoutingDto
            {
                Id = r.Id,
                ProductId = r.ProductId,
                ProductCode = r.Product.ProductCode,
                ProductName = r.Product.Name,
                Version = r.Version,
                IsActive = r.IsActive,
                CreatedAt = r.CreatedAt,
                Operations = r.Operations.OrderBy(o => o.SequenceNumber).Select(o => new ProductionRoutingOperationDto
                {
                    Id = o.Id,
                    RoutingId = o.RoutingId,
                    SequenceNumber = o.SequenceNumber,
                    OperationName = o.OperationName,
                    WorkCenterId = o.WorkCenterId,
                    WorkCenterName = o.WorkCenter.Name,
                    MachineId = o.MachineId,
                    MachineName = o.Machine != null ? o.Machine.MachineName : null,
                    StandardDurationMinutes = o.StandardDurationMinutes,
                    SetupDurationMinutes = o.SetupDurationMinutes,
                    Description = o.Description
                }).ToList()
            })
            .ToListAsync();

        return new PagedResult<ProductionRoutingDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<ProductionRoutingDto> CreateRoutingAsync(CreateProductionRoutingDto dto, Guid? currentUserId = null)
    {
        var prod = await _context.Products.FirstOrDefaultAsync(p => p.Id == dto.ProductId)
            ?? throw new KeyNotFoundException($"Product '{dto.ProductId}' not found.");

        var version = string.IsNullOrWhiteSpace(dto.Version) ? "1.0" : dto.Version.Trim();
        if (await _context.ProductionRoutings.AnyAsync(r => r.ProductId == dto.ProductId && r.Version == version))
            throw new InvalidOperationException($"Routing Version '{version}' already exists for product '{prod.Name}'.");

        var routing = new ProductionRouting
        {
            ProductId = dto.ProductId,
            Version = version,
            IsActive = true
        };

        if (dto.Operations == null || dto.Operations.Count == 0)
            throw new ArgumentException("Routing must contain at least one operation.");

        var sequences = dto.Operations.Select(o => o.SequenceNumber).ToList();
        if (sequences.Distinct().Count() != sequences.Count)
            throw new ArgumentException("Operation Sequence Numbers must be unique within a routing.");

        foreach (var opDto in dto.Operations.OrderBy(o => o.SequenceNumber))
        {
            if (string.IsNullOrWhiteSpace(opDto.OperationName))
                throw new ArgumentException("Operation Name is required.");

            var wc = await _context.WorkCenters.FirstOrDefaultAsync(w => w.Id == opDto.WorkCenterId)
                ?? throw new KeyNotFoundException($"Work Center '{opDto.WorkCenterId}' not found.");

            if (!wc.IsActive)
                throw new InvalidOperationException($"Work Center '{wc.Name}' is inactive.");

            if (opDto.MachineId.HasValue)
            {
                var machine = await _context.Machines.FirstOrDefaultAsync(m => m.Id == opDto.MachineId.Value)
                    ?? throw new KeyNotFoundException($"Machine '{opDto.MachineId.Value}' not found.");

                if (machine.WorkCenterId != opDto.WorkCenterId)
                    throw new InvalidOperationException($"Machine '{machine.MachineName}' does not belong to Work Center '{wc.Name}'.");
            }

            if (opDto.StandardDurationMinutes <= 0)
                throw new ArgumentException("Standard duration must be positive.");

            routing.Operations.Add(new ProductionRoutingOperation
            {
                SequenceNumber = opDto.SequenceNumber,
                OperationName = opDto.OperationName.Trim(),
                WorkCenterId = opDto.WorkCenterId,
                MachineId = opDto.MachineId,
                StandardDurationMinutes = opDto.StandardDurationMinutes,
                SetupDurationMinutes = Math.Max(0, opDto.SetupDurationMinutes),
                Description = opDto.Description?.Trim()
            });
        }

        _context.ProductionRoutings.Add(routing);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Routing.Create", "ProductionRouting", routing.Id.ToString(), newValues: $"Created Production Routing v{routing.Version} for Product '{prod.Name}'");

        return (await GetRoutingsAsync(1, 1, dto.ProductId)).Items.First(r => r.Id == routing.Id);
    }

    public async Task<ProductionRoutingDto?> GetRoutingByProductAsync(Guid productId)
    {
        var res = await GetRoutingsAsync(1, 1, productId);
        return res.Items.FirstOrDefault();
    }

    // --- STAGE D: WORKER ASSIGNMENT ---
    public async Task<PagedResult<ProductionWorkerAssignmentDto>> GetWorkerAssignmentsAsync(int pageNumber = 1, int pageSize = 10, Guid? executionId = null, Guid? employeeId = null)
    {
        var query = _context.ProductionWorkerAssignments
            .Include(a => a.ProductionExecution)
            .Include(a => a.Employee)
                .ThenInclude(e => e.User)
            .AsNoTracking();

        if (executionId.HasValue)
            query = query.Where(a => a.ProductionExecutionId == executionId.Value);

        if (employeeId.HasValue)
            query = query.Where(a => a.EmployeeId == employeeId.Value);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(a => a.StartTime)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new ProductionWorkerAssignmentDto
            {
                Id = a.Id,
                ProductionExecutionId = a.ProductionExecutionId,
                ExecutionNumber = a.ProductionExecution.ExecutionNumber,
                EmployeeId = a.EmployeeId,
                EmployeeNumber = a.Employee.EmployeeCode,
                EmployeeName = a.Employee.User != null ? $"{a.Employee.User.FirstName} {a.Employee.User.LastName}".Trim() : a.Employee.EmployeeCode,
                RoleOrFunction = a.RoleOrFunction,
                StartTime = a.StartTime,
                EndTime = a.EndTime,
                Status = a.Status,
                Remarks = a.Remarks
            })
            .ToListAsync();

        return new PagedResult<ProductionWorkerAssignmentDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<ProductionWorkerAssignmentDto> AssignWorkerAsync(CreateWorkerAssignmentDto dto, Guid? currentUserId = null)
    {
        var exec = await _context.ProductionExecutions.FirstOrDefaultAsync(e => e.Id == dto.ProductionExecutionId)
            ?? throw new KeyNotFoundException($"Production Execution '{dto.ProductionExecutionId}' not found.");

        var emp = await _context.EmployeeProfiles
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.Id == dto.EmployeeId)
            ?? throw new KeyNotFoundException($"Employee '{dto.EmployeeId}' not found.");

        if (emp.Status != EmploymentStatus.Active)
            throw new InvalidOperationException($"Cannot assign inactive employee '{emp.EmployeeCode}'.");

        var assignment = new ProductionWorkerAssignment
        {
            ProductionExecutionId = dto.ProductionExecutionId,
            EmployeeId = dto.EmployeeId,
            RoleOrFunction = string.IsNullOrWhiteSpace(dto.RoleOrFunction) ? "Operator" : dto.RoleOrFunction.Trim(),
            StartTime = DateTime.UtcNow,
            Status = "Active",
            Remarks = dto.Remarks?.Trim()
        };

        _context.ProductionWorkerAssignments.Add(assignment);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("WorkerAssignment.Create", "WorkerAssignment", assignment.Id.ToString(), newValues: $"Assigned Employee '{emp.EmployeeCode}' to Execution '{exec.ExecutionNumber}'");

        return (await GetWorkerAssignmentsAsync(1, 1, dto.ProductionExecutionId, dto.EmployeeId)).Items.First(a => a.Id == assignment.Id);
    }

    public async Task<ProductionWorkerAssignmentDto> CompleteWorkerAssignmentAsync(Guid id, Guid? currentUserId = null)
    {
        var assignment = await _context.ProductionWorkerAssignments
            .Include(a => a.Employee)
            .FirstOrDefaultAsync(a => a.Id == id)
            ?? throw new KeyNotFoundException($"Assignment '{id}' not found.");

        assignment.Status = "Completed";
        assignment.EndTime = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("WorkerAssignment.Complete", "WorkerAssignment", id.ToString(), newValues: $"Completed Assignment '{id}' for Employee '{assignment.Employee.EmployeeCode}'");

        return (await GetWorkerAssignmentsAsync(1, 1, assignment.ProductionExecutionId, assignment.EmployeeId)).Items.First(a => a.Id == assignment.Id);
    }

    // --- STAGE E: SCHEDULING ---
    public async Task<PagedResult<ProductionScheduleDto>> GetSchedulesAsync(int pageNumber = 1, int pageSize = 10, Guid? productionOrderId = null, Guid? workCenterId = null, ScheduleStatus? status = null)
    {
        var query = _context.ProductionSchedules
            .Include(s => s.ProductionOrder)
            .Include(s => s.Operation)
            .Include(s => s.WorkCenter)
            .Include(s => s.Machine)
            .AsNoTracking();

        if (productionOrderId.HasValue)
            query = query.Where(s => s.ProductionOrderId == productionOrderId.Value);

        if (workCenterId.HasValue)
            query = query.Where(s => s.WorkCenterId == workCenterId.Value);

        if (status.HasValue)
            query = query.Where(s => s.Status == status.Value);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(s => s.PlannedStart)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new ProductionScheduleDto
            {
                Id = s.Id,
                ProductionOrderId = s.ProductionOrderId,
                ProductionOrderNumber = s.ProductionOrder.ProductionOrderNumber,
                OperationId = s.OperationId,
                OperationName = s.Operation != null ? s.Operation.OperationName : null,
                WorkCenterId = s.WorkCenterId,
                WorkCenterName = s.WorkCenter.Name,
                MachineId = s.MachineId,
                MachineName = s.Machine != null ? s.Machine.MachineName : null,
                PlannedStart = s.PlannedStart,
                PlannedEnd = s.PlannedEnd,
                ActualStart = s.ActualStart,
                ActualEnd = s.ActualEnd,
                Status = s.Status,
                Remarks = s.Remarks
            })
            .ToListAsync();

        return new PagedResult<ProductionScheduleDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<ProductionScheduleDto> CreateScheduleAsync(CreateProductionScheduleDto dto, Guid? currentUserId = null)
    {
        if (dto.PlannedStart >= dto.PlannedEnd)
            throw new ArgumentException("Planned start time must be before planned end time.");

        var po = await _context.ProductionOrders.FirstOrDefaultAsync(p => p.Id == dto.ProductionOrderId)
            ?? throw new KeyNotFoundException($"Production Order '{dto.ProductionOrderId}' not found.");

        var wc = await _context.WorkCenters.FirstOrDefaultAsync(w => w.Id == dto.WorkCenterId)
            ?? throw new KeyNotFoundException($"Work Center '{dto.WorkCenterId}' not found.");

        if (!wc.IsActive)
            throw new InvalidOperationException($"Cannot schedule on inactive Work Center '{wc.Name}'.");

        Machine? machine = null;
        if (dto.MachineId.HasValue)
        {
            machine = await _context.Machines.FirstOrDefaultAsync(m => m.Id == dto.MachineId.Value)
                ?? throw new KeyNotFoundException($"Machine '{dto.MachineId.Value}' not found.");

            if (machine.WorkCenterId != dto.WorkCenterId)
                throw new InvalidOperationException($"Machine '{machine.MachineName}' does not belong to Work Center '{wc.Name}'.");

            if (!machine.IsActive)
                throw new InvalidOperationException($"Cannot schedule inactive Machine '{machine.MachineName}'.");

            var conflict = await _context.ProductionSchedules.AnyAsync(s =>
                s.MachineId == dto.MachineId.Value &&
                s.Status != ScheduleStatus.Cancelled &&
                s.PlannedStart < dto.PlannedEnd &&
                s.PlannedEnd > dto.PlannedStart);

            if (conflict)
                throw new InvalidOperationException($"Machine '{machine.MachineName}' is already scheduled during the requested time slot.");
        }

        var schedule = new ProductionSchedule
        {
            ProductionOrderId = dto.ProductionOrderId,
            OperationId = dto.OperationId,
            WorkCenterId = dto.WorkCenterId,
            MachineId = dto.MachineId,
            PlannedStart = dto.PlannedStart,
            PlannedEnd = dto.PlannedEnd,
            Status = ScheduleStatus.Scheduled,
            Remarks = dto.Remarks?.Trim()
        };

        _context.ProductionSchedules.Add(schedule);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Schedule.Create", "ProductionSchedule", schedule.Id.ToString(), newValues: $"Created Schedule for Order '{po.ProductionOrderNumber}' at Work Center '{wc.Code}'");

        return (await GetSchedulesAsync(1, 1, dto.ProductionOrderId, dto.WorkCenterId, null)).Items.First(s => s.Id == schedule.Id);
    }

    public async Task<ProductionScheduleDto> UpdateScheduleStatusAsync(Guid id, UpdateScheduleStatusDto dto, Guid? currentUserId = null)
    {
        var schedule = await _context.ProductionSchedules.FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new KeyNotFoundException($"Schedule '{id}' not found.");

        if (schedule.Status == ScheduleStatus.Cancelled)
            throw new InvalidOperationException("Cancelled schedule cannot be modified.");

        if (schedule.Status == ScheduleStatus.Completed && dto.Status != ScheduleStatus.Completed)
            throw new InvalidOperationException("Completed schedule cannot be restarted.");

        if (dto.Status == ScheduleStatus.InProgress && schedule.ActualStart == null)
        {
            schedule.ActualStart = DateTime.UtcNow;
        }
        else if (dto.Status == ScheduleStatus.Completed && schedule.ActualEnd == null)
        {
            schedule.ActualEnd = DateTime.UtcNow;
        }

        schedule.Status = dto.Status;
        if (!string.IsNullOrWhiteSpace(dto.Remarks))
            schedule.Remarks = dto.Remarks.Trim();

        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("Schedule.UpdateStatus", "ProductionSchedule", id.ToString(), newValues: $"Updated Schedule '{id}' status to {dto.Status}");

        return (await GetSchedulesAsync(1, 1, schedule.ProductionOrderId, null, null)).Items.First(s => s.Id == id);
    }

    // --- STAGE G: EVENTS / DOWNTIME ---
    public async Task<PagedResult<ProductionEventDto>> GetEventsAsync(int pageNumber = 1, int pageSize = 10, Guid? executionId = null, Guid? machineId = null, ProductionEventType? eventType = null)
    {
        var query = _context.ProductionEvents
            .Include(e => e.ProductionExecution)
            .Include(e => e.Machine)
            .Include(e => e.Employee)
                .ThenInclude(emp => emp!.User)
            .AsNoTracking();

        if (executionId.HasValue)
            query = query.Where(e => e.ProductionExecutionId == executionId.Value);

        if (machineId.HasValue)
            query = query.Where(e => e.MachineId == machineId.Value);

        if (eventType.HasValue)
            query = query.Where(e => e.EventType == eventType.Value);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(e => e.StartTime)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new ProductionEventDto
            {
                Id = e.Id,
                ProductionExecutionId = e.ProductionExecutionId,
                ExecutionNumber = e.ProductionExecution.ExecutionNumber,
                MachineId = e.MachineId,
                MachineName = e.Machine != null ? e.Machine.MachineName : null,
                EmployeeId = e.EmployeeId,
                EmployeeName = e.Employee != null ? (e.Employee.User != null ? (e.Employee.User.FirstName + " " + e.Employee.User.LastName).Trim() : e.Employee.EmployeeCode) : null,
                EventType = e.EventType,
                StartTime = e.StartTime,
                EndTime = e.EndTime,
                Reason = e.Reason,
                Remarks = e.Remarks
            })
            .ToListAsync();

        return new PagedResult<ProductionEventDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<ProductionEventDto> CreateEventAsync(CreateProductionEventDto dto, Guid? currentUserId = null)
    {
        if (string.IsNullOrWhiteSpace(dto.Reason))
            throw new ArgumentException("Reason is required for production event.");

        var exec = await _context.ProductionExecutions.FirstOrDefaultAsync(e => e.Id == dto.ProductionExecutionId)
            ?? throw new KeyNotFoundException($"Production Execution '{dto.ProductionExecutionId}' not found.");

        if (dto.EndTime.HasValue && dto.EndTime.Value < dto.StartTime)
            throw new ArgumentException("End time cannot be earlier than start time.");

        var evt = new ProductionEvent
        {
            ProductionExecutionId = dto.ProductionExecutionId,
            MachineId = dto.MachineId,
            EmployeeId = dto.EmployeeId,
            EventType = dto.EventType,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Reason = dto.Reason.Trim(),
            Remarks = dto.Remarks?.Trim()
        };

        _context.ProductionEvents.Add(evt);
        await _context.SaveChangesAsync();

        await _auditLogger.LogAsync("ProductionEvent.Create", "ProductionEvent", evt.Id.ToString(), newValues: $"Logged {evt.EventType} event for Execution '{exec.ExecutionNumber}'");

        return (await GetEventsAsync(1, 1, dto.ProductionExecutionId, null, null)).Items.First(e => e.Id == evt.Id);
    }

    // --- STAGE H: REPORTS SUMMARY ---
    public async Task<ProductionOperationsSummaryDto> GetSummaryReportAsync()
    {
        var totalWorkCenters = await _context.WorkCenters.CountAsync(w => w.IsActive);
        var activeMachines = await _context.Machines.CountAsync(m => m.IsActive && (m.Status == MachineStatus.Available || m.Status == MachineStatus.Running));
        var maintenanceMachines = await _context.Machines.CountAsync(m => m.Status == MachineStatus.Maintenance);
        var activeRoutings = await _context.ProductionRoutings.CountAsync(r => r.IsActive);
        var scheduledOrders = await _context.ProductionSchedules.CountAsync(s => s.Status == ScheduleStatus.Scheduled);
        var inProgressSchedules = await _context.ProductionSchedules.CountAsync(s => s.Status == ScheduleStatus.InProgress);
        var activeWorkerAssignments = await _context.ProductionWorkerAssignments.CountAsync(a => a.Status == "Active");
        var downtimeEventsCount = await _context.ProductionEvents.CountAsync(e => e.EventType == ProductionEventType.Downtime);

        var wcWorkload = await _context.WorkCenters
            .Where(w => w.IsActive)
            .Select(w => new WorkCenterWorkloadDto
            {
                WorkCenterCode = w.Code,
                WorkCenterName = w.Name,
                ScheduledJobsCount = _context.ProductionSchedules.Count(s => s.WorkCenterId == w.Id && s.Status != ScheduleStatus.Cancelled),
                TotalCapacity = w.Capacity
            })
            .ToListAsync();

        var machineBreakdown = await _context.Machines
            .Where(m => m.IsActive)
            .Select(m => new MachineUtilizationDto
            {
                MachineCode = m.MachineCode,
                MachineName = m.MachineName,
                Status = m.Status.ToString(),
                EventsLoggedCount = _context.ProductionEvents.Count(e => e.MachineId == m.Id)
            })
            .ToListAsync();

        return new ProductionOperationsSummaryDto
        {
            TotalWorkCenters = totalWorkCenters,
            ActiveMachines = activeMachines,
            MaintenanceMachines = maintenanceMachines,
            ActiveRoutings = activeRoutings,
            ScheduledOrders = scheduledOrders,
            InProgressSchedules = inProgressSchedules,
            ActiveWorkerAssignments = activeWorkerAssignments,
            DowntimeEventsCount = downtimeEventsCount,
            WorkCenterWorkload = wcWorkload,
            MachineStatusBreakdown = machineBreakdown
        };
    }
}
