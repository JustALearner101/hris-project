using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using hris_be.database.Models;

namespace hris_be.database.Repositories
{
    public class EmployeeRepository : BaseRepository<Employee>, IEmployeeRepository
    {
        public EmployeeRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Employee>> GetActiveEmployeesAsync()
        {
            return await Queryable(e => !e.IsDeleted && e.Status == 1).ToListAsync();
        }

        public async Task<Employee?> GetByEmailAsync(string email)
        {
            return await Queryable(e => e.Email.ToLower() == email.ToLower() && !e.IsDeleted).FirstOrDefaultAsync();
        }
    }
}
