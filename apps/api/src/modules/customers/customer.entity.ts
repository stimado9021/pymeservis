import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DocumentType } from '@pymes/shared';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ length: 150 })
  name: string;

  @Column({ nullable: true, length: 20 })
  identification: string;

  @Column({ type: 'varchar', default: DocumentType.CC })
  documentType: DocumentType;

  @Column({ nullable: true, length: 30 })
  phone: string;

  @Column({ nullable: true, length: 200 })
  email: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
