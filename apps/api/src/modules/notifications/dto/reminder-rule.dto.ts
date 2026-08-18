import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import {
  NotificationChannel,
  ReminderTone,
  ReminderTrigger,
} from '@pymes/shared';

export class CreateReminderRuleDto {
  @IsEnum(ReminderTrigger)
  trigger: ReminderTrigger;

  @IsInt()
  offsetDays: number;

  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsOptional()
  @IsEnum(ReminderTone)
  tone?: ReminderTone;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  messageTemplate?: string;
}
