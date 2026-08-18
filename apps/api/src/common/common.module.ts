import { Module } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from './guards';
import { SecretsService } from './secrets.service';

@Module({
  providers: [JwtAuthGuard, RolesGuard, SecretsService],
  exports: [JwtAuthGuard, RolesGuard, SecretsService],
})
export class CommonModule {}
