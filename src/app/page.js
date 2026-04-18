'use client';

import { useState, useRef, useCallback } from 'react';
import {
  UploadCloud, FileAudio, FileVideo, FileText, Trash2,
  CheckCircle2, ChevronDown, ChevronUp, AlertCircle, Copy, Check,
  TrendingUp, TrendingDown, Minus, AlertTriangle,
} from 'lucide-react';

const MAX_SIZE_MB = 25;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function resolveFileType(file) {
  if (file.type && file.type !== 'application/octet-stream') return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  const map = { mp3:'audio', wav:'audio', m4a:'audio', ogg:'audio', opus:'audio',
                 webm:'audio', mp4:'video', mov:'video', txt:'text' };
  return map[ext] ? `${map[ext]}/x-generic` : '';
}
function getFileIcon(file) {
  const t = resolveFileType(file);
  if (t.startsWith('video')) return <FileVideo className="w-5 h-5 text-indigo-500 flex-shrink-0" />;
  if (t.startsWith('audio')) return <FileAudio className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
  return <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />;
}

// ── Utilitários ───────────────────────────────────────────────────────────────

function CopyButton({ text, light = false }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`p-1.5 rounded-md transition-colors flex-shrink-0 ${
        light
          ? 'text-white/50 hover:text-white hover:bg-white/10'
          : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
      }`}
      title="Copiar"
    >
      {copied
        ? <Check className={`w-3.5 h-3.5 ${light ? 'text-emerald-400' : 'text-emerald-500'}`} />
        : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function Accordion({ label, count, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-colors">
        <span>{label}{count != null && <span className="ml-1.5 text-xs font-normal text-gray-400">({count})</span>}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="border-t border-gray-100 bg-gray-50 p-4">{children}</div>}
    </div>
  );
}

function SectionShell({ title, subtitle, accent = 'gray', loading = false, children }) {
  const accents = {
    blue:   'border-blue-100   bg-blue-50/30',
    indigo: 'border-indigo-100 bg-indigo-50/30',
    red:    'border-red-100    bg-red-50/20',
    gray:   'border-gray-200   bg-white',
    dark:   'border-gray-800   bg-gray-900',
  };
  return (
    <div className={`rounded-2xl border ${accents[accent]} overflow-hidden`}>
      <div className="px-5 pt-5 pb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {loading ? (
        <div className="px-5 pb-5 space-y-2.5">
          {[80, 60, 72].map((w, i) => (
            <div key={i} className="h-3 bg-gray-200 rounded animate-pulse" style={{width:`${w}%`}} />
          ))}
        </div>
      ) : (
        <div className="px-5 pb-5">{children}</div>
      )}
    </div>
  );
}

function Badge({ label, color = 'gray' }) {
  const colors = {
    gray:   'bg-gray-100 text-gray-700',
    blue:   'bg-blue-100 text-blue-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    green:  'bg-emerald-100 text-emerald-800',
    yellow: 'bg-amber-100 text-amber-800',
    red:    'bg-red-100 text-red-800',
    purple: 'bg-purple-100 text-purple-800',
    pink:   'bg-pink-100 text-pink-800',
    orange: 'bg-orange-100 text-orange-800',
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${colors[color] || colors.gray}`}>
      {label}
    </span>
  );
}

function NotaBadge({ nota }) {
  if (nota === 'Acertou') return <Badge label="✓ Acertou" color="green" />;
  if (nota === 'Parcial') return <Badge label="~ Parcial" color="yellow" />;
  return <Badge label="✕ Errou" color="red" />;
}

function RiscoBadge({ risco }) {
  if (risco === 'Alta')  return <Badge label="Risco Alto" color="red" />;
  if (risco === 'Média') return <Badge label="Risco Médio" color="yellow" />;
  return <Badge label="Risco Baixo" color="green" />;
}

function TendenciaBadge({ tendencia }) {
  const map = {
    'Avançando': { color: 'green',  icon: <TrendingUp  className="w-3.5 h-3.5 mr-1" /> },
    'Estagnado': { color: 'yellow', icon: <Minus       className="w-3.5 h-3.5 mr-1" /> },
    'Em risco':  { color: 'yellow', icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" /> },
    'Perdido':   { color: 'red',    icon: <TrendingDown className="w-3.5 h-3.5 mr-1" /> },
  };
  const { color, icon } = map[tendencia] || { color: 'gray', icon: null };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
      color === 'green'  ? 'bg-emerald-100 text-emerald-800' :
      color === 'yellow' ? 'bg-amber-100 text-amber-800' :
      color === 'red'    ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
    }`}>
      {icon}{tendencia}
    </span>
  );
}

function jungColor(perfil) {
  return { Pragmático: 'orange', Analítico: 'blue', Afável: 'green', Expressivo: 'pink' }[perfil] || 'gray';
}

