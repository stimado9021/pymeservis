import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { Organization } from '../organizations/organization.entity';
import { Invoice } from '../invoices/invoice.entity';
import { PaymentTransaction } from '../payments/payment-transaction.entity';
import { Customer } from '../customers/customer.entity';
import { InvoiceStatus, UserRole } from '@pymes/shared';

@Injectable()
export class SuperAdminService implements OnModuleInit {
  private readonly logger = new Logger(SuperAdminService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(PaymentTransaction)
    private readonly txRepo: Repository<PaymentTransaction>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  async onModuleInit(): Promise<void> {
    const email = this.config.get<string>('app.superadmin.email');
    const password = this.config.get<string>('app.superadmin.password');
    if (!email || !password) {
      this.logger.warn(
        'SUPERADMIN_EMAIL/SUPERADMIN_PASSWORD no definidos: no se crea superadmin',
      );
      return;
    }
    const existing = await this.userRepo.findOne({ where: { email } });
    const passwordHash = await bcrypt.hash(password, 10);
    if (existing) {
      existing.role = UserRole.SUPERADMIN;
      existing.organizationId = null as any;
      existing.passwordHash = passwordHash;
      await this.userRepo.save(existing);
      this.logger.log(`Superadmin actualizado: ${email}`);
    } else {
      const user = this.userRepo.create({
        email,
        passwordHash,
        name: 'Super Admin',
        role: UserRole.SUPERADMIN,
      });
      await this.userRepo.save(user);
      this.logger.log(`Superadmin creado: ${email}`);
    }
  }

  async getSummary() {
    const [orgs, invoices, txs, users] = await Promise.all([
      this.orgRepo.find(),
      this.invoiceRepo.find(),
      this.txRepo.find(),
      this.userRepo.find(),
    ]);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalInvoiced = 0;
    let totalCollected = 0;
    let overdueAmount = 0;
    for (const inv of invoices) {
      const amount = Number(inv.amount);
      const paid = Number(inv.paidAmount);
      totalInvoiced += amount;
      totalCollected += paid;
      if (inv.status === InvoiceStatus.OVERDUE) {
        overdueAmount += Math.max(0, amount - paid);
      }
    }

    let collectedThisMonth = 0;
    const byMonth: Record<string, number> = {};
    for (const tx of txs) {
      if (tx.status !== 'approved') continue;
      if (tx.createdAt >= monthStart) collectedThisMonth += Number(tx.amount);
      const key = tx.createdAt.toISOString().slice(0, 7);
      byMonth[key] = (byMonth[key] || 0) + Number(tx.amount);
    }

    const byPlan: Record<string, number> = {};
    const bySubscriptionStatus: Record<string, number> = {};
    for (const org of orgs) {
      byPlan[org.plan || 'basic'] = (byPlan[org.plan || 'basic'] || 0) + 1;
      bySubscriptionStatus[org.subscriptionStatus] =
        (bySubscriptionStatus[org.subscriptionStatus] || 0) + 1;
    }

    return {
      totalCompanies: orgs.length,
      totalUsers: users.filter((u) => u.role !== UserRole.SUPERADMIN).length,
      totalInvoiced,
      totalCollected,
      outstanding: totalInvoiced - totalCollected,
      overdueAmount,
      collectedThisMonth,
      recoveryRate: totalInvoiced > 0 ? totalCollected / totalInvoiced : 0,
      byPlan,
      bySubscriptionStatus,
      collectedByMonth: Object.entries(byMonth)
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      asOf: now.toISOString(),
    };
  }

  async getCompanies() {
    const [orgs, invoices, customers] = await Promise.all([
      this.orgRepo.find(),
      this.invoiceRepo.find(),
      this.customerRepo.find(),
    ]);
    const invByOrg = new Map<string, Invoice[]>();
    for (const inv of invoices) {
      const list = invByOrg.get(inv.organizationId) ?? [];
      list.push(inv);
      invByOrg.set(inv.organizationId, list);
    }
    const custByOrg = new Map<string, number>();
    for (const c of customers) {
      custByOrg.set(c.organizationId, (custByOrg.get(c.organizationId) ?? 0) + 1);
    }

    return orgs.map((org) => {
      const invs = invByOrg.get(org.id) ?? [];
      let invoiced = 0;
      let collected = 0;
      let outstanding = 0;
      let overdue = 0;
      for (const inv of invs) {
        const amount = Number(inv.amount);
        const paid = Number(inv.paidAmount);
        invoiced += amount;
        collected += paid;
        const due = Math.max(0, amount - paid);
        outstanding += due;
        if (inv.status === InvoiceStatus.OVERDUE) overdue += due;
      }
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        createdAt: org.createdAt,
        plan: org.plan,
        subscriptionStatus: org.subscriptionStatus,
        customers: custByOrg.get(org.id) ?? 0,
        invoices: invs.length,
        invoiced,
        collected,
        outstanding,
        overdue,
        recoveryRate: invoiced > 0 ? collected / invoiced : 0,
      };
    });
  }

  async getCompany(id: string) {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) return null;
    const [invoices, txs, customers] = await Promise.all([
      this.invoiceRepo.find({ where: { organizationId: id } }),
      this.txRepo.find({ where: { organizationId: id } }),
      this.customerRepo.find({ where: { organizationId: id } }),
    ]);

    let invoiced = 0;
    let collected = 0;
    const byStatus: Record<string, { count: number; amount: number }> = {};
    for (const inv of invoices) {
      const amount = Number(inv.amount);
      const paid = Number(inv.paidAmount);
      invoiced += amount;
      collected += paid;
      byStatus[inv.status] = byStatus[inv.status] || { count: 0, amount: 0 };
      byStatus[inv.status].count += 1;
      byStatus[inv.status].amount += amount;
    }

    const byMonth: Record<string, number> = {};
    const recentTx = [];
    for (const tx of txs) {
      if (tx.status === 'approved') {
        const key = tx.createdAt.toISOString().slice(0, 7);
        byMonth[key] = (byMonth[key] || 0) + Number(tx.amount);
      }
      recentTx.push(tx);
    }
    recentTx.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      org,
      customers: customers.length,
      invoices: invoices.length,
      invoiced,
      collected,
      outstanding: invoiced - collected,
      recoveryRate: invoiced > 0 ? collected / invoiced : 0,
      byStatus,
      collectedByMonth: Object.entries(byMonth)
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      recentTx: recentTx.slice(0, 10).map((t) => ({
        reference: t.reference,
        amount: Number(t.amount),
        status: t.status,
        createdAt: t.createdAt,
      })),
    };
  }
}