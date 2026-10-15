import { Module } from '@nestjs/common';
import { PsaService } from './psa.service';
import { PsaController } from './psa.controller';

@Module({
  controllers: [PsaController],
  providers: [PsaService],
  exports: [PsaService],
})
export class PsaModule {}
