using System.Threading.Tasks;
using hris_recruitment_be.database.Repositories;

namespace hris_recruitment_be.database
{
    public interface IUnitOfWork
    {
        IJobPostingRepository JobPostings { get; }
        IJobStageRepository JobStages { get; }
        ICandidateRepository Candidates { get; }
        IApplicationRepository Applications { get; }
        IApplicationDocumentRepository ApplicationDocuments { get; }
        IInterviewRepository Interviews { get; }
        IOfferRepository Offers { get; }
        IApplicationSubmissionRepository ApplicationSubmissions { get; }
        Task<int> SaveChangesAsync();
    }

    public class UnitOfWork : IUnitOfWork
    {
        private readonly RecruitmentDbContext _context;
        private IJobPostingRepository? _jobPostings;
        private IJobStageRepository? _jobStages;
        private ICandidateRepository? _candidates;
        private IApplicationRepository? _applications;
        private IApplicationDocumentRepository? _applicationDocuments;
        private IInterviewRepository? _interviews;
        private IOfferRepository? _offers;
        private IApplicationSubmissionRepository? _applicationSubmissions;

        public UnitOfWork(RecruitmentDbContext context)
        {
            _context = context;
        }

        public IJobPostingRepository JobPostings => _jobPostings ??= new JobPostingRepository(_context);
        public IJobStageRepository JobStages => _jobStages ??= new JobStageRepository(_context);
        public ICandidateRepository Candidates => _candidates ??= new CandidateRepository(_context);
        public IApplicationRepository Applications => _applications ??= new ApplicationRepository(_context);
        public IApplicationDocumentRepository ApplicationDocuments => _applicationDocuments ??= new ApplicationDocumentRepository(_context);
        public IInterviewRepository Interviews => _interviews ??= new InterviewRepository(_context);
        public IOfferRepository Offers => _offers ??= new OfferRepository(_context);
        public IApplicationSubmissionRepository ApplicationSubmissions => _applicationSubmissions ??= new ApplicationSubmissionRepository(_context);

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}
