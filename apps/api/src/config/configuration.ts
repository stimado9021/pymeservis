import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  apiPrefix: process.env.API_PREFIX || 'api',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  db: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'pymes',
    password: process.env.DB_PASSWORD || 'pymes',
    database: process.env.DB_DATABASE || 'pymes_cobranza',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  wompi: {
    env: process.env.WOMPI_MODE || process.env.WOMPI_ENV || 'sandbox',
    sandboxPublicKey:
      process.env.WOMPI_PUBLIC_KEY || process.env.WOMPI_SANDBOX_PUBLIC_KEY,
    sandboxPrivateKey:
      process.env.WOMPI_PRIVATE_KEY || process.env.WOMPI_SANDBOX_PRIVATE_KEY,
    sandboxEventsKey:
      process.env.WOMPI_EVENTS_KEY || process.env.WOMPI_SANDBOX_EVENTS_KEY,
    prodPublicKey: process.env.WOMPI_PROD_PUBLIC_KEY,
    prodPrivateKey: process.env.WOMPI_PROD_PRIVATE_KEY,
    prodEventsKey: process.env.WOMPI_PROD_EVENTS_KEY,
    integrityKey: process.env.WOMPI_INTEGRITY_KEY,
    apiUrl: process.env.WOMPI_API_URL || 'https://sandbox.wompi.co/v1',
    webhookSecret: process.env.WOMPI_WEBHOOK_SECRET,
  },
  evolution: {
    url: process.env.EVOLUTION_API_URL,
    instance: process.env.EVOLUTION_INSTANCE,
    apiKey: process.env.EVOLUTION_API_KEY,
    webhookToken: process.env.EVOLUTION_WEBHOOK_TOKEN,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    from: process.env.TWILIO_FROM,
  },
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY,
  },
  superadmin: {
    email: process.env.SUPERADMIN_EMAIL,
    password: process.env.SUPERADMIN_PASSWORD,
  },
}));
