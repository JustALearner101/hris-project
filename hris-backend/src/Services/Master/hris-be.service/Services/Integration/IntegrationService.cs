using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using hris_be.database;
using hris_be.database.Models;
using hris_be.lib.DefaultDTO;
using hris_be.lib.Utils;
using hris_be.view.DTOs.Integration;

namespace hris_be.service.Services.Integration
{
    public class IntegrationService : IIntegrationService
    {
        private readonly IUnitOfWork _unitOfWork;
        private static readonly ConcurrentBag<IntegrationSyncLogDto> _syncLogs = new ConcurrentBag<IntegrationSyncLogDto>();

        private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public IntegrationService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public Task<DefaultDtoResponse<IntegrationConnectorDto>> GetConnectorsAsync()
        {
            var connectors = new List<IntegrationConnectorDto>
            {
                new IntegrationConnectorDto
                {
                    Id = "coupa-spend",
                    Name = "Coupa Spend & Procurement",
                    Vendor = "Coupa Software Inc.",
                    Category = "Spend Management & Expenses",
                    Protocol = "REST API v30+ (JSON/cXML)",
                    Status = "ONLINE",
                    Mode = "MOCK_SIMULATOR",
                    LastSyncAt = _syncLogs.Where(l => l.ConnectorId == "coupa-spend").OrderByDescending(l => l.Timestamp).Select(l => (DateTime?)l.Timestamp).FirstOrDefault(),
                    TotalSyncedRecords = _syncLogs.Where(l => l.ConnectorId == "coupa-spend" && l.Status == "SUCCESS").Sum(l => l.RecordsCount),
                    Description = "Two-way integration: Sync employees as Coupa buyers/approvers & pull approved expenses into payroll."
                },
                new IntegrationConnectorDto
                {
                    Id = "sap-s4hana",
                    Name = "SAP S/4HANA Finance (FiCo)",
                    Vendor = "SAP SE",
                    Category = "Enterprise ERP & General Ledger",
                    Protocol = "OData v4 REST / CSRF Handshake",
                    Status = "ONLINE",
                    Mode = "MOCK_SIMULATOR",
                    LastSyncAt = null,
                    TotalSyncedRecords = 0,
                    Description = "Post double-entry payroll accounting journal vouchers & sync master Cost Centers."
                },
                new IntegrationConnectorDto
                {
                    Id = "oracle-hcm",
                    Name = "Oracle Cloud HCM / Fusion",
                    Vendor = "Oracle Corporation",
                    Category = "Global Identity & HR",
                    Protocol = "SCIM 2.0 / HDL Batch (.dat/SFTP)",
                    Status = "ONLINE",
                    Mode = "MOCK_SIMULATOR",
                    LastSyncAt = null,
                    TotalSyncedRecords = 0,
                    Description = "Standard SCIM 2.0 user provisioning & zipped HCM Data Loader batch exports."
                }
            };

            return Task.FromResult(BuildResponseUtil.Success(connectors, connectors.Count));
        }

        public Task<DefaultDtoResponse<IntegrationSyncLogDto>> GetLogsAsync()
        {
            var logs = _syncLogs.OrderByDescending(l => l.Timestamp).Take(50).ToList();
            return Task.FromResult(BuildResponseUtil.Success(logs, logs.Count));
        }

        /// <summary>
        /// Skenario Outbound: Ambil data karyawan di HRIS -> Terjemahkan ke Coupa User DTO -> Kirim ke Coupa Simulator
        /// </summary>
        public async Task<DefaultDtoResponse<IntegrationSyncLogDto>> SyncEmployeesToCoupaAsync()
        {
            var stopwatch = Stopwatch.StartNew();

            // 1. Ambil data karyawan aktif dari database HRIS
            var employees = await _unitOfWork.Employees.Queryable(e => !e.IsDeleted).ToListAsync();
            if (!employees.Any())
            {
                // Dummy fallback jika database masih kosong
                employees = GetSampleEmployees();
            }

            // 2. DATA TRANSFORMATION: Terjemahkan HRIS Employee -> Coupa User Payload (JSON)
            var coupaUsers = employees.Select(emp => new CoupaUserDto
            {
                Login = emp.Email,
                Email = emp.Email,
                Firstname = emp.FirstName,
                Lastname = emp.LastName,
                Active = emp.Status == 1,
                Department = string.IsNullOrWhiteSpace(emp.Department) ? "General" : emp.Department,
                CustomFields = new CoupaCustomFields
                {
                    CostCenter = MapDepartmentToCostCenter(emp.Department),
                    ApprovalLimit = MapPositionToApprovalLimit(emp.Position),
                    EmployeeId = $"EMP-{emp.Id:D4}"
                }
            }).ToList();

            var requestPayloadJson = JsonSerializer.Serialize(coupaUsers, _jsonOptions);

            // 3. SIMULASI COUPA API SERVER (Merespons status 201 Created)
            var coupaResponse = new
            {
                Status = "SUCCESS",
                Message = $"Successfully provisioned and synced {coupaUsers.Count} users in Coupa Spend Environment.",
                SyncedAt = DateTime.UtcNow,
                Users = coupaUsers.Select(u => new
                {
                    CoupaId = new Random().Next(10000, 99999),
                    Login = u.Login,
                    Status = "Active",
                    CostCenterAssigned = u.CustomFields.CostCenter,
                    ApprovalLimitAssigned = $"IDR {u.CustomFields.ApprovalLimit:N0}"
                })
            };

            var responsePayloadJson = JsonSerializer.Serialize(coupaResponse, _jsonOptions);
            stopwatch.Stop();

            // 4. Catat Audit Log
            var log = new IntegrationSyncLogDto
            {
                ConnectorId = "coupa-spend",
                ConnectorName = "Coupa Spend & Procurement",
                Operation = "PushUsers (HRIS ➔ Coupa)",
                Direction = "OUTBOUND",
                Status = "SUCCESS",
                HttpStatusCode = 201,
                EndpointUrl = "https://instance.coupahost.com/api/users/bulk",
                RequestPayload = requestPayloadJson,
                ResponsePayload = responsePayloadJson,
                DurationMs = stopwatch.ElapsedMilliseconds + 45, // tambahkan simulasi latency jaringan
                RecordsCount = coupaUsers.Count,
                Message = $"Berhasil mengirim {coupaUsers.Count} data karyawan ke Coupa Spend Management."
            };

            _syncLogs.Add(log);

            return BuildResponseUtil.Success(new List<IntegrationSyncLogDto> { log }, 1);
        }

