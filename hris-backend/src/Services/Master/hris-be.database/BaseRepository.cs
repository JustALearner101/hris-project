using System;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace hris_be.database
{
    public class BaseRepository<T> : IBaseRepository<T> where T : class
    {
        protected readonly ApplicationDbContext Context;
        private DbSet<T> DbSet => Context.Set<T>();

        public BaseRepository(ApplicationDbContext context)
        {
            Context = context;
        }

        public async Task AddAsync(T record)
        {
            await DbSet.AddAsync(record);
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
