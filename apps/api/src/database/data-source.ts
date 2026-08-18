import 'dotenv/config';
import { DataSource } from 'typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';
import appConfig from '../config/configuration';

export const getTypeOrmConfig = (): TypeOrmModuleOptions => {
  const cfg = appConfig();
  if (cfg.db.url) {
    return {
      type: 'postgres',
      url: cfg.db.url,
      ssl: true,
      entities: [path.join(__dirname, '..', 'modules', '**', '*.entity.{ts,js}')],
      migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
      synchronize: false,
      logging: cfg.nodeEnv === 'development',
    };
  }
  return {
    type: 'postgres',
    host: cfg.db.host,
    port: cfg.db.port,
    username: cfg.db.username,
    password: cfg.db.password,
    database: cfg.db.database,
    entities: [path.join(__dirname, '..', 'modules', '**', '*.entity.{ts,js}')],
    migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
    synchronize: false,
    logging: cfg.nodeEnv === 'development',
  };
};

export const dataSource = new DataSource(getTypeOrmConfig() as any);
