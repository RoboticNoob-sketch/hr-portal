using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.Features.Leave.DTOs;
using HR.Application.Features.Leave.Interfaces;
using HR.Domain.Entities;
using HR.Domain.Enums;

namespace HR.Application.Features.Leave.Services;

public class LeaveService : ILeaveService
{
    private readonly IRepository<LeaveRequest> _leaveRepo;
    private readonly IRepository<LeaveBalance> _balanceRepo;
    private readonly IRepository<Employee> _employeeRepo;
    private readonly IRepository<Department> _deptRepo;
    private readonly IUnitOfWork _unitOfWork;

    public LeaveService(
        IRepository<LeaveRequest> leaveRepo,
        IRepository<LeaveBalance> balanceRepo,
        IRepository<Employee> employeeRepo,
        IRepository<Department> deptRepo,
        IUnitOfWork unitOfWork)
    {
        _leaveRepo = leaveRepo;
        _balanceRepo = balanceRepo;
        _employeeRepo = employeeRepo;
        _deptRepo = deptRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<LeaveBalanceDto>> GetMyBalancesAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var employee = await GetEmployeeByUserIdAsync(userId, cancellationToken);
        var year = DateTime.UtcNow.Year;
        var balances = await _balanceRepo.FindAsync(
            b => b.EmployeeId == employee.Id && b.Year == year && !b.IsDeleted, cancellationToken);

        return balances
            .OrderBy(b => b.LeaveType)
            .Select(MapBalance)
            .ToList();
    }

    public async Task<PagedResult<LeaveRequestDto>> GetMyRequestsAsync(
        Guid userId, int page, int pageSize, LeaveStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var employee = await GetEmployeeByUserIdAsync(userId, cancellationToken);
        return await GetPagedRequestsAsync(page, pageSize, status, [employee.Id], cancellationToken);
    }

    public async Task<PagedResult<LeaveRequestDto>> GetPendingRequestsAsync(
        Guid userId, IEnumerable<string> roles, int page, int pageSize,
        CancellationToken cancellationToken = default)
    {
        var roleList = roles.ToList();
        var isHrOrAdmin = roleList.Contains("Admin") || roleList.Contains("HR");

        IEnumerable<LeaveRequest> all = await _leaveRepo.FindAsync(
            l => !l.IsDeleted && l.Status == LeaveStatus.Pending, cancellationToken);

        all = await FilterByApproverScopeAsync(all, userId, roles, cancellationToken);

        var ordered = all.OrderByDescending(l => l.CreatedAt).ToList();
        var total = ordered.Count;
        var pageItems = ordered.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        var dtos = await MapListAsync(pageItems, cancellationToken);

        return PagedResult<LeaveRequestDto>.Create(dtos, total, page, pageSize);
    }

    public async Task<PagedResult<LeaveRequestDto>> GetReviewedRequestsAsync(
        Guid userId, IEnumerable<string> roles, int page, int pageSize,
        CancellationToken cancellationToken = default)
    {
        var all = await _leaveRepo.FindAsync(
            l => !l.IsDeleted && (l.Status == LeaveStatus.Approved || l.Status == LeaveStatus.Rejected), cancellationToken);
        all = await FilterByApproverScopeAsync(all, userId, roles, cancellationToken);

        var ordered = all.OrderByDescending(l => l.ReviewedAt ?? l.UpdatedAt).ToList();
        var total = ordered.Count;
        var pageItems = ordered.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        var dtos = await MapListAsync(pageItems, cancellationToken);

        return PagedResult<LeaveRequestDto>.Create(dtos, total, page, pageSize);
    }

    public async Task<PagedResult<LeaveRequestDto>> GetAllRequestsAsync(
        int page, int pageSize, LeaveStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var all = await _leaveRepo.FindAsync(l => !l.IsDeleted, cancellationToken);
        if (status.HasValue)
            all = all.Where(l => l.Status == status.Value);

        var ordered = all.OrderByDescending(l => l.CreatedAt).ToList();
        var total = ordered.Count;
        var pageItems = ordered.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        var dtos = await MapListAsync(pageItems, cancellationToken);

        return PagedResult<LeaveRequestDto>.Create(dtos, total, page, pageSize);
    }

