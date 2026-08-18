'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { superFetch, setSuperToken, setSuperRefreshToken } from '@/lib/api';

export default function SuperLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await superFetch<{
        accessToken: string;
        refreshToken: string;
        user: { role: string };
      }>('/super/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.user.role !== 'superadmin') {
        throw new Error('Acceso restringido');
      }
      setSuperToken(res.accessToken);
      setSuperRefreshToken(res.refreshToken);
      router.push('/super');
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-surface-100">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-soft p-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🛡️</span>
          <h1 className="text-xl font-bold text-gray-800">Panel de plataforma</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Acceso exclusivo para el administrador del sitio.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            disabled={loading}
            className="w-full btn-primary py-3 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar al panel'}
          </button>
        </form>
        <div className="mt-5 text-center">
          <Link href="/" className="text-xs text-gray-400 hover:text-tienda-500 transition-colors">
            ← Volver al sitio
          </Link>
        </div>
      </div>
    </main>
  );
}