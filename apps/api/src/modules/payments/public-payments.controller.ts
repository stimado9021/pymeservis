import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentTransaction } from './payment-transaction.entity';
import { WompiService } from './wompi.service';
import { InvoiceService } from '../invoices/invoice.service';

@ApiTags('public')
@Controller('public')
export class PublicPaymentsController {
  constructor(
    private readonly wompi: WompiService,
    private readonly invoices: InvoiceService,
    @InjectRepository(PaymentTransaction)
    private readonly txRepo: Repository<PaymentTransaction>,
  ) {}

  @Get('invoices/:id')
  async invoice(@Param('id') id: string) {
    const invoice = await this.invoices.findPublic(id);
    return {
      id: invoice.id,
      number: invoice.number,
      amount: Number(invoice.amount),
      paidAmount: Number(invoice.paidAmount),
      pending: Number(invoice.amount) - Number(invoice.paidAmount),
      status: invoice.status,
      dueDate: invoice.dueDate,
      customer: invoice.customer ? { name: invoice.customer.name } : null,
    };
  }

  @Post('invoices/:id/payment-link')
  async paymentLink(@Param('id') id: string) {
    return this.wompi.generatePublicPaymentLink(id);
  }

  @Get('payments/:reference')
  async payment(@Param('reference') reference: string) {
    const tx = await this.txRepo.findOne({ where: { reference } });
    if (!tx) throw new NotFoundException('Payment not found');
    const invoice = await this.invoices.findPublic(tx.invoiceId);
    return {
      transaction: {
        reference: tx.reference,
        status: tx.status,
        amount: Number(tx.amount),
        createdAt: tx.createdAt,
      },
      invoice: {
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        customer: invoice.customer ? { name: invoice.customer.name } : null,
      },
    };
  }
}