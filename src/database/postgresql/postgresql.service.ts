import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from 'src/common/config/config.service';

@Injectable()
export class PostgresqlService {
  private readonly pgPool: Pool;

  constructor(private readonly configService: ConfigService) {
    const pgConfig = this.configService.getDatabaseConfig();

    this.pgPool = new Pool({
      host: pgConfig.host,
      port: pgConfig.port,
      user: pgConfig.user,
      password: pgConfig.password,
      database: pgConfig.database,
    });
  }

  // PostgreSQL 查詢方法
  async query(sql: string, params: any[] = []): Promise<any> {
    const client = await this.pgPool.connect();

    try {
      const result = await client.query(sql, params);

      return result.rows;
    } catch (error) {
      console.log('query error:', error);
    } finally {
      client.release();
    }
  }
}
