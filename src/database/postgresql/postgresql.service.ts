import { Injectable } from '@nestjs/common';
import { Pool, PoolClient, types } from 'pg';
import { ConfigService } from 'src/common/config/config.service';

@Injectable()
export class PostgresqlService {
  private readonly pgPool: Pool;

  constructor(private readonly configService: ConfigService) {
    const pgConfig = this.configService.getDatabaseConfig();

    // 部分回傳型態設定
    types.setTypeParser(types.builtins.FLOAT8, (value) => parseFloat(value));
    types.setTypeParser(types.builtins.NUMERIC, (value) => parseFloat(value));
    types.setTypeParser(types.builtins.TIMESTAMP, (value) => value);
    types.setTypeParser(types.builtins.DATE, (value) => value);
    types.setTypeParser(types.builtins.BOOL, (value) => value === 't');

    this.pgPool = new Pool({
      host: pgConfig.host,
      port: pgConfig.port,
      user: pgConfig.user,
      password: pgConfig.password,
      database: pgConfig.database
    });
  }

  // 單個SQL COMMAND
  async query(sql: string, params: any[]): Promise<any[]> {
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
    }
  }

  // rollback Transaction
  async rollbackTransaction(client: PoolClient): Promise<void> {
    try {
      await client.query('ROLLBACK');
    } catch (error) {
      console.log('rollback error:', error);
      throw error;
    }
  }
}
