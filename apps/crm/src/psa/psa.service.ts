import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';

@Injectable()
export class PsaService implements OnModuleInit {
  private readonly logger = new Logger(PsaService.name);

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    this.subscribeToDealEvents();
  }

  private subscribeToDealEvents(): void {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      const subscriber = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });
      subscriber
        .connect()
        .then(async () => {
          await subscriber.subscribe('deal.closed_won');
          this.logger.log('Subscribed to "deal.closed_won" event channel.');
          subscriber.on('message', async (channel: string, message: string) => {
            if (channel === 'deal.closed_won') {
              try {
                const eventData = JSON.parse(message);
                this.logger.log(
                  `Received deal.closed_won event: ${eventData.title}`,
                );
                await this.handleDealClosedWon(eventData);
              } catch (err) {
                this.logger.error(
                  'Error handling deal.closed_won event:',
                  err as Error,
                );
              }
            }
          });
        })
        .catch((err: Error) => {
          this.logger.warn(
            `Redis Subscriber unavailable (${err.message}). Event listener skipped in local mode.`,
          );
        });
    } catch (err) {
      this.logger.warn(
        `Could not initialize Redis subscriber: ${(err as Error).message}`,
      );
    }
  }

  private async handleDealClosedWon(eventData: any): Promise<void> {
    const existing = await this.prisma.project.findFirst({
      where: { dealId: eventData.dealId },
    });
    if (existing) {
      this.logger.log(
        `Project already exists for Deal ID: ${eventData.dealId}`,
      );
      return;
    }

    const project = await this.prisma.project.create({
      data: {
        dealId: eventData.dealId,
        accountId: eventData.accountId,
        name: `Project: ${eventData.title}`,
        description: `Auto-spawned from CRM Deal '${eventData.title}'. Required skills: ${
          Array.isArray(eventData.requiredSkills)
            ? eventData.requiredSkills.join(', ')
            : 'None'
        }`,
        status: ProjectStatus.PLANNING,
        budget: eventData.value || 0,
      },
    });

    this.logger.log(
      `[PSA Automated Staffing] Successfully created Project ID: ${project.id} for Deal: ${eventData.title}`,
    );
  }

  async createProject(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async getProjects() {
    return this.prisma.project.findMany({
      include: { allocations: { include: { timesheets: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProjectById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { allocations: { include: { timesheets: true } } },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID '${id}' not found`);
    }

    let totalBillableAmount = 0;
    let totalLaborCost = 0;
    let totalHoursLogged = 0;

    for (const alloc of project.allocations) {
      for (const ts of alloc.timesheets) {
        const hrs = Number(ts.hoursLogged);
        totalHoursLogged += hrs;
        if (ts.isBillable) {
          totalBillableAmount += hrs * Number(alloc.billingRate);
        }
        totalLaborCost += hrs * Number(alloc.costRate);
      }
    }

    const grossMargin = totalBillableAmount - totalLaborCost;
    const grossMarginPercent =
      totalBillableAmount > 0
        ? ((grossMargin / totalBillableAmount) * 100).toFixed(1)
        : '0.0';

    return {
      ...project,
      financials: {
        totalHoursLogged,
        totalBillableAmount,
        totalLaborCost,
        grossMargin,
        grossMarginPercent: Number(grossMarginPercent),
      },
    };
  }

  async createAllocation(dto: CreateAllocationDto) {
    await this.getProjectById(dto.projectId);
    return this.prisma.allocation.create({
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
      include: { project: true },
    });
  }

  async getAllocations() {
    return this.prisma.allocation.findMany({
      include: { project: true, timesheets: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWorkloadHeatmap() {
    const activeAllocations = await this.prisma.allocation.findMany({
      where: {
        project: {
          status: { in: [ProjectStatus.PLANNING, ProjectStatus.ACTIVE] },
        },
      },
      include: { project: true },
    });

    const employeeWorkload: Record<string, any> = {};

    for (const alloc of activeAllocations) {
      if (!employeeWorkload[alloc.employeeId]) {
        employeeWorkload[alloc.employeeId] = {
          employeeId: alloc.employeeId,
          totalAllocatedHours: 0,
          utilizationPercentage: 0,
          status: 'AVAILABLE',
          projects: [],
        };
      }
      employeeWorkload[alloc.employeeId].totalAllocatedHours +=
        alloc.allocatedHours;
      employeeWorkload[alloc.employeeId].projects.push({
        projectName: alloc.project.name,
        role: alloc.role,
        hours: alloc.allocatedHours,
      });
    }

    for (const empId in employeeWorkload) {
      const totalHrs = employeeWorkload[empId].totalAllocatedHours;
      const pct = Math.round((totalHrs / 40) * 100);
      employeeWorkload[empId].utilizationPercentage = pct;
      if (pct > 100) {
        employeeWorkload[empId].status = 'OVERALLOCATED';
      } else if (pct >= 80) {
        employeeWorkload[empId].status = 'OPTIMAL';
      } else {
        employeeWorkload[empId].status = 'AVAILABLE';
      }
    }

    return Object.values(employeeWorkload);
  }

  async createTimesheet(dto: CreateTimesheetDto) {
    const alloc = await this.prisma.allocation.findUnique({
      where: { id: dto.allocationId },
    });
    if (!alloc) {
      throw new NotFoundException(
        `Allocation with ID '${dto.allocationId}' not found`,
      );
    }
    return this.prisma.timesheet.create({
      data: {
        ...dto,
        workDate: new Date(dto.workDate),
      },
    });
  }

  async getTimesheets() {
    return this.prisma.timesheet.findMany({
      include: { allocation: { include: { project: true } } },
      orderBy: { workDate: 'desc' },
    });
  }
}
