import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService) {}

  get(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
  }

  getDatabaseConfig() {
    return {
      host: this.get('DATABASE_HOST'),
      port: parseInt(this.get('DATABASE_PORT'), 10),
      user: this.get('DATABASE_USER'),
      password: this.get('DATABASE_PASSWORD'),
      database: this.get('DATABASE_NAME'),
    };
  }

  getRedisConfig() {
    return {
      host: this.get('REDIS_HOST'),
      port: parseInt(this.get('REDIS_PORT'), 10),
    };
  }

  getAppPort() {
    return parseInt(this.get('APP_PORT'), 10);
  }
}
