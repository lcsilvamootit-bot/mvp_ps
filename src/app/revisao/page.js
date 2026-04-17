'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RevisaoPage() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>
          Painel de Revisão
        </h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link
            href="/revisao/configuracoes"
            style={{ fontSize: '0.875rem', color: '#1e40af', textDecoration: 'none' }}
          >
            Configurações
          </Link>
          <button
            onClick={handleLogout}
            style={{
              fontSize: '0.875rem',
              padding: '0.375rem 0.875rem',
              background: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            Sair
          </button>
        </div>
      </div>

      <p style={{ color: '#64748b', fontSize: '0.9375rem' }}>
        Listagem de análises em breve (Sprint 4).
      </p>
    </main>
  );
}
