import { Injectable } from '@nestjs/common';
import { PostgresqlService } from 'src/database/postgresql/postgresql.service';

@Injectable()
export class RentDao {
  constructor(private readonly postgresqlService: PostgresqlService) {}

  /**
   * 取得目前租借紀錄
   * @param scooterId
   * @return
   */
  async getRentInfo(scooterId: number): Promise<object> {
    const queryStr = /* sql */ `
          SELECT id 
          FROM wemo.rent 
          WHERE user_id = $1
            AND end_time IS NULL
          LIMIT 1
          ORDER BY id DESC    
       `;

    const result = await this.postgresqlService.query(queryStr, [scooterId]);

    return result;
  }

  /**
   * @param scooterId
   * @param status
   * @param connection
   * @description 更新機車租借狀態
   * @return
   */
  async updateScooterStatus(
    scooterId: number,
    status: string,
    connection,
  ): Promise<object> {
    const queryStr = /* sql */ `
          UPDATE wemo.scooter 
          SET status = $1
          WHERE id = $2   
           `;

    const result = await connection.query(queryStr, [status, scooterId]);

    return result;
  }

  /**
   * @param rentId rent table id
   * @param connection
   * @description 使用rent id 來更新該事件還車時間
   * @return
   */
  async updateRent(rentId: number, connection): Promise<object> {
    const queryStr = /* sql */ `
          UPDATE wemo.rent 
          SET end_time = CURRENT_TIMESTAMP
          WHERE id = $1   
               `;

    const result = await connection.query(queryStr, [rentId]);

    return result;
  }

  /**
   * @param userId
   * @param scooterId
   * @param connection
   * @description 寫入租借事件, 並回傳新Event的id
   * @return
   */
  async insertRentEvent(
    userId: number,
    scooterId: number,
    connection,
  ): Promise<any> {
    // const currentTime
    const queryStr = /* sql */ `
          INSERT INTO wemo.rent (
          	user_id,
	        scooter_id,
	        start_time
            ) 
          VALUES (
            $1,
            $2,
            CURRENT_TIMESTAMP
          )
          RETURNING id                 
               `;

    const result = await connection.query(queryStr, [userId, scooterId]);

    return result;
  }

  /**
   * @param status
   * @param latitude
   * @param longitude
   * @param scooterId
   * @param connection
   * @description 更新還車後機車資訊
   * @return
   */
  async returnScooterStatus(
    status: string,
    latitude: number,
    longitude: number,
    scooterId: number,
    connection,
  ): Promise<object> {
    const queryStr = /* sql */ `
              UPDATE wemo.scooter 
              SET status = $1,
                  latitude = $2,
                  longitude = $3                  
              WHERE id = $4   
               `;

    const result = await connection.query(queryStr, [
      status,
      latitude,
      longitude,
      scooterId,
    ]);

    return result;
  }
}
