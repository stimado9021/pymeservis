import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { NotificationChannel, ReminderStatus } from '@pymes/shared';
import { NotificationProvider, SendResult } from './notification-provider.interface';

@Injectable()
export class EmailNotificationProvider implements NotificationProvider {
  readonly channel: NotificationChannel = NotificationChannel.EMAIL;
  private readonly logger = new Logger(EmailNotificationProvider.name);

  constructor(private readonly config: ConfigService) {}

  async send(to: string, message: string): Promise<SendResult> {
    const apiKey = this.config.get<string>('app.resend.apiKey');
    const from = this.config.get<string>('app.resend.from');
    if (!apiKey) {
      this.logger.warn('Resend API not configured');
      return { status: ReminderStatus.FAILED, externalId: 'no-resend-config' };
    }
    try {
      const res = await axios.post(
        'https://api.resend.com/emails',
        {
          from,
          to,
          subject: 'Recordatorio de pago — Pymes Cobranza',
          text: message,
        },
        { headers: { Authorization: `Bearer ${apiKey}` } },
      );
      return {
        externalId: res.data?.id ? `email:${res.data.id}` : undefined,
        status: ReminderStatus.SENT,
      };
    } catch (err: any) {
      this.logger.error(
        `Resend send failed: ${err?.message}`,
        JSON.stringify(err?.response?.data),
      );
      return { status: ReminderStatus.FAILED };
    }
  }
}