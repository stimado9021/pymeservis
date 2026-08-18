import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SubscriptionStatus, WompiEnv } from '@pymes/shared';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ nullable: true, length: 20 })
  nit: string;

  @Column({ unique: true, length: 80 })
  slug: string;

  @Column({ type: 'varchar', default: WompiEnv.SANDBOX })
  wompiEnv: WompiEnv;

  @Column({ nullable: true, type: 'text' })
  wompiPublicKey: string;

  @Column({ nullable: true, type: 'text' })
  wompiPrivateKey: string;

  @Column({ nullable: true, type: 'text' })
  wompiEventsKey: string;

  @Column({ type: 'varchar', default: 'basic' })
  plan: string;

  @Column({ type: 'varchar', default: SubscriptionStatus.TRIAL })
  subscriptionStatus: SubscriptionStatus;

  @Column({ nullable: true, type: 'timestamptz' })
  subscriptionExpiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
