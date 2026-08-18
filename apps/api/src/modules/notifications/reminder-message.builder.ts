import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReminderTone } from '@pymes/shared';
import { ReminderRule } from './reminder-rule.entity';
import { Invoice } from '../invoices/invoice.entity';

@Injectable()
export class ReminderMessageBuilder {
  constructor(private readonly config: ConfigService) {}

  build(rule: ReminderRule, invoice: Invoice): string {
    if (rule.messageTemplate) {
      return rule.messageTemplate
        .replace('{name}', invoice.customer?.name ?? '')
        .replace('{number}', invoice.number)
        .replace('{amount}', invoice.amount.toString())
        .replace('{dueDate}', invoice.dueDate.toISOString().slice(0, 10));
    }
    const name = invoice.customer?.name ?? 'cliente';
    const amount = invoice.amount.toString();
    const due =
      invoice.dueDate instanceof Date
        ? invoice.dueDate.toISOString().slice(0, 10)
        : String(invoice.dueDate).slice(0, 10);
    const frontend = this.config.get<string>('app.frontendUrl')!;
    const link = `${frontend}/pagos/${invoice.id}`;
    switch (rule.tone) {
      case ReminderTone.FIRM:
        return `Atención ${name}: la factura ${invoice.number} por $${amount} está vencida. Por favor realiza el pago en ${link} para evitar recargos.`;
      case ReminderTone.NEUTRAL:
        return `Estimado ${name}, tu factura ${invoice.number} por $${amount} vence el ${due}. Puedes pagar aquí: ${link}`;
      default:
        return `Hola ${name}, te recordamos amablemente que tu factura ${invoice.number} por $${amount} vence el ${due}. Paga fácil aquí: ${link}`;
    }
  }
}