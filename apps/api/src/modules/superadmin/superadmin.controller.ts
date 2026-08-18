import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsString } from 'class-validator';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@pymes/shared';
import { AuthService } from '../auth/auth.service';
import { SuperAdminService } from './superadmin.service';

class SuperLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

@ApiTags('superadmin')
@Controller('super')
export class SuperAdminController {
  constructor(
    private readonly auth: AuthService,
    private readonly service: SuperAdminService,
  ) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  login(@Body() dto: SuperLoginDto) {
    return this.auth.superLogin(dto.email, dto.password);
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  summary() {
    return this.service.getSummary();
  }

  @Get('companies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  companies() {
    return this.service.getCompanies();
  }

  @Get('company/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  company(@Param('id') id: string) {
    return this.service.getCompany(id);
  }
}