import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NotificationChannel, ReminderStatus } from '@pymes/shared';

@Entity('reminders')
export class Reminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  organizationId: string;

  @Index()
  @Column({ type: 'uuid' })
  invoiceId: string;

  @Column({ type: 'uuid', nullable: true })
  ruleId: string;

  @Column({ type: 'varchar' })
  channel: NotificationChannel;

  @Column({ type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date;

  @Column({ type: 'varchar', default: ReminderStatus.SCHEDULED })
  status: ReminderStatus;

  @Column({ type: 'varchar', nullable: true })
  externalId: string | null;

  @Column({ type: 'text', nullable: true })
  messageContent: string;

  @CreateDateColumn()
  createdAt: Date;
}
