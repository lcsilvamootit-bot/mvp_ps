'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NovoVendedorPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Erro ao criar vendedor.');
        return;
      }
      const origin = window.location.origin;
      setInviteLink(`${origin}/primeiro-acesso?token=${data.inviteToken}`);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (inviteLink) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-8">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-green-700 text-lg">✓</span>
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-1">Vendedor criado!</h2>
          <p className="text-sm text-slate-500 mb-5">
            Copie o link abaixo e envie via WhatsApp para <strong>{name}</strong>. O link expira em 72h.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-slate-500 mb-1 font-medium">Link de acesso</p>
            <p className="text-xs text-slate-700 break-all font-mono">{inviteLink}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigator.clipboard.writeText(inviteLink)}
              className="flex-1 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium"
            >
              Copiar link
            </button>
            <Link
              href="/dashboard/gestor/equipe"
              className="flex-1 py-2 text-center border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium"
            >
              Ver equipe
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard/gestor/equipe" className="text-sm text-slate-500 hover:text-slate-800">← Equipe</Link>
        <h1 className="text-base font-semibold text-slate-900">Novo vendedor</h1>
      </header>

      <div className="max-w-md mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nome completo</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
                placeholder="João Silva"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="joao@empresa.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading || !name || !email}
              className="w-full py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium"
            >
              {loading ? 'Criando…' : 'Criar e gerar link de convite'}
            </button>
          </form>
        </div>

        <p className="text-xs text-slate-400 mt-4 text-center">
          O vendedor receberá um link para criar sua própria senha. O link expira em 72 horas.
        </p>
      </div>
    </main>
  );
}
