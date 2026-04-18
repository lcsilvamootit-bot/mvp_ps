import { getOpenAI } from '@/lib/openai';
import { zodResponseFormat } from 'openai/helpers/zod.mjs';
import {
  clientAnalysisSchema,
  vendorAnalysisSchema,
  signalsSchema,
  sirSchema,
} from '@/schemas';
import { getWorkspaceContext, buildContextBlock } from '@/lib/workspace';

export const runtime = 'nodejs';
export const maxDuration = 300;

const EXT_TO_MIME = {
  mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4',
  ogg: 'audio/ogg', opus: 'audio/ogg', webm: 'audio/webm',
  mp4: 'video/mp4', mov: 'video/quicktime', mpeg: 'audio/mpeg',
};
const MAX_BYTES = 25 * 1024 * 1024;

function resolveType(file) {
  if (file.type && file.type !== 'application/octet-stream') return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return EXT_TO_MIME[ext] || '';
}
function isAudio(file) {
  const t = resolveType(file);
  return t.startsWith('audio/') || !!file.name.match(/\.(mp3|wav|m4a|ogg|opus|webm|mpeg)$/i);
}
function isVideo(file) {
  const t = resolveType(file);
  return t.startsWith('video/') || !!file.name.match(/\.(mp4|webm|mov)$/i);
}
async function toWhisperFile(file) {
  const type = resolveType(file);
  const buffer = await file.arrayBuffer();
  return new File([buffer], file.name, { type });
}

const safeStringify = (obj) =>
  JSON.stringify(obj).replace(/[\u0080-\uFFFF]/g, (ch) =>
    `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`
  );

async function gptCall(schema, schemaName, messages, temperature = 0) {
  try {
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      temperature,
      response_format: zodResponseFormat(schema, schemaName),
      messages,
    });
    const content = completion.choices[0].message.content;
    console.log(`[gpt:${schemaName}] finish_reason: ${completion.choices[0].finish_reason} | tokens: ${completion.usage?.total_tokens}`);
    return JSON.parse(content);
  } catch (err) {
    console.error(`[gpt:${schemaName}] status: ${err?.status} | message: ${err?.message}`);
    throw err;
  }
}

// ── System prompts ────────────────────────────────────────────────────────────

function buildSystemBase(contextBlock) {
  const ctx = contextBlock ? `${contextBlock}\n\n` : '';
  return `${ctx}Você é um especialista em psicologia comportamental aplicada a vendas.
Sua análise usa dois modelos complementares de perfil:

MODELO 1 — PERFIL DE PERSONALIDADE (quem a pessoa é):
• Pragmático (Razão + Rápido): assertivo, focado, detesta perder tempo, tom forte, gestos impositivos. Quer proposta pronta, vai direto ao ponto, não tolera prolixidade.
• Analítico (Razão + Lento): racional mas sem pressa, adora dados/tabelas/pesquisa, tom constante sem variação, gestos pensativos. Decide só depois de analisar tudo.
• Afável (Emoção + Lento): acolhedor, foca em relacionamento, tom suave, gestos contidos. É o cliente que oferece café. Não suporta pressão.
• Expressivo (Emoção + Rápido): agitado, o "pavão", alta variação de tom, gesticula muito, fala de amenidades. Quer ser o centro das atenções.

MODELO 2 — PERFIL DE MOMENTO DE COMPRA (estado atual):
• Indeciso: coloca múltiplas objeções, duvida se precisa ou se é a melhor opção.
• Confuso: não consegue expressar o que quer, responde vagamente.
• Decidido: já pesquisou, veio para comprar, focado em condições.
• Crítico: não aceita opiniões, questiona dados, quer parecer que sabe mais.
• Nervoso: tom elevado, postura de confronto, estressado, discute por qualquer coisa.
• Apressado: sem paciência, ritmo acelerado, tenta cortar explicações.
• Negociador: quer vantagem a todo custo, só fecha se sentir que ganhou mais que os outros.
• Detalhista: faz perguntas profundas, não avança sem certeza, quer tudo detalhado.
• Informal: muito simpático, leva o assunto para o lado pessoal, adora conversar.

ANÁLISE TEMPORAL (obrigatória quando houver timestamps):
A DATA DE HOJE é fornecida no início da conversa. Use-a para calcular intervalos reais.
• Compare a data da última mensagem com a data de hoje:
  - Mesma data ou até 1 dia atrás → Ativo
  - 2 a 7 dias atrás → provável Follow-up ou início de Resgate
  - Mais de 7 dias atrás → Resgate (salvo se houver proposta pendente → Follow-up)
• Intervalo entre mensagens do cliente: resposta imediata = engajado; demora crescente = desengajamento.
• Ghosting temporal: cliente parou de responder após uma mensagem específica = objeção comportamental.
• Cliente que retomou contato após sumir = Resgate — abordagem de reconexão, não de pressão.
• Se não houver timestamps na conversa e o tipo não foi informado → Indefinido.

REGRAS DE DESEMPATE (quando os sinais parecem misturados):
• Pragmático vs Afável: se o cliente foca em resultado/solução → Pragmático. Se foca em vínculo/confiança → Afável. São opostos — nunca misture.
• Pragmático vs Expressivo: ambos são rápidos. Pragmático é frio e objetivo. Expressivo é emocional e agitado.
• Analítico vs Detalhista: Analítico é o PERFIL Jung (quem ele é sempre). Detalhista é o MOMENTO (estado nessa compra). Podem coexistir.
• Na dúvida entre dois perfis Jung: escolha pelo eixo mais evidente. Se o tom é claramente emocional, é Afável ou Expressivo. Se é claramente racional, é Pragmático ou Analítico.

REGRA ABSOLUTA: Toda classificação precisa de evidência concreta da conversa.
Nunca classifique sem citar o trecho ou comportamento específico que justifica.

LINGUAGEM: Português claro e acessível. Sem siglas (SPIN, DISC, MEDDIC, GAP).
Sem nomes de metodologias. Escreva para um vendedor experiente sem formação em psicologia.`;
}

