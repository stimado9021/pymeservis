import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module';
import { SubscriptionGuard } from '../../common/guards';
import { Organization } from '../organizations/organization.entity';
import { Customer } from './customer.entity';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Organization]),
    CommonModule,
  ],
  providers: [CustomerService, SubscriptionGuard],
  controllers: [CustomerController],
  exports: [CustomerService],
})
export class CustomerModule {}
