import { Module } from '@nestjs/common';
import { PostgresqlService } from './postgresql.service';
import { ConfigModule } from 'src/common/config/config.module';

@Module({
  imports: [ConfigModule],
  providers: [PostgresqlService],
  exports: [PostgresqlService],
})
export class PostgreModule {}
