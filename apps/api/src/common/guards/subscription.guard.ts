import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../modules/organizations/organization.entity';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    @InjectRepository(Organization)
    private readonly orgs: Repository<Organization>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.organizationId) {
      throw new UnauthorizedException();
    }
    const org = await this.orgs.findOne({ where: { id: user.organizationId } });
    if (!org) {
      throw new UnauthorizedException();
    }
    const now = new Date();
    if (org.subscriptionExpiresAt && org.subscriptionExpiresAt > now) {
      return true;
    }
    throw new HttpException(
      'Tu suscripción o prueba gratuita ha expirado. Renueva tu plan para continuar.',
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}