using HR.Application.Common.Models;
using HR.Application.Features.Positions.DTOs;

namespace HR.Application.Features.Positions.Interfaces;

public interface IPositionService
{
    Task<PagedResult<PositionDto>> GetPositionsAsync(int page, int pageSize, Guid? departmentId = null, string? search = null, CancellationToken cancellationToken = default);
    Task<IEnumerable<PositionDto>> GetAllActiveAsync(Guid? departmentId = null, CancellationToken cancellationToken = default);
    Task<PositionDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PositionDto> CreateAsync(CreatePositionRequest request, CancellationToken cancellationToken = default);
    Task<PositionDto> UpdateAsync(Guid id, UpdatePositionRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
