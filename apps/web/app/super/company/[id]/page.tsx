'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { superFetch } from '@/lib/api';
import { fmt } from '../../company-row';

interface Detail {
  org: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    subscriptionStatus: string;
    subscriptionExpiresAt: string | null;
    createdAt: string;
  };
  customers: number;
  invoices: number;
  invoiced: number;
  collected: number;
  outstanding: number;
  recoveryRate: number;
  byStatus: Record<string, { count: number; amount: number }>;
  collectedByMonth: { month: string; amount: number }[];
  recentTx: { reference: string; amount: number; status: string; createdAt: string }[];
}

const statusColor: Record<string, string> = {
  paid: '#6C5CE7',
  pending: '#94a3b8',
  partial: '#f59e0b',
  overdue: '#ff6b6b',
};

const statusLabel: Record<string, string> = {
  paid: 'Pagada',
  pending: 'Pendiente',
  partial: 'Parcial',
  overdue: 'Vencida',
};

export default function SuperCompanyPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    superFetch<Detail>(`/super/company/${params.id}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [params.id]);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return <p className="text-gray-500">Cargando...</p>;

  const statusData = Object.entries(data.byStatus).map(([key, v]) => ({
    name: statusLabel[key] ?? key,
    value: v.amount,
    fill: statusColor[key] ?? '#94a3b8',
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{data.org.name}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {data.org.slug} · {data.org.plan} · {data.org.subscriptionStatus} · Registrada{' '}
            {new Date(data.org.createdAt).toLocaleDateString('es-CO')}
          </p>
        </div>
        <Link href="/super/companies" className="tag hover:underline">
          ← Empresas
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniCard label="Facturado" value={fmt(data.invoiced)} tone="purple" />
        <MiniCard label="Cobrado" value={fmt(data.collected)} tone="green" />
        <MiniCard label="Por cobrar" value={fmt(data.outstanding)} />
        <MiniCard label="Recuperación" value={`${(data.recoveryRate * 100).toFixed(1)}%`} tone="purple" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="card">
          <h2 className="font-bold mb-4 text-gray-800">Avance del cobro por mes</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.collectedByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="amount" fill="#6C5CE7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card">
          <h2 className="font-bold mb-4 text-gray-800">Cartera por estado</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  label={(e: any) => `${e.name} ${((e.value / (data.invoiced || 1)) * 100).toFixed(0)}%`}
                />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="card">
        <h2 className="font-bold mb-4 text-gray-800">Evolución acumulada</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.collectedByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Line type="monotone" dataKey="amount" stroke="#6C5CE7" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card p-0 overflow-hidden">
        <h2 className="font-bold p-5 text-gray-800">Últimas transacciones</h2>
        <div className="divide-y divide-surface-200">
          {data.recentTx.map((t) => (
            <div key={t.reference} className="p-4 flex justify-between text-sm">
              <div>
                <p className="font-medium text-gray-800">{t.reference}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(t.createdAt).toLocaleString('es-CO')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-800">{fmt(t.amount)}</p>
                <p className="text-xs text-gray-400">{t.status}</p>
              </div>
            </div>
          ))}
          {data.recentTx.length === 0 && (
            <p className="p-5 text-sm text-gray-500">Sin transacciones aún.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function MiniCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'purple' | 'green';
}) {
  const tones: Record<string, string> = {
    default: 'bg-white text-gray-800',
    purple: 'bg-tienda-50 text-tienda-500',
    green: 'bg-green-50 text-green-600',
  };
  return (
    <div className={`card ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-wide opacity-70 font-medium">{label}</p>
      <p className="text-lg font-bold mt-2">{value}</p>
    </div>
  );
}