function ContextoBadge({ contexto }) {
  const map = {
    'Ativo':      { label: '● Ativo agora',  cls: 'bg-emerald-100 text-emerald-800' },
    'Resgate':    { label: '↩ Resgate',       cls: 'bg-purple-100  text-purple-800'  },
    'Follow-up':  { label: '→ Follow-up',     cls: 'bg-blue-100    text-blue-800'    },
    'Indefinido': { label: '? Indefinido',    cls: 'bg-gray-100    text-gray-500'    },
  };
  const { label, cls } = map[contexto] || map['Indefinido'];
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${cls}`}>
      {label}
    </span>
  );
}

function AderenciaBadge({ aderencia }) {
  const map = {
    'Alta':  { color: 'green',  label: 'Aderência Alta' },
    'Média': { color: 'yellow', label: 'Aderência Média' },
    'Baixa': { color: 'red',    label: 'Aderência Baixa' },
  };
  const { color, label } = map[aderencia] || { color: 'gray', label: aderencia };
  return <Badge label={label} color={color} />;
}

// ── Resultado da venda ────────────────────────────────────────────────────────

const RESULTADO_SUGERIDO_CONFIG = {
  fechada:       { label: 'IA identificou: Venda fechada',   className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  perdida:       { label: 'IA identificou: Venda perdida',   className: 'bg-red-50 text-red-700 border-red-200' },
  em_andamento:  { label: 'IA identificou: Em andamento',    className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
};

function ResultadoButtons({ onFechada, onPerdida, isSaving, resultadoSugerido, saveError }) {
  const sugestao = resultadoSugerido ? RESULTADO_SUGERIDO_CONFIG[resultadoSugerido] : null;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
      {sugestao && (
        <div className={`flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border ${sugestao.className}`}>
          {sugestao.label}
          <span className="font-normal opacity-70">— confirme ou corrija abaixo</span>
        </div>
      )}
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
        Como terminou esse atendimento?
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onFechada}
          disabled={isSaving}
          className="py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isSaving ? '...' : '✓ Venda fechada'}
        </button>
        <button
          onClick={onPerdida}
          disabled={isSaving}
          className="py-3.5 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-red-200 text-red-700 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isSaving ? '...' : '✕ Venda perdida'}
        </button>
      </div>
    </div>
  );
}

function VendaFechadaBand({ clientData, vendorData, signalsData, sirData }) {
  const acertos = [
    ...(vendorData?.veredito?.pontosForts || []),
  ];
  const sinaisAvanco = signalsData?.sinaisAvanco || [];

  return (
    <div className="bg-emerald-600 text-white rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <p className="text-xs font-bold uppercase tracking-widest opacity-70">Venda fechada</p>
        <p className="text-lg font-black mt-1">{clientData?.combinacao}</p>
      </div>
      <div className="px-5 pb-5 space-y-4">

        {/* O que funcionou */}
        {acertos.length > 0 && (
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">O que funcionou</p>
            <div className="space-y-1.5">
              {acertos.map((a, i) => (
                <p key={i} className="text-sm opacity-90">✓ {a}</p>
              ))}
            </div>
          </div>
        )}

        {/* Sinais de avanço que converteram */}
        {sinaisAvanco.length > 0 && (
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">Sinais que indicaram o fechamento</p>
            <div className="space-y-1.5">
              {sinaisAvanco.map((s, i) => (
                <p key={i} className="text-sm opacity-90">→ {s.sinal}</p>
              ))}
            </div>
          </div>
        )}

        {/* Argumento + fechamento */}
        {sirData && (
          <div className="bg-white/10 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider opacity-70">Argumento que fechou</p>
            <p className="text-sm opacity-90">{sirData.argumentoRecomendado}</p>
            <p className="text-xs opacity-60 mt-1">Tipo de fechamento: {sirData.tipoFechamento}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function VendaPerdidaBand({ rescueData, rescueLoading, rescueError }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50/30 overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-red-500">Venda perdida — Plano de resgate</p>
      </div>
      <div className="px-5 pb-5 space-y-4">
        {rescueLoading && (
          <div className="space-y-2.5">
            {[75, 55, 80, 60].map((w, i) => (
              <div key={i} className="h-3 bg-red-100 rounded animate-pulse" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}

        {rescueError && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-white border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{rescueError}</span>
          </div>
        )}

        {rescueData && (
          <>
            {/* Causa da perda */}
            <div className="bg-white border border-red-100 rounded-xl p-4">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Por que perdeu</p>
              <p className="text-sm text-gray-700 leading-relaxed">{rescueData.causaPrincipalPerda}</p>
            </div>

            {/* Perfil ideal + janela */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Perfil ideal para resgatar</p>
                <Badge label={rescueData.perfilIdealResgate} color={jungColor(rescueData.perfilIdealResgate)} />
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">{rescueData.perfilIdealRazao}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quando abordar</p>
                <p className="text-sm text-gray-700 leading-relaxed">{rescueData.janelaTemporal}</p>
              </div>
            </div>

            {/* Como abordar */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Como reabrir</p>
              <p className="text-sm text-gray-700 leading-relaxed">{rescueData.abordagemResgate}</p>
            </div>

            {/* Mensagem de resgate */}
            <div className="bg-gray-900 text-white rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wider opacity-60">Mensagem de reconexão</p>
                <CopyButton text={rescueData.mensagemResgate} light />
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap opacity-90">{rescueData.mensagemResgate}</p>
            </div>

            {/* O que evitar */}
            {rescueData.oqueEvitarNoResgate?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Não faça no resgate</p>
                <div className="space-y-1.5">
                  {rescueData.oqueEvitarNoResgate.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white border border-red-50 rounded-lg px-3 py-2">
                      <span className="text-red-400 text-xs flex-shrink-0 mt-0.5">✕</span>
                      <p className="text-xs text-gray-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Visão Rápida ──────────────────────────────────────────────────────────────

function Skeleton({ w = 'full', h = 2.5, color = 'gray' }) {
  const heights = { 2.5: 'h-2.5', 3: 'h-3', 4: 'h-4', 5: 'h-5', 8: 'h-8' };
  const colors  = { gray: 'bg-gray-200', red: 'bg-red-100', green: 'bg-emerald-100', white: 'bg-white/20' };
  return (
    <div className={`${heights[h] || 'h-2.5'} ${colors[color] || 'bg-gray-200'} rounded animate-pulse ${w === 'full' ? 'w-full' : `w-${w}`}`} />
  );
}

function QuickSummaryView({ clientData, vendorData, signalsData, sirData, loading, allDone, detailMode, onToggleDetail }) {
  const topLossSignals = signalsData?.sinaisPerda
    ?.slice().sort((a, b) => (a.gravidade === 'Alta' ? -1 : b.gravidade === 'Alta' ? 1 : 0))
    .slice(0, 2) || [];
  const topAdvanceSignals = signalsData?.sinaisAvanco?.slice(0, 2) || [];

  const sirReady  = !!sirData;
  const signReady = !!signalsData;
  const clientReady = !!clientData;
  const vendorReady = !!vendorData;

  return (
    <div className="space-y-3">

      {/* 1 — FAÇA AGORA */}
      <div className="bg-gray-900 text-white rounded-2xl p-5">
        <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">Faça agora</p>
        {sirReady ? (
          <>
            <p className="text-sm leading-relaxed font-medium">{sirData.oqueFazerAgora}</p>
            <div className="mt-4 bg-white/10 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold uppercase tracking-wider opacity-60">Mensagem pronta</p>
                <CopyButton text={sirData.mensagemPronta} light />
              </div>
              <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">{sirData.mensagemPronta}</p>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <Skeleton color="white" h={3} />
            <Skeleton color="white" h={3} w="3/4" />
            <div className="mt-3 space-y-1.5">
              <Skeleton color="white" h={2.5} />
              <Skeleton color="white" h={2.5} w="5/6" />
              <Skeleton color="white" h={2.5} w="2/3" />
            </div>
          </div>
        )}
      </div>

      {/* 2 — TENDÊNCIA + CONTEXTO TEMPORAL */}
      <div className="flex flex-wrap items-center gap-2">
        {signReady ? (
          <TendenciaBadge tendencia={signalsData.tendencia} />
        ) : (
          <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
        )}
        {clientReady ? (
          <>
            <Badge label={clientData.perfilMomento} color="indigo" />
            <ContextoBadge contexto={clientData.contextoTemporal} />
          </>
        ) : (
          <div className="h-5 w-24 bg-gray-200 rounded-full animate-pulse" />
        )}
      </div>

      {/* 3 — RISCO + PORTA ABERTA */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 min-h-[80px]">
          <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">⚠ Risco</p>
          {signReady ? (
            topLossSignals.length > 0 ? (
              topLossSignals.map((s, i) => (
                <div key={i} className={i > 0 ? 'mt-2 pt-2 border-t border-red-100' : ''}>
                  <p className="text-xs font-semibold text-gray-800 leading-snug">{s.sinal}</p>
                  <p className="text-xs text-gray-500 mt-0.5 italic line-clamp-2">"{s.evidencia}"</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">Nenhum sinal crítico</p>
            )
          ) : (
            <div className="space-y-1.5">
              <Skeleton color="red" h={2.5} />
              <Skeleton color="red" h={2.5} w="3/4" />
            </div>
          )}
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 min-h-[80px]">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">✓ Porta aberta</p>
          {signReady ? (
            topAdvanceSignals.length > 0 ? (
              topAdvanceSignals.map((s, i) => (
                <div key={i} className={i > 0 ? 'mt-2 pt-2 border-t border-emerald-100' : ''}>
                  <p className="text-xs font-semibold text-gray-800 leading-snug">{s.sinal}</p>
                  <p className="text-xs text-gray-500 mt-0.5 italic line-clamp-2">"{s.evidencia}"</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">Sem sinais de avanço</p>
            )
          ) : (
            <div className="space-y-1.5">
              <Skeleton color="green" h={2.5} />
              <Skeleton color="green" h={2.5} w="3/4" />
            </div>
          )}
        </div>
      </div>

      {/* 4 — QUEM É ELE + VENDEDOR */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Cliente */}
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quem é ele</p>
          {clientReady ? (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <Badge label={clientData.perfilJung} color={jungColor(clientData.perfilJung)} />
                <span className="text-gray-300 text-xs">+</span>
                <Badge label={clientData.perfilMomento} color="indigo" />
                <Badge
                  label={`Confiança ${clientData.confianca}`}
                  color={clientData.confianca === 'Alta' ? 'green' : clientData.confianca === 'Média' ? 'yellow' : 'red'}
                />
              </div>
              <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">{clientData.alerta}</p>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-5 w-24 bg-gray-200 rounded-full animate-pulse" />
              </div>
              <Skeleton h={8} />
            </div>
          )}
        </div>

        {/* Vendedor */}
        <div className="p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Vendedor</p>
          {vendorReady ? (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <Badge label={vendorData.perfilNatural} color={jungColor(vendorData.perfilNatural)} />
                <AderenciaBadge aderencia={vendorData.aderenciaCliente} />
                <RiscoBadge risco={vendorData.veredito.riscoPerda} />
              </div>
              <p className={`text-xs leading-relaxed px-3 py-2 rounded-lg border ${
                vendorData.aderenciaCliente === 'Alta'  ? 'bg-emerald-50 text-emerald-900 border-emerald-100' :
                vendorData.aderenciaCliente === 'Média' ? 'bg-amber-50 text-amber-900 border-amber-100' :
                                                          'bg-red-50 text-red-900 border-red-100'
              }`}>{vendorData.conflitoPerfil}</p>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
              </div>
              <Skeleton h={8} />
            </div>
          )}
        </div>
      </div>

      {/* 5 — TOGGLE DETALHAR */}
      <button
        onClick={onToggleDetail}
        disabled={!allDone}
        className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2
          ${!allDone
            ? 'bg-gray-50 border-2 border-dashed border-gray-200 text-gray-400 cursor-not-allowed'
            : detailMode
              ? 'bg-indigo-50 border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300'
              : 'bg-blue-50 border-2 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300'
          }`}
      >
        {!allDone ? (
          <>
            <div className="w-3 h-3 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
            Aguardando análise completa...
          </>
        ) : detailMode ? (
          <><ChevronUp className="w-4 h-4" /> Ocultar diagnóstico</>
        ) : (
          <><ChevronDown className="w-4 h-4" /> Ver diagnóstico completo</>
        )}
      </button>
    </div>
  );
}

