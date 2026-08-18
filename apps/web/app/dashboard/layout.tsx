'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getToken, getRefreshToken, logout } from '@/lib/api';

const links = [
  { href: '/dashboard', label: 'Inicio' },
  { href: '/dashboard/customers', label: 'Clientes' },
  { href: '/dashboard/invoices', label: 'Cartera' },
  { href: '/dashboard/notifications', label: 'Recordatorios' },
  { href: '/dashboard/subscription', label: 'Suscripción' },
  { href: '/dashboard/settings', label: 'Configuración' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hasSession = Boolean(getToken() || getRefreshToken());
    if (!hasSession) {
      router.replace('/');
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface-100">
      <aside className="md:w-60 bg-white border-r border-surface-200 p-5 flex md:flex-col gap-2">
        <h2 className="font-bold text-xl mb-5 hidden md:block text-tienda-500">Pymes Cobranza</h2>
        <nav className="flex md:flex-col gap-1 flex-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                pathname === l.href 
                  ? 'bg-tienda-50 text-tienda-500' 
                  : 'text-gray-600 hover:bg-surface-100'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <button
          className="px-4 py-2.5 rounded-2xl text-sm text-left text-gray-600 hover:bg-surface-100 font-medium transition-all"
          onClick={() => logout()}
        >
          Salir
        </button>
      </aside>
      <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">{children}</main>
    </div>
  );
}