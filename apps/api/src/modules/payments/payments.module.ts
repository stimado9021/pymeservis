import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module';
import { SubscriptionGuard } from '../../common/guards';
import { Organization } from '../organizations/organization.entity';
import { PaymentTransaction } from './payment-transaction.entity';
import { WompiService } from './wompi.service';
import { PaymentsController } from './payments.controller';
import { PublicPaymentsController } from './public-payments.controller';
import { SubscriptionController } from './subscription.controller';
import { OrganizationModule } from '../organizations/organization.module';
import { InvoiceModule } from '../invoices/invoice.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentTransaction, Organization]),
    OrganizationModule,
    InvoiceModule,
    CommonModule,
  ],
  providers: [WompiService, SubscriptionGuard],
  controllers: [
    PaymentsController,
    PublicPaymentsController,
    SubscriptionController,
  ],
  exports: [WompiService],
})
export class PaymentsModule {}