function buildClientSystem(SYSTEM_BASE) {
  return `${SYSTEM_BASE}

Sua tarefa: identificar o PERFIL COMPLETO DO CLIENTE nesse atendimento.
Em conversas WhatsApp, "Você" é o vendedor, o outro participante é o cliente.

Identifique:
1. Perfil Jung (personalidade estável): observe tom, ritmo, linguagem, gesticulação descrita.
2. Perfil de Momento (estado atual de compra): observe objeções, nível de clareza, temperamento, foco.
3. Contexto temporal (OBRIGATÓRIO): classifique o tipo de conversa com base em:
   - Timestamps presentes: calcule o intervalo entre mensagens e entre a conversa e hoje.
   - Referências a contatos anteriores: "como conversamos", "o orçamento que você mandou", "voltei para ver" = Resgate ou Follow-up.
   - Conversa iniciada do zero sem histórico = provável Ativo ou Indefinido.
   - Cliente que sumiu e retornou = Resgate.
   - Vendedor enviou proposta/orçamento e cliente respondeu = Follow-up.
   - Sem nenhum indicador temporal = Indefinido (nunca invente).

IMPORTANTE:
- Comportamentos implícitos também contam: ghosting, respostas monossilábicas, demora crescente, leitura sem resposta = objeções comportamentais.
- A combinação dos dois perfis (ex: "Analítico + Detalhista") é o diagnóstico completo.
- Se a conversa for curta, indique confiança Baixa ou Média.`;
}

