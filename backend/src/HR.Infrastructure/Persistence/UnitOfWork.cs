using HR.Application.Common.Interfaces;

namespace HR.Infrastructure.Persistence;

public class UnitOfWork : IUnitOfWork
{
    private readonly HrDbContext _context;

    public UnitOfWork(HrDbContext context)
    {
        _context = context;
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        await _context.SaveChangesAsync(cancellationToken);

    public void Dispose() => _context.Dispose();
}
