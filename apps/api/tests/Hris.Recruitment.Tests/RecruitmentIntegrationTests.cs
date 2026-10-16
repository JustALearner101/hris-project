using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Xunit;
using Hris.TokenValidation;
using hris_recruitment_be.lib.DefaultDTO;
using hris_recruitment_be.view.DTOs;
using hris_recruitment_be.view.DTOs.Public;

namespace Hris.Recruitment.Tests
{
    public class RecruitmentIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public RecruitmentIntegrationTests(WebApplicationFactory<Program> factory)
        {
            var dbName = $"RecruitmentIntegrationDb_{Guid.NewGuid():N}";
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureAppConfiguration((_, config) =>
                {
                    config.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        ["ConnectionStrings:DefaultConnection"] = "InMemory",
                        ["Testing:InMemoryDbName"] = dbName,
                        ["Testing:DisableBackgroundServices"] = "true"
                    });
                });
            });
        }

        [Fact]
        public async Task AdminEndpoints_EnforceAuthAndRole_WhilePublicEndpointsAllowAnonymous()
        {
            using var client = _factory.CreateClient();

            // 1. Anonymous health check succeeds
            var healthResp = await client.GetAsync("/api/health");
            Assert.Equal(HttpStatusCode.OK, healthResp.StatusCode);

            // 2. Anonymous call to Admin endpoint returns 401 Unauthorized
            var unauthAdminResp = await client.GetAsync("/api/v1/JobPosting");
            Assert.Equal(HttpStatusCode.Unauthorized, unauthAdminResp.StatusCode);

            // 3. Authenticated call with wrong role ("Employee") returns 403 Forbidden
            var employeeToken = Hris.TokenValidation.JwtBearerExtensions.IssueToken("emp-1", "emp@company.com", "Employee");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", employeeToken);
            var forbiddenResp = await client.GetAsync("/api/v1/JobPosting");
            Assert.Equal(HttpStatusCode.Forbidden, forbiddenResp.StatusCode);

            // 4. Login as HR Admin via /api/v1/auth/login
            client.DefaultRequestHeaders.Authorization = null;
            var loginResp = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto
            {
                Email = "admin@company.com",
                Password = "password123",
                Role = "HR Admin"
            });
            Assert.Equal(HttpStatusCode.OK, loginResp.StatusCode);
            var loginPayload = await loginResp.Content.ReadFromJsonAsync<DefaultDtoResponse<LoginResponseDto>>();
            Assert.NotNull(loginPayload);
            var adminToken = loginPayload!.Data[0].Token;

            // 5. Create and publish a job posting as HR Admin
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
            var createResp = await client.PostAsJsonAsync("/api/v1/JobPosting", new CreateJobPostingDto
            {
                Title = "Principal Security Engineer",
                Description = "Lead application security & DevSecOps",
                Department = "Security",
                Location = "Jakarta",
                EmploymentType = "FULL_TIME",
                Headcount = 1
            });
            Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);
            var createdJob = (await createResp.Content.ReadFromJsonAsync<DefaultDtoResponse<JobPostingDto>>())!.Data[0];

            var publishResp = await client.PostAsync($"/api/v1/JobPosting/{createdJob.Id}/publish", null);
            Assert.Equal(HttpStatusCode.OK, publishResp.StatusCode);

            // 6. Anonymous candidate browses public jobs and submits CV (202 Accepted)
            using var anonClient = _factory.CreateClient();
            var publicJobsResp = await anonClient.GetAsync("/api/v1/public/jobs");
            Assert.Equal(HttpStatusCode.OK, publicJobsResp.StatusCode);

            using var form = new MultipartFormDataContent();
            form.Add(new StringContent("Andi Wijaya"), "fullName");
            form.Add(new StringContent("andi@example.com"), "email");
            form.Add(new StringContent("+628111222333"), "phone");
            form.Add(new StringContent("true"), "consentAccepted");

            var pdfBytes = Encoding.ASCII.GetBytes("%PDF-1.4\n1 0 obj <<>> endobj\n%%EOF");
            var fileContent = new ByteArrayContent(pdfBytes);
            fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
            form.Add(fileContent, "cv", "andi_resume.pdf");

            using var applyReq = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/public/jobs/{createdJob.Id}/applications")
            {
                Content = form
            };
            applyReq.Headers.Add("Idempotency-Key", "integration-idem-key-1");

            var applyResp = await anonClient.SendAsync(applyReq);
            Assert.Equal(HttpStatusCode.Accepted, applyResp.StatusCode);

            var acceptedBody = await applyResp.Content.ReadFromJsonAsync<DefaultDtoResponse<ApplicationAcceptedDto>>();
            Assert.NotNull(acceptedBody);
            var trackingToken = acceptedBody!.Data[0].TrackingToken;
            var appId = acceptedBody.Data[0].ApplicationId;

            // 7. Anonymous candidate polls capability URL
            var pollResp = await anonClient.GetAsync($"/api/v1/public/applications/{trackingToken}");
            Assert.Equal(HttpStatusCode.OK, pollResp.StatusCode);

            // 8. Admin downloads CV attachment with nosniff + attachment headers
            var detailResp = await client.GetFromJsonAsync<DefaultDtoResponse<ApplicationDetailDto>>($"/api/v1/Application/{appId}");
            var docId = detailResp!.Data[0].Documents[0].Id;

            var downloadResp = await client.GetAsync($"/api/v1/Application/{appId}/documents/{docId}");
            Assert.Equal(HttpStatusCode.OK, downloadResp.StatusCode);
            Assert.Equal("nosniff", downloadResp.Headers.GetValues("X-Content-Type-Options").FirstOrDefault());
            Assert.Equal("attachment", downloadResp.Content.Headers.ContentDisposition?.DispositionType);
        }
    }
}
