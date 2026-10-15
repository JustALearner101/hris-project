import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateTimesheetDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  @IsUUID()
  @IsNotEmpty()
  allocationId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ example: '2026-11-04' })
  @IsDateString()
  @IsNotEmpty()
  workDate: string;

  @ApiProperty({ example: 8.0, description: 'Hours worked on project task' })
  @IsNumber()
  @Min(0.25)
  @Max(24)
  hoursLogged: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isBillable?: boolean;

  @ApiPropertyOptional({
    example: 'Designed database schema and set up Redis event bus',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
