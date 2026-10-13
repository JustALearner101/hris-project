using System.Collections.Generic;
using System.Threading.Tasks;
using hris_be.database.Models;

namespace hris_be.database.Repositories
{
    public interface IEmployeeRepository : IBaseRepository<Employee>
    {
        Task<IEnumerable<Employee>> GetActiveEmployeesAsync();
        Task<Employee?> GetByEmailAsync(string email);
    }
}
