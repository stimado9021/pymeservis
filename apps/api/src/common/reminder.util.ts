import { InvoiceStatus, ReminderTrigger } from '@pymes/shared';

export function computeInvoiceStatus(
  amount: number,
  paidAmount: number,
  dueDate: Date | string,
): InvoiceStatus {
  if (paidAmount >= amount) return InvoiceStatus.PAID;
  if (paidAmount > 0) return InvoiceStatus.PARTIAL;
  if (new Date(dueDate) < new Date()) return InvoiceStatus.OVERDUE;
  return InvoiceStatus.PENDING;
}

export function computeReminderDate(
  dueDate: Date,
  trigger: ReminderTrigger,
  offsetDays: number,
): Date {
  const d = new Date(dueDate);
  if (trigger === ReminderTrigger.DAYS_BEFORE) {
    d.setDate(d.getDate() - offsetDays);
  } else if (trigger === ReminderTrigger.DAYS_AFTER) {
    d.setDate(d.getDate() + offsetDays);
  }
  return d;
}