import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from 'src/common/config/config.service';

@Injectable()
export class RedisService {
  private readonly redisClient: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisConfig = this.configService.getRedisConfig();

    this.redisClient = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
    });
  }

  // Redis 設定鍵值
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redisClient.set(key, value, 'EX', ttl);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  // Redis 取得鍵值
  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  // Redis 刪除鍵值
  async del(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  async tryLock(
    key: string,
    ttl: number, // 過期時間（秒）
  ): Promise<string | null> {
    const lockId = uuidv4(); // 生成唯一標識
    const result = await (this.redisClient as any).set(key, lockId, {
      NX: true,
      EX: ttl,
    });

    if (result === 'OK') {
      return lockId; // 獲取鎖成功，返回 lockId
    }
    return null; // 獲取鎖失敗
  }

  // Redis 釋放鎖
  async releaseLock(key: string, lockId: string): Promise<boolean> {
    const currentValue = await this.redisClient.get(key);

    if (currentValue === lockId) {
      // 確保只有持有鎖的請求才能釋放
      await this.redisClient.del(key);
      return true;
    }
    return false; // 未持有鎖，無法釋放
  }
}
