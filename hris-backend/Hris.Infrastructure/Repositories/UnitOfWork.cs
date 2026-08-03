using Hris.Domain.Interfaces;
using Hris.Infrastructure.Data;

namespace Hris.Infrastructure.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly HrisDbContext _context;

        public UnitOfWork(HrisDbContext context)
        {
            _context = context;
        }

        public async Task<int> CompleteAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
