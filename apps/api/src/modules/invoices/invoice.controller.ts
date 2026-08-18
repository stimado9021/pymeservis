import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, SubscriptionGuard } from '../../common/guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, InvoiceStatus } from '@pymes/shared';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto, UpdateInvoiceDto, InvoiceRow } from './dto/invoice.dto';
import * as Papa from 'papaparse';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly service: InvoiceService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  create(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.service.create(orgId, dto);
  }

  @Post('import')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  import(
    @CurrentUser('organizationId') orgId: string,
    @Body() body: { csv?: string; rows?: InvoiceRow[] },
  ) {
    let rows: InvoiceRow[] = body.rows || [];
    if (body.csv) {
      const parsed = Papa.parse<InvoiceRow>(body.csv, {
        header: true,
        skipEmptyLines: true,
      });
      rows = parsed.data.map((r: any) => ({
        customerId: r.customerId?.trim() || undefined,
        customerName: r.customerName?.trim() || undefined,
        number: r.number?.trim(),
        amount: parseFloat(r.amount),
        issueDate: r.issueDate,
        dueDate: r.dueDate,
      }));
    }
    return this.service.importRows(orgId, rows);
  }

  @Get()
  findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query('status') status?: InvoiceStatus,
    @Query('customerId') customerId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.service.findAll(
      orgId,
      { status, customerId, from, to },
      { page, pageSize },
    );
  }

  @Get(':id')
  findOne(@CurrentUser('organizationId') orgId: string, @Param('id') id: string) {
    return this.service.findOne(orgId, id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  update(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.service.update(orgId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@CurrentUser('organizationId') orgId: string, @Param('id') id: string) {
    return this.service.remove(orgId, id);
  }
}
