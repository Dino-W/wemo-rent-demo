import { Module } from '@nestjs/common';
import { RentController } from './rent.controller';
import { RentService } from './rent.service';
import { RedisModule } from 'src/database/redis/redis.module';
import { PostgreModule } from 'src/database/postgresql/postgresql.module';
import { RentDao } from './rent.dao';

@Module({
  imports: [RedisModule, PostgreModule],
  controllers: [RentController],
  providers: [RentService, RentDao],
  exports: [RentService],
})
export class RentModule {}
