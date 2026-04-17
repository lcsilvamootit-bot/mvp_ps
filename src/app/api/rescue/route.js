import { getOpenAI } from '@/lib/openai';
import { zodResponseFormat } from 'openai/helpers/zod.mjs';
import { rescueSchema } from '@/schemas';
import { getWorkspaceContext, buildContextBlock } from '@/lib/workspace';

export const runtime = 'nodejs';
export const maxDuration = 120;

const safeStringify = (obj) =>
  JSON.stringify(obj).replace(/[\u0080-\uFFFF]/g, (ch) =>
    `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`
  );

const ADERENCIA_MATRIX = {
  Pragmático: { Pragmático: 'Natural', Analítico: 'Risco alto', Afável: 'Risco alto', Expressivo: 'Risco médio' },
  Analítico:  { Pragmático: 'Risco alto', Analítico: 'Natural', Afável: 'Risco baixo', Expressivo: 'Risco alto' },
  Afável:     { Pragmático: 'Risco alto', Analítico: 'Risco baixo', Afável: 'Natural', Expressivo: 'Risco médio' },
  Expressivo: { Pragmático: 'Risco médio', Analítico: 'Risco alto', Afável: 'Risco médio', Expressivo: 'Natural' },
};

function buildRescueSystem(clientData, vendorData, signalsData, contextBlock = '') {
  const clientPerfil = clientData.perfilJung;
  const aderencias = ADERENCIA_MATRIX[clientPerfil] || {};
  const melhoresVendedores = Object.entries(aderencias)
    .filter(([, v]) => v === 'Natural' || v === 'Risco baixo')
    .map(([k]) => k)
    .join(', ');

  const ctx = contextBlock ? `${contextBlock}\n\n` : '';
  return `${ctx}Você é um especialista em psicologia comportamental aplicada a vendas e recuperação de negócios perdidos.

DIAGNÓSTICO DO ATENDIMENTO PERDIDO:

Cliente:
• Perfil Jung: ${clientData.perfilJung} (${clientData.eixoDecisao} + ${clientData.eixoRitmo})
• Perfil de Momento: ${clientData.perfilMomento}
• Combinação: ${clientData.combinacao}
• Contexto temporal: ${clientData.contextoTemporal} — ${clientData.contextoTemporalRazao}
• Alerta original: ${clientData.alerta}

Vendedor que perdeu a venda:
• Perfil natural: ${vendorData.perfilNatural}
• Aderência com o cliente: ${vendorData.aderenciaCliente}
• Conflito de estilo: ${vendorData.conflitoPerfil}
• Ponto cego: ${vendorData.pontoCego}
• Fase 1: ${vendorData.fase1.nota} — ${vendorData.fase1.resumo}
• Fase 2: ${vendorData.fase2.nota} — ${vendorData.fase2.resumo}

Sinais:
• Tendência: ${signalsData.tendencia}
• Momento crítico da perda: ${signalsData.momentoCritico}
• Sinais de perda detectados: ${signalsData.sinaisPerda.map(s => `${s.sinal} (${s.gravidade})`).join(', ') || 'nenhum registrado'}

PERFIS COM MELHOR ADERÊNCIA PARA ESSE CLIENTE (${clientPerfil}):
${melhoresVendedores || 'Nenhum perfil com aderência perfeita — adaptar o mais próximo'}

REGRAS DO PLANO DE RESGATE:
• A causa da perda deve citar o comportamento específico que selou a desistência.
• O perfil ideal de resgate deve considerar a matriz de aderência acima.
• A janela temporal deve ser calibrada ao perfil: Afável precisa esfriar (5-7 dias). Pragmático pode receber contato rápido (1-2 dias). Analítico respeita prazo (3-5 dias). Expressivo responde bem a contato rápido com novidade (1-2 dias).
• A mensagem de resgate NUNCA deve pressionar, cobrar ou mencionar que ele não fechou. Tom de reconexão genuína.
• Cite algo específico da conversa original na mensagem — não pode ser genérica.

LINGUAGEM: Português direto. Sem jargões. Para um vendedor sem formação técnica.`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { clientData, vendorData, signalsData, conversa } = body;

    if (!clientData || !vendorData || !signalsData) {
      return new Response(JSON.stringify({ error: 'Dados incompletos.' }), { status: 400 });
    }

    const workspaceCtx = await getWorkspaceContext();
    const contextBlock = buildContextBlock(workspaceCtx);
    const system = buildRescueSystem(clientData, vendorData, signalsData, contextBlock);
    const userMsg = conversa
      ? `Conversa original:\n\n${conversa.slice(0, 8000)}`
      : 'Conversa original não disponível — use os dados do diagnóstico para gerar o plano de resgate.';

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      temperature: 0,
      response_format: zodResponseFormat(rescueSchema, 'rescue'),
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: userMsg },
      ],
    });

    console.log(`[rescue] tokens: ${completion.usage?.total_tokens}`);
    const data = JSON.parse(completion.choices[0].message.content);

    return new Response(safeStringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[rescue]', err?.status, err?.message);
    return new Response(JSON.stringify({ error: 'Erro ao gerar plano de resgate.' }), { status: 500 });
  }
}
