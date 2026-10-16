using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using hris_recruitment_be.service.Events;
using hris_recruitment_be.view.DTOs.Integration;

namespace hris_recruitment_be.Events
{
    public class RedisEventPublisher : IEventPublisher, IDisposable
    {
        private readonly ILogger<RedisEventPublisher> _logger;
        private readonly string _redisConnectionString;
        private readonly InMemoryEventPublisher _fallbackPublisher;
        private IConnectionMultiplexer? _multiplexer;
        private readonly SemaphoreSlim _connectionLock = new(1, 1);

        public RedisEventPublisher(
            IConfiguration configuration,
            ILogger<RedisEventPublisher> logger,
            InMemoryEventPublisher fallbackPublisher)
        {
            _logger = logger;
            _fallbackPublisher = fallbackPublisher;
            var rawRedisUrl = configuration["REDIS_URL"]
                ?? configuration["Redis:ConnectionString"]
                ?? "localhost:6379";

            _redisConnectionString = NormalizeRedisConnectionString(rawRedisUrl);
        }

        public async Task<IDatabase?> GetDatabaseAsync()
        {
            if (_multiplexer is { IsConnected: true })
            {
                return _multiplexer.GetDatabase();
            }

            await _connectionLock.WaitAsync();
            try
            {
                if (_multiplexer is { IsConnected: true })
                {
                    return _multiplexer.GetDatabase();
                }

                var options = ConfigurationOptions.Parse(_redisConnectionString);
                options.AbortOnConnectFail = false;
                options.ConnectTimeout = 1500;
                options.SyncTimeout = 1500;

                _multiplexer = await ConnectionMultiplexer.ConnectAsync(options);
                return _multiplexer.IsConnected ? _multiplexer.GetDatabase() : null;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis connection unavailable ({Conn}). Falling back to InMemoryEventPublisher.", _redisConnectionString);
                return null;
            }
            finally
            {
                _connectionLock.Release();
            }
        }

        public async Task<string> PublishAsync<T>(
            string streamName,
            string eventType,
            string entityId,
            T data,
            string? correlationId = null,
            string? causationId = null,
            CancellationToken cancellationToken = default)
        {
            // Always record in fallback publisher for test observability
            var fallbackId = await _fallbackPublisher.PublishAsync(
                streamName,
                eventType,
                entityId,
                data,
                correlationId,
                causationId,
                cancellationToken);

            var envelope = new EventEnvelope<T>
            {
                Id = fallbackId,
                Type = eventType,
                OccurredAt = DateTime.UtcNow.ToString("O"),
                TenantId = "default",
                EntityId = entityId,
                CorrelationId = correlationId ?? Guid.NewGuid().ToString(),
                CausationId = causationId,
                Version = 1,
                Data = data
            };

            var db = await GetDatabaseAsync();
            if (db == null)
            {
                return fallbackId;
            }

            try
            {
                var serializedEnvelope = JsonSerializer.Serialize(envelope);
                var serializedData = JsonSerializer.Serialize(data);

                var entries = new NameValueEntry[]
                {
                    new("envelope", serializedEnvelope),
                    new("id", envelope.Id),
                    new("type", envelope.Type),
                    new("occurred_at", envelope.OccurredAt),
                    new("tenant_id", envelope.TenantId),
                    new("entity_id", envelope.EntityId),
                    new("correlation_id", envelope.CorrelationId),
                    new("version", envelope.Version.ToString()),
                    new("data", serializedData)
                };

                var messageId = await db.StreamAddAsync(streamName, entries);
                _logger.LogInformation(
                    "Published event {EventType} to Redis stream {Stream} (messageId={MessageId}, correlationId={CorrelationId})",
                    eventType,
                    streamName,
                    messageId,
                    envelope.CorrelationId);

                return messageId.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to XADD to Redis stream {Stream}; event retained in fallback memory queue.", streamName);
                return fallbackId;
            }
        }

        public static string NormalizeRedisConnectionString(string raw)
        {
            if (string.IsNullOrWhiteSpace(raw))
            {
                return "localhost:6379";
            }

            var trimmed = raw.Trim();
            if (trimmed.StartsWith("redis://", StringComparison.OrdinalIgnoreCase))
            {
                var uri = new Uri(trimmed);
                var port = uri.Port > 0 ? uri.Port : 6379;
                return $"{uri.Host}:{port}";
            }

            return trimmed;
        }

        public void Dispose()
        {
            _multiplexer?.Dispose();
            _connectionLock.Dispose();
        }
    }
}
