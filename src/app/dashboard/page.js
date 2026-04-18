'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.role === 'gestor') router.replace('/dashboard/gestor');
        else if (data.role === 'psicologo') router.replace('/revisao');
        else router.replace('/dashboard/vendedor');
      })
      .catch(() => router.replace('/acesso'));
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-400 text-sm">Carregando…</p>
    </main>
  );
}
