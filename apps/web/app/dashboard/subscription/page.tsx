'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { SubscriptionPlan } from '@pymes/shared';

interface Current {
  plan: string;
  subscriptionStatus: string;
  subscriptionExpiresAt: string | null;
  plans: SubscriptionPlan[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);

const statusLabel: Record<string, string> = {
  trial: 'Prueba gratis',
  active: 'Activa',
  past_due: 'Pago pendiente',
  canceled: 'Cancelada',
};

export default function SubscriptionPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<Current | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setData(await apiFetch<Current>('/subscription/current'));
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function checkout(planId: string) {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<{ paymentUrl: string }>('/subscription/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId }),
      });
      window.location.href = res.paymentUrl;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  const ref = searchParams.get('ref');
  const blocked = searchParams.get('blocked') === '1';
  const paid = ref?.startsWith('SUB-') ? 'Esperando confirmación del pago. Si ya pagaste, el cambio se aplica automáticamente.' : null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Suscripción</h1>

      {blocked && (
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Tu suscripción o prueba gratuita ha expirado. Renueva tu plan para volver a usar la
          plataforma.
        </div>
      )}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {paid && <p className="text-green-600 text-sm bg-green-50 rounded-2xl p-4">{paid}</p>}

      {data && (
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Plan actual</p>
            <p className="text-xl font-bold capitalize text-gray-800">
              {data.plan} · <span className="text-tienda-500">{statusLabel[data.subscriptionStatus]}</span>
            </p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Vence el</p>
            <p className="font-bold text-gray-800 mt-1">
              {data.subscriptionExpiresAt
                ? new Date(data.subscriptionExpiresAt).toLocaleDateString('es-CO')
                : '—'}
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {data?.plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-3xl shadow-soft p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
              data?.plan === plan.id 
                ? 'border-2 border-tienda-500 bg-tienda-50' 
                : 'bg-white border-2 border-surface-200'
            }`}
          >
            <h3 className="font-bold text-xl text-gray-800">{plan.name}</h3>
            <p className="text-sm text-gray-500 mt-2">{plan.tagline}</p>
            <div className="mt-6 flex items-end gap-1">
              <span className="text-4xl font-extrabold text-gray-800">{fmt(plan.price)}</span>
              <span className="text-sm text-gray-400 mb-1">/mes</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-gray-600 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="text-tienda-500 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            {data?.plan === plan.id ? (
              <button
                disabled
                className="mt-8 text-center py-4 rounded-2xl font-semibold bg-surface-200 text-gray-400"
              >
                Plan actual
              </button>
            ) : (
              <button
                disabled={loading}
                onClick={() => checkout(plan.id)}
                className="mt-8 btn-primary py-4 disabled:opacity-50"
              >
                {loading ? 'Generando link...' : `Cambiar a ${plan.name}`}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}