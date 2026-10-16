using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Hris.TokenValidation;
using hris_recruitment_be.BackgroundServices;
using hris_recruitment_be.Consumers;
using hris_recruitment_be.database;
using hris_recruitment_be.database.Models;
using hris_recruitment_be.Events;
using hris_recruitment_be.lib.Storage;
using hris_recruitment_be.service.Events;
using hris_recruitment_be.service.Services;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration["DATABASE_URL"];

builder.Services.AddDbContext<RecruitmentDbContext>(options =>
{
    if (!string.IsNullOrWhiteSpace(connectionString) &&
        !string.Equals(connectionString, "InMemory", StringComparison.OrdinalIgnoreCase))
    {
        options.UseNpgsql(
            connectionString,
            npgsql => npgsql.MigrationsHistoryTable("__EFMigrationsHistory_ats", "ats"));
    }
    else
    {
        var dbName = builder.Configuration["Testing:InMemoryDbName"] ?? "RecruitmentAtsDb";
        options.UseInMemoryDatabase(dbName);
    }
});

var storageRoot = builder.Configuration["CV_STORAGE_ROOT"]
    ?? builder.Configuration["Storage:CvRootPath"];

if (string.IsNullOrWhiteSpace(storageRoot) ||
    (OperatingSystem.IsWindows() && storageRoot.StartsWith("/")))
{
    storageRoot = Path.Combine(Path.GetTempPath(), "hris-cv-data");
}

builder.Services.AddSingleton<IDocumentStorage>(_ => new LocalDiskStorage(storageRoot));
builder.Services.AddSingleton<InMemoryEventPublisher>();
builder.Services.AddSingleton<RedisEventPublisher>();
builder.Services.AddSingleton<IEventPublisher>(sp => sp.GetRequiredService<RedisEventPublisher>());

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IJobPostingService, JobPostingService>();
builder.Services.AddScoped<IApplicationService, ApplicationService>();
builder.Services.AddScoped<ICandidateService, CandidateService>();
builder.Services.AddScoped<IPublicJobService, PublicJobService>();
builder.Services.AddScoped<ICvProcessingService, CvProcessingService>();

if (!string.Equals(builder.Configuration["Testing:DisableBackgroundServices"], "true", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddHostedService<CvResultConsumer>();
    builder.Services.AddHostedService<StalePendingSweeper>();
}

builder.Services.AddHrisAuth(builder.Configuration);

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownProxies.Add(IPAddress.Loopback);
    options.KnownProxies.Add(IPAddress.IPv6Loopback);
});

var rateLimitPermit = int.TryParse(builder.Configuration["RateLimit:PublicUploadPermitLimit"], out var limit) && limit > 0
    ? limit
    : 20;

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("PublicUploadPolicy", httpContext =>
    {
        var remoteIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: remoteIp,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = rateLimitPermit,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            });
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowRecruitmentWeb", policy =>
    {
        policy
            .SetIsOriginAllowed(_ => true)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Seed demo data when running InMemory and not disabled by tests
if ((string.IsNullOrWhiteSpace(connectionString) ||
     string.Equals(connectionString, "InMemory", StringComparison.OrdinalIgnoreCase)) &&
    !string.Equals(builder.Configuration["Testing:DisableSeed"], "true", StringComparison.OrdinalIgnoreCase))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<RecruitmentDbContext>();
    if (!db.JobPostings.Any())
    {
        var now = DateTime.UtcNow;
        var job1 = new JobPosting
        {
            Title = "Senior Full-Stack Engineer (.NET & Next.js)",
            Description = "Lead the architecture and delivery of core enterprise HRIS & ATS microservices using ASP.NET Core 9, Next.js 15, PostgreSQL, and Redis Streams.",
            Department = "Engineering",
            Location = "Jakarta (Hybrid)",
            EmploymentType = AtsEnums.EmploymentType.FullTime,
            JobStatus = AtsEnums.JobStatus.Open,
            Headcount = 2,
            SalaryMin = 25000000m,
            SalaryMax = 40000000m,
            Currency = "IDR",
            SeoSlug = "senior-full-stack-engineer-net-nextjs",
            SeoMetaTitle = "Senior Full-Stack Engineer (.NET & Next.js) — AnglerFish Careers",
            SeoMetaDescription = "Join our Engineering team in Jakarta to build enterprise HRIS & ATS microservices.",
            OpenedAt = now.AddDays(-5),
            PublishedAt = now.AddDays(-5),
            CreatedBy = "system",
            CreatedAt = now.AddDays(-5)
        };
        db.JobPostings.Add(job1);
        db.SaveChanges();

        var seq = 1;
        foreach (var stageType in AtsEnums.PipelineStageType.DefaultSequence)
        {
            db.JobStages.Add(new JobStage
            {
                JobPostingId = job1.Id,
                Name = stageType[0] + stageType[1..].ToLowerInvariant(),
                StageType = stageType,
                Sequence = seq++,
                IsActive = true,
                CreatedBy = "system",
                CreatedAt = now.AddDays(-5)
            });
        }
        db.SaveChanges();
    }
}

app.UseForwardedHeaders();
app.UseCors("AllowRecruitmentWeb");

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Recruitment ATS API v1");
    c.RoutePrefix = "swagger";
});

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();

public partial class Program { }
