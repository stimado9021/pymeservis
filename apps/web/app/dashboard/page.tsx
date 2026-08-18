'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiFetch } from '@/lib/api';

interface Summary {
  totalReceivable: number;
  totalOverdue: number;
  collectedThisMonth: number;
  byStatus: Record<string, { count: number; amount: number }>;
}

interface Projection {
  month: string;
  amount: number;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [projection, setProjection] = useState<Projection[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch<Summary>('/dashboard/summary'),
      apiFetch<Projection[]>('/dashboard/projection'),
    ])
      .then(([s, p]) => {
        setSummary(s);
        setProjection(p);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!summary) return <p>Cargando...</p>;

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Flujo de caja</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Por cobrar" value={fmt(summary.totalReceivable)} tone="blue" />
        <Stat label="Vencido" value={fmt(summary.totalOverdue)} tone="red" />
        <Stat
          label="Cobrado este mes"
          value={fmt(summary.collectedThisMonth)}
          tone="green"
        />
      </div>

      <section className="bg-white rounded-2xl shadow p-4">
        <h2 className="font-semibold mb-3">Proyección por mes (según vencimiento)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projection}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="amount" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-4">
        <h2 className="font-semibold mb-3">Cartera por estado</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(summary.byStatus).map(([status, data]) => (
            <div key={status} className="border rounded-lg p-3">
              <p className="text-xs uppercase text-slate-500">{status}</p>
              <p className="font-semibold">{data.count} facturas</p>
              <p className="text-sm text-slate-600">{fmt(data.amount)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'blue' | 'red' | 'green';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
    green: 'bg-green-50 text-green-700',
  };
  return (
    <div className={`rounded-2xl shadow p-4 ${tones[tone]}`}>
      <p className="text-sm">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
