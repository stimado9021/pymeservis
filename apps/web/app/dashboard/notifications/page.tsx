'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import {
  NotificationChannel,
  ReminderTone,
  ReminderTrigger,
} from '@pymes/shared';

interface Rule {
  id: string;
  trigger: ReminderTrigger;
  offsetDays: number;
  channel: NotificationChannel;
  tone: ReminderTone;
  enabled: boolean;
  messageTemplate?: string;
}

interface Reminder {
  id: string;
  channel: NotificationChannel;
  status: string;
  scheduledAt: string;
  messageContent: string;
}

const triggerLabels: Record<ReminderTrigger, string> = {
  [ReminderTrigger.DAYS_BEFORE]: 'Días antes',
  [ReminderTrigger.ON_DUE]: 'Día del vencimiento',
  [ReminderTrigger.DAYS_AFTER]: 'Días después',
};

const channelLabels: Record<NotificationChannel, string> = {
  [NotificationChannel.WHATSAPP]: 'WhatsApp',
  [NotificationChannel.SMS]: 'SMS',
  [NotificationChannel.EMAIL]: 'Email',
  [NotificationChannel.CONSOLE]: 'Consola',
};

const toneLabels: Record<ReminderTone, string> = {
  [ReminderTone.FRIENDLY]: 'Amable',
  [ReminderTone.NEUTRAL]: 'Neutral',
  [ReminderTone.FIRM]: 'Firme',
};

export default function NotificationsPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    trigger: ReminderTrigger.DAYS_BEFORE,
    offsetDays: 3,
    channel: NotificationChannel.WHATSAPP,
    tone: ReminderTone.FRIENDLY,
  });

  async function load() {
    try {
      const [r, rem] = await Promise.all([
        apiFetch<Rule[]>('/notifications/rules'),
        apiFetch<{ items: Reminder[] }>('/notifications/reminders'),
      ]);
      setRules(r);
      setReminders(rem.items);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addRule(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch('/notifications/rules', { method: 'POST', body: JSON.stringify(form) });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function generate() {
    try {
      await apiFetch('/notifications/generate', { method: 'POST' });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Recordatorios</h1>
        <button onClick={generate}
          className="bg-brand-600 text-white px-3 py-2 rounded-lg text-sm font-medium">
          Generar recordatorios
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <form onSubmit={addRule} className="bg-white rounded-2xl shadow p-4 grid sm:grid-cols-5 gap-2">
        <select className="border rounded-lg px-3 py-2 text-sm"
          value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value as ReminderTrigger })}>
          {Object.values(ReminderTrigger).map((t) => (
            <option key={t} value={t}>{triggerLabels[t]}</option>
          ))}
        </select>
        <input className="border rounded-lg px-3 py-2 text-sm" type="number" placeholder="Días"
          value={form.offsetDays} onChange={(e) => setForm({ ...form, offsetDays: +e.target.value })} />
        <select className="border rounded-lg px-3 py-2 text-sm"
          value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as NotificationChannel })}>
          {Object.values(NotificationChannel)
            .filter((c) => c !== NotificationChannel.CONSOLE)
            .map((c) => (
              <option key={c} value={c}>{channelLabels[c]}</option>
            ))}
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm"
          value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value as ReminderTone })}>
          {Object.values(ReminderTone).map((t) => (
            <option key={t} value={t}>{toneLabels[t]}</option>
          ))}
        </select>
        <button className="bg-brand-600 text-white rounded-lg text-sm font-medium">Añadir regla</button>
      </form>

      <div className="bg-white rounded-2xl shadow divide-y">
        {rules.map((r) => (
          <div key={r.id} className="p-3 text-sm">
            <p className="font-medium">
              {r.trigger} ({r.offsetDays}d) · {r.channel} · {r.tone} · {r.enabled ? 'activa' : 'inactiva'}
            </p>
          </div>
        ))}
        {rules.length === 0 && <p className="p-4 text-sm text-slate-500">Sin reglas aún.</p>}
      </div>

      <section className="bg-white rounded-2xl shadow divide-y">
        <h2 className="font-semibold p-3">Historial</h2>
        {reminders.map((rem) => (
          <div key={rem.id} className="p-3 text-sm flex justify-between">
            <p className="text-slate-600">{rem.messageContent}</p>
            <span className="text-xs px-2 py-1 rounded bg-slate-100">{rem.status}</span>
          </div>
        ))}
        {reminders.length === 0 && <p className="p-4 text-sm text-slate-500">Sin envíos.</p>}
      </section>
    </div>
  );
}
