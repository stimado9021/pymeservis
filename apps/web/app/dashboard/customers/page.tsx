'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Customer {
  id: string;
  name: string;
  identification?: string;
  documentType?: string;
  phone?: string;
  email?: string;
}

export default function CustomersPage() {
  const [items, setItems] = useState<Customer[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', identification: '', phone: '', email: '' });

  async function load() {
    try {
      const res = await apiFetch<{ items: Customer[] }>('/customers');
      setItems(res.items);
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
      await apiFetch('/customers', { method: 'POST', body: JSON.stringify(form) });
      setForm({ name: '', identification: '', phone: '', email: '' });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Clientes</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <form onSubmit={create} className="bg-white rounded-2xl shadow p-4 grid sm:grid-cols-5 gap-2">
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Nombre" required
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Identificación"
          value={form.identification} onChange={(e) => setForm({ ...form, identification: e.target.value })} />
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Teléfono"
          value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Email"
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <button className="bg-brand-600 text-white rounded-lg text-sm font-medium">Agregar</button>
      </form>

      <div className="bg-white rounded-2xl shadow divide-y">
        {items.map((c) => (
          <div key={c.id} className="p-3 flex justify-between text-sm">
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-slate-500">{c.identification || '—'} · {c.phone || '—'}</p>
            </div>
            <p className="text-slate-500">{c.email || '—'}</p>
          </div>
        ))}
        {items.length === 0 && <p className="p-4 text-sm text-slate-500">Sin clientes aún.</p>}
      </div>
    </div>
  );
}
