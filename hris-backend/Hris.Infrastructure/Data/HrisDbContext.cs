using Hris.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Hris.Infrastructure.Data
{
    public class HrisDbContext : DbContext
    {
        public HrisDbContext(DbContextOptions<HrisDbContext> options) : base(options)
        {
        }

        public DbSet<Employee> Employees { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            // Apply configurations here
        }
    }
}
