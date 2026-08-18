import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { parsePagination, paginated, PaginationQuery } from '../../common/pagination';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerRow,
} from './dto/customer.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  create(organizationId: string, dto: CreateCustomerDto): Promise<Customer> {
    return this.repo.save(this.repo.create({ organizationId, ...dto }));
  }

  async importRows(
    organizationId: string,
    rows: CustomerRow[],
  ): Promise<{ inserted: number; errors: number }> {
    let inserted = 0;
    let errors = 0;
    for (const row of rows) {
      if (!row.name) {
        errors++;
        continue;
      }
      await this.repo.save(
        this.repo.create({ organizationId, ...row }),
      );
      inserted++;
    }
    return { inserted, errors };
  }

  async findAll(
    organizationId: string,
    search?: string,
    pagination?: PaginationQuery,
  ) {
    const qb = this.repo
      .createQueryBuilder('c')
      .where('c.organizationId = :orgId', { orgId: organizationId });
    if (search) {
      qb.andWhere(
        '(c.name ILIKE :s OR c.identification ILIKE :s OR c.email ILIKE :s)',
        { s: `%${search}%` },
      );
    }
    const p = parsePagination(pagination);
    qb.orderBy('c.createdAt', 'DESC');
    const [items, total] = await qb
      .skip(p.skip)
      .take(p.take)
      .getManyAndCount();
    return paginated(items, total, p.page, p.pageSize);
  }

  async findOne(organizationId: string, id: string): Promise<Customer> {
    const customer = await this.repo.findOne({
      where: { id, organizationId },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateCustomerDto,
  ): Promise<Customer> {
    const customer = await this.findOne(organizationId, id);
    Object.assign(customer, dto);
    return this.repo.save(customer);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const customer = await this.findOne(organizationId, id);
    await this.repo.remove(customer);
  }
}