    public async Task<LeaveRequestDto> CreateRequestAsync(
        Guid userId, CreateLeaveRequest request, CancellationToken cancellationToken = default)
    {
        var employee = await GetEmployeeByUserIdAsync(userId, cancellationToken);
        var totalDays = CalculateTotalDays(request.StartDate, request.EndDate);

        if (totalDays <= 0)
            throw new AppException("Leave duration must be at least one day.");

        var year = request.StartDate.Year;
        var balance = await _balanceRepo.FirstOrDefaultAsync(
            b => b.EmployeeId == employee.Id && b.LeaveType == request.LeaveType && b.Year == year && !b.IsDeleted,
            cancellationToken)
            ?? throw new AppException($"No leave balance found for {request.LeaveType} in {year}.");

        if (balance.RemainingDays < totalDays)
            throw new AppException($"Insufficient leave balance. Remaining: {balance.RemainingDays}, requested: {totalDays}.");

        var overlapping = await _leaveRepo.AnyAsync(l =>
            l.EmployeeId == employee.Id &&
            !l.IsDeleted &&
            l.Status != LeaveStatus.Rejected &&
            l.Status != LeaveStatus.Cancelled &&
            l.StartDate <= request.EndDate.Date &&
            l.EndDate >= request.StartDate.Date, cancellationToken);

        if (overlapping)
            throw new ConflictException("You already have a leave request for overlapping dates.");

        var leaveRequest = new LeaveRequest
        {
            EmployeeId = employee.Id,
            LeaveType = request.LeaveType,
            StartDate = request.StartDate.Date,
            EndDate = request.EndDate.Date,
            TotalDays = totalDays,
            Reason = request.Reason.Trim(),
            Status = LeaveStatus.Pending
        };

        balance.PendingDays += totalDays;
        balance.UpdatedAt = DateTime.UtcNow;

        await _leaveRepo.AddAsync(leaveRequest, cancellationToken);
        _balanceRepo.Update(balance);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapAsync(leaveRequest, cancellationToken);
    }

    public async Task<LeaveRequestDto> ReviewRequestAsync(
        Guid id, string reviewerEmail, IEnumerable<string> roles, Guid userId,
        ReviewLeaveRequest request, CancellationToken cancellationToken = default)
    {
        var leaveRequest = await _leaveRepo.FirstOrDefaultAsync(l => l.Id == id && !l.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(LeaveRequest), id);

        if (leaveRequest.Status != LeaveStatus.Pending)
            throw new ConflictException("Only pending leave requests can be reviewed.");

        await EnsureCanReviewAsync(leaveRequest, userId, roles, cancellationToken);

        var balance = await _balanceRepo.FirstOrDefaultAsync(
            b => b.EmployeeId == leaveRequest.EmployeeId &&
                 b.LeaveType == leaveRequest.LeaveType &&
                 b.Year == leaveRequest.StartDate.Year &&
                 !b.IsDeleted, cancellationToken)
            ?? throw new AppException("Leave balance record not found.");

        balance.PendingDays -= leaveRequest.TotalDays;

        if (request.Approve)
        {
            balance.UsedDays += leaveRequest.TotalDays;
            leaveRequest.Status = LeaveStatus.Approved;
        }
        else
        {
            leaveRequest.Status = LeaveStatus.Rejected;
        }

        leaveRequest.ReviewedBy = reviewerEmail;
        leaveRequest.ReviewedAt = DateTime.UtcNow;
        leaveRequest.ReviewNotes = request.ReviewNotes?.Trim();
        leaveRequest.UpdatedAt = DateTime.UtcNow;
        balance.UpdatedAt = DateTime.UtcNow;

        _leaveRepo.Update(leaveRequest);
        _balanceRepo.Update(balance);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapAsync(leaveRequest, cancellationToken);
    }

