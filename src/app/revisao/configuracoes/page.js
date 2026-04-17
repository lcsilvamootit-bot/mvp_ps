'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Settings } from 'lucide-react';

const SETORES = [
  'Seguros de saúde',
  'Seguros auto',
  'Seguros de vida',
  'Previdência privada',
  'Consórcio',
  'Imóveis',
  'Outro',
];

const TICKETS = [
  'Até R$500/mês',
  'R$500 a R$2.000/mês',
  'Acima de R$2.000/mês',
  'Venda única até R$10.000',
  'Venda única R$10.000–50.000',
  'Venda única acima de R$50.000',
];

const CICLOS = [
  'Decisão no mesmo dia',
  '2 a 7 dias',
  '1 a 4 semanas',
  'Mais de 1 mês',
];

export default function Configuracoes() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const [form, setForm] = useState({
    setor: '',
    produto: '',
    ticketMedio: '',
    cicloDecisao: '',
    perfilCliente: '',
    concorrentes: '',
    objecoes: '',
    observacao: '',
  });
  const [updatedBy, setUpdatedBy] = useState('');
  const [status, setStatus] = useState(null); // null | 'saving' | 'saved' | 'error'
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetch('/api/settings', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setForm(f => ({ ...f, ...data })))
      .catch(() => setLoadError(true));
  }, []);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setStatus('saving');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, updatedBy }),
      });
      setStatus(res.ok ? 'saved' : 'error');
      if (res.ok) setTimeout(() => setStatus(null), 3000);
    } catch {
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-black">SI</div>
        <span className="text-base font-bold text-gray-900">Sales Intelligence</span>
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Configurações</span>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/revisao" className="text-sm text-blue-700 hover:underline">
            Painel
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 border border-gray-200 rounded-md px-3 py-1 hover:bg-gray-50"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-gray-500" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Contexto do negócio</h1>
            <p className="text-sm text-gray-500">
              Essas informações são injetadas em todas as análises de IA para tornar as recomendações específicas para esse mercado.
            </p>
          </div>
        </div>

        {loadError && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Não foi possível carregar as configurações salvas.
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mercado</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Setor principal">
              <select value={form.setor} onChange={set('setor')}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-white">
                <option value="">Selecione...</option>
                {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>

            <Field label="Ticket médio">
              <select value={form.ticketMedio} onChange={set('ticketMedio')}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-white">
                <option value="">Selecione...</option>
                {TICKETS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Produto principal" hint="Ex: Plano de saúde pessoa física e PME">
            <input type="text" value={form.produto} onChange={set('produto')}
              placeholder="Descreva o produto ou serviço principal vendido..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
          </Field>

          <Field label="Ciclo de decisão típico">
            <select value={form.cicloDecisao} onChange={set('cicloDecisao')}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-white">
              <option value="">Selecione...</option>
              {CICLOS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Perfil do cliente</p>

          <Field label="Perfil típico" hint="Classe social, faixa etária, tipo de empresa, região...">
            <textarea value={form.perfilCliente} onChange={set('perfilCliente')} rows={3}
              placeholder="Ex: Famílias classe média, 30–50 anos, periferia de SP. Decisão envolve cônjuge."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none" />
          </Field>

          <Field label="Principais concorrentes" hint="Quem o cliente costuma comparar ou mencionar">
            <input type="text" value={form.concorrentes} onChange={set('concorrentes')}
              placeholder="Ex: Amil, Bradesco Saúde, Unimed local"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
          </Field>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Inteligência de vendas</p>

          <Field label="Objeções mais comuns nesse mercado"
            hint="Liste as objeções que aparecem com mais frequência — a IA usará isso para calibrar os alertas">
            <textarea value={form.objecoes} onChange={set('objecoes')} rows={4}
              placeholder={"1. Preço alto comparado ao plano atual\n2. Precisa consultar o cônjuge\n3. Vai pensar e retorna depois"}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none" />
          </Field>

          <Field label="Observações adicionais"
            hint="Sazonalidade, contexto do mercado, particularidades da corretora...">
            <textarea value={form.observacao} onChange={set('observacao')} rows={3}
              placeholder="Ex: Em março, reajustes anuais aumentam volume de resgates. Clientes PME decidem pelo RH."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none" />
          </Field>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-600 block mb-1">Salvo por</label>
            <input type="text" value={updatedBy} onChange={e => setUpdatedBy(e.target.value)}
              placeholder="Seu nome (opcional)"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
          </div>
          <button
            onClick={handleSave}
            disabled={status === 'saving'}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {status === 'saving' ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>

        {status === 'saved' && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Configurações salvas. Todas as próximas análises usarão esse contexto.
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Erro ao salvar. Tente novamente.
          </div>
        )}

        <div className="pb-6 text-center">
          <a href="/revisao" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            ← Voltar ao painel
          </a>
        </div>
      </div>
    </main>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {children}
    </div>
  );
}
