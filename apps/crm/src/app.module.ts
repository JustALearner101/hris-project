import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';
import { CrmModule } from './crm/crm.module';
import { PsaModule } from './psa/psa.module';

@Module({
  imports: [PrismaModule, EventsModule, CrmModule, PsaModule],
})
export class AppModule {}