function buildVendorSystem(SYSTEM_BASE, clientData) {
  return `${SYSTEM_BASE}

Sua tarefa: avaliar o DESEMPENHO DO VENDEDOR nesse atendimento em duas fases.
Em conversas WhatsApp, "Você" é o vendedor.

CONTEXTO DO CLIENTE (já identificado):
• Perfil Jung: ${clientData.perfilJung} (${clientData.eixoDecisao} + ${clientData.eixoRitmo})
• Perfil de Momento: ${clientData.perfilMomento}
• Combinação: ${clientData.combinacao}
• Como falar com esse cliente: ${clientData.comoFalar}
• O que fazer com esse cliente: ${clientData.oqueFazer}

PERFIL NATURAL DO VENDEDOR:
Identifique o perfil de personalidade natural do vendedor usando os mesmos 4 perfis Jung:
• Pragmático (Razão + Rápido): tom forte, direto, impositivo, sem rodeios
• Analítico (Razão + Lento): tom constante, metódico, se apoia em dados, gestos pensativos
• Afável (Emoção + Lento): tom suave, acolhedor, foca em relacionamento, contido
• Expressivo (Emoção + Rápido): animado, gesticula, alta variação de tom, fala de amenidades

Avalie o estilo ESPONTÂNEO do vendedor — o que ele faz naturalmente, não o que foi treinado.
Cite trechos concretos da conversa como evidência.

ADERÊNCIA COM O CLIENTE (perfil ${clientData.perfilJung}):
Vendedor ${clientData.perfilJung === 'Pragmático' ? 'Pragmático com cliente Pragmático = natural. Outros perfis = precisam adaptar ritmo ou linguagem.' :
clientData.perfilJung === 'Analítico' ? 'Analítico com Analítico = natural. Expressivo com Analítico = risco alto (energia demais). Pragmático com Analítico = risco alto (pressa demais).' :
clientData.perfilJung === 'Afável' ? 'Afável com Afável = natural. Pragmático com Afável = risco alto (frieza). Expressivo com Afável = risco médio (energia excessiva).' :
'Expressivo com Expressivo = natural. Analítico com Expressivo = risco alto (monotonia). Pragmático com Expressivo = risco médio (competição de assertividade).'}

FASE 1 — COMUNICAÇÃO: O vendedor adaptou o estilo ao perfil Jung do cliente?
Para cliente ${clientData.perfilJung}, o vendedor deveria:
${clientData.perfilJung === 'Pragmático' ? '• Ser direto, sem prolixidade, sem histórias longas, proposta pronta, cumprir horários.' : ''}
${clientData.perfilJung === 'Analítico' ? '• Fornecer dados, tabelas, fontes. Respeitar o ritmo de análise. Não apressar decisão.' : ''}
${clientData.perfilJung === 'Afável' ? '• Usar tom suave, focar em relacionamento, gestos contidos. Nunca pressionar.' : ''}
${clientData.perfilJung === 'Expressivo' ? '• Dar espaço para falar, acompanhar o dinamismo, ouvir amenidades. Usar repertório variado.' : ''}

FASE 2 — TÁTICA: O vendedor aplicou a tática correta para o Momento do cliente?
Para cliente ${clientData.perfilMomento}, o vendedor deveria:
${clientData.perfilMomento === 'Indeciso' ? '• Encaminhar ativamente a decisão, passar confiança, mostrar vantagens, não deixar sozinho.' : ''}
${clientData.perfilMomento === 'Confuso' ? '• Ter paciência, fazer perguntas simples, sugerir, guiar — não apenas concordar.' : ''}
${clientData.perfilMomento === 'Decidido' ? '• Ser objetivo, não demonstrar ansiedade para fechar, não criar fricção.' : ''}
${clientData.perfilMomento === 'Crítico' ? '• Ter calma, evitar discussões, fazer a decisão parecer do cliente.' : ''}
${clientData.perfilMomento === 'Nervoso' ? '• Ter jogo de cintura, ser sucinto e educado, entender a raiva, não se contaminar.' : ''}
${clientData.perfilMomento === 'Apressado' ? '• Ser muito rápido, fechar sem mostrar opções desnecessárias.' : ''}
${clientData.perfilMomento === 'Negociador' ? '• Mostrar abertura mas impor limites, lembrar da qualidade do serviço.' : ''}
${clientData.perfilMomento === 'Detalhista' ? '• Responder com profundidade e verdade, nunca ser superficial, apresentar todos os benefícios.' : ''}
${clientData.perfilMomento === 'Informal' ? '• Tratar com simpatia mas controlar o tempo, impor limites sutis para o lado pessoal.' : ''}

Avalie com evidências concretas da conversa. Cite os momentos específicos de acerto e erro.`;
}

