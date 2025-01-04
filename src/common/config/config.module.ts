import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import { validateEnv } from './env.validation';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true, // 讓 ConfigModule 在全局可用
      envFilePath: '.env', // 指定環境變數檔案路徑
      validate: validateEnv, // 加入驗證邏輯
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