    public async Task CancelRequestAsync(
        Guid id, Guid userId, IEnumerable<string> roles, CancellationToken cancellationToken = default)
    {
        var leaveRequest = await _leaveRepo.FirstOrDefaultAsync(l => l.Id == id && !l.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(LeaveRequest), id);

        if (leaveRequest.Status != LeaveStatus.Pending)
            throw new ConflictException("Only pending leave requests can be cancelled.");

        var roleList = roles.ToList();
        var isHrOrAdmin = roleList.Contains("Admin") || roleList.Contains("HR");
        if (!isHrOrAdmin)
        {
            var employee = await GetEmployeeByUserIdAsync(userId, cancellationToken);
            if (leaveRequest.EmployeeId != employee.Id)
                throw new ForbiddenException();
        }

        var balance = await _balanceRepo.FirstOrDefaultAsync(
            b => b.EmployeeId == leaveRequest.EmployeeId &&
                 b.LeaveType == leaveRequest.LeaveType &&
                 b.Year == leaveRequest.StartDate.Year &&
                 !b.IsDeleted, cancellationToken)
            ?? throw new AppException("Leave balance record not found.");

        balance.PendingDays -= leaveRequest.TotalDays;
        balance.UpdatedAt = DateTime.UtcNow;
        leaveRequest.Status = LeaveStatus.Cancelled;
        leaveRequest.UpdatedAt = DateTime.UtcNow;

        _leaveRepo.Update(leaveRequest);
        _balanceRepo.Update(balance);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<IEnumerable<LeaveRequest>> FilterByApproverScopeAsync(
        IEnumerable<LeaveRequest> requests, Guid userId, IEnumerable<string> roles, CancellationToken cancellationToken)
    {
        var roleList = roles.ToList();
        if (roleList.Contains("Admin") || roleList.Contains("HR"))
            return requests;

        var manager = await GetEmployeeByUserIdAsync(userId, cancellationToken);
        var reports = await _employeeRepo.FindAsync(
            e => e.ManagerId == manager.Id && !e.IsDeleted, cancellationToken);
        var reportIds = reports.Select(e => e.Id).ToHashSet();
        return requests.Where(l => reportIds.Contains(l.EmployeeId));
    }

    private async Task EnsureCanReviewAsync(
        LeaveRequest leaveRequest, Guid userId, IEnumerable<string> roles, CancellationToken cancellationToken)
    {
        var roleList = roles.ToList();
        if (roleList.Contains("Admin") || roleList.Contains("HR"))
            return;

        if (!roleList.Contains("Manager"))
            throw new ForbiddenException();

        var manager = await GetEmployeeByUserIdAsync(userId, cancellationToken);
        var employee = await _employeeRepo.FirstOrDefaultAsync(
            e => e.Id == leaveRequest.EmployeeId && !e.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(Employee), leaveRequest.EmployeeId);

        if (employee.ManagerId != manager.Id)
            throw new ForbiddenException("You can only review leave requests for your direct reports.");
    }

    private async Task<PagedResult<LeaveRequestDto>> GetPagedRequestsAsync(
        int page, int pageSize, LeaveStatus? status, List<Guid> employeeIds,
        CancellationToken cancellationToken)
    {
        var all = await _leaveRepo.FindAsync(
            l => !l.IsDeleted && employeeIds.Contains(l.EmployeeId), cancellationToken);

        if (status.HasValue)
            all = all.Where(l => l.Status == status.Value);

        var ordered = all.OrderByDescending(l => l.CreatedAt).ToList();
        var total = ordered.Count;
        var pageItems = ordered.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        var dtos = await MapListAsync(pageItems, cancellationToken);

        return PagedResult<LeaveRequestDto>.Create(dtos, total, page, pageSize);
    }

    private async Task<Employee> GetEmployeeByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await _employeeRepo.FirstOrDefaultAsync(e => e.UserId == userId && !e.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(Employee), userId);
    }

    private async Task<List<LeaveRequestDto>> MapListAsync(List<LeaveRequest> items, CancellationToken cancellationToken)
    {
        var result = new List<LeaveRequestDto>();
        foreach (var item in items)
            result.Add(await MapAsync(item, cancellationToken));
        return result;
    }

    private async Task<LeaveRequestDto> MapAsync(LeaveRequest l, CancellationToken cancellationToken)
    {
        var employee = await _employeeRepo.FirstOrDefaultAsync(e => e.Id == l.EmployeeId && !e.IsDeleted, cancellationToken);
        Department? dept = null;
        if (employee?.DepartmentId is not null)
            dept = await _deptRepo.FirstOrDefaultAsync(d => d.Id == employee.DepartmentId.Value, cancellationToken);

        return new LeaveRequestDto(
            l.Id,
            l.EmployeeId,
            employee?.FullName ?? "Unknown",
            dept?.Name,
            l.LeaveType.ToString(),
            l.StartDate,
            l.EndDate,
            l.TotalDays,
            l.Reason,
            l.Status.ToString(),
            l.ReviewedBy,
            l.ReviewedAt,
            l.ReviewNotes,
            l.CreatedAt
        );
    }

    private static LeaveBalanceDto MapBalance(LeaveBalance b) =>
        new(b.Id, b.EmployeeId, b.LeaveType.ToString(), b.Year,
            b.TotalEntitlement, b.UsedDays, b.PendingDays, b.RemainingDays);

    private static int CalculateTotalDays(DateTime start, DateTime end)
    {
        var days = 0;
        for (var date = start.Date; date <= end.Date; date = date.AddDays(1))
        {
            if (date.DayOfWeek is not DayOfWeek.Saturday and not DayOfWeek.Sunday)
                days++;
        }
        return days;
    }
}