function buildSignalsSystem(SYSTEM_BASE, clientData) {
  return `${SYSTEM_BASE}

Sua tarefa: identificar SINAIS DE PERDA e SINAIS DE AVANÇO nesse atendimento.
Em conversas WhatsApp, "Você" é o vendedor.

CONTEXTO DO CLIENTE:
• Perfil Jung: ${clientData.perfilJung}
• Perfil de Momento: ${clientData.perfilMomento}
• Combinação: ${clientData.combinacao}

SINAIS DE PERDA — busque por:
• Objeção repetida sem resposta direta do vendedor
• Cliente fica monossilábico ou para de engajar
• Tom do cliente esfria após proposta ou argumento
• Acúmulo de objeções novas ao longo da conversa
• Vendedor foi prolixo com Pragmático
• Vendedor foi superficial com Detalhista
• Vendedor demonstrou ansiedade com Decidido
• Vendedor perdeu controle do tempo com Informal
• Vendedor entrou em confronto com Crítico
• Ausência de próximo passo claro

SINAIS DE AVANÇO — busque por:
• Cliente usa primeira pessoa afirmativa ("eu prefiro", "faz sentido pra mim")
• Perguntas migram de resistência para operacional (prazo, pagamento, entrega)
• Número de objeções cai ao longo da conversa
• Cliente confirma entendimento em voz alta
• Cliente compartilha contexto pessoal relevante
• Cliente pede condições ou documentação
• Tom do cliente aquece após argumento

Identifique o MOMENTO CRÍTICO: o ponto exato onde a conversa virou — para melhor ou pior.
Cite o trecho específico.`;
}

