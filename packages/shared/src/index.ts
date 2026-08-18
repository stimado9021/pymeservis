export enum UserRole {
  ADMIN = 'admin',
  COLLABORATOR = 'collaborator',
  SUPERADMIN = 'superadmin',
}

export enum InvoiceStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

export enum DocumentType {
  CC = 'CC',
  NIT = 'NIT',
  CE = 'CE',
  OTHER = 'OTHER',
}

export enum NotificationChannel {
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
  EMAIL = 'email',
  CONSOLE = 'console',
}

export enum ReminderTrigger {
  DAYS_BEFORE = 'days_before',
  ON_DUE = 'on_due',
  DAYS_AFTER = 'days_after',
}

export enum ReminderTone {
  FRIENDLY = 'friendly',
  NEUTRAL = 'neutral',
  FIRM = 'firm',
}

export enum ReminderStatus {
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DECLINED = 'declined',
  ERROR = 'error',
}

export enum WompiEnv {
  SANDBOX = 'sandbox',
  PROD = 'prod',
}

export interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
  role: UserRole;
}

export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'year';
  tagline: string;
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 49900,
    period: 'month',
    tagline: 'Para pymes que empiezan a ordenar su cartera.',
    features: [
      'Hasta 50 facturas al mes',
      'Links de pago Wompi',
      'Recordatorios por SMS y WhatsApp',
      'Reporte de cartera básico',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99900,
    period: 'month',
    tagline: 'Para pymes que cobran a diario y quieren recuperar rápido.',
    features: [
      'Hasta 500 facturas al mes',
      'Todo lo de Básico',
      'Recordatorios ilimitados y personalizados',
      'Gráficos y proyección de flujo de caja',
      'Soporte prioritario',
    ],
  },
  {
    id: 'enterprise',
    name: 'Empresarial',
    price: 249900,
    period: 'month',
    tagline: 'Para equipos que gestionan cartera de varias personas.',
    features: [
      'Facturas ilimitadas',
      'Todo lo de Pro',
      'Multi-usuario con roles',
      'Dashboard de supervisión por equipo',
      'Onboarding asistido',
    ],
  },
];
