import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from 'src/database/redis/redis.service';
import { PostgresqlService } from 'src/database/postgresql/postgresql.service';
import { RentDao } from './rent.dao';
import { SCOOTER_STATUS } from './enum/scooter.status.enum';
import { RentScooterDto } from './dto/rentScooter.dto';
import { ReturnScooterDto } from './dto/returnScooter.dto';
import { ERROR_MESSAGES } from 'src/common/constant/error-messages.constant';
import { getRentInfoDto } from './dto/getScooterInfo.dto';

@Injectable()
export class RentService {
  constructor(
    private readonly redisService: RedisService,
    private readonly postgresqlService: PostgresqlService,
    private readonly rentDao: RentDao
  ) {}

  /**
   * @param query
   * @description 取得使用者租借紀錄
   * @returns
   */
  async getRentInfo(query: getRentInfoDto) {
    const { userId } = query;
    const queryResult = await this.rentDao.getRentInfo(userId);

    return queryResult;
  }

  /**
   * @param req HTTP Request Body
   * @description 租用機車
   */
  async rentScooter(req: RentScooterDto) {
    const { userId, scooterId } = req;
    const scooterLockKey = `rent:lock:scooter:${scooterId}`;
    // 使用NX當參數設置Redis鎖，如果 scooterLockKey已存在，則不設置並返回 false
    const lockResult = await this.redisService.setnx(
      scooterLockKey,
      userId,
      30
    );

    if (!lockResult) {
      throw new HttpException(
        ERROR_MESSAGES.SCOOTER_STATUS_RENTING,
        HttpStatus.BAD_REQUEST
      );
    }
    const client = await this.postgresqlService.startTransaction();
    try {
      // 再次確保車子沒有被租用
      const scooterStatus = await this.rentDao.getScooterInfo(
        scooterId,
        client
      );

      if (scooterStatus.status !== SCOOTER_STATUS.AVAILABLE) {
        throw new HttpException(
          ERROR_MESSAGES.SCOOTER_STATUS_RENTED,
          HttpStatus.BAD_REQUEST
        );
      }

      // 寫入新的一筆資料進rent表
      const insertResult = await this.rentDao.insertRentEvent(
        userId,
        scooterId,
        client
      );

      // 更新Scooter狀態為租用
      const rentStatus = SCOOTER_STATUS.RENTED;
      await this.rentDao.updateScooterStatus(scooterId, rentStatus, client);

      // 將租借事件 ID 存入 Redis hash
      const rentEventKey = `renting:scooters`;
      const rentEventId = insertResult.rows[0].id;
      await this.redisService.setHashData(rentEventKey, scooterId, rentEventId);

      await this.postgresqlService.commitTransaction(client);

      return;
    } catch (error) {
      console.log('catch rentScooter error:', error);
      if (client) {
        await this.postgresqlService.rollbackTransaction(client);
      }

      throw error;
    } finally {
      if (client) {
        client.release(); // 確保只有這裡釋放連線
      }
      // 解鎖
      await this.redisService.del(scooterLockKey, userId);
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
      scooterId
    );
    try {
      // 確認車子是不是還在租用狀態
      const checkResult = await this.rentDao.getScooterInfo(scooterId);

      if (checkResult?.status !== SCOOTER_STATUS.RENTED) {
        throw new HttpException(
          ERROR_MESSAGES.SCOOTER_STATUS_ERROR,
          HttpStatus.BAD_REQUEST
        );
      }
      // TODO:確認車子是不是在還車範圍內

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
        client
      );

      await this.postgresqlService.commitTransaction(client);

      // 移除redis
      await this.redisService.deleteHashField(rentEventKey, scooterId);
      return;
    } catch (error) {
      console.log('catch returnScooter error:', error);
      throw error;
    }
  }
}
