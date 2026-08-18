'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, setToken, setRefreshToken, AuthResult } from '@/lib/api';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    orgName: '',
    slug: '',
    name: '',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await apiFetch<AuthResult>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        setToken(res.accessToken);
        setRefreshToken(res.refreshToken);
      } else {
        const res = await apiFetch<AuthResult>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            orgName: form.orgName,
            slug: form.slug,
            name: form.name,
          }),
        });
        setToken(res.accessToken);
        setRefreshToken(res.refreshToken);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-surface-100">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-soft p-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-tienda-500">Pymes Cobranza</h1>
          <Link href="/" className="text-xs text-gray-400 hover:text-tienda-500 transition-colors">
            ← Volver al sitio
          </Link>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Cobra tu cartera vencida y mejora tu flujo de caja.
        </p>

        <div className="flex mb-6 bg-surface-100 rounded-2xl p-1">
          <button
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
              mode === 'login' ? 'bg-white shadow-card text-tienda-500' : 'text-gray-500'
            }`}
            onClick={() => setMode('login')}
          >
            Iniciar sesión
          </button>
          <button
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
              mode === 'register' ? 'bg-white shadow-card text-tienda-500' : 'text-gray-500'
            }`}
            onClick={() => setMode('register')}
          >
            Registrar pyme
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <>
              <Input
                placeholder="Nombre de la empresa"
                value={form.orgName}
                onChange={(v) => setForm({ ...form, orgName: v })}
              />
              <Input
                placeholder="Slug (ej. mi-pyme)"
                value={form.slug}
                onChange={(v) => setForm({ ...form, slug: v })}
              />
              <Input
                placeholder="Tu nombre"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
              />
            </>
          )}
          <Input
            placeholder="Correo"
            type="email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
          />
          <Input
            placeholder="Contraseña"
            type="password"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            disabled={loading}
            className="w-full btn-primary py-3.5 text-base disabled:opacity-50"
          >
            {loading ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        {mode === 'register' && (
          <p className="text-xs text-gray-400 mt-5 text-center">
            Tu pyme empieza con 14 días de prueba gratis. Sin tarjeta.
          </p>
        )}
      </div>
    </main>
  );
}

function Input(props: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <input
      type={props.type || 'text'}
      placeholder={props.placeholder}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      className="input"
      required
    />
  );
}