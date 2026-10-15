import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DealStage } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateDealDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  @IsUUID()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty({ example: 'Enterprise HRIS Replatforming' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 450000000,
    description: 'Deal value in IDR or target currency',
  })
  @IsNumber()
  @IsNotEmpty()
  value: number;

  @ApiPropertyOptional({ enum: DealStage, default: DealStage.PROSPECTING })
  @IsEnum(DealStage)
  @IsOptional()
  stage?: DealStage;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  closeDate?: string;

  @ApiPropertyOptional({
    example: 60,
    description: 'Estimated close probability percentage (0-100)',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  probability?: number;

  @ApiPropertyOptional({
    example: ['ASP.NET Core', 'Next.js', 'PostgreSQL', 'Microservices'],
    description: 'Skills and technical requirements for project staffing',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredSkills?: string[];

  @ApiPropertyOptional({
    example: 640,
    description: 'Total estimated billable labor hours',
  })
  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @ApiPropertyOptional({ example: 'Q4 flagship enterprise deal' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateDealStageDto {
  @ApiProperty({ enum: DealStage, example: DealStage.CLOSED_WON })
  @IsEnum(DealStage)
  @IsNotEmpty()
  stage: DealStage;
}
