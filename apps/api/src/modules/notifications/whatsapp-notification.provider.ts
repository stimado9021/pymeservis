import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { NotificationChannel, ReminderStatus } from '@pymes/shared';
import { NotificationProvider, SendResult } from './notification-provider.interface';

@Injectable()
export class WhatsappNotificationProvider implements NotificationProvider {
  readonly channel: NotificationChannel = NotificationChannel.WHATSAPP;
  private readonly logger = new Logger(WhatsappNotificationProvider.name);

  constructor(private readonly config: ConfigService) {}

  async send(to: string, message: string): Promise<SendResult> {
    const url = this.config.get<string>('app.evolution.url');
    const instance = this.config.get<string>('app.evolution.instance');
    const apiKey = this.config.get<string>('app.evolution.apiKey');
    if (!url || !instance || !apiKey) {
      this.logger.warn('Evolution API not configured');
      return { status: ReminderStatus.FAILED, externalId: 'no-evolution-config' };
    }
    const number = this.normalizeNumber(to);
    try {
      const res = await axios.post(
        `${url}/message/sendText/${instance}`,
        { number, text: message },
        { headers: { apikey: apiKey, 'Content-Type': 'application/json' } },
      );
      const key = res.data?.key?.id;
      return {
        externalId: key ? `wa:${key}` : undefined,
        status: ReminderStatus.SENT,
      };
    } catch (err: any) {
      this.logger.error(
        `Evolution send failed: ${err?.message}`,
        JSON.stringify(err?.response?.data),
      );
      return { status: ReminderStatus.FAILED };
    }
  }

  private normalizeNumber(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 10 && digits.startsWith('3')) {
      return `57${digits}`;
    }
    if (digits.length === 11 && digits.startsWith('3')) {
      return `57${digits.slice(1)}`;
    }
    return digits;
  }
}