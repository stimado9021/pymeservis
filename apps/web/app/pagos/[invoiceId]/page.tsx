'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiBase } from '@/lib/api';

interface PublicInvoice {
  id: string;
  number: string;
  amount: number;
  paidAmount: number;
  pending: number;
  status: string;
  dueDate: string;
  customer: { name: string } | null;
}

const base = apiBase;

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);

export default function PublicPaymentPage() {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch(`${base}/public/invoices/${invoiceId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Factura no encontrada'))))
      .then(setInvoice)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  async function pay() {
    setGenerating(true);
    try {
      const res = await fetch(`${base}/public/invoices/${invoiceId}/payment-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('No se pudo generar el link de pago');
      const data = await res.json();
      window.location.href = data.paymentUrl;
    } catch (e: any) {
      setError(e.message);
      setGenerating(false);
    }
  }

  if (loading) return <Centered><p>Cargando...</p></Centered>;
  if (error || !invoice) return <Centered><p className="text-red-600">{error || 'Factura no encontrada'}</p></Centered>;

  const paid = invoice.pending <= 0;

  return (
    <Centered>
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 text-center">
        <h1 className="text-xl font-bold text-brand-700 mb-1">Pymes Cobranza</h1>
        <p className="text-sm text-slate-500 mb-6">
          {invoice.customer?.name
            ? `Hola ${invoice.customer.name}, completa tu pago.`
            : 'Completa tu pago.'}
        </p>

        <div className="bg-slate-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-slate-500">Factura {invoice.number}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{fmt(invoice.pending)}</p>
          <p className="text-xs text-slate-400 mt-1">
            Vence el {String(invoice.dueDate).slice(0, 10)} · Total {fmt(invoice.amount)}
          </p>
        </div>

        {paid ? (
          <div className="bg-green-50 text-green-700 rounded-xl p-4 text-sm font-medium">
            Esta factura ya está pagada.
          </div>
        ) : (
          <button
            onClick={pay}
            disabled={generating}
            className="w-full bg-brand-600 text-white py-3 rounded-xl font-medium disabled:opacity-50"
          >
            {generating ? 'Redirigiendo al banco...' : 'Pagar ahora'}
          </button>
        )}
      </div>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      {children}
    </main>
  );
}