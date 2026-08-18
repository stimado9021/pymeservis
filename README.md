# Pymes Cobranza — SaaS de cobranza y flujo de caja

SaaS para pymes colombianas que venden a crédito y necesitan automatizar el
cobro de cartera vencida (recordatorios por WhatsApp/SMS + pagos con Wompi).

## Stack

- **Backend**: NestJS + TypeORM + PostgreSQL
- **Cola**: BullMQ + Redis
- **Frontend**: Next.js (App Router) + Tailwind, instalable como PWA
- **Pagos**: Wompi (sandbox)
- **Auth**: JWT multi-tenant con refresh tokens

## Estructura (monorepo pnpm + Turborepo)

```
apps/api   -> NestJS (backend, puerto 3001)
apps/web   -> Next.js (frontend, puerto 3000)
packages/shared -> enums y tipos compartidos
```

## Puesta en marcha

```bash
# 1. Levantar Postgres + Redis
docker compose up -d

# 2. Instalar dependencias (construye packages/shared primero)
pnpm install
pnpm --filter @pymes/shared build

# 3. Variables de entorno
cp .env.example apps/api/.env   # ajusta JWT_SECRET, WOMPI_* etc.

# 4. Migración inicial de la BD
pnpm --filter @pymes/api migration:run

# 5. Correr en dev
pnpm dev
```

- API: http://localhost:3001/api  ·  docs Swagger: http://localhost:3001/docs
- Web: http://localhost:3000

## Notas de seguridad

- Las llaves de Wompi se guardan por organización; en producción encripta las
  columnas `wompiPrivateKey`/`wompiEventsKey` (p.ej. con `@nestjs/config` + KMS)
  o usa un secret manager. No se usa `synchronize: true` en producción.
- El webhook de Wompi verifica la firma HMAC con `WOMPI_WEBHOOK_SECRET` /
  `wompiEventsKey` de la organización.

## Integración de mensajería

`NotificationProvider` es la interfaz desacoplada. Proveedores implementados:

- **WhatsApp**: Evolution API (`EVOLUTION_API_URL`, `EVOLUTION_INSTANCE`, `EVOLUTION_API_KEY`).
- **Email**: Resend (`RESEND_API_KEY`, `EMAIL_FROM`).
- **SMS**: stub pendiente (falla a `failed` sin crash).
- **Console**: fallback para depuración.

`NotificationDispatcher.getProvider()` resuelve el proveedor según el canal
(`whatsapp` | `email` | `sms`). Un job recurrente diario (`daily-maintenance`)
recalcula estados vencidos y genera recordatorios sin duplicar los ya agendados.

## Páginas públicas

- `GET /api/public/invoices/:id` — resumen público de factura (pago).
- `POST /api/public/invoices/:id/payment-link` — genera link de pago Wompi.
- `GET /api/public/payments/:reference` — resultado del pago.
- Web: `/pagos/:invoiceId` (pagar) y `/pagos/resultado?ref=...` (confirmación).

## Flujo de pagos Wompi (sandbox)

1. `POST /payments/invoices/:id/payment-link` crea una `PaymentTransaction`
   (estado `pending`) y devuelve la URL del checkout de Wompi.
2. Wompi envía el evento al `POST /payments/wompi/webhook`, que verifica la
   firma (`signature`/`Signature`) y, si está `APPROVED`, aplica el pago
   (parcial o total) a la factura de forma idempotente y guarda
   `wompiTransactionId`.
