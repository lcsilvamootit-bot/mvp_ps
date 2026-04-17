'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RESULTADO_LABEL } from '@/lib/analysisConstants';
import { formatDateTime } from '@/lib/utils';

export default function VendedorPage() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const LIMIT = 20;

  const fetchAnalyses = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      const res = await fetch(`/api/analyses?${params}`);
      if (res.status === 401) { router.replace('/acesso'); return; }
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

  useEffect(() => { fetchAnalyses(1); }, []);

  // Stats
  const fechadas = analyses.filter(a => a.resultado === 'fechada').length;
  const perdidas = analyses.filter(a => a.resultado === 'perdida').length;
  const total = analyses.length;
  const taxaFechamento = total > 0 ? Math.round((fechadas / total) * 100) : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-base font-semibold text-slate-900">Meus atendimentos</h1>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-blue-700 hover:underline">Nova análise</Link>
          <button
            onClick={async () => { await fetch('/api/auth/signout', { method: 'POST' }); router.replace('/acesso'); }}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {taxaFechamento !== null && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-slate-800">{total}</p>
              <p className="text-xs text-slate-500 mt-1">Atendimentos</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{fechadas}</p>
              <p className="text-xs text-slate-500 mt-1">Fechadas</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{taxaFechamento}%</p>
              <p className="text-xs text-slate-500 mt-1">Taxa de fechamento</p>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-400">Carregando…</p>
        ) : analyses.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm">Nenhum atendimento registrado ainda.</p>
            <Link href="/" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              Analisar o primeiro atendimento →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Perfil</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analyses.map(a => {
                  const r = RESULTADO_LABEL[a.resultado] ?? { label: a.resultado, color: 'bg-slate-100 text-slate-600' };
                  return (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDateTime(a.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-700">{a.clienteRef ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-700">{a.perfilJung ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${r.color}`}>
                          {r.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {(page > 1 || hasMore) && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <button onClick={() => { const p = page - 1; setPage(p); fetchAnalyses(p); }} disabled={page === 1} className="text-xs text-slate-500 disabled:opacity-40">← Anterior</button>
                <span className="text-xs text-slate-400">Página {page}</span>
                <button onClick={() => { const p = page + 1; setPage(p); fetchAnalyses(p); }} disabled={!hasMore} className="text-xs text-slate-500 disabled:opacity-40">Próxima →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
