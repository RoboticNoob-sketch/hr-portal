using HR.Application.Common.Models;
using HR.Application.Features.Announcements.DTOs;

namespace HR.Application.Features.Announcements.Interfaces;

public interface IAnnouncementService
{
    Task<PagedResult<AnnouncementDto>> GetAnnouncementsAsync(int page, int pageSize, CancellationToken cancellationToken = default);
    Task<AnnouncementDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<AnnouncementDto> CreateAsync(CreateAnnouncementRequest request, CancellationToken cancellationToken = default);
    Task<AnnouncementDto> UpdateAsync(Guid id, UpdateAnnouncementRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
