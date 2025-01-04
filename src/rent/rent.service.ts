import { Injectable, BadRequestException } from '@nestjs/common';
import { RedisService } from 'src/database/redis/redis.service';
import { PostgresqlService } from 'src/database/postgresql/postgresql.service';

@Injectable()
export class RentService {
  constructor(
    private readonly redisService: RedisService,
    private readonly postgresqlService: PostgresqlService,
  ) {}

  async returnScooter() {
    // 在rent找出目前使用者租借的車輛

    const sqlResult = await this.postgresqlService.query(
      `SELECT * FROM  wemo.users `,
    );

    await this.redisService.set('test', 'hello', 60);

    return sqlResult;
  }

  async rentScooter() {
    // Redis 鎖鍵
    // const userLockKey = `rent:lock:user:${userId}`;
    // const scooterLockKey = `rent:lock:scooter:${scooterId}`;
    // 使用SETNX
    // 嘗試加鎖
    // const userLock = await this.databaseService.set(userLockKey, 'locked', 10);
    // const scooterLock = await this.databaseService.set(scooterLockKey, 'locked', 10);
    // if (!userLock || !scooterLock) {
    //   throw new BadRequestException('Resource is locked by another operation.');
    // }

    try {
      // 檢查使用者是否已有未結束的租借
      const activeRentQuery = `
        SELECT * FROM rents WHERE user_id = $1 AND end_time IS NULL
      `;
      //   const activeRent = await this.databaseService.query(activeRentQuery, [userId]);
      //   if (activeRent.length > 0) {
      //     throw new BadRequestException('User already has an active rent.');
      //   }

      // 檢查車輛是否可用
      const scooterQuery = `
        SELECT * FROM scooters WHERE id = $1 AND status = 'available'
      `;
      //   const scooter = await this.databaseService.query(scooterQuery, [scooterId]);
      //   if (scooter.length === 0) {
      //     throw new BadRequestException('Scooter is not available.');
      //   }

      // 插入租借紀錄
      const insertRentQuery = `
        INSERT INTO rents (user_id, scooter_id, start_time)
        VALUES ($1, $2, NOW())
        RETURNING *
      `;
      //   const rent = await this.databaseService.query(insertRentQuery, [userId, scooterId]);

      // 更新車輛狀態
      const updateScooterQuery = `
        UPDATE scooters SET status = 'rented' WHERE id = $1
      `;
      //   await this.databaseService.query(updateScooterQuery, [scooterId]);
      return;
    } finally {
      // 解鎖
      //   await this.databaseService.del(userLockKey);
      //   await this.databaseService.del(scooterLockKey);
    }
  }
}
