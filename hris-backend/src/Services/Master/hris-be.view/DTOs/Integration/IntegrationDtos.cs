using System;
using System.Collections.Generic;

namespace hris_be.view.DTOs.Integration
{
    /// <summary>
    /// Status dan Metadata dari Enterprise Connector (Coupa, SAP, Oracle)
    /// </summary>
    public class IntegrationConnectorDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Vendor { get; set; } = string.Empty; // Coupa, SAP, Oracle
        public string Category { get; set; } = string.Empty; // Spend Management, ERP / General Ledger, Identity & HCM
        public string Protocol { get; set; } = string.Empty; // REST / JSON, OData v4, SCIM 2.0 / SFTP
        public string Status { get; set; } = "ONLINE"; // ONLINE, ERROR, DEGRADED, MOCK_MODE
        public string Mode { get; set; } = "MOCK_SIMULATOR"; // MOCK_SIMULATOR, LIVE_SANDBOX
        public DateTime? LastSyncAt { get; set; }
        public int TotalSyncedRecords { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    /// <summary>
    /// Log Audit Trail untuk melihat isi data (JSON/XML) yang keluar dan masuk
    /// </summary>
    public class IntegrationSyncLogDto
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ConnectorId { get; set; } = string.Empty;
        public string ConnectorName { get; set; } = string.Empty;
        public string Operation { get; set; } = string.Empty; // PushUsers, PullExpenses, PostJournalEntry, ExportHDL
        public string Direction { get; set; } = "OUTBOUND"; // OUTBOUND (HRIS -> Vendor) atau INBOUND (Vendor -> HRIS)
        public string Status { get; set; } = "SUCCESS"; // SUCCESS, FAILED, WARNING
        public int HttpStatusCode { get; set; } = 200;
        public string EndpointUrl { get; set; } = string.Empty;
        public string RequestPayload { get; set; } = string.Empty; // Raw JSON / XML yang dikirim
        public string ResponsePayload { get; set; } = string.Empty; // Raw JSON / XML yang diterima
        public long DurationMs { get; set; }
        public int RecordsCount { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Payload User sesuai format standar Coupa REST API v30+ (/api/users)
    /// </summary>
    public class CoupaUserDto
    {
        public string Login { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Firstname { get; set; } = string.Empty;
        public string Lastname { get; set; } = string.Empty;
        public bool Active { get; set; } = true;
        public string Department { get; set; } = string.Empty;
        public CoupaCustomFields CustomFields { get; set; } = new CoupaCustomFields();
    }

    public class CoupaCustomFields
    {
        public string CostCenter { get; set; } = "CC-DEFAULT";
        public decimal ApprovalLimit { get; set; } = 5000000m; // Default IDR 5.000.000 limit
        public string EmployeeId { get; set; } = string.Empty;
    }

    /// <summary>
    /// Payload Expense Report dari Coupa (/api/expense_reports)
    /// </summary>
    public class CoupaExpenseReportDto
    {
        public string Id { get; set; } = string.Empty;
        public string ReportNumber { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string EmployeeEmail { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string Currency { get; set; } = "IDR";
        public string Status { get; set; } = "approved_for_payment";
        public DateTime ApprovedDate { get; set; }
        public List<CoupaExpenseLineDto> Lines { get; set; } = new List<CoupaExpenseLineDto>();
    }

    public class CoupaExpenseLineDto
    {
        public string LineNumber { get; set; } = "1";
        public string Category { get; set; } = "Travel & Transport"; // Meal, Transport, Lodging, Office Supplies
        public decimal Amount { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime ExpenseDate { get; set; }
    }
}
