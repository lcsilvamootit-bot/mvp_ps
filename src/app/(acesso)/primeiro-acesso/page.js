'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PrimeiroAcessoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const mismatch = confirm && password !== confirm;

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) { setError('As senhas não coincidem.'); return; }
    if (!token) { setError('Link inválido. Solicite um novo convite.'); return; }

    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/primeiro-acesso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Erro ao definir senha.');
        return;
      }
      router.push(data.role === 'gestor' ? '/dashboard/gestor' : '/dashboard/vendedor');
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-lg font-semibold text-slate-900 mb-1">Criar sua senha</h1>
        <p className="text-sm text-slate-500 mb-6">Defina uma senha para acessar sua conta.</p>

        {!token && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
            Link inválido. Solicite um novo convite ao seu gestor.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nova senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Confirmar senha</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              placeholder="Repita a senha"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${mismatch ? 'border-red-400' : 'border-slate-300'}`}
            />
            {mismatch && <p className="text-xs text-red-600 mt-1">As senhas não coincidem.</p>}
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password || !confirm || mismatch || !token}
            className="w-full py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? 'Salvando…' : 'Criar senha e entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function PrimeiroAcessoPage() {
  return (
    <Suspense>
      <PrimeiroAcessoForm />
    </Suspense>
  );
}
