import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReminderRule } from './reminder-rule.entity';
import { Reminder } from './reminder.entity';
import { ReminderService } from './reminder.service';
import { ReminderRuleService } from './reminder-rule.service';
import { ReminderGenerator } from './reminder-generator.service';
import { ReminderMessageBuilder } from './reminder-message.builder';
import { NotificationController } from './notification.controller';
import { NotificationProcessor } from './notification.processor';
import {
  NotificationDispatcher,
  NOTIFICATION_PROVIDERS,
} from './notification-dispatcher';
import { ConsoleNotificationProvider } from './console-notification.provider';
import { WhatsappNotificationProvider } from './whatsapp-notification.provider';
import { SmsNotificationProvider } from './sms-notification.provider';
import { EmailNotificationProvider } from './email-notification.provider';
import { InvoiceModule } from '../invoices/invoice.module';
import { CustomerModule } from '../customers/customer.module';
import { Invoice } from '../invoices/invoice.entity';
import { Customer } from '../customers/customer.entity';
import { CommonModule } from '../../common/common.module';
import { SubscriptionGuard } from '../../common/guards';
import { Organization } from '../organizations/organization.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReminderRule,
      Reminder,
      Invoice,
      Customer,
      Organization,
    ]),
    CommonModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('app.redis.host'),
          port: config.get<number>('app.redis.port'),
        },
      }),
    }),
    BullModule.registerQueue({ name: 'notifications' }),
    InvoiceModule,
    CustomerModule,
  ],
  providers: [
    ReminderService,
    ReminderRuleService,
    ReminderGenerator,
    ReminderMessageBuilder,
    NotificationProcessor,
    NotificationDispatcher,
    SubscriptionGuard,
    {
      provide: NOTIFICATION_PROVIDERS,
      inject: [
        WhatsappNotificationProvider,
        SmsNotificationProvider,
        EmailNotificationProvider,
        ConsoleNotificationProvider,
      ],
      useFactory: (
        whatsapp: WhatsappNotificationProvider,
        sms: SmsNotificationProvider,
        email: EmailNotificationProvider,
        console: ConsoleNotificationProvider,
      ) => [whatsapp, sms, email, console],
    },
    ConsoleNotificationProvider,
    WhatsappNotificationProvider,
    SmsNotificationProvider,
    EmailNotificationProvider,
  ],
  controllers: [NotificationController],
  exports: [ReminderService],
})
export class NotificationsModule {}
