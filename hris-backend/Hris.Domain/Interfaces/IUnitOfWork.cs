namespace Hris.Domain.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        // Add specific repositories here if needed, e.g.:
        // IEmployeeRepository Employees { get; }
        
        Task<int> CompleteAsync();
    }
}