        /// <summary>
        /// Skenario Inbound: Tarik data approved expenses dari Coupa -> Masukkan ke sistem klaim/payroll HRIS
        /// </summary>
        public Task<DefaultDtoResponse<CoupaExpenseReportDto>> PullCoupaExpensesAsync()
        {
            var stopwatch = Stopwatch.StartNew();

            // 1. Data Dummy Expenses yang disetujui di Coupa
            var sampleExpenses = new List<CoupaExpenseReportDto>
            {
                new CoupaExpenseReportDto
                {
                    Id = "EXP-COUPA-8821",
                    ReportNumber = "ER-2026-0801",
                    Title = "Kunjungan Klien & Workshop Singapore",
                    EmployeeEmail = "budi.santoso@hris.corp",
                    EmployeeName = "Budi Santoso",
                    TotalAmount = 4850000m,
                    Currency = "IDR",
                    Status = "approved_for_payment",
                    ApprovedDate = DateTime.UtcNow.AddDays(-2),
                    Lines = new List<CoupaExpenseLineDto>
                    {
                        new CoupaExpenseLineDto { LineNumber = "1", Category = "Flight & Transport", Amount = 3200000m, Description = "Tiket Pesawat CGK - SIN PP", ExpenseDate = DateTime.UtcNow.AddDays(-4) },
                        new CoupaExpenseLineDto { LineNumber = "2", Category = "Meals & Entertainment", Amount = 1650000m, Description = "Business Dinner Client", ExpenseDate = DateTime.UtcNow.AddDays(-3) }
                    }
                },
                new CoupaExpenseReportDto
                {
                    Id = "EXP-COUPA-8822",
                    ReportNumber = "ER-2026-0802",
                    Title = "Pembelian Kursi Ergonomis WFH Allowance",
                    EmployeeEmail = "siti.rahma@hris.corp",
                    EmployeeName = "Siti Rahma",
                    TotalAmount = 2100000m,
                    Currency = "IDR",
                    Status = "approved_for_payment",
                    ApprovedDate = DateTime.UtcNow.AddDays(-1),
                    Lines = new List<CoupaExpenseLineDto>
                    {
                        new CoupaExpenseLineDto { LineNumber = "1", Category = "Office Supplies / Equipment", Amount = 2100000m, Description = "Ergonomic Mesh Chair", ExpenseDate = DateTime.UtcNow.AddDays(-2) }
                    }
                },
                new CoupaExpenseReportDto
                {
                    Id = "EXP-COUPA-8823",
                    ReportNumber = "ER-2026-0803",
                    Title = "Sertifikasi Cloud Solutions Architect",
                    EmployeeEmail = "ahmad.fauzi@hris.corp",
                    EmployeeName = "Ahmad Fauzi",
                    TotalAmount = 4500000m,
                    Currency = "IDR",
                    Status = "approved_for_payment",
                    ApprovedDate = DateTime.UtcNow,
                    Lines = new List<CoupaExpenseLineDto>
                    {
                        new CoupaExpenseLineDto { LineNumber = "1", Category = "Professional Training & Cert", Amount = 4500000m, Description = "Exam Voucher & Courseware", ExpenseDate = DateTime.UtcNow.AddDays(-1) }
                    }
                }
            };

            var requestSummary = new { Query = "GET /api/expense_reports?status=approved_for_payment&limit=50", AuthHeader = "Bearer coupa_api_key_sandbox_sec_***" };
            var requestPayloadJson = JsonSerializer.Serialize(requestSummary, _jsonOptions);
            var responsePayloadJson = JsonSerializer.Serialize(sampleExpenses, _jsonOptions);
            stopwatch.Stop();

            // 2. Catat Audit Log
            var log = new IntegrationSyncLogDto
            {
                ConnectorId = "coupa-spend",
                ConnectorName = "Coupa Spend & Procurement",
                Operation = "PullExpenses (Coupa ➔ HRIS)",
                Direction = "INBOUND",
                Status = "SUCCESS",
                HttpStatusCode = 200,
                EndpointUrl = "https://instance.coupahost.com/api/expense_reports?status=approved_for_payment",
                RequestPayload = requestPayloadJson,
                ResponsePayload = responsePayloadJson,
                DurationMs = stopwatch.ElapsedMilliseconds + 60,
                RecordsCount = sampleExpenses.Count,
                Message = $"Berhasil menarik {sampleExpenses.Count} data expense yang sudah diapprove dari Coupa untuk dimasukkan ke slip gaji."
            };

            _syncLogs.Add(log);

            return Task.FromResult(BuildResponseUtil.Success(sampleExpenses, sampleExpenses.Count));
        }

