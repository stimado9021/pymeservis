import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ReminderStatus } from '@pymes/shared';
import { SmsNotificationProvider } from './sms-notification.provider';

jest.mock('axios');
const mockPost = axios.post as jest.Mock;

function makeProvider(overrides: Record<string, string | undefined> = {}) {
  const values: Record<string, string> = {
    'app.twilio.accountSid': 'AC_ACCOUNT',
    'app.twilio.authToken': 'TOKEN',
    'app.twilio.from': '+12025551234',
    ...overrides,
  };
  const config = {
    get: jest.fn((k: string) => values[k] ?? undefined),
  } as unknown as ConfigService;
  return new SmsNotificationProvider(config);
}

describe('SmsNotificationProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('marca FAILED sin configuración', async () => {
    const p = makeProvider({ 'app.twilio.accountSid': undefined });
    const res = await p.send('3001234567', 'hola');
    expect(res.status).toBe(ReminderStatus.FAILED);
    expect(res.externalId).toBe('no-twilio-config');
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('envía por Twilio y devuelve SENT con externalId', async () => {
    mockPost.mockResolvedValue({ data: { sid: 'SM123' } });
    const p = makeProvider();

    const res = await p.send('3001234567', 'Paga tu factura');

    expect(res.status).toBe(ReminderStatus.SENT);
    expect(res.externalId).toBe('sms:SM123');
    const [url, body, opts] = mockPost.mock.calls[0];
    expect(url).toBe(
      'https://api.twilio.com/2010-04-01/Accounts/AC_ACCOUNT/Messages.json',
    );
    expect(body).toContain('From=%2B12025551234');
    expect(body).toContain('To=%2B573001234567');
    expect(body).toContain('Body=Paga+tu+factura');
    expect(opts.auth).toEqual({ username: 'AC_ACCOUNT', password: 'TOKEN' });
  });

  it('normaliza números colombianos a E.164', async () => {
    mockPost.mockResolvedValue({ data: { sid: 'SM1' } });
    const p = makeProvider();
    await p.send('3001234567', 'x');
    await p.send('573001234567', 'x');
    await p.send('+573001234567', 'x');
    const bodies = mockPost.mock.calls.map((c) => c[1]);
    expect(bodies.every((b) => b.includes('To=%2B573001234567'))).toBe(true);
  });

  it('marca FAILED cuando Twilio responde con error', async () => {
    mockPost.mockRejectedValue({
      message: 'Unauthorized',
      response: { data: { code: 20003 } },
    });
    const p = makeProvider();
    const res = await p.send('3001234567', 'x');
    expect(res.status).toBe(ReminderStatus.FAILED);
    expect(res.externalId).toBeUndefined();
  });
});
