import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from 'src/common/config/config.service';
import { number } from 'joi';

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

  // 一般的redis設置
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redisClient.set(key, value, 'EX', ttl);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async setex(key: string, value: any, ttl: number): Promise<void> {
    try {
      await this.redisClient.setex(key, ttl, value); // 使用 setex 設置過期時間
    } catch (error) {
      console.error(`Set key "${key}" with TTL failed:`, error);
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

  /**
   將資料塞入Hash Data
   * @param key string
   * @param value string
   * @param TTL  number
   */
  async setHashData(key: string, field: any, value: any, TTL?: number) {
    try {
      await this.redisClient.hmset(key, field, JSON.stringify(value));
      if (TTL) {
        await this.redisClient.expire(key, TTL);
      }
    } catch (error) {
      // throw new CustomerException(configError._120001, HttpStatus.OK);
    }
  }

  // 取得Hash data內容
  async getHash(key: string, field: any): Promise<any> {
    const result = await this.redisClient.hget(key, field);
    return result ? JSON.parse(result) : null;
  }

  /**
   * 更新Redis Hash data的特定字段
   * @param key string
   * @param field string 字段名
   * @param value string 新的值
   * @param ttl number
   */
  async updateHashField(
    key: string,
    field: string,
    value: string,
    ttl?: number,
  ) {
    try {
      await this.redisClient.hset(key, field, value);
      if (ttl) {
        await this.redisClient.expire(key, ttl);
      }
    } catch (error) {
      // throw new CustomerException(configError._120001, HttpStatus.OK);
    }
  }

  /**
   * 利用Key值配合Hash內的字段直接搜尋其Value
   * @param key string redis儲存的key值
   * @param field string 要獲取的字段名
   * @return
   */
  async getHashField(key: string, field: string) {
    try {
      let result;

      const targetData = await this.redisClient.hmget(key, field);
      result = targetData[0];

      if (!result) {
        result = JSON.parse(null);
      }

      return result;
    } catch (error) {
      // throw new CustomerException(configError._120001, HttpStatus.OK);
    }
  }

  /**
   * @description 移除Hash裡面的Field
   */
  async deleteHashField(key: string, field: any): Promise<number> {
    await this.redisClient.hdel(key, field);
    return;
  }
}
