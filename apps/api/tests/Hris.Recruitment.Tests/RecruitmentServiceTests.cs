using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using hris_recruitment_be.database;
using hris_recruitment_be.database.Models;
using hris_recruitment_be.lib.DefaultDTO;
using hris_recruitment_be.lib.Storage;
using hris_recruitment_be.lib.Utils;
using hris_recruitment_be.service.Events;
using hris_recruitment_be.service.Services;
using hris_recruitment_be.view.DTOs;
using hris_recruitment_be.view.DTOs.Integration;
using hris_recruitment_be.view.DTOs.Public;

namespace Hris.Recruitment.Tests
{
    public class RecruitmentServiceTests : IDisposable
    {
        private readonly RecruitmentDbContext _dbContext;
        private readonly IUnitOfWork _unitOfWork;
        private readonly InMemoryEventPublisher _eventPublisher;
        private readonly LocalDiskStorage _storage;
        private readonly string _tempDir;
        private readonly JobPostingService _jobPostingService;
        private readonly ApplicationService _applicationService;
        private readonly CvProcessingService _cvProcessingService;
        private readonly PublicJobService _publicJobService;

        public RecruitmentServiceTests()
        {
            var options = new DbContextOptionsBuilder<RecruitmentDbContext>()
                .UseInMemoryDatabase(databaseName: $"RecruitmentUnitTest_{Guid.NewGuid():N}")
                .Options;

            _dbContext = new RecruitmentDbContext(options);
            _unitOfWork = new UnitOfWork(_dbContext);
            _eventPublisher = new InMemoryEventPublisher();
            _tempDir = Path.Combine(Path.GetTempPath(), $"hris_ats_test_{Guid.NewGuid():N}");
            _storage = new LocalDiskStorage(_tempDir);

            _jobPostingService = new JobPostingService(_unitOfWork);
            _applicationService = new ApplicationService(_unitOfWork, _eventPublisher, _storage);
            _cvProcessingService = new CvProcessingService(_unitOfWork, _storage, _eventPublisher);
            _publicJobService = new PublicJobService(_unitOfWork);
        }

        [Fact]
        public async Task CreateJobPosting_GeneratesDefaultStagesAndSanitizesHtml()
        {
            var createDto = new CreateJobPostingDto
            {
                Title = "Backend Architect",
                Description = "<p>Build scalable APIs</p><script>alert('xss')</script>",
                Department = "Engineering",
                Location = "Jakarta",
                EmploymentType = "FULL_TIME",
                Headcount = 3
            };

            var res = await _jobPostingService.CreateJobPostingAsync(createDto, "hr-admin");

            Assert.Equal("SUCCESS", res.Status);
            Assert.Single(res.Data);
            var job = res.Data[0];
            Assert.Equal("backend-architect", job.SeoSlug);
            Assert.DoesNotContain("<script>", job.Description);
            Assert.Equal(5, job.Stages.Count);
            Assert.Equal("SOURCING", job.Stages[0].StageType);
            Assert.Equal("HIRED", job.Stages[4].StageType);
        }

        [Fact]
        public async Task SubmitApplication_EnforcesIdempotencyKey_AndDeduplicatesCandidate()
        {
            var created = await _jobPostingService.CreateJobPostingAsync(new CreateJobPostingDto
            {
                Title = "AI Engineer",
                Description = "RAG and CV Worker",
                Department = "AI",
                Location = "Jakarta"
            });
            var jobId = created.Data[0].Id;
            await _jobPostingService.PublishJobPostingAsync(jobId);

            var validPdfBytes = Encoding.ASCII.GetBytes("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF");
            var submitDto = new SubmitApplicationDto
            {
                FullName = "Budi Santoso",
                Email = "budi@example.com",
                Phone = "+628123456789",
                ConsentAccepted = true
            };

            var first = await _cvProcessingService.SubmitApplicationAsync(
                jobId,
                submitDto,
                "budi_cv.pdf",
                validPdfBytes,
                idempotencyKey: "idem-key-001");

            Assert.Equal("SUCCESS", first.Status);
            var token1 = first.Data[0].TrackingToken;
            Assert.False(string.IsNullOrWhiteSpace(token1));

            // Replay with same Idempotency-Key returns identical response and does not emit second event
            var second = await _cvProcessingService.SubmitApplicationAsync(
                jobId,
                submitDto,
                "budi_cv.pdf",
                validPdfBytes,
                idempotencyKey: "idem-key-001");

            Assert.Equal(first.Data[0].ApplicationId, second.Data[0].ApplicationId);
            Assert.Equal(token1, second.Data[0].TrackingToken);
            Assert.Single(_eventPublisher.GetPublishedEvents("candidate.cv.uploaded"));

            // Verify token is stored hashed at rest in DB
            var dbApp = await _dbContext.Applications.FirstAsync();
            Assert.NotEqual(token1, dbApp.TrackingTokenHash);
            Assert.Equal(TrackingTokenUtil.HashToken(token1), dbApp.TrackingTokenHash);

            // Polling by raw token succeeds
            var statusRes = await _publicJobService.GetApplicationStatusByTokenAsync(token1);
            Assert.Equal("SUCCESS", statusRes.Status);
            Assert.Equal("PENDING", statusRes.Data[0].CvParseStatus);
            Assert.Equal("Budi S.", statusRes.Data[0].CandidateName);
        }

