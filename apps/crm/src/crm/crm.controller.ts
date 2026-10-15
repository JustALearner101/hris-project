import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CrmService } from './crm.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { CreateDealDto, UpdateDealStageDto } from './dto/create-deal.dto';

@ApiTags('CRM')
@Controller('api/v1/crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Post('accounts')
  @ApiOperation({ summary: 'Create new company account' })
  createAccount(@Body() dto: CreateAccountDto) {
    return this.crmService.createAccount(dto);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Get all accounts' })
  getAccounts() {
    return this.crmService.getAccounts();
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get account details by ID' })
  getAccountById(@Param('id') id: string) {
    return this.crmService.getAccountById(id);
  }

  @Post('contacts')
  @ApiOperation({ summary: 'Create new contact under an account' })
  createContact(@Body() dto: CreateContactDto) {
    return this.crmService.createContact(dto);
  }

  @Get('contacts')
  @ApiOperation({ summary: 'Get all contacts' })
  getContacts() {
    return this.crmService.getContacts();
  }

  @Post('leads')
  @ApiOperation({ summary: 'Create new incoming lead' })
  createLead(@Body() dto: CreateLeadDto) {
    return this.crmService.createLead(dto);
  }

  @Get('leads')
  @ApiOperation({ summary: 'Get all leads' })
  getLeads() {
    return this.crmService.getLeads();
  }

  @Post('leads/:id/convert')
  @ApiOperation({ summary: 'Convert lead to account and contact' })
  convertLead(@Param('id') id: string) {
    return this.crmService.convertLead(id);
  }

  @Post('deals')
  @ApiOperation({ summary: 'Create new sales deal' })
  createDeal(@Body() dto: CreateDealDto) {
    return this.crmService.createDeal(dto);
  }

  @Get('deals')
  @ApiOperation({ summary: 'Get all deals' })
  getDeals() {
    return this.crmService.getDeals();
  }

  @Get('deals/pipeline')
  @ApiOperation({
    summary: 'Get deals grouped by pipeline stage for Kanban board',
  })
  getPipeline() {
    return this.crmService.getDealsGroupedByStage();
  }

  @Patch('deals/:id/stage')
  @ApiOperation({ summary: 'Update deal stage (e.g. drag & drop in Kanban)' })
  updateDealStage(@Param('id') id: string, @Body() dto: UpdateDealStageDto) {
    return this.crmService.updateDealStage(id, dto);
  }
}
