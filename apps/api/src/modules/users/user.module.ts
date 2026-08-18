import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module';
import { SubscriptionGuard } from '../../common/guards';
import { Organization } from '../organizations/organization.entity';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Organization]),
    CommonModule,
  ],
  providers: [UserService, SubscriptionGuard],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
