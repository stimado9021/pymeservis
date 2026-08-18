import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1700000000000 implements MigrationInterface {
  name = 'InitSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE organizations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(150) NOT NULL,
        nit varchar(20),
        slug varchar(80) NOT NULL UNIQUE,
        "wompiEnv" varchar NOT NULL DEFAULT 'sandbox',
        "wompiPublicKey" text,
        "wompiPrivateKey" text,
        "wompiEventsKey" text,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organizationId" uuid NOT NULL,
        email varchar(200) NOT NULL UNIQUE,
        "passwordHash" text NOT NULL,
        name varchar(120) NOT NULL,
        phone varchar(30),
        role varchar NOT NULL DEFAULT 'collaborator',
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_users_org ON users("organizationId");
    `);
    await queryRunner.query(`
      CREATE TABLE refresh_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "tokenHash" text NOT NULL,
        "expiresAt" timestamptz NOT NULL,
        "revokedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_rt_user ON refresh_tokens("userId");
    `);
    await queryRunner.query(`
      CREATE TABLE customers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organizationId" uuid NOT NULL,
        name varchar(150) NOT NULL,
        identification varchar(20),
        "documentType" varchar NOT NULL DEFAULT 'CC',
        phone varchar(30),
        email varchar(200),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_cust_org ON customers("organizationId");
    `);
    await queryRunner.query(`
      CREATE TABLE invoices (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organizationId" uuid NOT NULL,
        "customerId" uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        number varchar(50) NOT NULL,
        amount numeric(12,2) NOT NULL,
        "paidAmount" numeric(12,2) NOT NULL DEFAULT 0,
        "issueDate" date NOT NULL,
        "dueDate" date NOT NULL,
        status varchar NOT NULL DEFAULT 'pending',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_inv_org ON invoices("organizationId");
      CREATE INDEX idx_inv_cust ON invoices("customerId");
    `);
    await queryRunner.query(`
      CREATE TABLE reminder_rules (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organizationId" uuid NOT NULL,
        trigger varchar NOT NULL,
        "offsetDays" int NOT NULL DEFAULT 0,
        channel varchar NOT NULL,
        tone varchar NOT NULL DEFAULT 'friendly',
        enabled boolean NOT NULL DEFAULT true,
        "messageTemplate" text,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_rr_org ON reminder_rules("organizationId");
    `);
    await queryRunner.query(`
      CREATE TABLE reminders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organizationId" uuid NOT NULL,
        "invoiceId" uuid NOT NULL,
        "ruleId" uuid,
        channel varchar NOT NULL,
        "scheduledAt" timestamptz NOT NULL,
        "sentAt" timestamptz,
        status varchar NOT NULL DEFAULT 'scheduled',
        "externalId" varchar,
        "messageContent" text,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_rem_org ON reminders("organizationId");
      CREATE INDEX idx_rem_inv ON reminders("invoiceId");
    `);
    await queryRunner.query(`
      CREATE TABLE payment_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organizationId" uuid NOT NULL,
        "invoiceId" uuid NOT NULL,
        "wompiTransactionId" varchar(60),
        reference varchar(60) NOT NULL UNIQUE,
        amount numeric(12,2) NOT NULL,
        status varchar NOT NULL DEFAULT 'pending',
        "customerEmail" varchar(200),
        "paymentUrl" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_pt_org ON payment_transactions("organizationId");
      CREATE INDEX idx_pt_inv ON payment_transactions("invoiceId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS payment_transactions`);
    await queryRunner.query(`DROP TABLE IF EXISTS reminders`);
    await queryRunner.query(`DROP TABLE IF EXISTS reminder_rules`);
    await queryRunner.query(`DROP TABLE IF EXISTS invoices`);
    await queryRunner.query(`DROP TABLE IF EXISTS customers`);
    await queryRunner.query(`DROP TABLE IF EXISTS refresh_tokens`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
    await queryRunner.query(`DROP TABLE IF EXISTS organizations`);
  }
}
