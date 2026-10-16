using System;
using System.Text.Json.Serialization;

namespace hris_recruitment_be.view.DTOs.Integration
{
    public class EventEnvelope<T>
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        [JsonPropertyName("occurred_at")]
        public string OccurredAt { get; set; } = DateTime.UtcNow.ToString("O");

        [JsonPropertyName("tenant_id")]
        public string TenantId { get; set; } = "default";

        [JsonPropertyName("entity_id")]
        public string EntityId { get; set; } = string.Empty;

        [JsonPropertyName("correlation_id")]
        public string CorrelationId { get; set; } = Guid.NewGuid().ToString();

        [JsonPropertyName("causation_id")]
        public string? CausationId { get; set; }

        [JsonPropertyName("version")]
        public int Version { get; set; } = 1;

        [JsonPropertyName("data")]
        public T Data { get; set; } = default!;
    }

    public class CvUploadedEventData
    {
        [JsonPropertyName("applicationId")]
        public int ApplicationId { get; set; }

        [JsonPropertyName("documentId")]
        public int DocumentId { get; set; }

        [JsonPropertyName("storagePath")]
        public string StoragePath { get; set; } = string.Empty;

        [JsonPropertyName("mimeType")]
        public string MimeType { get; set; } = "application/pdf";

        [JsonPropertyName("attempt")]
        public int Attempt { get; set; } = 1;
    }

    public class CvParsedEventData
    {
        [JsonPropertyName("applicationId")]
        public int ApplicationId { get; set; }

        [JsonPropertyName("documentId")]
        public int DocumentId { get; set; }

        [JsonPropertyName("parsedJson")]
        public string? ParsedJson { get; set; }

        [JsonPropertyName("extractedText")]
        public string? ExtractedText { get; set; }

        [JsonPropertyName("confidence")]
        public double Confidence { get; set; }
    }

    public class CvFailedEventData
    {
        [JsonPropertyName("applicationId")]
        public int ApplicationId { get; set; }

        [JsonPropertyName("documentId")]
        public int DocumentId { get; set; }

        [JsonPropertyName("errorCode")]
        public string ErrorCode { get; set; } = "ERR_PARSE_FAILED";

        [JsonPropertyName("attempt")]
        public int Attempt { get; set; } = 1;
    }

    public class CandidateHiredEventData
    {
        [JsonPropertyName("applicationId")]
        public int ApplicationId { get; set; }

        [JsonPropertyName("candidateId")]
        public int CandidateId { get; set; }

        [JsonPropertyName("jobPostingId")]
        public int JobPostingId { get; set; }

        [JsonPropertyName("hiredAt")]
        public string HiredAt { get; set; } = DateTime.UtcNow.ToString("O");
    }
}
