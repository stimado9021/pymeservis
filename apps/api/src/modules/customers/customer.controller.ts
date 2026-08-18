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
import { UserRole } from '@pymes/shared';
import { CustomerService } from './customer.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerRow,
} from './dto/customer.dto';
import * as Papa from 'papaparse';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
@Controller('customers')
export class CustomerController {
  constructor(private readonly service: CustomerService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  create(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.service.create(orgId, dto);
  }

  @Post('import')
  @Roles(UserRole.ADMIN, UserRole.COLLABORATOR)
  async import(
    @CurrentUser('organizationId') orgId: string,
    @Body()
    body: { csv?: string; rows?: CustomerRow[] },
  ) {
    let rows: CustomerRow[] = body.rows || [];
    if (body.csv) {
      const parsed = Papa.parse<CustomerRow>(body.csv, {
        header: true,
        skipEmptyLines: true,
      });
      rows = parsed.data.map((r) => ({
        name: r.name?.trim(),
        identification: r.identification?.trim(),
        documentType: (r.documentType as CustomerRow['documentType']) || undefined,
        phone: r.phone?.trim(),
        email: r.email?.trim(),
      }));
    }
    return this.service.importRows(orgId, rows);
  }

  @Get()
  findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.service.findAll(orgId, search, { page, pageSize });
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
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.service.update(orgId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@CurrentUser('organizationId') orgId: string, @Param('id') id: string) {
    return this.service.remove(orgId, id);
  }
}
