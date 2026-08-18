import { MigrationInterface, QueryRunner } from 'typeorm';

export class SuperAdminAndSubscriptions1720000000000
  implements MigrationInterface
{
  name = 'SuperAdminAndSubscriptions1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users ALTER COLUMN "organizationId" DROP NOT NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE payment_transactions ALTER COLUMN "invoiceId" DROP NOT NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE organizations
        ADD COLUMN plan varchar NOT NULL DEFAULT 'basic',
        ADD COLUMN "subscriptionStatus" varchar NOT NULL DEFAULT 'trial',
        ADD COLUMN "subscriptionExpiresAt" timestamptz;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE organizations
        DROP COLUMN "subscriptionExpiresAt",
        DROP COLUMN "subscriptionStatus",
        DROP COLUMN plan;
    `);
    await queryRunner.query(`
      ALTER TABLE payment_transactions ALTER COLUMN "invoiceId" SET NOT NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE users ALTER COLUMN "organizationId" SET NOT NULL;
    `);
  }
}