        /// <summary>
        /// Skenario Pembelajaran: Simulasi Error (Misal API Key Expired / 401 atau Payload Invalid / 422)
        /// </summary>
        public Task<DefaultDtoResponse<IntegrationSyncLogDto>> SimulateCoupaErrorAsync(string errorType)
        {
            var stopwatch = Stopwatch.StartNew();
            int statusCode;
            string errorResponse;
            string message;

            if (errorType == "401_UNAUTHORIZED")
            {
                statusCode = 401;
                errorResponse = JsonSerializer.Serialize(new
                {
                    Errors = new[] { "Invalid or expired Coupa API Key. Please renew the API credential in Coupa Admin > API Keys." }
                }, _jsonOptions);
                message = "Gagal autentikasi ke Coupa API: API Key tidak valid atau kadaluarsa (HTTP 401).";
            }
            else
            {
                statusCode = 422;
                errorResponse = JsonSerializer.Serialize(new
                {
                    Errors = new[] { "Validation Error: Field 'custom_fields.cost_center' is required and must exist in Coupa Master Chart of Accounts." }
                }, _jsonOptions);
                message = "Coupa menolak data (HTTP 422): Cost Center tidak ditemukan dalam sistem Coupa.";
            }

            stopwatch.Stop();

            var log = new IntegrationSyncLogDto
            {
                ConnectorId = "coupa-spend",
                ConnectorName = "Coupa Spend & Procurement",
                Operation = "PushUsers (Simulasi Error)",
                Direction = "OUTBOUND",
                Status = "FAILED",
                HttpStatusCode = statusCode,
                EndpointUrl = "https://instance.coupahost.com/api/users",
                RequestPayload = "{\"login\":\"budi@invalid\",\"custom_fields\":{\"cost_center\":\"\"}}",
                ResponsePayload = errorResponse,
                DurationMs = stopwatch.ElapsedMilliseconds + 30,
                RecordsCount = 0,
                Message = message
            };

            _syncLogs.Add(log);

            return Task.FromResult(BuildResponseUtil.Success(new List<IntegrationSyncLogDto> { log }, 1));
        }

        #region Helper Mapping Functions
        private static string MapDepartmentToCostCenter(string department)
        {
            return department?.ToLowerInvariant() switch
            {
                "engineering" or "tech" => "CC-ENG-101",
                "human resources" or "hr" => "CC-HRD-201",
                "finance" or "accounting" => "CC-FIN-301",
                "marketing" => "CC-MKT-401",
                "sales" => "CC-SLS-501",
                _ => "CC-CORP-999"
            };
        }

        private static decimal MapPositionToApprovalLimit(string position)
        {
            var p = position?.ToLowerInvariant() ?? "";
            if (p.Contains("director") || p.Contains("vp") || p.Contains("head")) return 50000000m; // 50 Juta
            if (p.Contains("lead") || p.Contains("manager")) return 20000000m; // 20 Juta
            if (p.Contains("senior")) return 10000000m; // 10 Juta
            return 5000000m; // 5 Juta untuk staff biasa
        }

        private static List<Employee> GetSampleEmployees()
        {
            return new List<Employee>
            {
                new Employee { Id = 1, FirstName = "Budi", LastName = "Santoso", Email = "budi.santoso@hris.corp", Department = "Engineering", Position = "Lead Software Engineer", Status = 1 },
                new Employee { Id = 2, FirstName = "Siti", LastName = "Rahma", Email = "siti.rahma@hris.corp", Department = "Human Resources", Position = "HR Manager", Status = 1 },
                new Employee { Id = 3, FirstName = "Ahmad", LastName = "Fauzi", Email = "ahmad.fauzi@hris.corp", Department = "Finance", Position = "Senior Accountant", Status = 1 }
            };
        }
        #endregion
    }
}
