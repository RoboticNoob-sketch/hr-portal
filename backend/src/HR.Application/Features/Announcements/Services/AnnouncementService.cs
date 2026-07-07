using HR.Application.Common.Exceptions;
using HR.Application.Common.Interfaces;
using HR.Application.Common.Models;
using HR.Application.Features.Announcements.DTOs;
using HR.Application.Features.Announcements.Interfaces;
using HR.Domain.Entities;

namespace HR.Application.Features.Announcements.Services;

public class AnnouncementService : IAnnouncementService
{
    private readonly IRepository<Announcement> _repo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;

    public AnnouncementService(IRepository<Announcement> repo, IUnitOfWork unitOfWork, ICurrentUserService currentUser)
    {
        _repo = repo;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<AnnouncementDto>> GetAnnouncementsAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var all = await _repo.FindAsync(a => !a.IsDeleted, cancellationToken);
        var ordered = all.OrderByDescending(a => a.PublishDate).ToList();
        var total = ordered.Count;
        var items = ordered.Skip((page - 1) * pageSize).Take(pageSize);
        return PagedResult<AnnouncementDto>.Create(items.Select(Map), total, page, pageSize);
    }

    public async Task<AnnouncementDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var a = await _repo.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(Announcement), id);
        return Map(a);
    }

    public async Task<AnnouncementDto> CreateAsync(CreateAnnouncementRequest request, CancellationToken cancellationToken = default)
    {
        var a = new Announcement
        {
            Title = request.Title,
            Body = request.Body,
            Category = request.Category,
            PublishDate = request.PublishDate,
            ExpiryDate = request.ExpiryDate,
            IsPublished = request.IsPublished,
            TargetAudience = request.TargetAudience,
            AuthorName = _currentUser.UserEmail
        };
        await _repo.AddAsync(a, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Map(a);
    }

    public async Task<AnnouncementDto> UpdateAsync(Guid id, UpdateAnnouncementRequest request, CancellationToken cancellationToken = default)
    {
        var a = await _repo.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(Announcement), id);

        a.Title = request.Title;
        a.Body = request.Body;
        a.Category = request.Category;
        a.PublishDate = request.PublishDate;
        a.ExpiryDate = request.ExpiryDate;
        a.IsPublished = request.IsPublished;
        a.TargetAudience = request.TargetAudience;
        a.UpdatedAt = DateTime.UtcNow;

        _repo.Update(a);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Map(a);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var a = await _repo.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken)
            ?? throw new NotFoundException(nameof(Announcement), id);
        a.IsDeleted = true;
        _repo.Update(a);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static AnnouncementDto Map(Announcement a) =>
        new(a.Id, a.Title, a.Body, a.Category.ToString(), a.PublishDate, a.ExpiryDate, a.IsPublished, a.TargetAudience, a.AuthorName, a.CreatedAt);
}
