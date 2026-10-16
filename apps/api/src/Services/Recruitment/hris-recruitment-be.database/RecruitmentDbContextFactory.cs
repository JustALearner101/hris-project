using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace hris_recruitment_be.database
{
    public class RecruitmentDbContextFactory : IDesignTimeDbContextFactory<RecruitmentDbContext>
    {
        public RecruitmentDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<RecruitmentDbContext>();
            optionsBuilder.UseNpgsql(
                "Host=localhost;Port=5432;Database=hris;Username=hris;Password=hris",
                npgsql => npgsql.MigrationsHistoryTable("__EFMigrationsHistory_ats", "ats"));
            return new RecruitmentDbContext(optionsBuilder.Options);
        }
    }
}
