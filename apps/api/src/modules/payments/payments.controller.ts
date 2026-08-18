import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { JwtAuthGuard, RolesGuard, SubscriptionGuard } from '../../common/guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@pymes/shared';
import { WompiService } from './wompi.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentTransaction } from './payment-transaction.entity';
import { parsePagination, paginated } from '../../common/pagination';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly wompi: WompiService,
    @InjectRepository(PaymentTransaction)
    private readonly txRepo: Repository<PaymentTransaction>,
  ) {}

  @Post('invoices/:id/payment-link')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  generateLink(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') invoiceId: string,
  ) {
    return this.wompi.generatePaymentLink(orgId, invoiceId);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
  async list(
    @CurrentUser('organizationId') orgId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const p = parsePagination({ page, pageSize });
    const [items, total] = await this.txRepo
      .createQueryBuilder('t')
      .where('t.organizationId = :orgId', { orgId })
      .orderBy('t.createdAt', 'DESC')
      .skip(p.skip)
      .take(p.take)
      .getManyAndCount();
    return paginated(items, total, p.page, p.pageSize);
  }

  @Post('wompi/webhook')
  @SkipThrottle()
  async webhook(@Req() req: Request, @Res() res: Response) {
    const signature =
      (req.headers['signature'] as string) ||
      (req.headers['x-event-signature'] as string);
    const rawBody = (req as any).rawBody?.toString?.() || JSON.stringify(req.body);
    try {
      await this.wompi.handleWebhook(rawBody, signature);
      return res.status(200).json({ received: true });
    } catch {
      return res.status(400).json({ received: false });
    }
  }
}
