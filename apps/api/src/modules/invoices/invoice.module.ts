import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module';
import { SubscriptionGuard } from '../../common/guards';
import { Organization } from '../organizations/organization.entity';
import { Invoice } from './invoice.entity';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { Customer } from '../customers/customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Customer, Organization]),
    CommonModule,
  ],
  providers: [InvoiceService, SubscriptionGuard],
  controllers: [InvoiceController],
  exports: [InvoiceService],
})
export class InvoiceModule {}
