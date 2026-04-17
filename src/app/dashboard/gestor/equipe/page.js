'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function StatusBadge({ user }) {
  if (!user.active) return <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">Inativo</span>;
  if (user.mustChangePassword) return <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">Convite pendente</span>;
  return <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Ativo</span>;
}

export default function EquipePage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.status === 401) { router.replace('/acesso'); return; }
      if (!res.ok) throw new Error();
      setUsers(await res.json());
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleActive = async (id) => {
    await fetch(`/api/users/${id}`, { method: 'PATCH' });
    fetchUsers();
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/gestor" className="text-sm text-slate-500 hover:text-slate-800">← Painel</Link>
          <h1 className="text-base font-semibold text-slate-900">Minha Equipe</h1>
        </div>
        <Link
          href="/dashboard/gestor/equipe/novo"
          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium"
        >
          + Novo vendedor
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <p className="text-sm text-slate-400">Carregando…</p>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm">Nenhum vendedor cadastrado.</p>
            <Link href="/dashboard/gestor/equipe/novo" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              Criar o primeiro vendedor →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">E-mail</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3"><StatusBadge user={u} /></td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleActive(u.id)}
                        className="text-xs text-slate-400 hover:text-slate-700"
                      >
                        {u.active ? 'Inativar' : 'Reativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
