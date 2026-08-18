import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, SUBSCRIPTION_PLANS } from '@pymes/shared';
import { OrganizationService } from '../organizations/organization.service';
import { WompiService } from './wompi.service';

class CheckoutDto {
  @IsString()
  planId: string;
}

@ApiTags('subscription')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly orgs: OrganizationService,
    private readonly wompi: WompiService,
  ) {}

  @Get('current')
  async current(@CurrentUser('organizationId') orgId: string) {
    const org = await this.orgs.findById(orgId);
    return {
      plan: org.plan,
      subscriptionStatus: org.subscriptionStatus,
      subscriptionExpiresAt: org.subscriptionExpiresAt,
      plans: SUBSCRIPTION_PLANS,
    };
  }

  @Post('checkout')
  @Roles(UserRole.ADMIN)
  checkout(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CheckoutDto,
  ) {
    return this.wompi.createSubscriptionCheckout(orgId, dto.planId);
  }
}