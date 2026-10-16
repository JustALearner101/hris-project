using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using hris_recruitment_be.database.Models;

namespace hris_recruitment_be.database
{
    public interface IBaseRepository<T> where T : class
    {
        Task AddAsync(T record);
        Task AddRangeAsync(IEnumerable<T> records);
        Task UpdateAsync(T record);
        Task<T?> GetAsync(object id);
        IQueryable<T> Queryable(Expression<Func<T, bool>> expression);
        IQueryable<T> Queryable();
    }

    public class BaseRepository<T> : IBaseRepository<T> where T : class
    {
        protected readonly RecruitmentDbContext Context;
        private DbSet<T> DbSet => Context.Set<T>();

        public BaseRepository(RecruitmentDbContext context)
        {
            Context = context;
        }

        public async Task AddAsync(T record)
        {
            await DbSet.AddAsync(record);
            await Context.SaveChangesAsync();
        }

        public async Task AddRangeAsync(IEnumerable<T> records)
        {
            await DbSet.AddRangeAsync(records);
            await Context.SaveChangesAsync();
        }

        public async Task UpdateAsync(T record)
        {
            DbSet.Update(record);
            await Context.SaveChangesAsync();
        }

        public async Task<T?> GetAsync(object id)
        {
            return await DbSet.FindAsync(id);
        }

        public IQueryable<T> Queryable(Expression<Func<T, bool>> expression)
        {
            return DbSet.Where(expression);
        }

        public IQueryable<T> Queryable()
        {
            return DbSet;
        }
    }
}
