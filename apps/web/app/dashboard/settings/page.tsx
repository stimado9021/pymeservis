'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Org {
  id: string;
  name: string;
  slug: string;
  nit?: string;
  wompiEnv: string;
  wompiPublicKey?: string;
  hasWompiPrivateKey?: boolean;
  hasWompiEventsKey?: boolean;
}

export default function SettingsPage() {
  const [org, setOrg] = useState<Org | null>(null);
  const [form, setForm] = useState({
    wompiEnv: 'sandbox',
    wompiPublicKey: '',
    wompiPrivateKey: '',
    wompiEventsKey: '',
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<Org>('/organizations/me')
      .then((o) => {
        setOrg(o);
        setForm({
          wompiEnv: o.wompiEnv || 'sandbox',
          wompiPublicKey: o.wompiPublicKey || '',
          wompiPrivateKey: '',
          wompiEventsKey: '',
        });
      })
      .catch((e) => setError(e.message));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError('');
    try {
      await apiFetch('/organizations/me/wompi', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setSaved(true);
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (!org) return <p className="text-slate-500">Cargando...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Configuración</h1>
      <p className="text-sm text-slate-500">
        Empresa: <span className="font-medium">{org.name}</span>
        {org.slug ? ` (${org.slug})` : ''}
      </p>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {saved && <p className="text-green-600 text-sm">Configuración guardada.</p>}

      <form onSubmit={save} className="bg-white rounded-2xl shadow p-4 space-y-3 max-w-lg">
        <div>
          <label className="block text-sm font-medium mb-1">Ambiente Wompi</label>
          <select
            className="border rounded-lg px-3 py-2 text-sm w-full"
            value={form.wompiEnv}
            onChange={(e) => setForm({ ...form, wompiEnv: e.target.value })}
          >
            <option value="sandbox">Sandbox (pruebas)</option>
            <option value="prod">Producción</option>
          </select>
        </div>
        <Field label="Public key" value={form.wompiPublicKey}
          onChange={(v) => setForm({ ...form, wompiPublicKey: v })} />
        <Field label="Private key" value={form.wompiPrivateKey}
          hint={org.hasWompiPrivateKey ? 'Ya configurada (se reemplaza si escribes una nueva)' : 'No configurada'}
          onChange={(v) => setForm({ ...form, wompiPrivateKey: v })} />
        <Field label="Events key" value={form.wompiEventsKey}
          hint={org.hasWompiEventsKey ? 'Ya configurada (se reemplaza si escribes una nueva)' : 'No configurada'}
          onChange={(v) => setForm({ ...form, wompiEventsKey: v })} />
        <button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          Guardar
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        className="border rounded-lg px-3 py-2 text-sm w-full font-mono"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={hint || 'pub_/prv_/evt_...'}
      />
    </div>
  );
}