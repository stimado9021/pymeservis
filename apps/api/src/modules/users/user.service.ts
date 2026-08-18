import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto } from './dto/user.dto';
import { UserRole } from '@pymes/shared';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async create(
    organizationId: string,
    dto: CreateUserDto,
    role: UserRole = UserRole.COLLABORATOR,
  ): Promise<User> {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.repo.create({
      organizationId,
      email: dto.email,
      passwordHash,
      name: dto.name,
      phone: dto.phone,
      role: dto.role ?? role,
    });
    return this.repo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findAllByOrganization(organizationId: string): Promise<User[]> {
    return this.repo.find({
      where: { organizationId },
      select: ['id', 'email', 'name', 'phone', 'role', 'createdAt'],
    });
  }
}