function buildSIRSystem(SYSTEM_BASE, clientData, vendorData, signalsData) {
  return `${SYSTEM_BASE}

Sua tarefa: gerar as RECOMENDAÇÕES FINAIS do Sales Intelligence Record.
Em conversas WhatsApp, "Você" é o vendedor.

DIAGNÓSTICO COMPLETO JÁ FEITO:

Cliente:
• Perfil Jung: ${clientData.perfilJung} (${clientData.comoFalar})
• Perfil de Momento: ${clientData.perfilMomento} (${clientData.oqueFazer})
• Combinação: ${clientData.combinacao}
• Alerta: ${clientData.alerta}

Vendedor:
• Perfil natural: ${vendorData.perfilNatural}
• Fase 1: ${vendorData.fase1.nota} — ${vendorData.fase1.resumo}
• Fase 2: ${vendorData.fase2.nota} — ${vendorData.fase2.resumo}
• Risco de perda: ${vendorData.veredito.riscoPerda}
• Ação imediata: ${vendorData.veredito.acaoImediata}

Sinais:
• Tendência: ${signalsData.tendencia}
• Momento crítico: ${signalsData.momentoCritico}
• Sinais de perda: ${signalsData.sinaisPerda.map(s => s.sinal).join(', ') || 'nenhum'}
• Sinais de avanço: ${signalsData.sinaisAvanco.map(s => s.sinal).join(', ') || 'nenhum'}

CONTEXTO TEMPORAL DETECTADO: ${clientData.contextoTemporal}
Motivo: ${clientData.contextoTemporalRazao}

${clientData.contextoTemporal === 'Ativo' ? `REGRAS PARA ATENDIMENTO ATIVO:
• O cliente está engajado agora. Ação e mensagem devem ser imediatas.
• Mensagem pronta: tom direto, sem introdução longa. Responda o que está em aberto na conversa.
• oqueFazerAgora: ação para executar nos próximos minutos.` : ''}
${clientData.contextoTemporal === 'Resgate' ? `REGRAS PARA RESGATE:
• Cliente não fechou antes. Não mencione isso diretamente. Não pressione.
• Mensagem pronta: reative o interesse com algo novo — uma mudança, uma novidade, uma pergunta sobre a situação dele.
• Nunca use tom de cobrança. A primeira resposta dele é o objetivo, não o fechamento.
• oqueFazerAgora: como reabrir a conversa sem parecer desesperado.` : ''}
${clientData.contextoTemporal === 'Follow-up' ? `REGRAS PARA FOLLOW-UP:
• Proposta já foi enviada. O cliente está avaliando.
• Mensagem pronta: gere reação sem pressão. Pergunte sobre dúvidas ou mudanças na situação.
• Não repita os argumentos da proposta. Descubra o que está travando.
• oqueFazerAgora: como fazer o cliente se pronunciar sobre a proposta.` : ''}
${clientData.contextoTemporal === 'Indefinido' ? `REGRAS PARA CONTEXTO INDEFINIDO:
• Sem dados temporais claros. Calibre para o perfil de Momento detectado (${clientData.perfilMomento}).
• Mensagem pronta: tom neutro, sem assumir urgência ou relação anterior.` : ''}

Agora gere as recomendações finais. REGRAS GERAIS:
• A mensagem pronta DEVE referenciar algo específico que o cliente disse ou fez nessa conversa. Se for genérica, está errada.
• O argumento recomendado deve considerar o estado atual (${clientData.perfilMomento}) — não o que funcionaria em geral.
• O que evitar deve ser específico para ESSE perfil e ESSE contexto temporal, não uma lista genérica.

RESULTADO DA CONVERSA (resultadoSugerido):
Classifique o desfecho real desta conversa com base apenas no que aconteceu, não no que pode acontecer.
• fechada: há evidência explícita de fechamento nesta conversa ("fechado", "pode mandar o boleto", pagamento confirmado, contrato assinado).
• perdida: há evidência explícita de perda ("vou pensar e nunca mais respondeu após várias tentativas", "fui para outra empresa", cliente recusou definitivamente).
• em_andamento: qualquer outro caso — proposta aberta, cliente ainda avaliando, conversa ativa, follow-up pendente, sem desfecho claro.
Na dúvida, classifique como em_andamento.`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request) {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const send = async (event, status, label, data = null, fileKey = null) => {
    const payload = safeStringify({
      event, status, label,
      ...(data    && { data }),
      ...(fileKey && { fileKey }),
    });
    await writer.write(encoder.encode(`data: ${payload}\n\n`));
  };

  (async () => {
    try {
      // ── Parse do FormData ────────────────────────────────────────────────
      let formData;
      try { formData = await request.formData(); }
      catch {
        await send('error', 'error', 'Não foi possível ler os dados enviados.');
        return writer.close();
      }

      const rawText = (formData.get('rawText') || '').trim();
      const files = formData.getAll('files').filter(f => f.size > 0);

      for (const file of files) {
        if (file.size > MAX_BYTES) {
          await send('error', 'error', `"${file.name}" excede 25MB. Comprima ou exporte só o áudio.`);
          return writer.close();
        }
        if (!isAudio(file) && !isVideo(file) && !file.type.startsWith('text/')) {
          await send('error', 'error', `Formato de "${file.name}" não suportado.`);
          return writer.close();
        }
      }

      if (files.length === 0 && !rawText) {
        await send('error', 'error', 'Nenhum conteúdo enviado para análise.');
        return writer.close();
      }

      const audioFiles = files.filter(isAudio);
      const videoFiles = files.filter(isVideo);
      const textFiles  = files.filter(f => !isAudio(f) && !isVideo(f));
      const summary = [
        audioFiles.length && `${audioFiles.length} áudio(s)`,
        videoFiles.length && `${videoFiles.length} vídeo(s)`,
        textFiles.length  && `${textFiles.length} texto(s)`,
        rawText           && 'texto colado',
      ].filter(Boolean).join(', ');

      await send('upload', 'done', `Recebido: ${summary}`);

      // ── Transcrição ──────────────────────────────────────────────────────
      const context = [];
      if (rawText) context.push(`[Texto da conversa]:\n${rawText}`);

      for (const file of files) {
        if (isAudio(file) || isVideo(file)) {
          await send('transcribe', 'processing', `Transcrevendo ${file.name}...`, null, file.name);
          const whisperFile = await toWhisperFile(file);

          let done = false;
          for (let attempt = 1; attempt <= 2; attempt++) {
            try {
              const resp = await getOpenAI().audio.transcriptions.create({
                file: whisperFile, model: 'whisper-1', language: 'pt',
              });
              if (!resp.text?.trim() || resp.text.trim().length < 5) {
                await send('transcribe', 'error', `"${file.name}" vazio ou sem fala detectada.`, null, file.name);
                break;
              }
              context.push(`[Transcrição de ${file.name}]:\n${resp.text.trim()}`);
              await send('transcribe', 'done', `${file.name} transcrito`, null, file.name);
              done = true;
              break;
            } catch (err) {
              console.error(`[transcribe] ${file.name} | attempt ${attempt} | ${err?.status} | ${err?.message}`);
              if (attempt === 2) {
                const msg = err?.status === 429
                  ? `Serviço sobrecarregado ao transcrever "${file.name}". Tente novamente.`
                  : `Erro ao transcrever "${file.name}": ${err?.message || 'sem detalhes'}`;
                await send('transcribe', 'error', msg, null, file.name);
              } else {
                await new Promise(r => setTimeout(r, 3000));
              }
            }
          }
          void done;

        } else if (file.type.startsWith('text/')) {
          await send('transcribe', 'processing', `Lendo ${file.name}...`, null, file.name);
          const text = new TextDecoder('utf-8').decode(await file.arrayBuffer()).trim();
          context.push(`[Texto do arquivo ${file.name}]:\n${text}`);
          await send('transcribe', 'done', `${file.name} lido`, null, file.name);
        }
      }

      const fullContext = context.join('\n\n');
      if (!fullContext.trim() || fullContext.split(/\s+/).length < 5) {
        await send('error', 'error', 'Nenhum conteúdo foi transcrito com sucesso.');
        return writer.close();
      }

      const truncated = fullContext.length > 400000
        ? fullContext.slice(0, 400000) + '\n[conteúdo truncado]'
        : fullContext;

      const hoje = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo',
      });

      const metaPrefix = `[DATA DE HOJE: ${hoje}]\n\n`;

      const convMsg = {
        role: 'user',
        content: `${metaPrefix}Atendimento para análise:\n\n${truncated}`,
      };

      // ── Contexto do negócio (configurado pelo psicólogo) ─────────────────
      const workspaceCtx = await getWorkspaceContext();
      const contextBlock = buildContextBlock(workspaceCtx);
      const SYSTEM_BASE  = buildSystemBase(contextBlock);

      // ── Call 1: Análise do Cliente ───────────────────────────────────────
      await send('client', 'processing', 'Identificando perfil do cliente...');
      let clientData;
      try {
        clientData = await gptCall(clientAnalysisSchema, 'client', [
          { role: 'system', content: buildClientSystem(SYSTEM_BASE) },
          convMsg,
        ]);
        await send('client', 'done', `${clientData.combinacao} — confiança ${clientData.confianca}`, clientData);
      } catch (err) {
        await send('error', 'error', 'Erro ao identificar perfil do cliente. Tente novamente.');
        return writer.close();
      }

      // ── Calls 2A + 2B em paralelo: Vendedor + Sinais ─────────────────────
      await send('vendor', 'processing', 'Avaliando postura do vendedor...');
      await send('signals', 'processing', 'Detectando sinais de perda e avanço...');

      let vendorData, signalsData;

      const vendorPromise = gptCall(vendorAnalysisSchema, 'vendor', [
        { role: 'system', content: buildVendorSystem(SYSTEM_BASE, clientData) },
        convMsg,
      ]).then(async data => {
        await send('vendor', 'done',
          `Vendedor ${data.perfilNatural} — risco ${data.veredito.riscoPerda}`, data);
        return data;
      });

      const signalsPromise = gptCall(signalsSchema, 'signals', [
        { role: 'system', content: buildSignalsSystem(SYSTEM_BASE, clientData) },
        convMsg,
      ]).then(async data => {
        await send('signals', 'done', `Tendência: ${data.tendencia}`, data);
        return data;
      });

      try {
        [vendorData, signalsData] = await Promise.all([vendorPromise, signalsPromise]);
      } catch (err) {
        await send('error', 'error', 'Erro ao analisar vendedor ou sinais. Tente novamente.');
        return writer.close();
      }

      // ── Call 3: Sales Intelligence Record ───────────────────────────────
      await send('sir', 'processing', 'Gerando recomendações finais...');
      let sirData;
      try {
        sirData = await gptCall(sirSchema, 'sir', [
          { role: 'system', content: buildSIRSystem(SYSTEM_BASE, clientData, vendorData, signalsData) },
          convMsg,
        ]);
        await send('sir', 'done', 'Análise completa', sirData);
      } catch (err) {
        await send('error', 'error', 'Erro ao gerar recomendações. Tente novamente.');
        return writer.close();
      }

      await send('done', 'done', 'Análise concluída');
      writer.close();

    } catch (err) {
      console.error('[analyze] Erro inesperado:', err);
      try { await send('error', 'error', 'Erro interno. Tente novamente.'); } catch {}
      writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
