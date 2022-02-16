import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { ConfigModule } from 'src/modules';

import { HealthController } from './health.controller';

@Module({
  imports: [ConfigModule, TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}