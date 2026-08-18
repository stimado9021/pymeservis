import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, SubscriptionGuard } from '../../common/guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@pymes/shared';
import { ReminderRuleService } from './reminder-rule.service';
import { ReminderGenerator } from './reminder-generator.service';
import { ReminderService } from './reminder.service';
import { CreateReminderRuleDto } from './dto/reminder-rule.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly rules: ReminderRuleService,
    private readonly service: ReminderService,
    private readonly generator: ReminderGenerator,
  ) {}

  @Get('rules')
  listRules(@CurrentUser('organizationId') orgId: string) {
    return this.rules.list(orgId);
  }

  @Post('rules')
  @Roles(UserRole.ADMIN)
  createRule(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateReminderRuleDto,
  ) {
    return this.rules.create(orgId, dto);
  }

  @Patch('rules/:id')
  @Roles(UserRole.ADMIN)
  updateRule(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateReminderRuleDto>,
  ) {
    return this.rules.update(orgId, id, dto);
  }

  @Delete('rules/:id')
  @Roles(UserRole.ADMIN)
  removeRule(@CurrentUser('organizationId') orgId: string, @Param('id') id: string) {
    return this.rules.remove(orgId, id);
  }

  @Post('generate')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  generate(@CurrentUser('organizationId') orgId: string) {
    return this.generator.generate(orgId);
  }

  @Get('reminders')
  listReminders(
    @CurrentUser('organizationId') orgId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.service.listReminders(orgId, { page, pageSize });
  }
}
