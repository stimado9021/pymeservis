import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserRole } from '@pymes/shared';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  organizationId: string;

  @Index({ unique: true })
  @Column({ length: 200 })
  email: string;

  @Column({ type: 'text' })
  passwordHash: string;

  @Column({ length: 120 })
  name: string;

  @Column({ nullable: true, length: 30 })
  phone: string;

  @Column({ type: 'varchar', default: UserRole.COLLABORATOR })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;
}
