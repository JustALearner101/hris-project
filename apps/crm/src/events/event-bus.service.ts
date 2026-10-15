import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class EventBusService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventBusService.name);
  private publisher?: Redis;

  onModuleInit(): void {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      this.publisher = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });
      this.publisher
        .connect()
        .then(() => {
          this.logger.log(`Connected to Redis Event Bus at ${redisUrl}`);
        })
        .catch((err: Error) => {
          this.logger.warn(
            `Redis Event Bus unavailable (${err.message}). Local fallback enabled.`,
          );
        });
    } catch (err) {
      this.logger.warn(`Could not initialize Redis: ${(err as Error).message}`);
    }
  }

  async publish(channel: string, message: any): Promise<void> {
    const payload = JSON.stringify(message);
    this.logger.log(`[EventBus] Publishing to '${channel}': ${payload}`);
    if (this.publisher && this.publisher.status === 'ready') {
      try {
        await this.publisher.publish(channel, payload);
      } catch (err) {
        this.logger.error(
          `Failed to publish message to ${channel}:`,
          err as Error,
        );
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.publisher) {
      await this.publisher.quit();
    }
  }
}
