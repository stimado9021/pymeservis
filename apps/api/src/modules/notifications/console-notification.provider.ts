import { Injectable } from '@nestjs/common';
import { NotificationChannel, ReminderStatus } from '@pymes/shared';
import { NotificationProvider, SendResult } from './notification-provider.interface';

@Injectable()
export class ConsoleNotificationProvider implements NotificationProvider {
  readonly channel: NotificationChannel = NotificationChannel.CONSOLE;

  async send(to: string, message: string): Promise<SendResult> {
    console.log(`[NOTIFICATION:${this.channel}] -> ${to}: ${message}`);
    return {
      externalId: `console-${Date.now()}`,
      status: ReminderStatus.SENT,
    };
  }
}
