import { SecretsService } from './secrets.service';
import { ConfigService } from '@nestjs/config';

describe('SecretsService', () => {
  it('cifra y descifra en round-trip', () => {
    const svc = new SecretsService({
      get: jest.fn(() => 'mi-clave-super-secreta'),
    } as unknown as ConfigService);
    expect(svc.enabled()).toBe(true);

    const secret = 'prv_test_zLUXPpwkhigmcw2nlVWtwoshsc5bdzNs';
    const encrypted = svc.encrypt(secret);
    expect(encrypted).not.toBe(secret);
    expect(encrypted).toContain('enc:v1:');
    expect(svc.decrypt(encrypted)).toBe(secret);
  });

  it('no cifra cuando no hay clave', () => {
    const svc = new SecretsService({
      get: jest.fn(() => undefined),
    } as unknown as ConfigService);
    expect(svc.enabled()).toBe(false);
    expect(svc.encrypt('abc')).toBe('abc');
    expect(svc.decrypt('abc')).toBe('abc');
  });

  it('devuelve valores legacy sin prefijo intactos', () => {
    const svc = new SecretsService({
      get: jest.fn(() => 'clave'),
    } as unknown as ConfigService);
    expect(svc.decrypt('prv_test_legacy')).toBe('prv_test_legacy');
  });
});