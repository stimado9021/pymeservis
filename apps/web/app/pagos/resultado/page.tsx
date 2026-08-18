'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const base =
  (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);

function Result() {
  const params = useSearchParams();
  const ref = params.get('ref');
  const [state, setState] = useState<
    'loading' | 'approved' | 'declined' | 'pending' | 'error'
  >('loading');
  const [info, setInfo] = useState<{ amount: number; invoiceNumber: string } | null>(null);

  useEffect(() => {
    if (!ref) {
      setState('error');
      return;
    }
    fetch(`${base}/public/payments/${ref}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('No encontrado'))))
      .then((data) => {
        const t = data.transaction;
        setInfo({ amount: t.amount, invoiceNumber: data.invoice?.number });
        if (t.status === 'approved') setState('approved');
        else if (t.status === 'declined') setState('declined');
        else if (t.status === 'error') setState('declined');
        else setState('pending');
      })
      .catch(() => setState('error'));
  }, [ref]);

  if (state === 'loading') return <Message>Consultando tu pago...</Message>;
  if (state === 'error') return <Message tone="red">No pudimos confirmar tu pago.</Message>;
  if (state === 'pending')
    return (
      <Message tone="amber">
        Tu pago está siendo procesado. Te avisaremos cuando se confirme.
      </Message>
    );
  if (state === 'declined')
    return (
      <Message tone="red">
        El pago no fue completado.
        {info && ` Intenta de nuevo con la factura ${info.invoiceNumber}.`}
      </Message>
    );

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl mb-4">
        ✓
      </div>
      <h1 className="text-xl font-bold text-green-700 mb-1">¡Pago recibido!</h1>
      <p className="text-sm text-slate-500 mb-6">
        Factura {info?.invoiceNumber} · {info ? fmt(info.amount) : ''}
      </p>
      <Link href="/" className="text-sm text-brand-600 underline">
        Volver al inicio
      </Link>
    </div>
  );
}

function Message({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: 'red' | 'amber';
}) {
  const tones = { red: 'text-red-600', amber: 'text-amber-600' };
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 text-center">
      <p className={tone ? tones[tone] : 'text-slate-600'}>{children}</p>
      <Link href="/" className="inline-block mt-4 text-sm text-brand-600 underline">
        Volver al inicio
      </Link>
    </div>
  );
}

export default function ResultPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<Message>Consultando tu pago...</Message>}>
        <Result />
      </Suspense>
    </main>
  );
}