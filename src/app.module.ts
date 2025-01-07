import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from 'src/common/config/config.module';
import { RentModule } from 'src/rent/rent.module';
import { ScooterModule } from 'src/scooter/scooter.module';
import { RedisModule } from 'src/database/redis/redis.module';
import { PostgreModule } from 'src/database/postgresql/postgresql.module';
import { APP_FILTER } from '@nestjs/core';
import { GlobalHttpExceptionFilter } from 'src/common/filters/global-http-exception.filter';

@Module({
  imports: [
    ConfigModule,
    RentModule,
    ScooterModule,
    RedisModule,
    PostgreModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter
    }
  ]
})
export class AppModule {}
