'use client';

import Link from 'next/link';

export const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);

export interface Company {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  plan: string;
  subscriptionStatus: string;
  customers: number;
  invoices: number;
  invoiced: number;
  collected: number;
  outstanding: number;
  overdue: number;
  recoveryRate: number;
}

export function CompanyRow({ c }: { c: Company }) {
  return (
    <Link
      href={`/super/company/${c.id}`}
      className="p-3 flex items-center justify-between hover:bg-slate-50"
    >
      <div>
        <p className="font-medium text-sm">{c.name}</p>
        <p className="text-xs text-slate-400">
          {c.invoices} facturas · {c.customers} clientes · {c.plan} · {c.subscriptionStatus}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-green-700">{fmt(c.collected)}</p>
        <p className="text-xs text-slate-400">
          {(c.recoveryRate * 100).toFixed(0)}% · vencido {fmt(c.overdue)}
        </p>
      </div>
    </Link>
  );
}