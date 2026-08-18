import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  NotificationChannel,
  ReminderTone,
  ReminderTrigger,
} from '@pymes/shared';

@Entity('reminder_rules')
export class ReminderRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'varchar' })
  trigger: ReminderTrigger;

  @Column({ type: 'int', default: 0 })
  offsetDays: number;

  @Column({ type: 'varchar' })
  channel: NotificationChannel;

  @Column({ type: 'varchar', default: ReminderTone.FRIENDLY })
  tone: ReminderTone;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'text', nullable: true })
  messageTemplate: string;

  @CreateDateColumn()
  createdAt: Date;
}
