import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Organization } from '../organizations/organization.entity';
import { Invoice } from '../invoices/invoice.entity';
import { PaymentTransaction } from '../payments/payment-transaction.entity';
import { Customer } from '../customers/customer.entity';
import { AuthModule } from '../auth/auth.module';
import { SuperAdminService } from './superadmin.service';
import { SuperAdminController } from './superadmin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Organization,
      Invoice,
      PaymentTransaction,
      Customer,
    ]),
    AuthModule,
  ],
  controllers: [SuperAdminController],
  providers: [SuperAdminService],
})
export class SuperAdminModule {}