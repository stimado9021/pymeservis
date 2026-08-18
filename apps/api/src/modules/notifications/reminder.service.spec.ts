import { ReminderService } from './reminder.service';
import {
  InvoiceStatus,
  NotificationChannel,
  ReminderStatus,
} from '@pymes/shared';

function makeService(overrides: Record<string, unknown> = {}) {
  const reminderRepo: any =
    overrides.reminderRepo ??
    ({
      findOne: jest.fn(),
      save: jest.fn(async (r) => r),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(async () => [[], 0]),
      })),
    } as any);
  const invoiceRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(async (i) => i),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(async () => []),
    })),
  };
  const queue = { add: jest.fn(async () => ({})) };
  const dispatcher = { getProvider: jest.fn() };
  const generator = { generate: jest.fn(async () => ({ scheduled: 0 })) };

  const service = new ReminderService(
    reminderRepo,
    invoiceRepo as any,
    queue as any,
    dispatcher as any,
    generator as any,
  );
  return { service, reminderRepo, invoiceRepo, queue, dispatcher };
}

describe('ReminderService', () => {
  const invoice = {
    id: 'inv-1',
    organizationId: 'org-1',
    number: 'F-001',
    amount: 150000,
    paidAmount: 0,
    dueDate: new Date('2026-08-17T12:00:00Z'),
    status: InvoiceStatus.PENDING,
    customer: {
      id: 'c-1',
      name: 'Juan',
      phone: '+573001234567',
      email: 'juan@example.com',
    },
  };

  it('marca como fallido si el recordatorio no existe', async () => {
    const { service, reminderRepo } = makeService();
    reminderRepo.findOne.mockResolvedValue(null);
    await expect(service.sendReminder('nope')).resolves.toBeUndefined();
    expect(reminderRepo.save).not.toHaveBeenCalled();
  });

  it('marca como fallido si la factura no tiene destinatario', async () => {
    const reminder = {
      id: 'r-1',
      invoiceId: 'inv-1',
      channel: NotificationChannel.WHATSAPP,
      status: ReminderStatus.SCHEDULED,
    };
    const { service, reminderRepo, invoiceRepo } = makeService();
    reminderRepo.findOne.mockResolvedValue(reminder);
    invoiceRepo.findOne.mockResolvedValue({
      ...invoice,
      customer: { ...invoice.customer, phone: null, email: null },
    });

    await service.sendReminder('r-1');
    expect(reminder.status).toBe(ReminderStatus.FAILED);
    expect(reminderRepo.save).toHaveBeenCalled();
  });

  it('envía por el provider y actualiza el estado', async () => {
    const reminder = {
      id: 'r-1',
      invoiceId: 'inv-1',
      channel: NotificationChannel.WHATSAPP,
      messageContent: 'Hola',
      status: ReminderStatus.SCHEDULED,
    } as any;
    const { service, reminderRepo, invoiceRepo, dispatcher } = makeService();
    reminderRepo.findOne.mockResolvedValue(reminder);
    invoiceRepo.findOne.mockResolvedValue(invoice);
    dispatcher.getProvider.mockReturnValue({
      send: jest.fn(async () => ({
        status: ReminderStatus.SENT,
        externalId: 'ext-1',
      })),
    });

    await service.sendReminder('r-1');
    expect(dispatcher.getProvider).toHaveBeenCalledWith(
      NotificationChannel.WHATSAPP,
    );
    expect(reminder.status).toBe(ReminderStatus.SENT);
    expect(reminder.externalId).toBe('ext-1');
    expect(reminderRepo.save).toHaveBeenCalled();
  });

  it('listReminders siempre devuelve {items,total,page,pageSize}', async () => {
    const { service } = makeService();
    const res = await service.listReminders('org-1', { page: 1, pageSize: 10 });
    expect(res).toHaveProperty('items');
    expect(res).toHaveProperty('total');
    expect(res).toHaveProperty('page');
    expect(res).toHaveProperty('pageSize');
  });
});
