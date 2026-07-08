using HR.Application.Common.Models;
using HR.Application.Features.Attendance.DTOs;

namespace HR.Application.Features.Attendance.Interfaces;

public interface IAttendanceService
{
    Task<TodayAttendanceStatusDto> GetTodayStatusAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<AttendanceDto> ClockInAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<AttendanceDto> ClockOutAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<PagedResult<AttendanceDto>> GetMyAttendanceAsync(Guid userId, int page, int pageSize, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);
    Task<PagedResult<AttendanceDto>> GetTeamAttendanceAsync(int page, int pageSize, DateTime? date = null, Guid? departmentId = null, CancellationToken cancellationToken = default);
    Task<AttendanceDto> UpdateAsync(Guid id, UpdateAttendanceRequest request, CancellationToken cancellationToken = default);
}
