import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@pymes/shared';
import { OrganizationService } from './organization.service';
import { UpdateWompiConfigDto } from './dto/organization.dto';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly service: OrganizationService) {}

  @Get('me')
  async me(@CurrentUser('organizationId') orgId: string) {
    return this.service.sanitize(await this.service.findById(orgId));
  }

  @Put('me/wompi')
  @Roles(UserRole.ADMIN)
  async updateWompi(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: UpdateWompiConfigDto,
  ) {
    const org = await this.service.updateWompiConfig(orgId, dto);
    return this.service.sanitize(org);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.service.sanitize(await this.service.findById(id));
  }
}
