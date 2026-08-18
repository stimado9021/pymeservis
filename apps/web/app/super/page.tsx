'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { superFetch } from '@/lib/api';
import { Company, CompanyRow, fmt } from './company-row';

interface Summary {
  totalCompanies: number;
  totalUsers: number;
  totalInvoiced: number;
  totalCollected: number;
  outstanding: number;
  overdueAmount: number;
  collectedThisMonth: number;
  recoveryRate: number;
  byPlan: Record<string, number>;
  bySubscriptionStatus: Record<string, number>;
  collectedByMonth: { month: string; amount: number }[];
  asOf: string;
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default function SuperDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      superFetch<Summary>('/super/summary'),
      superFetch<Company[]>('/super/companies'),
    ])
      .then(([s, c]) => {
        setSummary(s);
        setCompanies(c);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!summary) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Resumen de la plataforma</h1>
        <span className="tag">
          Actualizado: {new Date(summary.asOf).toLocaleString('es-CO')}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card label="Empresas registradas" value={String(summary.totalCompanies)} />
        <Card label="Usuarios activos" value={String(summary.totalUsers)} />
        <Card label="Total facturado" value={fmt(summary.totalInvoiced)} tone="purple" />
        <Card label="Total cobrado" value={fmt(summary.totalCollected)} tone="green" />
        <Card label="Por cobrar" value={fmt(summary.outstanding)} />
        <Card label="Vencido" value={fmt(summary.overdueAmount)} tone="red" />
        <Card label="Cobrado este mes" value={fmt(summary.collectedThisMonth)} tone="green" />
        <Card label="Tasa de recuperación" value={pct(summary.recoveryRate)} tone="purple" />
      </div>

      <section className="card">
        <h2 className="font-bold mb-4 text-gray-800">Cobros por mes (todas las pymes)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.collectedByMonth}>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">Últimas empresas</h2>
          <Link href="/super/companies" className="tag-coral hover:underline">
            Ver todas →
          </Link>
        </div>
        <div className="divide-y divide-surface-200">
          {companies.slice(0, 8).map((c) => (
            <CompanyRow key={c.id} c={c} />
          ))}
          {companies.length === 0 && (
            <p className="p-4 text-sm text-gray-500">Sin empresas registradas.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Card({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'purple' | 'green' | 'red';
}) {
  const tones: Record<string, string> = {
    default: 'bg-white text-gray-800',
    purple: 'bg-tienda-50 text-tienda-500',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-500',
  };
  return (
    <div className={`card ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-wide opacity-70 font-medium">{label}</p>
      <p className="text-xl font-bold mt-2">{value}</p>
    </div>
  );
}