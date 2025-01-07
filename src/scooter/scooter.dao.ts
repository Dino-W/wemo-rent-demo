import { Injectable } from '@nestjs/common';
import { PostgresqlService } from 'src/database/postgresql/postgresql.service';
import { SCOOTER_STATUS } from 'src/rent/enum/scooter.status.enum';
import { ScooterLocation } from 'src/scooter/interface/getScooterLocation.interface';

@Injectable()
export class ScooterDao {
  constructor(private readonly postgresqlService: PostgresqlService) {}

  /**
   * 取得目前租借紀錄
   * @param scooterId
   * @return
   */
  async getScooterLocation(
    latitude: number,
    longitude: number
  ): Promise<ScooterLocation[]> {
    const scooterStatus = SCOOTER_STATUS.AVAILABLE;
    const queryStr = /* sql */ `
            SELECT id AS id, 
                   status AS status, 
                   latitude AS latitude, 
                   longitude AS longitude,
                   ST_DistanceSphere(ST_MakePoint(longitude, latitude), ST_MakePoint($1, $2)) AS distance
            FROM wemo.scooter
            WHERE status = $3
              AND ST_DistanceSphere(ST_MakePoint(longitude, latitude), ST_MakePoint($1, $2)) <= 50000000;
           `;

    const result = await this.postgresqlService.query(queryStr, [
      latitude,
      longitude,
      scooterStatus
    ]);

    const scooterLocations: ScooterLocation[] = result.map((row) => ({
      id: row.id,
      status: row.status,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      distance: parseFloat(row.distance)
    }));

    return scooterLocations;
  }
}
