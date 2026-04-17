'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push('/revisao');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Senha inválida.');
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      fontFamily: 'sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 360,
        padding: '2rem',
        background: 'white',
        borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem', color: '#1e293b' }}>
          Área do Psicólogo
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
          Insira a senha para acessar o painel de revisão.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoFocus
            placeholder="••••••••"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '0.625rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: '0.9375rem',
              marginBottom: '1rem',
              outline: 'none',
            }}
          />

          {error && (
            <p style={{ fontSize: '0.8125rem', color: '#dc2626', marginBottom: '0.75rem' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%',
              padding: '0.625rem',
              background: loading ? '#94a3b8' : '#1e40af',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.9375rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
