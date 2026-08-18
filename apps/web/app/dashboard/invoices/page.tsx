'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Invoice {
  id: string;
  number: string;
  amount: number;
  paidAmount: number;
  status: string;
  dueDate: string;
  customer?: { name: string };
}

interface Customer {
  id: string;
  name: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);

export default function InvoicesPage() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    customerId: '',
    number: '',
    amount: '',
    dueDate: '',
  });

  async function load() {
    try {
      const [inv, cus] = await Promise.all([
        apiFetch<{ items: Invoice[] }>('/invoices'),
        apiFetch<{ items: Customer[] }>('/customers'),
      ]);
      setItems(inv.items);
      setCustomers(cus.items);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch('/invoices', {
        method: 'POST',
        body: JSON.stringify({
          customerId: form.customerId,
          number: form.number,
          amount: parseFloat(form.amount),
          issueDate: new Date().toISOString().slice(0, 10),
          dueDate: form.dueDate,
        }),
      });
      setForm({ customerId: '', number: '', amount: '', dueDate: '' });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function payLink(id: string) {
    try {
      const res = await apiFetch<{ paymentUrl: string }>(
        `/payments/invoices/${id}/payment-link`,
        { method: 'POST' },
      );
      window.open(res.paymentUrl, '_blank');
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Cartera</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <form onSubmit={create} className="bg-white rounded-2xl shadow p-4 grid sm:grid-cols-5 gap-2">
        <select className="border rounded-lg px-3 py-2 text-sm" required
          value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
          <option value="">Cliente</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Número" required
          value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Monto" type="number" required
          value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <input className="border rounded-lg px-3 py-2 text-sm" type="date" required
          value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        <button className="bg-brand-600 text-white rounded-lg text-sm font-medium">Crear</button>
      </form>

      <div className="bg-white rounded-2xl shadow divide-y">
        {items.map((inv) => (
          <div key={inv.id} className="p-3 flex justify-between items-center text-sm">
            <div>
              <p className="font-medium">{inv.customer?.name} · {inv.number}</p>
              <p className="text-slate-500">
                {fmt(Number(inv.amount))} — vence {inv.dueDate?.slice(0, 10)} · {inv.status}
              </p>
            </div>
            <button
              onClick={() => payLink(inv.id)}
              className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
            >
              Link de pago
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="p-4 text-sm text-slate-500">Sin facturas aún.</p>}
      </div>
    </div>
  );
}
