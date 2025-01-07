import { Module } from '@nestjs/common';
import { ScooterController } from './scooter.controller';
import { ScooterService } from './scooter.service';
import { RedisModule } from 'src/database/redis/redis.module';
import { PostgreModule } from 'src/database/postgresql/postgresql.module';
import { ScooterDao } from './scooter.dao';

@Module({
  imports: [RedisModule, PostgreModule],
  controllers: [ScooterController],
  providers: [ScooterService, ScooterDao],
  exports: [ScooterService]
})
export class ScooterModule {}
