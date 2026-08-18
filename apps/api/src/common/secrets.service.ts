import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class SecretsService {
  private readonly key: Buffer | null;
  private readonly logger = new Logger(SecretsService.name);

  constructor(config: ConfigService) {
    const raw = config.get<string>('app.security.encryptionKey');
    if (!raw) {
      this.logger.warn(
        'ENCRYPTION_KEY no definida: las llaves Wompi se guardarán sin cifrar',
      );
      this.key = null;
    } else {
      this.key = crypto.createHash('sha256').update(raw).digest();
    }
  }

  enabled(): boolean {
    return this.key !== null;
  }

  encrypt(value: string): string {
    if (!this.key) return value;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const enc = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [
      'enc:v1',
      iv.toString('base64'),
      tag.toString('base64'),
      enc.toString('base64'),
    ].join(':');
  }

  decrypt(value: string): string {
    if (!this.key) return value;
    if (!value.startsWith('enc:v1:')) return value;
    try {
      const [, , ivB64, tagB64, dataB64] = value.split(':');
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        this.key,
        Buffer.from(ivB64, 'base64'),
      );
      decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
      return Buffer.concat([
        decipher.update(Buffer.from(dataB64, 'base64')),
        decipher.final(),
      ]).toString('utf8');
    } catch (err) {
      this.logger.error(`No se pudo descifrar un secreto: ${err}`);
      return value;
    }
  }
}