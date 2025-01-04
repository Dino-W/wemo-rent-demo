import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from 'src/common/config/config.module';
import { RentModule } from 'src/rent/rent.module';
import { RedisModule } from 'src/database/redis/redis.module';
import { PostgreModule } from 'src/database/postgresql/postgresql.module';

@Module({
  imports: [ConfigModule, RentModule, RedisModule, PostgreModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
