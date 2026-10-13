using System.Threading.Tasks;
using hris_be.database.Repositories;

namespace hris_be.database
{
    public interface IUnitOfWork
    {
        IEmployeeRepository Employees { get; }
        Task<int> SaveChangesAsync();
    }
}
