using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using hris_recruitment_be.Events;
using hris_recruitment_be.service.Services;
using hris_recruitment_be.view.DTOs.Integration;

namespace hris_recruitment_be.Consumers
{
    public class CvResultConsumer : BackgroundService
    {
        public const string ParsedStream = "candidate.cv.parsed";
        public const string FailedStream = "candidate.cv.failed";
        public const string ConsumerGroup = "ats-result-writer";

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly RedisEventPublisher _redisPublisher;
        private readonly ILogger<CvResultConsumer> _logger;
        private readonly string _consumerName;

        public CvResultConsumer(
            IServiceScopeFactory scopeFactory,
            RedisEventPublisher redisPublisher,
            ILogger<CvResultConsumer> logger)
        {
            _scopeFactory = scopeFactory;
            _redisPublisher = redisPublisher;
            _logger = logger;
            _consumerName = $"ats-host-{Environment.MachineName}";
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var groupsInitialized = false;

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var db = await _redisPublisher.GetDatabaseAsync();
                    if (db == null)
                    {
                        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
                        continue;
                    }

                    if (!groupsInitialized)
                    {
                        await EnsureConsumerGroupAsync(db, ParsedStream);
                        await EnsureConsumerGroupAsync(db, FailedStream);
                        groupsInitialized = true;
                    }

                    await ConsumeStreamBatchAsync(db, ParsedStream, isSuccessStream: true, stoppingToken);
                    await ConsumeStreamBatchAsync(db, FailedStream, isSuccessStream: false, stoppingToken);

                    await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "CvResultConsumer encountered an error polling Redis Streams. Retrying in 5s.");
                    await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                }
            }
        }

        private static async Task EnsureConsumerGroupAsync(IDatabase db, string streamName)
        {
            try
            {
                await db.StreamCreateConsumerGroupAsync(streamName, ConsumerGroup, "0-0", createStream: true);
            }
            catch (RedisServerException ex) when (ex.Message.Contains("BUSYGROUP", StringComparison.OrdinalIgnoreCase))
            {
                // Consumer group already exists
            }
        }

        private async Task ConsumeStreamBatchAsync(
            IDatabase db,
            string streamName,
            bool isSuccessStream,
            CancellationToken stoppingToken)
        {
            var entries = await db.StreamReadGroupAsync(
                streamName,
                ConsumerGroup,
                _consumerName,
                ">",
                count: 10);

            if (entries == null || entries.Length == 0)
            {
                return;
            }

            using var scope = _scopeFactory.CreateScope();
            var cvService = scope.ServiceProvider.GetRequiredService<ICvProcessingService>();

            foreach (var entry in entries)
            {
                var envelopeJson = entry.Values.FirstOrDefault(v => v.Name == "envelope").Value.ToString();
                var dataJson = entry.Values.FirstOrDefault(v => v.Name == "data").Value.ToString();

                if (isSuccessStream)
                {
                    var payload = DeserializePayload<CvParsedEventData>(envelopeJson, dataJson);
                    if (payload != null)
                    {
                        await cvService.HandleCvParsedAsync(payload, stoppingToken);
                    }
                }
                else
                {
                    var payload = DeserializePayload<CvFailedEventData>(envelopeJson, dataJson);
                    if (payload != null)
                    {
                        await cvService.HandleCvFailedAsync(payload, stoppingToken);
                    }
                }

                await db.StreamAcknowledgeAsync(streamName, ConsumerGroup, entry.Id);
            }
        }

        public static T? DeserializePayload<T>(string? envelopeJson, string? dataJson) where T : class
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            if (!string.IsNullOrWhiteSpace(envelopeJson))
            {
                try
                {
                    var env = JsonSerializer.Deserialize<EventEnvelope<T>>(envelopeJson, options);
                    if (env?.Data != null)
                    {
                        return env.Data;
                    }
                }
                catch
                {
                    // Fall through to raw dataJson
                }
            }

            if (!string.IsNullOrWhiteSpace(dataJson))
            {
                try
                {
                    return JsonSerializer.Deserialize<T>(dataJson, options);
                }
                catch
                {
                    return null;
                }
            }

            return null;
        }
    }
}
