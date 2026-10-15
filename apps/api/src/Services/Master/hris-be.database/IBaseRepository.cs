using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace hris_be.database
{
    public interface IBaseRepository<T> where T : class
    {
        Task AddAsync(T record);
        Task UpdateAsync(T record);
        Task<T?> GetAsync(object id);
        IQueryable<T> Queryable(Expression<Func<T, bool>> expression);
        IQueryable<T> Queryable();
    }
}
