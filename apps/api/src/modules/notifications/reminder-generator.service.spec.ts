import { ReminderGenerator } from './reminder-generator.service';
import {
  InvoiceStatus,
  NotificationChannel,
  ReminderStatus,
  ReminderTrigger,
} from '@pymes/shared';

function makeGenerator(overrides: Record<string, unknown> = {}) {
  const reminderStore: any[] =
    (overrides.reminderStore as any[]) ?? [];
  const ruleRepo = { find: jest.fn() };
  const reminderRepo = {
    find: jest.fn(async () => reminderStore),
    create: jest.fn((d) => ({ ...d })),
    save: jest.fn(async (r) => {
      const i = reminderStore.findIndex((x) => x.id === r.id);
      if (i >= 0) reminderStore[i] = r;
      else reminderStore.push(r);
      return r;
    }),
  };
  const invoiceRepo = { find: jest.fn() };
  const queue = { add: jest.fn(async () => ({})) };
  const messageBuilder = { build: jest.fn(() => 'mensaje') };

  const generator = new ReminderGenerator(
    ruleRepo as any,
    reminderRepo as any,
    invoiceRepo as any,
    queue as any,
    messageBuilder as any,
  );
  return { generator, ruleRepo, reminderRepo, invoiceRepo, queue };
}

describe('ReminderGenerator', () => {
  const rule = {
    id: 'rule-1',
    organizationId: 'org-1',
    trigger: ReminderTrigger.ON_DUE,
    offsetDays: 0,
    channel: NotificationChannel.WHATSAPP,
    enabled: true,
  };
  const due = new Date('2026-08-17T12:00:00Z');
  const invoice = {
    id: 'inv-1',
    organizationId: 'org-1',
    number: 'F-001',
    amount: 150000,
    paidAmount: 0,
    dueDate: due,
    status: InvoiceStatus.PENDING,
    customer: {
      id: 'c-1',
      name: 'Juan',
      phone: '+573001234567',
      email: 'juan@example.com',
    },
  };

  it('agenda 1 recordatorio cuando no existe uno previo', async () => {
    const { generator, ruleRepo, invoiceRepo, queue } = makeGenerator();
    ruleRepo.find.mockResolvedValue([rule]);
    invoiceRepo.find.mockResolvedValue([invoice]);

    const res = await generator.generate('org-1');
    expect(res.scheduled).toBe(1);
    expect(queue.add).toHaveBeenCalledTimes(1);
    expect((queue.add as jest.Mock).mock.calls[0][0]).toBe('send');
  });

  it('deduplica: no agenda si ya existe recordatorio para la misma fecha', async () => {
    const { generator, ruleRepo, invoiceRepo, queue } = makeGenerator({
      reminderStore: [
        {
          id: 'r-existente',
          organizationId: 'org-1',
          invoiceId: 'inv-1',
          ruleId: 'rule-1',
          channel: NotificationChannel.WHATSAPP,
          scheduledAt: new Date('2026-08-17T08:00:00Z'),
          status: ReminderStatus.SCHEDULED,
        },
      ],
    });
    ruleRepo.find.mockResolvedValue([rule]);
    invoiceRepo.find.mockResolvedValue([invoice]);

    const res = await generator.generate('org-1');
    expect(res.scheduled).toBe(0);
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('re-agenda un recordatorio que antes falló', async () => {
    const { generator, ruleRepo, invoiceRepo, queue } = makeGenerator({
      reminderStore: [
        {
          id: 'r-fallido',
          organizationId: 'org-1',
          invoiceId: 'inv-1',
          ruleId: 'rule-1',
          channel: NotificationChannel.WHATSAPP,
          scheduledAt: new Date('2026-08-17T08:00:00Z'),
          status: ReminderStatus.FAILED,
        },
      ],
    });
    ruleRepo.find.mockResolvedValue([rule]);
    invoiceRepo.find.mockResolvedValue([invoice]);

    const res = await generator.generate('org-1');
    expect(res.scheduled).toBe(1);
    expect(queue.add).toHaveBeenCalledTimes(1);
  });
});
