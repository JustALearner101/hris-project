using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using hris_recruitment_be.database;
using hris_recruitment_be.database.Models;
using hris_recruitment_be.service.Events;
using hris_recruitment_be.view.DTOs.Integration;

namespace hris_recruitment_be.BackgroundServices
{
    public class StalePendingSweeper : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<StalePendingSweeper> _logger;

        public StalePendingSweeper(
            IServiceScopeFactory scopeFactory,
            IConfiguration configuration,
            ILogger<StalePendingSweeper> logger)
        {
            _scopeFactory = scopeFactory;
            _configuration = configuration;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await SweepStalePendingDocumentsAsync(stoppingToken);
                    await EnforcePiiRetentionPolicyAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "StalePendingSweeper encountered an error during maintenance sweep.");
                }

                await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);
            }
        }

        public async Task<int> SweepStalePendingDocumentsAsync(CancellationToken cancellationToken = default)
        {
            using var scope = _scopeFactory.CreateScope();
            var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
            var publisher = scope.ServiceProvider.GetRequiredService<IEventPublisher>();

            var cutoff = DateTime.UtcNow.AddMinutes(-5);
            var staleDocs = await uow.ApplicationDocuments
                .Queryable(d =>
                    !d.IsDeleted &&
                    d.ParseStatus == AtsEnums.UploadParseStatus.Pending &&
                    d.AttemptCount < 3 &&
                    (d.ModifiedAt ?? d.CreatedAt) <= cutoff)
                .Take(25)
                .ToListAsync(cancellationToken);

            foreach (var doc in staleDocs)
            {
                doc.AttemptCount += 1;
                doc.ModifiedAt = DateTime.UtcNow;
                doc.ModifiedBy = "stale-sweeper";
                await uow.ApplicationDocuments.UpdateAsync(doc);

                await publisher.PublishAsync(
                    streamName: "candidate.cv.uploaded",
                    eventType: "candidate.cv.uploaded",
                    entityId: doc.ApplicationId.ToString(),
                    data: new CvUploadedEventData
                    {
                        ApplicationId = doc.ApplicationId,
                        DocumentId = doc.Id,
                        StoragePath = doc.StoragePath,
                        MimeType = doc.MimeType,
                        Attempt = doc.AttemptCount
                    },
                    cancellationToken: cancellationToken);
            }

            return staleDocs.Count;
        }

        public async Task<int> EnforcePiiRetentionPolicyAsync(CancellationToken cancellationToken = default)
        {
            var retentionDays = int.TryParse(_configuration["Retention:RejectedCandidateRetentionDays"], out var days) && days > 0
                ? days
                : 365;

            var cutoff = DateTime.UtcNow.AddDays(-retentionDays);

            using var scope = _scopeFactory.CreateScope();
            var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

            var expiredApps = await uow.Applications
                .Queryable(a =>
                    !a.IsDeleted &&
                    (a.ApplicationStatus == AtsEnums.ApplicationStatus.Rejected ||
                     a.ApplicationStatus == AtsEnums.ApplicationStatus.Withdrawn) &&
                    (a.ModifiedAt ?? a.AppliedAt) <= cutoff)
                .Include(a => a.Documents)
                .Take(50)
                .ToListAsync(cancellationToken);

            foreach (var app in expiredApps)
            {
                app.IsDeleted = true;
                app.Status = 0;
                app.Notes = "[REDACTED - UU PDP RETENTION POLICY]";
                app.ModifiedAt = DateTime.UtcNow;
                app.ModifiedBy = "pii-retention-sweeper";

                if (app.Documents != null)
                {
                    foreach (var doc in app.Documents)
                    {
                        doc.IsDeleted = true;
                        doc.Status = 0;
                        doc.ExtractedText = null;
                        doc.ParsedJson = null;
                        doc.ModifiedAt = DateTime.UtcNow;
                        doc.ModifiedBy = "pii-retention-sweeper";
                        await uow.ApplicationDocuments.UpdateAsync(doc);
                    }
                }

                await uow.Applications.UpdateAsync(app);
            }

            return expiredApps.Count;
        }
    }
}
