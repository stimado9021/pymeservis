import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Reminder } from './reminder.entity';
import { Invoice } from '../invoices/invoice.entity';
import { NotificationDispatcher } from './notification-dispatcher';
import { ReminderGenerator } from './reminder-generator.service';
import { computeInvoiceStatus } from '../../common/reminder.util';
import { parsePagination, paginated, PaginationQuery } from '../../common/pagination';
import {
  NotificationChannel,
  ReminderStatus,
} from '@pymes/shared';

@Injectable()
export class ReminderService implements OnModuleInit {
  constructor(
    @InjectRepository(Reminder)
    private readonly reminderRepo: Repository<Reminder>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectQueue('notifications')
    private readonly queue: Queue,
    private readonly dispatcher: NotificationDispatcher,
    private readonly generator: ReminderGenerator,
  ) {}

  async listReminders(organizationId: string, pagination?: PaginationQuery) {
    const p = parsePagination(pagination);
    const [items, total] = await this.reminderRepo
      .createQueryBuilder('r')
      .where('r.organizationId = :orgId', { orgId: organizationId })
      .orderBy('r.scheduledAt', 'DESC')
      .skip(p.skip)
      .take(p.take)
      .getManyAndCount();
    return paginated(items, total, p.page, p.pageSize);
  }

  async sendReminder(reminderId: string): Promise<void> {
    const reminder = await this.reminderRepo.findOne({
      where: { id: reminderId },
    });
    if (!reminder) return;
    const invoice = await this.invoiceRepo.findOne({
      where: { id: reminder.invoiceId },
      relations: ['customer'],
    });
    if (!invoice || !invoice.customer) {
      reminder.status = ReminderStatus.FAILED;
      await this.reminderRepo.save(reminder);
      return;
    }
    const recipient =
      reminder.channel === NotificationChannel.EMAIL
        ? invoice.customer.email
        : invoice.customer.phone;
    if (!recipient) {
      reminder.status = ReminderStatus.FAILED;
      await this.reminderRepo.save(reminder);
      return;
    }
    const provider = this.dispatcher.getProvider(reminder.channel);
    try {
      const result = await provider.send(recipient, reminder.messageContent);
      reminder.status = result.status;
      reminder.sentAt = new Date();
      reminder.externalId = result.externalId ?? null;
    } catch {
      reminder.status = ReminderStatus.FAILED;
    }
    await this.reminderRepo.save(reminder);
  }

  async runDailyMaintenance(): Promise<{
    statusesUpdated: number;
    scheduled: number;
  }> {
    const orgs = await this.invoiceRepo
      .createQueryBuilder('i')
      .select('i.organizationId', 'organizationId')
      .distinct(true)
      .getRawMany<{ organizationId: string }>();

    let statusesUpdated = 0;
    let scheduled = 0;
    for (const { organizationId } of orgs) {
      const invoices = await this.invoiceRepo.find({
        where: { organizationId },
      });
      for (const invoice of invoices) {
        const next = computeInvoiceStatus(
          Number(invoice.amount),
          Number(invoice.paidAmount),
          invoice.dueDate,
        );
        if (next !== invoice.status) {
          invoice.status = next;
          await this.invoiceRepo.save(invoice);
          statusesUpdated++;
        }
      }
      const res = await this.generator.generate(organizationId);
      scheduled += res.scheduled;
    }
    return { statusesUpdated, scheduled };
  }

  async onModuleInit(): Promise<void> {
    await this.queue.add(
      'daily-maintenance',
      {},
      { repeat: { pattern: '0 7 * * *' }, jobId: 'daily-maintenance' },
    );
  }
}