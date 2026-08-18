import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
import {
  InvoiceStatus,
} from '@pymes/shared';

export class CreateInvoiceDto {
  @IsUUID()
  customerId: string;

  @IsString()
  @Length(1, 50)
  number: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsDateString()
  issueDate: string;

  @IsDateString()
  dueDate: string;
}

export class UpdateInvoiceDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  number?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export interface InvoiceRow {
  customerId?: string;
  customerName?: string;
  number: string;
  amount: number;
  issueDate: string;
  dueDate: string;
}

export class InvoiceFilterDto {
  @IsOptional()
  status?: InvoiceStatus;

  @IsOptional()
  customerId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
