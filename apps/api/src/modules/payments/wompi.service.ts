import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrganizationService } from '../organizations/organization.service';
import { InvoiceService } from '../invoices/invoice.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentTransaction } from './payment-transaction.entity';
import { Organization } from '../organizations/organization.entity';
import { Invoice } from '../invoices/invoice.entity';
import {
  PaymentStatus,
  SUBSCRIPTION_PLANS,
  SubscriptionStatus,
  WompiEnv,
} from '@pymes/shared';
import { SecretsService } from '../../common/secrets.service';
import * as crypto from 'crypto';

interface WompiKeys {
  env: WompiEnv;
  publicKey: string;
  privateKey: string;
  eventsKey: string;
  baseUrl: string;
}

@Injectable()
export class WompiService {
  constructor(
    private readonly config: ConfigService,
    private readonly orgs: OrganizationService,
    private readonly invoices: InvoiceService,
    private readonly secrets: SecretsService,
    @InjectRepository(PaymentTransaction)
    private readonly txRepo: Repository<PaymentTransaction>,
  ) {}

  private resolveKeys(org: Organization): WompiKeys {
    const useProd = org.wompiEnv === WompiEnv.PROD && org.wompiPublicKey;
    const env = useProd ? WompiEnv.PROD : WompiEnv.SANDBOX;
    const publicKey = useProd ? org.wompiPublicKey : org.wompiPublicKey;
    const privateKey = useProd ? org.wompiPrivateKey : org.wompiPrivateKey;
    const eventsKey = useProd ? org.wompiEventsKey : org.wompiEventsKey;
    if (!publicKey || !privateKey || !eventsKey) {
      throw new BadRequestException(
        'Wompi not configured for this organization. Registra tu cuenta de Wompi en Configuración.',
      );
    }
    const baseUrl =
      env === WompiEnv.PROD
        ? 'https://production.wompi.co/v1'
        : 'https://sandbox.wompi.co/v1';
    return {
      env,
      publicKey,
      privateKey: this.secrets.decrypt(privateKey),
      eventsKey: this.secrets.decrypt(eventsKey),
      baseUrl,
    };
  }

  private resolvePlatformKeys(): WompiKeys {
    const cfg = this.config.get('app.wompi');
    const useProd = cfg.env === WompiEnv.PROD;
    const env: WompiEnv = useProd ? WompiEnv.PROD : WompiEnv.SANDBOX;
    const publicKey = useProd ? cfg.prodPublicKey : cfg.sandboxPublicKey;
    const privateKey = useProd ? cfg.prodPrivateKey : cfg.sandboxPrivateKey;
    const eventsKey = useProd ? cfg.prodEventsKey : cfg.sandboxEventsKey;
    if (!publicKey || !privateKey || !eventsKey) {
      throw new BadRequestException('Platform Wompi keys not configured');
    }
    return {
      env,
      publicKey,
      privateKey: this.secrets.decrypt(privateKey),
      eventsKey: this.secrets.decrypt(eventsKey),
      baseUrl: cfg.apiUrl,
    };
  }

  async generatePaymentLink(
    organizationId: string,
    invoiceId: string,
  ): Promise<{ reference: string; paymentUrl: string; amount: number }> {
    const org = await this.orgs.findById(organizationId);
    const invoice = await this.invoices.findOne(organizationId, invoiceId);
    return this.buildLink(org, invoice);
  }

  async generatePublicPaymentLink(
    invoiceId: string,
  ): Promise<{ reference: string; paymentUrl: string; amount: number }> {
    const invoice = await this.invoices.findPublic(invoiceId);
    const org = await this.orgs.findById(invoice.organizationId);
    return this.buildLink(org, invoice);
  }

  private async buildLink(
    org: Organization,
    invoice: Invoice,
  ): Promise<{ reference: string; paymentUrl: string; amount: number }> {
    const keys = this.resolveKeys(org);
    if (!keys.publicKey) {
      throw new BadRequestException(
        'Wompi public key not configured for this organization',
      );
    }
    const pending = Number(invoice.amount) - Number(invoice.paidAmount);
    if (pending <= 0) {
      throw new BadRequestException('Invoice already paid');
    }
    const amountCents = Math.round(pending * 100);
    const reference = `INV-${invoice.id}-${Date.now()}`;
    const frontend = this.config.get<string>('app.frontendUrl');
    const redirectUrl = `${frontend}/pagos/resultado?ref=${reference}`;

    const tx = this.txRepo.create({
      organizationId: org.id,
      invoiceId: invoice.id,
      reference,
      amount: pending,
      status: PaymentStatus.PENDING,
      customerEmail: invoice.customer?.email,
    });
    await this.txRepo.save(tx);

    const checkoutBase =
      keys.env === WompiEnv.PROD
        ? 'https://checkout.wompi.co/p/'
        : 'https://sandbox.wompi.co/p/';
    const params = new URLSearchParams({
      'public-key': keys.publicKey,
      'currency': 'COP',
      'amount-in-cents': String(amountCents),
      'reference': reference,
      'redirect-url': redirectUrl,
    });
    if (invoice.customer?.email) {
      params.append('customer-data:email', invoice.customer.email);
    }
    const paymentUrl = `${checkoutBase}?${params.toString()}`;
    tx.paymentUrl = paymentUrl;
    await this.txRepo.save(tx);

    return { reference, paymentUrl, amount: pending };
  }

