import { NotificationChannel, ReminderStatus } from '@pymes/shared';

export interface SendResult {
  externalId?: string;
  status: ReminderStatus;
}

export interface NotificationProvider {
  readonly channel: NotificationChannel;
  send(to: string, message: string): Promise<SendResult>;
}
