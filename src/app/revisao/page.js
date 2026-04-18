'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RESULTADO_LABEL, TENDENCIA_COLOR } from '@/lib/analysisConstants';
import { formatDateTime } from '@/lib/utils';

export default function RevisaoPage() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendente, setPendente] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const LIMIT = 20;

  const fetchAnalyses = async (p = 1, pend = pendente) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT, pendente: pend });
      const res = await fetch(`/api/analyses?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAnalyses(data);
      setHasMore(data.length === LIMIT);
    } catch {
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalyses(1, pendente); }, [pendente]);

  const handlePage = (next) => {
    setPage(next);
    fetchAnalyses(next, pendente);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/acesso');
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-black">SI</div>
        <span className="text-base font-bold text-gray-900">Sales Intelligence</span>
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Painel do Psicólogo</span>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/revisao/configuracoes" className="text-sm text-blue-700 hover:underline">
            Configurações
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 border border-gray-200 rounded-md px-3 py-1 hover:bg-gray-50"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Análises</h1>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={pendente}
              onChange={e => { setPendente(e.target.checked); setPage(1); }}
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            Somente pendentes de revisão
          </label>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 py-12 text-center">Carregando…</p>
        ) : analyses.length === 0 ? (
          <p className="text-sm text-gray-400 py-12 text-center">Nenhuma análise encontrada.</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Corretor</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Jung</th>
                  <th className="px-4 py-3 text-left">Tendência</th>
                  <th className="px-4 py-3 text-left">Resultado</th>
                  <th className="px-4 py-3 text-left">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {analyses.map(a => {
                  const res = RESULTADO_LABEL[a.resultado];
                  return (
                    <tr
                      key={a.id}
                      onClick={() => router.push(`/revisao/${a.id}`)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDateTime(a.createdAt)}</td>
                      <td className="px-4 py-3 text-gray-800">{a.corretorNome ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-800">{a.clienteRef ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{a.perfilJung ?? '—'}</td>
                      <td className={`px-4 py-3 font-medium ${TENDENCIA_COLOR[a.tendencia] ?? 'text-gray-500'}`}>
                        {a.tendencia ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        {res
                          ? <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${res.color}`}>{res.label}</span>
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {a.temReview
                          ? <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Revisado</span>
                          : <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">Pendente</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {(page > 1 || hasMore) && (
          <div className="flex justify-center gap-3 mt-6">
            <button
              disabled={page === 1}
              onClick={() => handlePage(page - 1)}
              className="text-sm px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-500 self-center">Página {page}</span>
            <button
              disabled={!hasMore}
              onClick={() => handlePage(page + 1)}
              className="text-sm px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
