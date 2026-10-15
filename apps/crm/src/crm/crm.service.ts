import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DealStage, LeadStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { CreateDealDto, UpdateDealStageDto } from './dto/create-deal.dto';

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  async createAccount(dto: CreateAccountDto) {
    return this.prisma.account.create({ data: dto });
  }

  async getAccounts() {
    return this.prisma.account.findMany({
      include: { contacts: true, deals: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAccountById(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: { contacts: true, deals: true },
    });
    if (!account) {
      throw new NotFoundException(`Account with ID '${id}' not found`);
    }
    return account;
  }

  async createContact(dto: CreateContactDto) {
    await this.getAccountById(dto.accountId);
    return this.prisma.contact.create({ data: dto });
  }

  async getContacts() {
    return this.prisma.contact.findMany({
      include: { account: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createLead(dto: CreateLeadDto) {
    return this.prisma.lead.create({ data: dto });
  }

  async getLeads() {
    return this.prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async convertLead(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      throw new NotFoundException(`Lead with ID '${id}' not found`);
    }

    const account = await this.prisma.account.create({
      data: { name: lead.company, phone: lead.phone },
    });

    const contact = await this.prisma.contact.create({
      data: {
        accountId: account.id,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
      },
    });

    await this.prisma.lead.update({
      where: { id },
      data: { status: LeadStatus.CONVERTED },
    });

    return { message: 'Lead converted successfully', account, contact };
  }

  async createDeal(dto: CreateDealDto) {
    await this.getAccountById(dto.accountId);
    const deal = await this.prisma.deal.create({
      data: {
        ...dto,
        closeDate: dto.closeDate ? new Date(dto.closeDate) : null,
      },
      include: { account: true },
    });

    if (deal.stage === DealStage.CLOSED_WON) {
      await this.emitClosedWonEvent(deal);
    }

    return deal;
  }

  async getDeals() {
    return this.prisma.deal.findMany({
      include: { account: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDealsGroupedByStage(): Promise<Record<string, any[]>> {
    const allDeals = await this.getDeals();
    const stages = Object.values(DealStage);
    const grouped: Record<string, any[]> = {};

    for (const s of stages) {
      grouped[s] = [];
    }

    for (const d of allDeals) {
      if (grouped[d.stage]) {
        grouped[d.stage].push(d);
      }
    }

    return grouped;
  }

  async updateDealStage(id: string, dto: UpdateDealStageDto) {
    const existing = await this.prisma.deal.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Deal with ID '${id}' not found`);
    }

    const previousStage = existing.stage;
    const updated = await this.prisma.deal.update({
      where: { id },
      data: { stage: dto.stage },
      include: { account: true },
    });

    this.logger.log(
      `Deal '${updated.title}' stage updated: ${previousStage} -> ${dto.stage}`,
    );

    if (
      dto.stage === DealStage.CLOSED_WON &&
      previousStage !== DealStage.CLOSED_WON
    ) {
      await this.emitClosedWonEvent(updated);
    }

    return updated;
  }

  private async emitClosedWonEvent(deal: any): Promise<void> {
    this.logger.log(
      `[PSA Trigger] Deal CLOSED_WON detected! Emitting event for: ${deal.title}`,
    );
    await this.eventBus.publish('deal.closed_won', {
      dealId: deal.id,
      accountId: deal.accountId,
      accountName: deal.account?.name,
      title: deal.title,
      value: deal.value,
      requiredSkills: deal.requiredSkills,
      estimatedHours: deal.estimatedHours,
      timestamp: new Date().toISOString(),
    });
  }
}
