import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../invoices/invoice.entity';
import { PaymentTransaction } from '../payments/payment-transaction.entity';
import { InvoiceStatus } from '@pymes/shared';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(PaymentTransaction)
    private readonly txRepo: Repository<PaymentTransaction>,
  ) {}

  async getSummary(organizationId: string) {
    const invoices = await this.invoiceRepo.find({ where: { organizationId } });
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalReceivable = 0;
    let totalOverdue = 0;
    let collectedThisMonth = 0;
    const byStatus: Record<string, { count: number; amount: number }> = {};

    for (const inv of invoices) {
      const due = Number(inv.amount) - Number(inv.paidAmount);
      totalReceivable += due > 0 ? due : 0;
      if (inv.status === InvoiceStatus.OVERDUE) totalOverdue += due > 0 ? due : 0;
      byStatus[inv.status] = byStatus[inv.status] || { count: 0, amount: 0 };
      byStatus[inv.status].count += 1;
      byStatus[inv.status].amount += Number(inv.amount);
    }

    const monthTx = await this.txRepo.find({
      where: { organizationId },
    });
    for (const tx of monthTx) {
      if (tx.status === 'approved' && tx.createdAt >= monthStart) {
        collectedThisMonth += Number(tx.amount);
      }
    }

    return {
      totalReceivable,
      totalOverdue,
      collectedThisMonth,
      byStatus,
      asOf: now.toISOString(),
    };
  }

  async getProjection(organizationId: string) {
    const invoices = await this.invoiceRepo.find({ where: { organizationId } });
    const buckets: Record<string, number> = {};
    for (const inv of invoices) {
      if (inv.status === InvoiceStatus.PAID) continue;
      const pending = Number(inv.amount) - Number(inv.paidAmount);
      const due = new Date(inv.dueDate);
      const key = due.toISOString().slice(0, 7);
      buckets[key] = (buckets[key] || 0) + pending;
    }
    return Object.entries(buckets)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
}
