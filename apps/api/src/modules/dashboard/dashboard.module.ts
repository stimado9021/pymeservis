import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module';
import { SubscriptionGuard } from '../../common/guards';
import { Organization } from '../organizations/organization.entity';
import { Invoice } from '../invoices/invoice.entity';
import { PaymentTransaction } from '../payments/payment-transaction.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, PaymentTransaction, Organization]),
    CommonModule,
  ],
  providers: [DashboardService, SubscriptionGuard],
  controllers: [DashboardController],
})
export class DashboardModule {}
