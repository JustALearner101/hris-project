using hris_recruitment_be.database.Models;

namespace hris_recruitment_be.database.Repositories
{
    public interface IJobPostingRepository : IBaseRepository<JobPosting> { }
    public interface IJobStageRepository : IBaseRepository<JobStage> { }
    public interface ICandidateRepository : IBaseRepository<Candidate> { }
    public interface IApplicationRepository : IBaseRepository<Application> { }
    public interface IApplicationDocumentRepository : IBaseRepository<ApplicationDocument> { }
    public interface IInterviewRepository : IBaseRepository<Interview> { }
    public interface IOfferRepository : IBaseRepository<Offer> { }
    public interface IApplicationSubmissionRepository : IBaseRepository<ApplicationSubmission> { }

    public class JobPostingRepository : BaseRepository<JobPosting>, IJobPostingRepository
    {
        public JobPostingRepository(RecruitmentDbContext context) : base(context) { }
    }

    public class JobStageRepository : BaseRepository<JobStage>, IJobStageRepository
    {
        public JobStageRepository(RecruitmentDbContext context) : base(context) { }
    }

    public class CandidateRepository : BaseRepository<Candidate>, ICandidateRepository
    {
        public CandidateRepository(RecruitmentDbContext context) : base(context) { }
    }

    public class ApplicationRepository : BaseRepository<Application>, IApplicationRepository
    {
        public ApplicationRepository(RecruitmentDbContext context) : base(context) { }
    }

    public class ApplicationDocumentRepository : BaseRepository<ApplicationDocument>, IApplicationDocumentRepository
    {
        public ApplicationDocumentRepository(RecruitmentDbContext context) : base(context) { }
    }

    public class InterviewRepository : BaseRepository<Interview>, IInterviewRepository
    {
        public InterviewRepository(RecruitmentDbContext context) : base(context) { }
    }

    public class OfferRepository : BaseRepository<Offer>, IOfferRepository
    {
        public OfferRepository(RecruitmentDbContext context) : base(context) { }
    }

    public class ApplicationSubmissionRepository : BaseRepository<ApplicationSubmission>, IApplicationSubmissionRepository
    {
        public ApplicationSubmissionRepository(RecruitmentDbContext context) : base(context) { }
    }
}
