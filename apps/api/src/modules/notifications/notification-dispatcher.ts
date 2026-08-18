import { Inject, Injectable } from '@nestjs/common';
import { NotificationChannel } from '@pymes/shared';
import { NotificationProvider } from './notification-provider.interface';

export const NOTIFICATION_PROVIDERS = 'NOTIFICATION_PROVIDERS';

@Injectable()
export class NotificationDispatcher {
  private readonly registry = new Map<
    NotificationChannel,
    NotificationProvider
  >();

  constructor(
    @Inject(NOTIFICATION_PROVIDERS)
    providers: NotificationProvider[],
  ) {
    for (const provider of providers) {
      this.registry.set(provider.channel, provider);
    }
  }

  getProvider(channel: NotificationChannel): NotificationProvider {
    return (
      this.registry.get(channel) ??
      this.registry.get(NotificationChannel.CONSOLE)!
    );
  }
}