'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSuperToken, superLogout } from '@/lib/api';

const links = [
  { href: '/super', label: 'Resumen' },
  { href: '/super/companies', label: 'Empresas' },
];

export default function SuperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname.startsWith('/super/login');
  const [ready, setReady] = useState(() => isLogin);

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      return;
    }
    if (!getSuperToken()) {
      router.replace('/super/login');
    } else {
      setReady(true);
    }
  }, [isLogin, router]);

  if (!ready) return null;
  if (isLogin) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface-100">
      <aside className="md:w-64 bg-white border-r border-surface-200 p-5 flex md:flex-col gap-2">
        <div className="mb-5">
          <h2 className="font-bold text-xl flex items-center gap-2 text-tienda-500">
            <span className="text-2xl">🛡️</span> Plataforma
          </h2>
          <p className="text-xs text-gray-400 mt-1">Administración del sitio</p>
        </div>
        <nav className="flex md:flex-col gap-1 flex-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                pathname === l.href || pathname.startsWith(l.href + '/')
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
          onClick={() => superLogout()}
        >
          Salir
        </button>
      </aside>
      <main className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">{children}</main>
    </div>
  );
}