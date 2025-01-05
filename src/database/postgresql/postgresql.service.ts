import { Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
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

  // 單個SQL COMMAND
  async query(sql: string, params: any[] = []): Promise<object> {
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

  // 開始 Transaction
  async startTransaction(): Promise<PoolClient> {
    try {
      const client = await this.pgPool.connect();
      await client.query('BEGIN');
      return client;
    } catch (error) {
      console.log('connect error:', error);
    }
  }

  // 提交 Transaction
  async commitTransaction(client: PoolClient): Promise<void> {
    try {
      await client.query('COMMIT');
    } catch (error) {
      console.log('commit error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // rollback Transaction
  async rollbackTransaction(client: PoolClient): Promise<void> {
    try {
      await client.query('ROLLBACK');
    } catch (error) {
      console.log('rollback error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}
