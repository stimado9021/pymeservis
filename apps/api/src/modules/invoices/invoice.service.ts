import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Invoice } from './invoice.entity';
import { Customer } from '../customers/customer.entity';
import { parsePagination, paginated, PaginationQuery } from '../../common/pagination';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceRow,
} from './dto/invoice.dto';
import { InvoiceStatus } from '@pymes/shared';
import { computeInvoiceStatus } from '../../common/reminder.util';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly repo: Repository<Invoice>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly dataSource: DataSource,
  ) {}

  async create(organizationId: string, dto: CreateInvoiceDto): Promise<Invoice> {
    const customer = await this.customerRepo.findOne({
      where: { id: dto.customerId, organizationId },
    });
    if (!customer) throw new NotFoundException('Customer not found in organization');

    const dueDate = new Date(dto.dueDate);
    const invoice = this.repo.create({
      organizationId,
      customerId: dto.customerId,
      number: dto.number,
      amount: dto.amount,
      paidAmount: 0,
      issueDate: new Date(dto.issueDate),
      dueDate,
      status: computeInvoiceStatus(dto.amount, 0, dueDate),
    });
    return this.repo.save(invoice);
  }

  async importRows(
    organizationId: string,
    rows: InvoiceRow[],
  ): Promise<{ inserted: number; errors: number }> {
    const customers = await this.customerRepo.find({ where: { organizationId } });
    const byId = new Map(customers.map((c) => [c.id, c]));
    const byName = new Map(
      customers.map((c) => [c.name.toLowerCase(), c]),
    );
    let inserted = 0;
    let errors = 0;
    for (const row of rows) {
      const customer =
        (row.customerId && byId.get(row.customerId)) ||
        (row.customerName && byName.get(row.customerName.toLowerCase()));
      if (!customer || !row.number || !(row.amount > 0)) {
        errors++;
        continue;
      }
      const dueDate = new Date(row.dueDate);
      await this.repo.save(
        this.repo.create({
          organizationId,
          customerId: customer.id,
          number: row.number,
          amount: row.amount,
          paidAmount: 0,
          issueDate: new Date(row.issueDate),
          dueDate,
          status: computeInvoiceStatus(row.amount, 0, dueDate),
        }),
      );
      inserted++;
    }
    return { inserted, errors };
  }

  async findAll(
    organizationId: string,
    filter: {
      status?: InvoiceStatus;
      customerId?: string;
      from?: string;
      to?: string;
    },
    pagination?: PaginationQuery,
  ) {
    const qb = this.repo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.customer', 'customer')
      .where('i.organizationId = :orgId', { orgId: organizationId });
    if (filter.status) qb.andWhere('i.status = :status', { status: filter.status });
    if (filter.customerId)
      qb.andWhere('i.customerId = :cid', { cid: filter.customerId });
    if (filter.from)
      qb.andWhere('i.dueDate >= :from', { from: filter.from });
    if (filter.to) qb.andWhere('i.dueDate <= :to', { to: filter.to });
    qb.orderBy('i.dueDate', 'ASC');
    const p = parsePagination(pagination);
    const [items, total] = await qb
      .skip(p.skip)
      .take(p.take)
      .getManyAndCount();
    return paginated(items, total, p.page, p.pageSize);
  }

  async findOne(organizationId: string, id: string): Promise<Invoice> {
    const invoice = await this.repo.findOne({
      where: { id, organizationId },
      relations: ['customer'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async findPublic(id: string): Promise<Invoice> {
    const invoice = await this.repo.findOne({
      where: { id },
      relations: ['customer'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    const invoice = await this.findOne(organizationId, id);
    if (dto.customerId) {
      const customer = await this.customerRepo.findOne({
        where: { id: dto.customerId, organizationId },
      });
      if (!customer) throw new NotFoundException('Customer not found');
      invoice.customerId = dto.customerId;
    }
    if (dto.number) invoice.number = dto.number;
    if (dto.amount) invoice.amount = dto.amount;
    if (dto.issueDate) invoice.issueDate = new Date(dto.issueDate);
    if (dto.dueDate) invoice.dueDate = new Date(dto.dueDate);
    invoice.status = computeInvoiceStatus(
      invoice.amount,
      invoice.paidAmount,
      invoice.dueDate,
    );
    return this.repo.save(invoice);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const invoice = await this.findOne(organizationId, id);
    await this.repo.remove(invoice);
  }

  async applyPayment(
    invoiceId: string,
    amount: number,
  ): Promise<Invoice> {
    const invoice = await this.repo.findOne({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    invoice.paidAmount = Number(invoice.paidAmount) + amount;
    invoice.status = computeInvoiceStatus(
      Number(invoice.amount),
      invoice.paidAmount,
      invoice.dueDate,
    );
    return this.repo.save(invoice);
  }
}
