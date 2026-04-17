'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const RESULTADO_LABEL = {
  fechada:      { label: 'Fechada',       color: 'bg-green-100 text-green-800' },
  perdida:      { label: 'Perdida',       color: 'bg-red-100 text-red-800' },
  em_andamento: { label: 'Em andamento',  color: 'bg-yellow-100 text-yellow-800' },
  resgate_bem_sucedido:  { label: 'Resgate ✓', color: 'bg-emerald-100 text-emerald-800' },
  resgate_frustrado:     { label: 'Resgate ✗', color: 'bg-orange-100 text-orange-800' },
};

function formatDate(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
  });
}

export default function GestorPage() {
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

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-base font-semibold text-slate-900">Painel do Gestor</h1>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/gestor/equipe" className="text-sm text-blue-700 hover:underline">
            Minha equipe
          </Link>
          <button
            onClick={async () => { await fetch('/api/auth/signout', { method: 'POST' }); router.replace('/acesso'); }}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-medium text-slate-700">Atendimentos da equipe</h2>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">Carregando…</p>
        ) : analyses.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm">Nenhum atendimento registrado ainda.</p>
            <p className="text-xs mt-1">Os atendimentos aparecem aqui após serem salvos pelo vendedor.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Vendedor</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Perfil</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Resultado</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analyses.map(a => {
                  const r = RESULTADO_LABEL[a.resultado] ?? { label: a.resultado, color: 'bg-slate-100 text-slate-600' };
                  return (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDate(a.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-700">{a.corretorNome ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{a.clienteRef ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-700">{a.perfilJung ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${r.color}`}>
                          {r.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/revisao/${a.id}`} className="text-blue-600 hover:underline text-xs">
                          {a.temReview ? 'Ver revisão' : 'Revisar'}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {(page > 1 || hasMore) && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <button
                  onClick={() => { const p = page - 1; setPage(p); fetchAnalyses(p); }}
                  disabled={page === 1}
                  className="text-xs text-slate-500 hover:text-slate-800 disabled:opacity-40"
                >
                  ← Anterior
                </button>
                <span className="text-xs text-slate-400">Página {page}</span>
                <button
                  onClick={() => { const p = page + 1; setPage(p); fetchAnalyses(p); }}
                  disabled={!hasMore}
                  className="text-xs text-slate-500 hover:text-slate-800 disabled:opacity-40"
                >
                  Próxima →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
