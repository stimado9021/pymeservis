import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, SubscriptionGuard } from '../../common/guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@pymes/shared';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/user.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateUserDto,
  ) {
    return this.service.create(orgId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@CurrentUser('organizationId') orgId: string) {
    return this.service.findAllByOrganization(orgId);
  }
}
