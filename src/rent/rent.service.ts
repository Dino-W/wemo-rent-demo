import { Injectable, BadRequestException } from '@nestjs/common';
import { RedisService } from 'src/database/redis/redis.service';
import { PostgresqlService } from 'src/database/postgresql/postgresql.service';
import { RentDao } from './rent.dao';
import { SCOOTER_STATUS } from './enum/scooter.status.enum';
import { RentScooterDto } from './dto/rentScooter.dto';
import { ReturnScooterDto } from './dto/returnScooter.dto';

@Injectable()
export class RentService {
  constructor(
    private readonly redisService: RedisService,
    private readonly postgresqlService: PostgresqlService,
    private readonly rentDao: RentDao,
  ) {}

  /**
   * @param req HTTP Request Body
   * @description 租用機車
   */
  async rentScooter(req: RentScooterDto) {
    const { userId, scooterId } = req;
    const scooterLockKey = `rent:lock:scooter:${scooterId}`;
    try {
      // 使用NX當參數設置Redis鎖，如果 scooterLockKey已存在，則不設置並返回 false
      const lockResult = await this.redisService.setnx(
        scooterLockKey,
        userId,
        30,
      );

      if (!lockResult) {
        console.log('this scooter is renting');
        throw new Error('this scooter is renting');
      }

      const client = await this.postgresqlService.startTransaction();
      // 再次確保車子沒有被租用
      const scooterStatus = await this.rentDao.getScooterInfo(
        scooterId,
        client,
      );

      if (scooterStatus.status !== SCOOTER_STATUS.AVAILABLE) {
        console.log('this scooter has rented');
        throw new Error('this scooter has rented');
      }

      // 寫入新的一筆資料進rent表
      const insertResult = await this.rentDao.insertRentEvent(
        userId,
        scooterId,
        client,
      );

      // 更新Scooter狀態為租用
      const rentStatus = SCOOTER_STATUS.RENTED;
      await this.rentDao.updateScooterStatus(scooterId, rentStatus, client);

      await this.postgresqlService.commitTransaction(client);

      // 將租借事件 ID 存入 Redis hash
      const rentEventKey = `renting:scooters`;
      const rentEventId = insertResult.rows[0].id;
      await this.redisService.setHashData(rentEventKey, scooterId, rentEventId);

      return;
    } finally {
      // catch TODO:
      // 解鎖
      await this.redisService.del(scooterLockKey);
    }
  }

  /**
   * @param req HTTP Request Body
   * @description 還車
   */
  async returnScooter(req: ReturnScooterDto) {
    const { scooterId, latitude, longitude } = req;

    const rentEventKey = `renting:scooters`;
    // 在redis找出目前使用者租借的車輛事件
    const rentingEventId = await this.redisService.getHash(
      rentEventKey,
      scooterId,
    );

    const client = await this.postgresqlService.startTransaction();

    // 更新Rent還車時間
    await this.rentDao.updateRent(rentingEventId, client);

    // 更新Scooter狀態 & 座標
    const scooterStatus = SCOOTER_STATUS.AVAILABLE;
    await this.rentDao.returnScooterStatus(
      scooterStatus,
      latitude,
      longitude,
      scooterId,
      client,
    );

    await this.postgresqlService.commitTransaction(client);

    // 移除redis
    await this.redisService.deleteHashField(rentEventKey, scooterId);
    return;
  }
}
