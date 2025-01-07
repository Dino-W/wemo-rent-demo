import { Injectable, BadRequestException } from '@nestjs/common';
import { RedisService } from 'src/database/redis/redis.service';
import { PostgresqlService } from 'src/database/postgresql/postgresql.service';
import { GetScooterLocationDto } from './dto/scooterLocation.dto';
import { ScooterDao } from './scooter.dao';
import { ScooterLocation } from './interface/getScooterLocation.interface';

@Injectable()
export class ScooterService {
  constructor(
    private readonly redisService: RedisService,
    private readonly postgresqlService: PostgresqlService,
    private readonly scooterDao: ScooterDao
  ) {}

  /**
   * @param query
   * @description 傳入當前位置的經緯度，查詢指定半徑內可租借的車輛（包含與目前相對距離）
   * @returns
   */
  async getScooterLocation(query: GetScooterLocationDto) {
    const { latitude, longitude } = query;
    const queryReult: ScooterLocation[] =
      await this.scooterDao.getScooterLocation(latitude, longitude);

    return queryReult;
  }
}
