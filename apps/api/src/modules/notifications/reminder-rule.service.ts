import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReminderRule } from './reminder-rule.entity';
import { CreateReminderRuleDto } from './dto/reminder-rule.dto';
import { ReminderTone } from '@pymes/shared';

@Injectable()
export class ReminderRuleService {
  constructor(
    @InjectRepository(ReminderRule)
    private readonly ruleRepo: Repository<ReminderRule>,
  ) {}

  create(organizationId: string, dto: CreateReminderRuleDto): Promise<ReminderRule> {
    return this.ruleRepo.save(
      this.ruleRepo.create({
        organizationId,
        trigger: dto.trigger,
        offsetDays: dto.offsetDays,
        channel: dto.channel,
        tone: dto.tone ?? ReminderTone.FRIENDLY,
        enabled: dto.enabled ?? true,
        messageTemplate: dto.messageTemplate,
      }),
    );
  }

  list(organizationId: string): Promise<ReminderRule[]> {
    return this.ruleRepo.find({
      where: { organizationId },
      order: { createdAt: 'ASC' },
    });
  }

  async update(
    organizationId: string,
    id: string,
    dto: Partial<CreateReminderRuleDto>,
  ): Promise<ReminderRule> {
    const rule = await this.ruleRepo.findOne({ where: { id, organizationId } });
    if (!rule) throw new NotFoundException('Rule not found');
    Object.assign(rule, dto);
    return this.ruleRepo.save(rule);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const rule = await this.ruleRepo.findOne({ where: { id, organizationId } });
    if (!rule) throw new NotFoundException('Rule not found');
    await this.ruleRepo.remove(rule);
  }
}