// ── Banda 1: Perfil do Cliente ────────────────────────────────────────────────

function ClientProfileBand({ data }) {
  return (
    <SectionShell title="Perfil do Cliente" accent="blue">
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="text-lg font-black text-gray-900">{data.combinacao}</span>
        <Badge label={`Confiança ${data.confianca}`}
          color={data.confianca === 'Alta' ? 'green' : data.confianca === 'Média' ? 'yellow' : 'red'} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div className="bg-white border border-blue-100 rounded-xl p-4 space-y-2">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Personalidade</p>
          <div className="flex items-center gap-2">
            <Badge label={data.perfilJung} color={jungColor(data.perfilJung)} />
            <span className="text-xs text-gray-400">{data.eixoDecisao} · {data.eixoRitmo}</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{data.perfilJungRazao}</p>
        </div>
        <div className="bg-white border border-purple-100 rounded-xl p-4 space-y-2">
          <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Momento de compra</p>
          <Badge label={data.perfilMomento} color="indigo" />
          <p className="text-xs text-gray-600 leading-relaxed">{data.perfilMomentoRazao}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {[
          { label: 'Clareza',       value: data.clareza },
          { label: 'Temperamento',  value: data.temperamento },
          { label: 'Ritmo',         value: data.ritmo },
          { label: 'Foco',          value: data.focoValor },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 text-center">
            <p className="text-xs text-gray-400 mb-0.5">{label}</p>
            <p className="text-xs font-semibold text-gray-800">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3 mb-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Como falar</p>
          <p className="text-sm text-blue-900 leading-relaxed">{data.comoFalar}</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
          <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">O que fazer</p>
          <p className="text-sm text-purple-900 leading-relaxed">{data.oqueFazer}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Alerta</p>
          <p className="text-sm text-amber-900 leading-relaxed">{data.alerta}</p>
        </div>
      </div>

      {data.evidencias?.length > 0 && (
        <Accordion label="Evidências da análise" count={data.evidencias.length}>
          <div className="space-y-2">
            {data.evidencias.map((q, i) => (
              <blockquote key={i} className="text-xs text-gray-600 italic border-l-4 border-blue-200 pl-3 py-0.5">
                "{q}"
              </blockquote>
            ))}
          </div>
        </Accordion>
      )}
    </SectionShell>
  );
}

// ── Banda 2: Avaliação do Vendedor ────────────────────────────────────────────

function VendorBand({ data }) {
  return (
    <SectionShell title="Perfil e Avaliação do Vendedor" accent="indigo">
      <div className="bg-white border border-indigo-100 rounded-xl p-4 mb-4">
        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Perfil natural</p>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge label={data.perfilNatural} color={jungColor(data.perfilNatural)} />
          <span className="text-xs text-gray-400">{data.eixoDecisao} · {data.eixoRitmo}</span>
          <AderenciaBadge aderencia={data.aderenciaCliente} />
          <RiscoBadge risco={data.veredito.riscoPerda} />
        </div>
        <p className="text-xs text-gray-600 leading-relaxed mb-3">{data.perfilNaturalRazao}</p>

        <div className={`rounded-lg p-3 text-xs leading-relaxed ${
          data.aderenciaCliente === 'Alta'  ? 'bg-emerald-50 text-emerald-900 border border-emerald-100' :
          data.aderenciaCliente === 'Média' ? 'bg-amber-50 text-amber-900 border border-amber-100' :
                                              'bg-red-50 text-red-900 border border-red-100'
        }`}>
          <span className="font-bold uppercase tracking-wide mr-1.5">
            {data.aderenciaCliente === 'Alta' ? 'Complementaridade:' :
             data.aderenciaCliente === 'Média' ? 'Ajuste necessário:' : 'Conflito de estilo:'}
          </span>
          {data.conflitoPerfil}
        </div>

        {data.evidenciasPerfilNatural?.length > 0 && (
          <div className="mt-3">
            <Accordion label="Evidências do perfil" count={data.evidenciasPerfilNatural.length}>
              <div className="space-y-2">
                {data.evidenciasPerfilNatural.map((q, i) => (
                  <blockquote key={i} className="text-xs text-gray-600 italic border-l-4 border-indigo-200 pl-3 py-0.5">
                    "{q}"
                  </blockquote>
                ))}
              </div>
            </Accordion>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-5">
        <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Ponto cego</p>
        <p className="text-sm text-amber-900 leading-relaxed">{data.pontoCego}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {[
          { fase: 'Fase 1', subtitle: 'Comunicação', d: data.fase1 },
          { fase: 'Fase 2', subtitle: 'Tática de venda', d: data.fase2 },
        ].map(({ fase, subtitle, d }) => (
          <div key={fase} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-700">{fase}</p>
                <p className="text-xs text-gray-400">{subtitle}</p>
              </div>
              <NotaBadge nota={d.nota} />
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{d.resumo}</p>
            {d.acertos.length > 0 && (
              <div className="space-y-1">
                {d.acertos.map((a, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600">{a}</p>
                  </div>
                ))}
              </div>
            )}
            {d.erros.length > 0 && (
              <div className="space-y-1">
                {d.erros.map((e, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-red-400 text-xs flex-shrink-0 mt-0.5">✕</span>
                    <p className="text-xs text-gray-600">{e}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-indigo-600 text-white rounded-xl p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider opacity-70">Veredito</p>
        {data.veredito.pontosForts.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold opacity-80">O que acertou</p>
            {data.veredito.pontosForts.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed opacity-90">✓ {p}</p>
            ))}
          </div>
        )}
        {data.veredito.pontosCorrecao.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold opacity-80">O que corrigir</p>
            {data.veredito.pontosCorrecao.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed opacity-90">→ {p}</p>
            ))}
          </div>
        )}
        <div className="pt-2 border-t border-white/20">
          <p className="text-xs font-semibold opacity-80 mb-1">Ação imediata</p>
          <p className="text-sm font-medium leading-relaxed">{data.veredito.acaoImediata}</p>
        </div>
      </div>
    </SectionShell>
  );
}

// ── Banda 3: Sinais ───────────────────────────────────────────────────────────

function SignalsBand({ data }) {
  return (
    <SectionShell title="Sinais do Atendimento" accent="gray">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <TendenciaBadge tendencia={data.tendencia} />
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Momento crítico</p>
        <p className="text-sm text-gray-700 leading-relaxed italic">{data.momentoCritico}</p>
      </div>

      {data.sinaisPerda.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">
            Sinais de risco ({data.sinaisPerda.length})
          </p>
          <div className="space-y-2">
            {data.sinaisPerda.map((s, i) => (
              <div key={i} className="bg-white border border-red-100 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-800">{s.sinal}</p>
                  <Badge label={s.gravidade}
                    color={s.gravidade === 'Alta' ? 'red' : s.gravidade === 'Média' ? 'yellow' : 'gray'} />
                </div>
                <p className="text-xs text-gray-500 mb-1 italic">"{s.evidencia}"</p>
                <p className="text-xs text-gray-600"><span className="font-medium">Causa:</span> {s.causa}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.sinaisAvanco.length > 0 && (
        <div>
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
            Sinais de avanço ({data.sinaisAvanco.length})
          </p>
          <div className="space-y-2">
            {data.sinaisAvanco.map((s, i) => (
              <div key={i} className="bg-white border border-emerald-100 rounded-xl p-3">
                <p className="text-sm font-semibold text-gray-800 mb-1">{s.sinal}</p>
                <p className="text-xs text-gray-500 mb-1 italic">"{s.evidencia}"</p>
                <p className="text-xs text-gray-600"><span className="font-medium">Por quê avançou:</span> {s.causa}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.sinaisPerda.length === 0 && data.sinaisAvanco.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">Nenhum sinal detectado — conversa insuficiente para análise.</p>
      )}
    </SectionShell>
  );
}

// ── Banda 4: Sales Intelligence Record ────────────────────────────────────────

function SIRBand({ data }) {
  return (
    <SectionShell title="Recomendações" subtitle="Sales Intelligence Record" accent="gray">
      <div className="bg-gray-900 text-white rounded-xl p-4 mb-4">
        <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2">O que fazer agora</p>
        <p className="text-sm leading-relaxed">{data.oqueFazerAgora}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Argumento recomendado</p>
          <p className="text-sm text-gray-700 leading-relaxed">{data.argumentoRecomendado}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tipo de fechamento</p>
          <p className="text-sm text-gray-700 leading-relaxed">{data.tipoFechamento}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mensagem pronta</p>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="flex items-start gap-2">
            <p className="flex-1 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{data.mensagemPronta}</p>
            <CopyButton text={data.mensagemPronta} />
          </div>
        </div>
      </div>

      {data.oqueEvitar.length > 0 && (
        <div>
          <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">O que evitar</p>
          <div className="space-y-2">
            {data.oqueEvitar.map((item, i) => (
              <div key={i} className="bg-white border border-red-50 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <span className="text-red-400 text-xs flex-shrink-0 mt-0.5">✕</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.comportamento}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.motivo}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionShell>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function Home() {
  const [files, setFiles] = useState([]);
  const [rawText, setRawText] = useState('');
  const [corretorNome, setCorretorNome] = useState('');
  const [clienteRef, setClienteRef]     = useState('');
  const [analysisId, setAnalysisId]     = useState(null);
  const [isSaving, setIsSaving]         = useState(false);
  const [saveError, setSaveError]       = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [fileErrors, setFileErrors] = useState([]);
  const [detailMode, setDetailMode] = useState(false);
  const [resultado, setResultado]   = useState(null); // null | 'fechada' | 'perdida'
  const [rescueData, setRescueData] = useState(null);
  const [rescueLoading, setRescueLoading] = useState(false);
  const [rescueError, setRescueError] = useState(null);

  const [clientData, setClientData]   = useState(null);
  const [vendorData, setVendorData]   = useState(null);
  const [signalsData, setSignalsData] = useState(null);
  const [sirData, setSirData]         = useState(null);

  const [loading, setLoading] = useState({ client: false, vendor: false, signals: false, sir: false });

  const fileInputRef = useRef(null);
  const hasResult = clientData || vendorData || signalsData || sirData;
  const allDone   = !!(clientData && vendorData && signalsData && sirData);

  const addFiles = useCallback((incoming) => {
    const errors = [];
    const valid = [];
    incoming.forEach((file) => {
      if (file.size > MAX_SIZE_BYTES) { errors.push(`"${file.name}" excede ${MAX_SIZE_MB}MB.`); return; }
      const accepted = file.type.match(/^(audio|video|text)\//) ||
        file.name.match(/\.(mp3|wav|m4a|ogg|opus|mp4|webm|mov|txt)$/i);
      if (!accepted) { errors.push(`Formato de "${file.name}" não suportado.`); return; }
      valid.push(file);
    });
    setFileErrors(errors);
    if (valid.length > 0) setFiles(prev => [...prev, ...valid]);
  }, []);

  const handleFileChange = (e) => { addFiles(Array.from(e.target.files)); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); addFiles(Array.from(e.dataTransfer.files)); };
  const removeFile = (i) => { setFiles(prev => prev.filter((_, idx) => idx !== i)); setFileErrors([]); };

  const startAnalysis = async () => {
    if (files.length === 0 && !rawText.trim()) return;
    setIsProcessing(true);
    setSteps([]);
    setClientData(null); setVendorData(null); setSignalsData(null); setSirData(null);
    setLoading({ client: false, vendor: false, signals: false, sir: false });
    setFileErrors([]);
    setSaveError(null);
    setAnalysisId(null);
    setResultado(null);
    setDetailMode(false);

    // Cópias locais para uso no auto-save (não dependem de flush de estado React)
    let _clientData = null, _vendorData = null, _signalsData = null, _sirData = null;

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    if (rawText.trim()) formData.append('rawText', rawText);

    try {
      const response = await fetch('/api/analyze', { method: 'POST', body: formData, credentials: 'include' });
      if (response.status === 403) { setFileErrors(['Sessão expirada. Recarregue com o link de acesso.']); setIsProcessing(false); return; }
      if (!response.ok || !response.body) { setFileErrors(['Falha na comunicação. Tente novamente.']); setIsProcessing(false); return; }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) { setIsProcessing(false); break; }
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop();

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(part.slice(6));

            setSteps(prev => {
              const unique = ['upload','client','vendor','signals','sir','done','error'];
              if (unique.includes(ev.event)) {
                const idx = prev.findIndex(s => s.event === ev.event);
                if (idx !== -1) { const n = [...prev]; n[idx] = ev; return n; }
                return [...prev, ev];
              }
              if (ev.event === 'transcribe' && ev.fileKey) {
                const idx = prev.findIndex(s => s.event === 'transcribe' && s.fileKey === ev.fileKey);
                if (idx !== -1) { const n = [...prev]; n[idx] = ev; return n; }
              }
              return [...prev, ev];
            });

            if (ev.event === 'client') {
              if (ev.status === 'processing') setLoading(l => ({ ...l, client: true }));
              if (ev.status === 'done') { _clientData = ev.data; setLoading(l => ({ ...l, client: false })); setClientData(ev.data); }
            }
            if (ev.event === 'vendor') {
              if (ev.status === 'processing') setLoading(l => ({ ...l, vendor: true }));
              if (ev.status === 'done') { _vendorData = ev.data; setLoading(l => ({ ...l, vendor: false })); setVendorData(ev.data); }
            }
            if (ev.event === 'signals') {
              if (ev.status === 'processing') setLoading(l => ({ ...l, signals: true }));
              if (ev.status === 'done') { _signalsData = ev.data; setLoading(l => ({ ...l, signals: false })); setSignalsData(ev.data); }
            }
            if (ev.event === 'sir') {
              if (ev.status === 'processing') setLoading(l => ({ ...l, sir: true }));
              if (ev.status === 'done') { _sirData = ev.data; setLoading(l => ({ ...l, sir: false })); setSirData(ev.data); }
            }
            if (ev.event === 'done') {
              setIsProcessing(false);
              if (_clientData && _vendorData && _signalsData && _sirData) {
                autoSave(_clientData, _vendorData, _signalsData, _sirData);
              }
            }
            if (ev.event === 'error') setIsProcessing(false);
          } catch { /* fragmento malformado */ }
        }
      }
    } catch (err) {
      console.error('[analyze]', err);
      setFileErrors(['Erro de conexão. Verifique sua internet e tente novamente.']);
      setIsProcessing(false);
    }
  };

  // Salva análise nova (POST) — usado no auto-save e como fallback
  const autoSave = async (cData, vData, sData, sirD) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          corretorNome: corretorNome || undefined,
          clienteRef:   clienteRef   || undefined,
          conversaRaw:  rawText || '[conversa via arquivo de mídia]',
          resultado:    sirD.resultadoSugerido,
          clientData:   cData,
          vendorData:   vData,
          signalsData:  sData,
          sirData:      sirD,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysisId(data.id);
        return data.id;
      }
      setSaveError('Não foi possível salvar a análise.');
    } catch (err) {
      console.error('[autoSave]', err);
      setSaveError('Erro de conexão ao salvar.');
    } finally {
      setIsSaving(false);
    }
    return null;
  };

  // Atualiza resultado de análise já salva (PATCH)
  const updateResultado = async (id, resultado) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/analyses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ resultado }),
      });
      if (!res.ok) setSaveError('Não foi possível atualizar o resultado.');
    } catch (err) {
      console.error('[updateResultado]', err);
      setSaveError('Erro de conexão ao atualizar.');
    } finally {
      setIsSaving(false);
    }
  };

  // Fallback: salva do zero se o auto-save falhou
  const saveAnalysisFallback = async (resultado) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          corretorNome: corretorNome || undefined,
          clienteRef:   clienteRef   || undefined,
          conversaRaw:  rawText || '[conversa via arquivo de mídia]',
          resultado,
          clientData,
          vendorData,
          signalsData,
          sirData,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysisId(data.id);
        return data.id;
      }
      setSaveError('Não foi possível salvar a análise.');
    } catch (err) {
      console.error('[saveAnalysisFallback]', err);
      setSaveError('Erro de conexão ao salvar.');
    } finally {
      setIsSaving(false);
    }
    return null;
  };

  const handleVendaFechada = async () => {
    setResultado('fechada');
    if (analysisId) {
      await updateResultado(analysisId, 'fechada');
    } else {
      await saveAnalysisFallback('fechada');
    }
  };

  const handleVendaPerdida = async () => {
    setResultado('perdida');
    setRescueLoading(true);
    setRescueError(null);

    let savedId = analysisId;
    if (savedId) {
      await updateResultado(savedId, 'perdida');
    } else {
      savedId = await saveAnalysisFallback('perdida');
    }

    try {
      const res = await fetch('/api/rescue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ clientData, vendorData, signalsData, conversa: rawText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setRescueError(err.error ?? 'Não foi possível gerar o plano de resgate. Tente novamente.');
        return;
      }
      const rescue = await res.json();
      setRescueData(rescue);

      if (savedId) {
        await fetch(`/api/analyses/${savedId}/rescue`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ rescuePlan: rescue }),
        }).catch(err => console.error('[saveRescuePlan]', err));
      }
    } catch (err) {
      console.error('[rescue]', err);
      setRescueError('Erro de conexão ao gerar o plano de resgate. Verifique sua internet.');
    } finally {
      setRescueLoading(false);
    }
  };

  const reset = () => {
    setClientData(null); setVendorData(null); setSignalsData(null); setSirData(null);
    setSteps([]); setFiles([]); setRawText(''); setFileErrors([]);
    setLoading({ client: false, vendor: false, signals: false, sir: false });
    setDetailMode(false);
    setResultado(null);
    setSaveError(null);
    setRescueData(null);
    setRescueLoading(false);
    setRescueError(null);
    setAnalysisId(null);
    setIsSaving(false);
    // mantém corretorNome e clienteRef — usuário provavelmente fará outra análise
  };

  const toggleDetail = () => {
    const next = !detailMode;
    setDetailMode(next);
    if (!next) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Upload form — shown before processing starts */}
        {!isProcessing && !hasResult && (
          <UploadForm
            files={files} rawText={rawText} dragOver={dragOver}
            isProcessing={isProcessing} fileErrors={fileErrors}
            fileInputRef={fileInputRef}
            corretorNome={corretorNome} clienteRef={clienteRef}
            onCorretorNomeChange={e => setCorretorNome(e.target.value)}
            onClienteRefChange={e => setClienteRef(e.target.value)}
            onFileChange={handleFileChange}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onRemoveFile={removeFile}
            onTextChange={e => setRawText(e.target.value)}
            onSubmit={startAnalysis}
          />
        )}

        {/* Errors after processing starts */}
        {fileErrors.length > 0 && (isProcessing || hasResult) && fileErrors.map((err, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{err}</span>
          </div>
        ))}

        {/* Erro de save/update — visível independente do estado dos botões */}
        {saveError && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{saveError}</span>
          </div>
        )}

        {/* Steps — while processing, before first result */}
        {steps.length > 0 && isProcessing && !clientData && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-2.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Processando...</p>
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm">
                {s.status === 'processing' && <div className="w-4 h-4 flex-shrink-0 mt-0.5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />}
                {s.status === 'done'       && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
                {s.status === 'error'      && <AlertCircle  className="w-4 h-4 text-red-400  flex-shrink-0 mt-0.5" />}
                <span className={s.status === 'error' ? 'text-red-500' : s.status === 'processing' ? 'text-gray-500' : 'text-gray-700'}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Quick view — appears as soon as client analysis starts */}
        {(clientData || loading.client) && (
          <QuickSummaryView
            clientData={clientData}
            vendorData={vendorData}
            signalsData={signalsData}
            sirData={sirData}
            loading={loading}
            allDone={allDone}
            detailMode={detailMode}
            onToggleDetail={toggleDetail}
          />
        )}

        {/* Botões de resultado — aparecem quando análise completa e sem resultado ainda */}
        {allDone && !resultado && (
          <ResultadoButtons
            onFechada={handleVendaFechada}
            onPerdida={handleVendaPerdida}
            isSaving={isSaving}
            resultadoSugerido={sirData?.resultadoSugerido}
            saveError={saveError}
          />
        )}

        {/* Banda de venda fechada */}
        {resultado === 'fechada' && (
          <VendaFechadaBand
            clientData={clientData}
            vendorData={vendorData}
            signalsData={signalsData}
            sirData={sirData}
          />
        )}

        {/* Banda de venda perdida + plano de resgate */}
        {resultado === 'perdida' && (
          <VendaPerdidaBand
            rescueData={rescueData}
            rescueLoading={rescueLoading}
            rescueError={rescueError}
          />
        )}

        {/* Collapsible detail — all 4 bands */}
        <div className={`grid transition-all duration-500 ease-in-out ${detailMode ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            <div className="space-y-6 pt-1">
              {clientData  && <ClientProfileBand data={clientData} />}
              {vendorData  && <VendorBand data={vendorData} />}
              {signalsData && <SignalsBand data={signalsData} />}
              {sirData     && <SIRBand data={sirData} />}
            </div>
          </div>
        </div>

        {/* Reset */}
        {hasResult && !isProcessing && (
          <div className="flex justify-center pt-2 pb-6">
            <button onClick={reset} className="text-sm text-gray-400 hover:text-gray-700 transition-colors font-medium">
              ← Nova análise
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-black">SI</div>
      <span className="text-base font-bold text-gray-900">Sales Intelligence</span>
      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">MVP</span>
    </header>
  );
}

function UploadForm({ files, rawText, dragOver, isProcessing, fileErrors, fileInputRef,
                      corretorNome, clienteRef, onCorretorNomeChange, onClienteRefChange,
                      onFileChange, onDrop, onDragOver, onDragLeave, onRemoveFile,
                      onTextChange, onSubmit }) {
  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Identificação</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Seu nome</label>
            <input
              type="text"
              value={corretorNome}
              onChange={onCorretorNomeChange}
              placeholder="Ex: João Silva"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Referência do cliente</label>
            <input
              type="text"
              value={clienteRef}
              onChange={onClienteRefChange}
              placeholder="Ex: Cliente_001"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Mídia do atendimento</h2>
        <div
          onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center text-center cursor-pointer transition-colors
            ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
        >
          <input type="file" multiple accept="audio/*,video/*,text/plain" className="hidden" ref={fileInputRef} onChange={onFileChange} />
          <div className="bg-gray-100 text-gray-500 p-4 rounded-full mb-3"><UploadCloud className="w-7 h-7" /></div>
          <p className="text-sm font-medium text-gray-800 mb-1">{dragOver ? 'Solte aqui' : 'Arraste ou clique para selecionar'}</p>
          <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
            <span className="flex items-center gap-1"><FileAudio className="w-3.5 h-3.5" /> áudio</span>
            <span className="flex items-center gap-1"><FileVideo className="w-3.5 h-3.5" /> vídeo</span>
            <span className="flex items-center gap-1"><FileText  className="w-3.5 h-3.5" /> .txt</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Múltiplos arquivos · Máx. 25MB por arquivo</p>
        </div>

        {fileErrors.length > 0 && fileErrors.map((err, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{err}</span>
          </div>
        ))}

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
                <div className="flex items-center gap-2 overflow-hidden">
                  {getFileIcon(file)}
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{(file.size/1024/1024).toFixed(1)}MB</span>
                </div>
                <button onClick={e => { e.stopPropagation(); onRemoveFile(i); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Texto do atendimento</h2>
        <textarea
          value={rawText} onChange={onTextChange}
          placeholder={`Cole aqui o chat exportado do WhatsApp ou qualquer trecho da conversa...\n\nExemplo:\n[14/04/2026, 09:15] Cliente: Gostei, mas o preço parece alto\n[14/04/2026, 09:22] Você: Posso mostrar as opções de parcelamento`}
          className="w-full h-40 p-4 text-sm text-gray-700 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
        />

        <p className="text-xs text-gray-400">
          Timestamps do WhatsApp (ex: [14/04, 09:15]) são considerados automaticamente na análise.
        </p>
      </div>

      <button
        onClick={onSubmit}
        disabled={isProcessing || (files.length === 0 && !rawText.trim())}
        className="w-full py-3.5 bg-gray-900 text-white text-sm font-semibold rounded-xl shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
      >
        {isProcessing ? 'Analisando...' : 'Analisar Atendimento →'}
      </button>
    </>
  );
}
