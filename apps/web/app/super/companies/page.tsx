'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { superFetch } from '@/lib/api';
import { Company, CompanyRow } from '../company-row';

export default function SuperCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    superFetch<Company[]>('/super/companies')
      .then(setCompanies)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!companies.length) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Empresas registradas ({companies.length})</h1>
      <div className="card p-0 overflow-hidden">
        <div className="divide-y divide-surface-200">
          {companies.map((c) => (
            <CompanyRow key={c.id} c={c} />
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-400">
        Haz clic en una empresa para ver su detalle y gráficos.
      </p>
      <Link href="/super" className="tag hover:underline">
        ← Volver al resumen
      </Link>
    </div>
  );
}