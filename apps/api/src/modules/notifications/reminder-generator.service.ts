import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ReminderRule } from './reminder-rule.entity';
import { Reminder } from './reminder.entity';
import { Invoice } from '../invoices/invoice.entity';
import { ReminderMessageBuilder } from './reminder-message.builder';
import { computeReminderDate } from '../../common/reminder.util';
import {
  InvoiceStatus,
  ReminderStatus,
} from '@pymes/shared';

@Injectable()
export class ReminderGenerator {
  constructor(
    @InjectRepository(ReminderRule)
    private readonly ruleRepo: Repository<ReminderRule>,
    @InjectRepository(Reminder)
    private readonly reminderRepo: Repository<Reminder>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectQueue('notifications')
    private readonly queue: Queue,
    private readonly messageBuilder: ReminderMessageBuilder,
  ) {}

  async generate(organizationId: string): Promise<{ scheduled: number }> {
    const rules = await this.ruleRepo.find({
      where: { organizationId, enabled: true },
    });
    const invoices = await this.invoiceRepo.find({
      where: [
        { organizationId, status: InvoiceStatus.PENDING },
        { organizationId, status: InvoiceStatus.PARTIAL },
        { organizationId, status: InvoiceStatus.OVERDUE },
      ],
      relations: ['customer'],
    });

    const existing = await this.reminderRepo.find({
      where: { organizationId },
    });
    const seen = new Set(
      existing
        .filter((r) => r.status !== ReminderStatus.FAILED)
        .map(
          (r) =>
            `${r.invoiceId}:${r.ruleId}:${r.channel}:${r.scheduledAt
              .toISOString()
              .slice(0, 10)}`,
        ),
    );

    let scheduled = 0;
    for (const invoice of invoices) {
      for (const rule of rules) {
        const scheduledAt = computeReminderDate(
          invoice.dueDate,
          rule.trigger,
          rule.offsetDays,
        );
        const key = `${invoice.id}:${rule.id}:${rule.channel}:${scheduledAt
          .toISOString()
          .slice(0, 10)}`;
        if (seen.has(key)) continue;
        const reminder = this.reminderRepo.create({
          organizationId,
          invoiceId: invoice.id,
          ruleId: rule.id,
          channel: rule.channel,
          scheduledAt,
          status: ReminderStatus.SCHEDULED,
          messageContent: this.messageBuilder.build(rule, invoice),
        });
        const saved = await this.reminderRepo.save(reminder);
        const delay = Math.max(0, scheduledAt.getTime() - Date.now());
        await this.queue.add('send', { reminderId: saved.id }, { delay });
        scheduled++;
      }
    }
    return { scheduled };
  }
}