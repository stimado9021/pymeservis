import { IsEmail, IsString, IsOptional, Length } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(2, 150)
  orgName: string;

  @IsString()
  @Length(3, 80)
  slug: string;

  @IsOptional()
  @IsString()
  @Length(0, 20)
  nit?: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 100)
  password: string;

  @IsString()
  @Length(2, 120)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 30)
  phone?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class RefreshDto {
  @IsString()
  refreshToken: string;
}