  async findByReference(reference: string): Promise<PaymentTransaction | null> {
    return this.txRepo.findOne({ where: { reference } });
  }

  async createSubscriptionCheckout(
    organizationId: string,
    planId: string,
  ): Promise<{ reference: string; paymentUrl: string; amount: number; planId: string }> {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) throw new NotFoundException('Plan not found');
    const org = await this.orgs.findById(organizationId);
    const keys = this.resolvePlatformKeys();
    const amountCents = Math.round(plan.price * 100);
    const reference = `SUB-${org.id}-${plan.id}-${Date.now()}`;
    const frontend = this.config.get<string>('app.frontendUrl');
    const redirectUrl = `${frontend}/dashboard/subscription?ref=${reference}`;

    const tx = this.txRepo.create({
      organizationId: org.id,
      reference,
      amount: plan.price,
      status: PaymentStatus.PENDING,
    });
    await this.txRepo.save(tx);

    const checkoutBase =
      keys.env === WompiEnv.PROD
        ? 'https://checkout.wompi.co/p/'
        : 'https://sandbox.wompi.co/p/';
    const params = new URLSearchParams({
      'public-key': keys.publicKey,
      'currency': 'COP',
      'amount-in-cents': String(amountCents),
      'reference': reference,
      'redirect-url': redirectUrl,
    });
    const paymentUrl = `${checkoutBase}?${params.toString()}`;
    tx.paymentUrl = paymentUrl;
    await this.txRepo.save(tx);

    return { reference, paymentUrl, amount: plan.price, planId: plan.id };
  }

  async handleWebhook(rawBody: string, signature: string | undefined): Promise<void> {
    if (!signature) return;
    const txRef = this.extractReference(rawBody);
    if (!txRef) return;
    const tx = await this.findByReference(txRef);
    if (!tx) return;

    const isSubscription = tx.reference.startsWith('SUB-');
    const org = await this.orgs.findById(tx.organizationId);
    const keys = isSubscription ? this.resolvePlatformKeys() : this.resolveKeys(org);

    if (keys.eventsKey && !this.verifySignature(rawBody, signature, keys.eventsKey)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const status = this.extractStatus(rawBody);
    if (!status) return;

    const mapped = this.mapStatus(status);
    const alreadyApproved = tx.status === PaymentStatus.APPROVED;
    tx.status = mapped;
    const transactionId = this.extractTransactionId(rawBody);
    if (transactionId) tx.wompiTransactionId = transactionId;
    if (mapped === PaymentStatus.APPROVED && !alreadyApproved) {
      if (isSubscription) {
        const match = tx.reference.match(/^SUB-([0-9a-f-]+)-([a-z]+)-\d+$/);
        const planId = match?.[2] || 'basic';
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await this.orgs.updateSubscription(
          org.id,
          planId,
          SubscriptionStatus.ACTIVE,
          expiresAt,
        );
      } else {
        const amountCents = this.extractAmountCents(rawBody);
        const amount = amountCents ? amountCents / 100 : Number(tx.amount);
        if (tx.invoiceId) {
          await this.invoices.applyPayment(tx.invoiceId, amount);
        }
      }
    }
    await this.txRepo.save(tx);
  }

  private verifySignature(raw: string, signature: string, eventsKey: string): boolean {
    try {
      const hmac = crypto.createHmac('sha256', eventsKey).update(raw).digest('hex');
      if (hmac.length !== signature.length) return false;
      return crypto.timingSafeEqual(
        Buffer.from(hmac),
        Buffer.from(signature),
      );
    } catch {
      return false;
    }
  }

  private extractReference(raw: string): string | null {
    try {
      const parsed = JSON.parse(raw);
      return parsed?.data?.transaction?.reference ?? null;
    } catch {
      return null;
    }
  }

  private extractTransactionId(raw: string): string | null {
    try {
      const parsed = JSON.parse(raw);
      return parsed?.data?.transaction?.id ?? null;
    } catch {
      return null;
    }
  }

  private extractStatus(raw: string): string | null {
    try {
      const parsed = JSON.parse(raw);
      return parsed?.data?.transaction?.status ?? null;
    } catch {
      return null;
    }
  }

  private extractAmountCents(raw: string): number | null {
    try {
      const parsed = JSON.parse(raw);
      return parsed?.data?.transaction?.amount_in_cents ?? null;
    } catch {
      return null;
    }
  }

  private mapStatus(wompiStatus: string): PaymentStatus {
    switch (wompiStatus) {
      case 'APPROVED':
        return PaymentStatus.APPROVED;
      case 'DECLINED':
        return PaymentStatus.DECLINED;
      case 'ERROR':
        return PaymentStatus.ERROR;
      default:
        return PaymentStatus.PENDING;
    }
  }
}
