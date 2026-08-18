import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './organization.entity';
import { SecretsService } from '../../common/secrets.service';
import { SubscriptionStatus, WompiEnv } from '@pymes/shared';
import {
  CreateOrganizationDto,
  UpdateWompiConfigDto,
} from './dto/organization.dto';

const TRIAL_DAYS = 14;

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly repo: Repository<Organization>,
    private readonly secrets: SecretsService,
  ) {}

  async create(dto: CreateOrganizationDto): Promise<Organization> {
    const org = this.repo.create({
      ...dto,
      plan: 'basic',
      subscriptionStatus: SubscriptionStatus.TRIAL,
      subscriptionExpiresAt: new Date(
        Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000,
      ),
    });
    return this.repo.save(org);
  }

  async findById(id: string): Promise<Organization> {
    const org = await this.repo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async updateWompiConfig(
    id: string,
    dto: UpdateWompiConfigDto,
  ): Promise<Organization> {
    const org = await this.findById(id);
    if (dto.wompiEnv) org.wompiEnv = dto.wompiEnv as WompiEnv;
    if (dto.wompiPublicKey) org.wompiPublicKey = dto.wompiPublicKey.trim();
    if (dto.wompiPrivateKey && dto.wompiPrivateKey.trim()) {
      org.wompiPrivateKey = this.secrets.encrypt(dto.wompiPrivateKey.trim());
    }
    if (dto.wompiEventsKey && dto.wompiEventsKey.trim()) {
      org.wompiEventsKey = this.secrets.encrypt(dto.wompiEventsKey.trim());
    }
    return this.repo.save(org);
  }

  async updateSubscription(
    id: string,
    plan: string,
    status: SubscriptionStatus,
    expiresAt: Date,
  ): Promise<Organization> {
    const org = await this.findById(id);
    org.plan = plan;
    org.subscriptionStatus = status;
    org.subscriptionExpiresAt = expiresAt;
    return this.repo.save(org);
  }

  sanitize(org: Organization): Record<string, unknown> {
    const { wompiPrivateKey, wompiEventsKey, ...rest } = org;
    return {
      ...rest,
      hasWompiPrivateKey: Boolean(wompiPrivateKey),
      hasWompiEventsKey: Boolean(wompiEventsKey),
    };
  }
}
