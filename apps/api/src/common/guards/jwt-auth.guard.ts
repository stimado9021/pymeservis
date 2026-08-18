import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { AuthenticatedUser, JwtPayload } from '@pymes/shared';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = authHeader.split(' ')[1];
    try {
      const secret = this.configService.get<string>('app.jwt.secret') as jwt.Secret;
      const payload = jwt.verify(token, secret) as unknown as JwtPayload;
      const user: AuthenticatedUser = {
        id: payload.sub,
        email: payload.email,
        organizationId: payload.organizationId,
        role: payload.role,
      };
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
