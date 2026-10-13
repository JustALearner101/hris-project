using Microsoft.EntityFrameworkCore;
using hris_be.database.Models;

namespace hris_be.database
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Employee> Employees { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Employee>(entity =>
            {
                entity.ToTable("tblm_employees");

                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                
                entity.Property(e => e.FirstName)
                    .IsRequired()
                    .HasMaxLength(100)
                    .HasColumnName("first_name");

                entity.Property(e => e.LastName)
                    .IsRequired()
                    .HasMaxLength(100)
                    .HasColumnName("last_name");

                entity.Property(e => e.Email)
                    .IsRequired()
                    .HasMaxLength(150)
                    .HasColumnName("email");

                entity.Property(e => e.PhoneNumber)
                    .HasMaxLength(20)
                    .HasColumnName("phone_number");

                entity.Property(e => e.DateOfBirth)
                    .HasColumnName("date_of_birth");

                entity.Property(e => e.Position)
                    .IsRequired()
                    .HasMaxLength(100)
                    .HasColumnName("position");

                entity.Property(e => e.Department)
                    .IsRequired()
                    .HasMaxLength(100)
                    .HasColumnName("department");

                entity.Property(e => e.Status)
                    .HasDefaultValue(1)
                    .HasColumnName("status");

                entity.Property(e => e.CreatedBy)
                    .IsRequired()
                    .HasMaxLength(100)
                    .HasColumnName("created_by");

                entity.Property(e => e.CreatedAt)
                    .HasColumnName("created_at");

                entity.Property(e => e.ModifiedBy)
                    .HasMaxLength(100)
                    .HasColumnName("modified_by");

                entity.Property(e => e.ModifiedAt)
                    .HasColumnName("modified_at");

                entity.Property(e => e.IsDeleted)
                    .HasDefaultValue(false)
                    .HasColumnName("is_deleted");
            });
        }
    }
}
