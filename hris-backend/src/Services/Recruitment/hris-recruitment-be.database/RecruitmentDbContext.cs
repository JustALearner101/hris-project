using Microsoft.EntityFrameworkCore;
using hris_recruitment_be.database.Models;

namespace hris_recruitment_be.database
{
    public class RecruitmentDbContext : DbContext
    {
        public RecruitmentDbContext(DbContextOptions<RecruitmentDbContext> options) : base(options) { }
        public DbSet<RecruitmentItem> Items { get; set; } = null!;
    }
}
