import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WompiService } from './wompi.service';
import { SecretsService } from '../../common/secrets.service';
import { PaymentStatus, WompiEnv } from '@pymes/shared';
import * as crypto from 'crypto';

function makeService(overrides: Record<string, unknown> = {}) {
  const txStore = overrides.txStore as any[] ?? [];
  const txRepo = {
    findOne: jest.fn(({ where }) =>
      txStore.find((t) => t.reference === where.reference) ?? null,
    ),
    create: jest.fn((d) => ({ ...d })),
    save: jest.fn(async (t) => {
      const existing = txStore.find((x) => x.reference === t.reference);
      if (existing) Object.assign(existing, t);
      else txStore.push(t);
      return t;
    }),
  };
  const orgs = {
    findById: jest.fn(),
    findOne: jest.fn(),
  };
  const invoices = {
    findOne: jest.fn(),
    findPublic: jest.fn(),
    applyPayment: jest.fn(async () => ({})),
  };
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'app.wompi')
        return {
          sandboxPublicKey: 'pub_sandbox_fallback',
          sandboxPrivateKey: 'prv_sandbox_fallback',
          sandboxEventsKey: 'evt_sandbox_fallback',
        };
      if (key === 'app.frontendUrl') return 'http://localhost:3000';
      if (key === 'app.security.encryptionKey') return 'test-enc-key';
      return undefined;
    }),
  } as unknown as ConfigService;

  const secrets = new SecretsService(config);
  const service = new WompiService(
    config,
    orgs as any,
    invoices as any,
    secrets,
    txRepo as any,
  );
  return { service, orgs, invoices, txRepo, txStore };
}

describe('WompiService', () => {
  const eventsKey = 'evt_test_events_key';
  const org = {
    id: 'org-1',
    wompiEnv: WompiEnv.SANDBOX,
    wompiPublicKey: 'pub_test_1',
    wompiPrivateKey: 'prv_test_1',
    wompiEventsKey: eventsKey,
  };

  function payload(reference: string, status: string, id = 'tx-1') {
    return JSON.stringify({
      event: 'transaction.updated',
      data: {
        transaction: {
          id,
          reference,
          status,
          amount_in_cents: 15000000,
        },
      },
    });
  }

  function sign(raw: string) {
    return crypto
      .createHmac('sha256', eventsKey)
      .update(raw)
      .digest('hex');
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rechaza firma inválida', async () => {
    const { service, txStore } = makeService();
    txStore.push({
      reference: 'REF-1',
      organizationId: 'org-1',
      invoiceId: 'inv-1',
      amount: 150000,
      status: PaymentStatus.PENDING,
    });
    (service as any).orgs = { findById: jest.fn(async () => org) };
    await expect(
      (service as any).handleWebhook(payload('REF-1', 'APPROVED'), 'firma-incorrecta'),
    ).rejects.toThrow(BadRequestException);
  });

  it('aplica pago y guarda wompiTransactionId en APPROVED válido', async () => {
    const { service, txRepo, invoices } = makeService();
    const tx: any = {
      reference: 'REF-2',
      organizationId: 'org-1',
      invoiceId: 'inv-2',
      amount: 150000,
      status: PaymentStatus.PENDING,
    };
    (service as any).orgs.findById.mockResolvedValue(org);
    (txRepo as any).findOne.mockImplementation(async (opts: any) =>
      tx.reference === opts.where.reference ? tx : null,
    );
    (txRepo as any).save.mockImplementation(async (t: any) => ({ ...t }));

    const raw = payload('REF-2', 'APPROVED');
    await (service as any).handleWebhook(raw, sign(raw));

    expect(tx.status).toBe(PaymentStatus.APPROVED);
    expect(tx.wompiTransactionId).toBe('tx-1');
    expect(invoices.applyPayment).toHaveBeenCalledWith('inv-2', 150000);
  });

  it('no duplica el pago ante webhooks repetidos', async () => {
    const { service, txRepo, invoices } = makeService();
    const tx: any = {
      reference: 'REF-3',
      organizationId: 'org-1',
      invoiceId: 'inv-3',
      amount: 100000,
      status: PaymentStatus.PENDING,
    };
    (service as any).orgs.findById.mockResolvedValue(org);
    (txRepo as any).findOne.mockImplementation(async (opts: any) =>
      tx.reference === opts.where.reference ? tx : null,
    );
    (txRepo as any).save.mockImplementation(async (t: any) => ({ ...t }));

    const raw = payload('REF-3', 'APPROVED');
    await (service as any).handleWebhook(raw, sign(raw));
    await (service as any).handleWebhook(raw, sign(raw));
    await (service as any).handleWebhook(raw, sign(raw));

    expect(invoices.applyPayment).toHaveBeenCalledTimes(1);
  });

  it('descifra llaves cifradas de la organización', async () => {
    const { service, txRepo, invoices } = makeService();
    const secrets = new SecretsService({
      get: jest.fn((k: string) =>
        k === 'app.security.encryptionKey' ? 'test-enc-key' : undefined,
      ),
    } as unknown as ConfigService);
    const encOrg = {
      ...org,
      wompiPrivateKey: secrets.encrypt('prv_test_secret'),
      wompiEventsKey: secrets.encrypt(eventsKey),
    };
    const tx: any = {
      reference: 'REF-4',
      organizationId: 'org-1',
      invoiceId: 'inv-4',
      amount: 50000,
      status: PaymentStatus.PENDING,
    };
    (service as any).orgs.findById.mockResolvedValue(encOrg);
    (txRepo as any).findOne.mockImplementation(async (opts: any) =>
      tx.reference === opts.where.reference ? tx : null,
    );
    (txRepo as any).save.mockImplementation(async (t: any) => ({ ...t }));

    const raw = payload('REF-4', 'APPROVED');
    await (service as any).handleWebhook(raw, sign(raw));
    expect(tx.status).toBe(PaymentStatus.APPROVED);
    expect(invoices.applyPayment).toHaveBeenCalledTimes(1);
  });
});