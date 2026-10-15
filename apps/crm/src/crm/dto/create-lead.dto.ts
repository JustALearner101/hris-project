import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadStatus } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateLeadDto {
  @ApiProperty({ example: 'Dewi' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Lestari' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'Nusantara Tech' })
  @IsString()
  @IsNotEmpty()
  company: string;

  @ApiProperty({ example: 'dewi@nusantara.example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '+62 811 2233 4455' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ enum: LeadStatus, default: LeadStatus.NEW })
  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @ApiPropertyOptional({ example: 250000000 })
  @IsNumber()
  @IsOptional()
  estimatedVal?: number;

  @ApiPropertyOptional({
    example: 'Interested in core HRIS replatforming and CRM integration.',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
