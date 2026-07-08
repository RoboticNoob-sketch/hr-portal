using HR.Application.Common.Models;
using HR.Application.Features.Leave.DTOs;
using HR.Domain.Enums;

namespace HR.Application.Features.Leave.Interfaces;

public interface ILeaveService
{
    Task<IEnumerable<LeaveBalanceDto>> GetMyBalancesAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<PagedResult<LeaveRequestDto>> GetMyRequestsAsync(Guid userId, int page, int pageSize, LeaveStatus? status = null, CancellationToken cancellationToken = default);
    Task<PagedResult<LeaveRequestDto>> GetPendingRequestsAsync(Guid userId, IEnumerable<string> roles, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<PagedResult<LeaveRequestDto>> GetReviewedRequestsAsync(Guid userId, IEnumerable<string> roles, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<PagedResult<LeaveRequestDto>> GetAllRequestsAsync(int page, int pageSize, LeaveStatus? status = null, CancellationToken cancellationToken = default);
    Task<LeaveRequestDto> CreateRequestAsync(Guid userId, CreateLeaveRequest request, CancellationToken cancellationToken = default);
    Task<LeaveRequestDto> ReviewRequestAsync(Guid id, string reviewerEmail, IEnumerable<string> roles, Guid userId, ReviewLeaveRequest request, CancellationToken cancellationToken = default);
    Task CancelRequestAsync(Guid id, Guid userId, IEnumerable<string> roles, CancellationToken cancellationToken = default);
}