        [Fact]
        public async Task MoveStage_And_HireApplication_EmitsCandidateHiredOnce_AndRejectsDuplicateHire()
        {
            var created = await _jobPostingService.CreateJobPostingAsync(new CreateJobPostingDto
            {
                Title = "Platform Engineer",
                Description = "Kubernetes & Postgres",
                Department = "Infra",
                Location = "Bandung"
            });
            var jobId = created.Data[0].Id;
            await _jobPostingService.PublishJobPostingAsync(jobId);

            var validPdfBytes = Encoding.ASCII.GetBytes("%PDF-1.4\n%%EOF");
            var appRes = await _cvProcessingService.SubmitApplicationAsync(
                jobId,
                new SubmitApplicationDto { FullName = "Siti Aminah", Email = "siti@example.com", ConsentAccepted = true },
                "siti.pdf",
                validPdfBytes);

            var appId = appRes.Data[0].ApplicationId;

            // Move to SCREENING
            var moveRes = await _applicationService.MoveStageAsync(appId, new MoveStageDto
            {
                TargetStageType = "SCREENING",
                Notes = "Passed initial CV review"
            });
            Assert.Equal("SUCCESS", moveRes.Status);
            Assert.Equal("SCREENING", moveRes.Data[0].Status);
            Assert.Equal("SCREENING", moveRes.Data[0].CurrentStageType);

            // Hire candidate
            var hireRes = await _applicationService.HireApplicationAsync(appId, new HireApplicationDto { Notes = "Offer accepted" });
            Assert.Equal("SUCCESS", hireRes.Status);
            Assert.Equal("HIRED", hireRes.Data[0].Status);
            Assert.NotNull(hireRes.Data[0].HiredAt);

            var hiredEvents = _eventPublisher.GetPublishedEvents("candidate.hired");
            Assert.Single(hiredEvents);

            // Second hire attempt returns ERR_ALREADY_HIRED and does not emit duplicate event
            var secondHire = await _applicationService.HireApplicationAsync(appId, new HireApplicationDto());
            Assert.Equal("FAILED", secondHire.Status);
            Assert.Equal("ERR_ALREADY_HIRED", secondHire.Message["code"]);
            Assert.Single(_eventPublisher.GetPublishedEvents("candidate.hired"));
        }

        [Fact]
        public void ValidateAndSniffFile_RejectsFakePdf_TooLarge_AndEicarSignature()
        {
            // Fake PDF (plain text renamed to .pdf)
            var fakePdf = Encoding.ASCII.GetBytes("Hello world this is not a PDF");
            var ex1 = Assert.Throws<DocumentValidationException>(() =>
                LocalDiskStorage.ValidateAndSniffFile("resume.pdf", fakePdf));
            Assert.Equal("ERR_UNSUPPORTED_FILE", ex1.ErrorCode);

            // EICAR test signature inside PDF header
            var eicarBytes = Encoding.ASCII.GetBytes("%PDF-1.4\nX5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*");
            var ex2 = Assert.Throws<DocumentValidationException>(() =>
                LocalDiskStorage.ValidateAndSniffFile("infected.pdf", eicarBytes));
            Assert.Equal("ERR_UNSUPPORTED_FILE", ex2.ErrorCode);

            // Oversized (> 5 MB)
            var oversized = new byte[5 * 1024 * 1024 + 10];
            oversized[0] = 0x25; oversized[1] = 0x50; oversized[2] = 0x44; oversized[3] = 0x46; oversized[4] = 0x2D;
            var ex3 = Assert.Throws<DocumentValidationException>(() =>
                LocalDiskStorage.ValidateAndSniffFile("huge.pdf", oversized));
            Assert.Equal("ERR_FILE_TOO_LARGE", ex3.ErrorCode);
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            if (Directory.Exists(_tempDir))
            {
                try { Directory.Delete(_tempDir, recursive: true); } catch { }
            }
        }
    }
}
