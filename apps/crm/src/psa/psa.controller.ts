import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PsaService } from './psa.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';

@ApiTags('PSA (Professional Services Automation)')
@Controller('api/v1/psa')
export class PsaController {
  constructor(private readonly psaService: PsaService) {}

  @Post('projects')
  @ApiOperation({ summary: 'Create new project manually' })
  createProject(@Body() dto: CreateProjectDto) {
    return this.psaService.createProject(dto);
  }

  @Get('projects')
  @ApiOperation({ summary: 'Get all projects with staffing allocations' })
  getProjects() {
    return this.psaService.getProjects();
  }

  @Get('projects/:id')
  @ApiOperation({ summary: 'Get project details with profitability analytics' })
  getProjectById(@Param('id') id: string) {
    return this.psaService.getProjectById(id);
  }

  @Post('allocations')
  @ApiOperation({
    summary: 'Allocate employee to project with billing/cost rates',
  })
  createAllocation(@Body() dto: CreateAllocationDto) {
    return this.psaService.createAllocation(dto);
  }

  @Get('allocations')
  @ApiOperation({ summary: 'Get all active allocations' })
  getAllocations() {
    return this.psaService.getAllocations();
  }

  @Get('staffing/workload-heatmap')
  @ApiOperation({
    summary: 'Get employee workload utilization heatmap (available vs overloaded)',
  })
  getWorkloadHeatmap() {
    return this.psaService.getWorkloadHeatmap();
  }

  @Post('timesheets')
  @ApiOperation({ summary: 'Log daily hours worked on project' })
  createTimesheet(@Body() dto: CreateTimesheetDto) {
    return this.psaService.createTimesheet(dto);
  }

  @Get('timesheets')
  @ApiOperation({ summary: 'Get logged timesheets' })
  getTimesheets() {
    return this.psaService.getTimesheets();
  }
}
