'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PERFIS_JUNG    = ['Pragmático', 'Analítico', 'Afável', 'Expressivo'];
const PERFIS_MOMENTO = ['Indeciso', 'Confuso', 'Decidido', 'Crítico', 'Nervoso', 'Apressado', 'Negociador', 'Detalhista', 'Informal'];
const CONTEXTOS      = ['Ativo', 'Resgate', 'Follow-up', 'Indefinido'];

const AVA_OPTIONS = [
  { value: 'correto',       label: 'Correto' },
  { value: 'parcialmente',  label: 'Parcialmente' },
  { value: 'errado',        label: 'Errado' },
];

import { RESULTADO_LABEL } from '@/lib/analysisConstants';
import { formatDateTime } from '@/lib/utils';

const NOTA_COLOR = {
  Acertou: 'text-green-700 bg-green-100',
  Parcial:  'text-yellow-700 bg-yellow-100',
  Errou:    'text-red-700 bg-red-100',
};

const RISCO_COLOR = {
  Alta:  'text-red-700',
  Média: 'text-yellow-700',
  Baixa: 'text-green-700',
};

function Badge({ label, colorClass }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>{label}</span>
  );
}

function Section({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button
        className="w-full text-left px-5 py-4 flex items-center justify-between"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function EvidList({ items }) {
  if (!items?.length) return null;
  return (
    <ul className="mt-2 space-y-1">
      {items.map((e, i) => (
        <li key={i} className="text-xs text-gray-600 bg-gray-50 rounded px-3 py-1.5 italic">"{e}"</li>
      ))}
    </ul>
  );
}

function AvaField({ label, detected, value, onChange, correto, onCorretoChange, options }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-gray-600">{label}</span>
        <span className="text-xs text-gray-800 font-medium">{detected ?? '—'}</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {AVA_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              value === opt.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-200 text-gray-600 hover:border-blue-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {value === 'errado' && (
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Qual seria o correto?</label>
          <select
            value={correto ?? ''}
            onChange={e => onCorretoChange(e.target.value || null)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-full max-w-xs"
          >
            <option value="">Selecionar…</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

export default function AnalysisPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [reviewerNome,      setReviewerNome]      = useState('');
  const [jungAvaliacao,     setJungAvaliacao]      = useState('');
  const [jungCorreto,       setJungCorreto]        = useState(null);
  const [momentoAvaliacao,  setMomentoAvaliacao]   = useState('');
  const [momentoCorreto,    setMomentoCorreto]     = useState(null);
  const [contextoAvaliacao, setContextoAvaliacao]  = useState('');
  const [contextoCorreto,   setContextoCorreto]   = useState(null);
  const [observacao,        setObservacao]         = useState('');

  useEffect(() => {
    fetch(`/api/analyses/${id}`)
      .then(r => r.json())
      .then(data => {
        setAnalysis(data);
        // Pré-preencher se já tem review
        if (data.reviewId) {
          setReviewerNome(data.reviewerNome ?? '');
          setJungAvaliacao(data.jungAvaliacao ?? '');
          setJungCorreto(data.jungCorreto ?? null);
          setMomentoAvaliacao(data.momentoAvaliacao ?? '');
          setMomentoCorreto(data.momentoCorreto ?? null);
          setContextoAvaliacao(data.contextoAvaliacao ?? '');
          setContextoCorreto(data.contextoCorreto ?? null);
          setObservacao(data.reviewObservacao ?? '');
        }
      })
      .catch(() => setAnalysis(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!jungAvaliacao || !momentoAvaliacao || !contextoAvaliacao) {
      setSaveError('Preencha a avaliação dos três campos.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`/api/analyses/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerNome:      reviewerNome || null,
          jungAvaliacao,
          jungCorreto:       jungAvaliacao === 'errado' ? jungCorreto : null,
          momentoAvaliacao,
          momentoCorreto:    momentoAvaliacao === 'errado' ? momentoCorreto : null,
          contextoAvaliacao,
          contextoCorreto:   contextoAvaliacao === 'errado' ? contextoCorreto : null,
          observacao:        observacao || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Erro desconhecido');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Carregando…</p>
      </main>
    );
  }

  if (!analysis) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-red-500">Análise não encontrada.</p>
      </main>
    );
  }

  const clientData  = analysis.clientData  ?? {};
  const vendorData  = analysis.vendorData  ?? {};
  const signalsData = analysis.signalsData ?? {};
  const sirData     = analysis.sirData     ?? {};
  const rescuePlan  = analysis.rescuePlan  ?? null;
  const res         = RESULTADO_LABEL[analysis.resultado];

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-black">SI</div>
        <span className="text-base font-bold text-gray-900">Sales Intelligence</span>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/revisao" className="text-sm text-blue-700 hover:underline">← Painel</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

        {/* Cabeçalho da análise */}
        <div className="bg-white rounded-xl border border-gray-100 px-5 py-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-gray-400 mb-1">{formatDateTime(analysis.createdAt)}</p>
              <p className="text-sm font-semibold text-gray-800">
                {analysis.corretorNome ?? 'Corretor desconhecido'}
                {analysis.clienteRef && <span className="font-normal text-gray-500"> · {analysis.clienteRef}</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {res && <Badge label={res.label} colorClass={res.color} />}
              {analysis.reviewId
                ? <Badge label="Revisado" colorClass="bg-green-100 text-green-800" />
                : <Badge label="Pendente de revisão" colorClass="bg-orange-100 text-orange-800" />}
            </div>
          </div>
        </div>

        {/* Perfil do Cliente */}
        <Section title="Perfil do Cliente">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge label={`Jung: ${analysis.perfilJung ?? '—'}`} colorClass="bg-blue-100 text-blue-800" />
            <Badge label={`Momento: ${analysis.perfilMomento ?? '—'}`} colorClass="bg-purple-100 text-purple-800" />
            <Badge label={`Contexto: ${analysis.contextoTemporal ?? '—'}`} colorClass="bg-gray-100 text-gray-700" />
            <Badge label={`Confiança: ${clientData.confianca ?? '—'}`} colorClass="bg-gray-100 text-gray-700" />
          </div>
          {clientData.perfilJungRazao && (
            <p className="text-sm text-gray-700 mb-2"><span className="font-medium">Jung: </span>{clientData.perfilJungRazao}</p>
          )}
          {clientData.perfilMomentoRazao && (
            <p className="text-sm text-gray-700 mb-2"><span className="font-medium">Momento: </span>{clientData.perfilMomentoRazao}</p>
          )}
          {clientData.combinacao && (
            <p className="text-sm text-gray-700 mb-2"><span className="font-medium">Combinação: </span>{clientData.combinacao}</p>
          )}
          <EvidList items={clientData.evidencias} />
          {clientData.alerta && (
            <p className="mt-3 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2">⚠ {clientData.alerta}</p>
          )}
        </Section>

        {/* Avaliação do Vendedor */}
        <Section title="Avaliação do Vendedor">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge label={`Perfil natural: ${analysis.perfilNaturalVendedor ?? '—'}`} colorClass="bg-blue-100 text-blue-800" />
            <Badge label={`Aderência: ${analysis.aderenciaCliente ?? '—'}`} colorClass="bg-gray-100 text-gray-700" />
            {analysis.riscoPerdaNota && (
              <span className={`text-xs font-medium ${RISCO_COLOR[analysis.riscoPerdaNota]}`}>
                Risco de perda: {analysis.riscoPerdaNota}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {['fase1', 'fase2'].map(fase => {
              const f = vendorData[fase] ?? {};
              return (
                <div key={fase} className="bg-gray-50 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-600">{fase === 'fase1' ? 'Fase 1 — Comunicação' : 'Fase 2 — Tática'}</span>
                    {f.nota && <Badge label={f.nota} colorClass={NOTA_COLOR[f.nota] ?? 'bg-gray-100 text-gray-700'} />}
                  </div>
                  {f.resumo && <p className="text-xs text-gray-600">{f.resumo}</p>}
                </div>
              );
            })}
          </div>
          {vendorData.veredito?.acaoImediata && (
            <div className="bg-blue-50 rounded-lg px-4 py-3">
              <p className="text-xs font-semibold text-blue-800 mb-1">Ação imediata</p>
              <p className="text-sm text-blue-900">{vendorData.veredito.acaoImediata}</p>
            </div>
          )}
        </Section>

        {/* Sinais */}
        <Section title="Sinais">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium text-gray-700">Tendência:</span>
            <span className={`text-sm font-semibold ${
              analysis.tendencia === 'Avançando' ? 'text-green-700' :
              analysis.tendencia === 'Estagnado' ? 'text-yellow-700' :
              analysis.tendencia === 'Em risco'  ? 'text-orange-700' :
              'text-red-700'}`}>
              {analysis.tendencia ?? '—'}
            </span>
          </div>
          {signalsData.sinaisPerda?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-red-700 mb-2">Sinais de perda</p>
              <div className="space-y-2">
                {signalsData.sinaisPerda.map((s, i) => (
                  <div key={i} className="bg-red-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-red-800">{s.sinal}</span>
                      <Badge label={s.gravidade} colorClass={
                        s.gravidade === 'Alta' ? 'bg-red-200 text-red-900' :
                        s.gravidade === 'Média' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      } />
                    </div>
                    {s.evidencia && <p className="text-xs text-red-700 mt-1 italic">"{s.evidencia}"</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {signalsData.sinaisAvanco?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-700 mb-2">Sinais de avanço</p>
              <div className="space-y-2">
                {signalsData.sinaisAvanco.map((s, i) => (
                  <div key={i} className="bg-green-50 rounded-lg px-3 py-2">
                    <span className="text-xs font-medium text-green-800">{s.sinal}</span>
                    {s.evidencia && <p className="text-xs text-green-700 mt-1 italic">"{s.evidencia}"</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Recomendações SIR */}
        {sirData.mensagemPronta && (
          <Section title="Recomendações (SIR)">
            {sirData.oqueFazerAgora && (
              <p className="text-sm text-gray-700 mb-3"><span className="font-medium">O que fazer agora: </span>{sirData.oqueFazerAgora}</p>
            )}
            <div className="bg-blue-50 rounded-lg px-4 py-3">
              <p className="text-xs font-semibold text-blue-800 mb-1">Mensagem pronta</p>
              <p className="text-sm text-blue-900 whitespace-pre-wrap">{sirData.mensagemPronta}</p>
            </div>
          </Section>
        )}

        {/* Plano de Resgate */}
        {rescuePlan && (
          <Section title="Plano de Resgate">
            {rescuePlan.causaPrincipalPerda && (
              <p className="text-sm text-gray-700 mb-3"><span className="font-medium">Causa da perda: </span>{rescuePlan.causaPrincipalPerda}</p>
            )}
            {rescuePlan.abordagemResgate && (
              <p className="text-sm text-gray-700 mb-3"><span className="font-medium">Abordagem: </span>{rescuePlan.abordagemResgate}</p>
            )}
            {rescuePlan.mensagemResgate && (
              <div className="bg-purple-50 rounded-lg px-4 py-3">
                <p className="text-xs font-semibold text-purple-800 mb-1">Mensagem de resgate</p>
                <p className="text-sm text-purple-900 whitespace-pre-wrap">{rescuePlan.mensagemResgate}</p>
              </div>
            )}
          </Section>
        )}

        {/* Conversa Original */}
        <Section title="Conversa Original">
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
            {analysis.conversaRaw}
          </pre>
        </Section>

        {/* Formulário de Avaliação */}
        <div className="bg-white rounded-xl border border-blue-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-blue-50 bg-blue-50">
            <h2 className="text-sm font-semibold text-blue-900">
              {analysis.reviewId ? 'Atualizar Avaliação' : 'Avaliar Análise'}
            </h2>
            {analysis.reviewId && (
              <p className="text-xs text-blue-600 mt-0.5">Revisado em {formatDateTime(analysis.reviewCreatedAt)}</p>
            )}
          </div>
          <div className="px-5 py-5 space-y-6">
            <AvaField
              label="Perfil Jung"
              detected={analysis.perfilJung}
              value={jungAvaliacao}
              onChange={v => { setJungAvaliacao(v); setJungCorreto(null); }}
              correto={jungCorreto}
              onCorretoChange={setJungCorreto}
              options={PERFIS_JUNG}
            />
            <AvaField
              label="Perfil Momento"
              detected={analysis.perfilMomento}
              value={momentoAvaliacao}
              onChange={v => { setMomentoAvaliacao(v); setMomentoCorreto(null); }}
              correto={momentoCorreto}
              onCorretoChange={setMomentoCorreto}
              options={PERFIS_MOMENTO}
            />
            <AvaField
              label="Contexto Temporal"
              detected={analysis.contextoTemporal}
              value={contextoAvaliacao}
              onChange={v => { setContextoAvaliacao(v); setContextoCorreto(null); }}
              correto={contextoCorreto}
              onCorretoChange={setContextoCorreto}
              options={CONTEXTOS}
            />

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Observação livre</label>
              <textarea
                value={observacao}
                onChange={e => setObservacao(e.target.value)}
                rows={4}
                placeholder="Insights que a IA não capturou, nuances do perfil…"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Seu nome (opcional)</label>
              <input
                type="text"
                value={reviewerNome}
                onChange={e => setReviewerNome(e.target.value)}
                placeholder="Nome do revisor"
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 w-full max-w-xs"
              />
            </div>

            {saveError && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{saveError}</p>
            )}

            {saved && (
              <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">Avaliação salva com sucesso.</p>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !jungAvaliacao || !momentoAvaliacao || !contextoAvaliacao}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-40 hover:bg-blue-700 transition-colors"
            >
              {saving ? 'Salvando…' : (analysis.reviewId ? 'Atualizar avaliação' : 'Salvar avaliação')}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
