import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/user.entity';
import { UserService } from '../users/user.service';
import { OrganizationService } from '../organizations/organization.service';
import { RefreshToken } from './refresh-token.entity';
import { RegisterDto, LoginDto, RefreshDto } from './dto/auth.dto';
import {
  AuthenticatedUser,
  JwtPayload,
  UserRole,
} from '@pymes/shared';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly users: UserService,
    private readonly organizations: OrganizationService,
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
  ) {}

  async register(dto: RegisterDto): Promise<TokenPair & { user: AuthenticatedUser }> {
    const org = await this.organizations.create({
      name: dto.orgName,
      slug: dto.slug,
      nit: dto.nit,
    });
    const user = await this.users.create(org.id, {
      email: dto.email,
      password: dto.password,
      name: dto.name,
      phone: dto.phone,
    }, UserRole.ADMIN);
    const authUser = this.toAuthUser(user);
    const tokens = await this.issueTokens(authUser);
    return { ...tokens, user: authUser };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(dto: LoginDto): Promise<TokenPair & { user: AuthenticatedUser }> {
    const user = await this.validateUser(dto.email, dto.password);
    const authUser = this.toAuthUser(user);
    const tokens = await this.issueTokens(authUser);
    return { ...tokens, user: authUser };
  }

  async superLogin(
    email: string,
    password: string,
  ): Promise<TokenPair & { user: AuthenticatedUser }> {
    const user = await this.users.findByEmail(email);
    if (!user || user.role !== UserRole.SUPERADMIN) {
      throw new UnauthorizedException('Invalid superadmin credentials');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid superadmin credentials');
    const authUser = this.toAuthUser(user);
    const tokens = await this.issueTokens(authUser);
    return { ...tokens, user: authUser };
  }

  async refresh(dto: RefreshDto): Promise<TokenPair> {
    const tokenHash = this.hash(dto.refreshToken);
    const record = await this.refreshRepo.findOne({ where: { tokenHash } });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.users.findById(record.userId);
    await this.refreshRepo.update(record.id, { revokedAt: new Date() });
    return this.issueTokens(this.toAuthUser(user));
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hash(refreshToken);
    await this.refreshRepo.update(
      { tokenHash },
      { revokedAt: new Date() },
    );
  }

  private async issueTokens(user: AuthenticatedUser): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('app.jwt.secret')!,
      expiresIn: this.configService.get<string>('app.jwt.accessExpiresIn')!,
    });
    const plainRefresh = crypto.randomBytes(48).toString('hex');
    const refreshRecord = this.refreshRepo.create({
      userId: user.id,
      tokenHash: this.hash(plainRefresh),
      expiresAt: new Date(
        Date.now() +
          this.parseExpiry(
            this.configService.get<string>('app.jwt.refreshExpiresIn')!,
          ),
      ),
    });
    await this.refreshRepo.save(refreshRecord);
    return { accessToken, refreshToken: plainRefresh };
  }

  private toAuthUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    };
  }

  private hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  private parseExpiry(value: string): number {
    const unit = value.slice(-1);
    const amount = parseInt(value.slice(0, -1), 10);
    switch (unit) {
      case 'd':
        return amount * 86400000;
      case 'h':
        return amount * 3600000;
      case 'm':
        return amount * 60000;
      default:
        return amount * 1000;
    }
  }
}
