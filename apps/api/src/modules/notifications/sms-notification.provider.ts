import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { NotificationChannel, ReminderStatus } from '@pymes/shared';
import { NotificationProvider, SendResult } from './notification-provider.interface';

@Injectable()
export class SmsNotificationProvider implements NotificationProvider {
  readonly channel: NotificationChannel = NotificationChannel.SMS;
  private readonly logger = new Logger(SmsNotificationProvider.name);

  constructor(private readonly config: ConfigService) {}

  async send(to: string, message: string): Promise<SendResult> {
    const accountSid = this.config.get<string>('app.twilio.accountSid');
    const authToken = this.config.get<string>('app.twilio.authToken');
    const from = this.config.get<string>('app.twilio.from');
    if (!accountSid || !authToken || !from) {
      this.logger.warn('Twilio not configured');
      return { status: ReminderStatus.FAILED, externalId: 'no-twilio-config' };
    }
    const number = this.normalizeNumber(to);
    try {
      const body = new URLSearchParams({
        From: from,
        To: number,
        Body: message,
      });
      const res = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        body.toString(),
        {
          auth: { username: accountSid, password: authToken },
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );
      return {
        externalId: res.data?.sid ? `sms:${res.data.sid}` : undefined,
        status: ReminderStatus.SENT,
      };
    } catch (err: any) {
      this.logger.error(
        `Twilio send failed: ${err?.message}`,
        JSON.stringify(err?.response?.data),
      );
      return { status: ReminderStatus.FAILED };
    }
  }

  private normalizeNumber(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 10 && digits.startsWith('3')) {
      return `+57${digits}`;
    }
    if (digits.length === 11 && digits.startsWith('3')) {
      return `+57${digits.slice(1)}`;
    }
    return `+${digits}`;
  }
}
