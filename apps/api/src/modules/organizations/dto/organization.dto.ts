import { IsOptional, IsString, Length } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @Length(2, 150)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 20)
  nit?: string;

  @IsString()
  @Length(3, 80)
  slug: string;
}

export class UpdateWompiConfigDto {
  @IsString()
  wompiEnv: 'sandbox' | 'prod';

  @IsOptional()
  @IsString()
  wompiPublicKey?: string;

  @IsOptional()
  @IsString()
  wompiPrivateKey?: string;

  @IsOptional()
  @IsString()
  wompiEventsKey?: string;
}
