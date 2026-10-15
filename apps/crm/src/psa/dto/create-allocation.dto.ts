import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateAllocationDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'Employee ID from HRIS',
  })
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ example: 'Lead Software Architect' })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({
    example: 20,
    description: 'Allocated hours per week (standard full-time is 40)',
  })
  @IsNumber()
  @Min(1)
  @Max(80)
  allocatedHours: number;

  @ApiPropertyOptional({
    example: 450000,
    description: 'Hourly billing rate to client (in IDR)',
  })
  @IsNumber()
  @IsOptional()
  billingRate?: number;

  @ApiPropertyOptional({
    example: 250000,
    description: 'Hourly internal cost rate from HRIS salary',
  })
  @IsNumber()
  @IsOptional()
  costRate?: number;

  @ApiPropertyOptional({ example: '2026-11-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2027-02-28T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
