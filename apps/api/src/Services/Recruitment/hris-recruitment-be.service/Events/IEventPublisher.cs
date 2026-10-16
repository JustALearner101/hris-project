using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using hris_recruitment_be.view.DTOs.Integration;

namespace hris_recruitment_be.service.Events
{
    public interface IEventPublisher
    {
        Task<string> PublishAsync<T>(
            string streamName,
            string eventType,
            string entityId,
            T data,
            string? correlationId = null,
            string? causationId = null,
            CancellationToken cancellationToken = default);
    }

    public class InMemoryEventPublisher : IEventPublisher
    {
        private readonly ConcurrentDictionary<string, ConcurrentQueue<EventEnvelope<object>>> _streams = new();

        public Task<string> PublishAsync<T>(
            string streamName,
            string eventType,
            string entityId,
            T data,
            string? correlationId = null,
            string? causationId = null,
            CancellationToken cancellationToken = default)
        {
            var envelope = new EventEnvelope<object>
            {
                Id = Guid.NewGuid().ToString(),
                Type = eventType,
                OccurredAt = DateTime.UtcNow.ToString("O"),
                TenantId = "default",
                EntityId = entityId,
                CorrelationId = correlationId ?? Guid.NewGuid().ToString(),
                CausationId = causationId,
                Version = 1,
                Data = data!
            };

            var queue = _streams.GetOrAdd(streamName, _ => new ConcurrentQueue<EventEnvelope<object>>());
            queue.Enqueue(envelope);

            return Task.FromResult(envelope.Id);
        }

        public IReadOnlyList<EventEnvelope<object>> GetPublishedEvents(string streamName)
        {
            if (_streams.TryGetValue(streamName, out var queue))
            {
                return queue.ToArray();
            }
            return Array.Empty<EventEnvelope<object>>();
        }
    }
}
