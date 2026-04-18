import { z } from 'zod';

// ── Schema 1: Análise completa do Cliente ─────────────────────────────────────
// Jung (personalidade) + Momento de compra + como abordar
export const clientAnalysisSchema = z.object({

  // Perfil de personalidade (Jung)
  perfilJung: z.enum(['Pragmático', 'Analítico', 'Afável', 'Expressivo']).describe(
    'Perfil de personalidade dominante. Pragmático = Razão + Rápido. Analítico = Razão + Lento. Afável = Emoção + Lento. Expressivo = Emoção + Rápido.'
  ),
  eixoDecisao: z.enum(['Razão', 'Emoção']),
  eixoRitmo: z.enum(['Rápido', 'Lento']),
  perfilJungRazao: z.string().describe(
    'Em 1-2 frases: por que esse é o perfil Jung desse cliente? Cite o comportamento concreto observado. Ex: "Pediu proposta pronta e cortou explicações longas" não "parece ser pragmático".'
  ),

  // Perfil de momento de compra
  perfilMomento: z.enum([
    'Indeciso', 'Confuso', 'Decidido', 'Crítico',
    'Nervoso', 'Apressado', 'Negociador', 'Detalhista', 'Informal',
  ]).describe(
    'Estado comportamental do cliente neste atendimento. Indeciso = múltiplas objeções, insegurança. Confuso = não sabe expressar o que quer. Decidido = já pesquisou, veio para comprar. Crítico = questiona dados, não aceita opiniões. Nervoso = agressivo, tom elevado. Apressado = ritmo acelerado, corta explicações. Negociador = foca em preço e vantagem. Detalhista = faz perguntas profundas antes de avançar. Informal = leva para o lado pessoal, muito comunicativo.'
  ),
  perfilMomentoRazao: z.string().describe(
    'Em 1-2 frases: por que esse é o estado de compra desse cliente? Cite o comportamento ou fala específica que revela esse estado.'
  ),

  // Indicadores do momento
  clareza: z.enum(['Sabe o que quer', 'Parcialmente claro', 'Confuso']),
  temperamento: z.enum(['Calmo', 'Comunicativo', 'Crítico', 'Agressivo']),
  ritmo: z.enum(['Acelerado', 'Moderado', 'Lento']),
  focoValor: z.enum(['Resolver um problema', 'Relacionamento', 'Vantagem financeira']),

  // Contexto temporal da conversa
  contextoTemporal: z.enum(['Ativo', 'Resgate', 'Follow-up', 'Indefinido']).describe(
    'Ativo = conversa acontecendo agora ou muito recentemente (horas). Resgate = cliente que não fechou anteriormente e foi recontatado ou retomou contato. Follow-up = sequência após proposta ou orçamento enviado. Indefinido = sem dados suficientes para determinar.'
  ),
  contextoTemporalRazao: z.string().describe(
    'Em 1 frase: o que na conversa indica esse contexto? Cite timestamps, intervalos entre mensagens, menções a contatos anteriores ("como falamos", "o orçamento que mandei"), ou ausência total de referência temporal.'
  ),

  // Resumo combinado
  combinacao: z.string().describe(
    'A combinação dos dois perfis em formato simples. Ex: "Analítico + Detalhista" ou "Pragmático + Apressado".'
  ),
  confianca: z.enum(['Alta', 'Média', 'Baixa']).describe(
    'Alta = múltiplos sinais convergentes claros. Média = sinais presentes mas a conversa foi curta ou ambígua. Baixa = poucos dados.'
  ),
  evidencias: z.array(z.string()).min(2).describe(
    'Trechos literais da conversa que sustentam o perfil. Use colchetes para comportamentos implícitos: "[parou de responder após receber o preço]".'
  ),

  // Orientação de abordagem
  comoFalar: z.string().describe(
    'Como o vendedor deve calibrar tom, ritmo e linguagem para o perfil Jung desse cliente. Específico, sem jargões.'
  ),
  oqueFazer: z.string().describe(
    'O que o vendedor deve fazer agora para lidar com o estado de compra (Momento) desse cliente. Ação concreta, não conselho genérico.'
  ),
  alerta: z.string().describe(
    'O maior risco de perder a venda com esse perfil específico, baseado na conversa. Uma frase direta.'
  ),
});

// ── Schema 2: Avaliação do Vendedor ──────────────────────────────────────────
// Perfil natural + Fase 1 (comunicação) + Fase 2 (tática) + Veredito
export const vendorAnalysisSchema = z.object({

  // Perfil natural do vendedor
  perfilNatural: z.enum(['Pragmático', 'Analítico', 'Afável', 'Expressivo']).describe(
    'Perfil de personalidade natural que emerge do comportamento do vendedor, ignorando técnica treinada. Avalie o estilo espontâneo de comunicação.'
  ),
  eixoDecisao: z.enum(['Razão', 'Emoção']).describe('Eixo dominante de decisão do vendedor.'),
  eixoRitmo: z.enum(['Rápido', 'Lento']).describe('Eixo de ritmo natural do vendedor.'),
  perfilNaturalRazao: z.string().describe(
    'Em 1-2 frases: o que na conduta do vendedor revela esse perfil natural? Cite comportamento concreto observado na conversa.'
  ),
  evidenciasPerfilNatural: z.array(z.string()).min(1).describe(
    'Trechos ou comportamentos concretos do vendedor que revelam o perfil natural. Cite o que ele disse ou fez — não o que deixou de fazer.'
  ),
  aderenciaCliente: z.enum(['Alta', 'Média', 'Baixa']).describe(
    'Alta = estilos compatíveis, pouco esforço de adaptação necessário. Média = pequeno ajuste necessário. Baixa = conflito de estilo — vendedor precisa de esforço consciente para não errar.'
  ),
  conflitoPerfil: z.string().describe(
    'O que especificamente cria tensão entre o perfil natural do vendedor e o perfil do cliente? Em 1-2 frases concretas. Se aderência for Alta, descreva por que os estilos se complementam.'
  ),
  pontoCego: z.string().describe(
    'Dado o perfil natural do vendedor e o perfil do cliente, qual é o principal risco de conflito ou erro que esse vendedor está propenso a cometer nesse atendimento específico?'
  ),

  // Fase 1: Avaliação da comunicação (adaptou ao perfil Jung do cliente?)
  fase1: z.object({
    nota: z.enum(['Acertou', 'Parcial', 'Errou']).describe(
      'Acertou = adaptou tom, ritmo e linguagem ao perfil do cliente. Parcial = adaptou parcialmente. Errou = comunicou no próprio estilo, ignorando o perfil do cliente.'
    ),
    resumo: z.string().describe('Uma frase que resume o desempenho na fase 1.'),
    acertos: z.array(z.string()).describe('O que o vendedor fez certo na comunicação. Cite momento/trecho da conversa.'),
    erros: z.array(z.string()).describe('O que o vendedor fez errado na comunicação. Cite momento/trecho da conversa.'),
  }),

  // Fase 2: Avaliação da tática (aplicou o plano correto para o Momento do cliente?)
  fase2: z.object({
    nota: z.enum(['Acertou', 'Parcial', 'Errou']).describe(
      'Acertou = aplicou a tática correta para o estado de compra do cliente. Parcial = acertou em parte. Errou = usou tática errada para o Momento identificado.'
    ),
    resumo: z.string().describe('Uma frase que resume o desempenho na fase 2.'),
    acertos: z.array(z.string()).describe('O que o vendedor fez certo taticamente. Cite momento/trecho da conversa.'),
    erros: z.array(z.string()).describe('O que o vendedor fez errado taticamente. Cite momento/trecho da conversa.'),
  }),

  // Veredito final
  veredito: z.object({
    pontosForts: z.array(z.string()).describe('O que o vendedor fez bem nesse atendimento específico.'),
    pontosCorrecao: z.array(z.string()).describe('O que o vendedor precisa corrigir no próximo atendimento com esse perfil.'),
    acaoImediata: z.string().describe('A coisa mais importante que o vendedor deve fazer diferente agora ou na próxima interação.'),
    riscoPerda: z.enum(['Alta', 'Média', 'Baixa']).describe('Risco atual de perder a venda com base na avaliação.'),
  }),
});

// ── Schema 3: Sinais de Perda e Avanço ───────────────────────────────────────
export const signalsSchema = z.object({

  sinaisPerda: z.array(z.object({
    sinal: z.string().describe('Nome curto do sinal. Ex: "Objeção repetida sem resposta" ou "Cliente ficou monossilábico".'),
    evidencia: z.string().describe('Citação exata ou comportamento observado que revela o sinal. Precisa ser rastreável na conversa.'),
    causa: z.string().describe('O que o vendedor fez ou deixou de fazer que causou esse sinal.'),
    gravidade: z.enum(['Alta', 'Média', 'Baixa']),
  })).describe('Sinais de que a venda está em risco. Array vazio se não houver.'),

  sinaisAvanco: z.array(z.object({
    sinal: z.string().describe('Nome curto do sinal. Ex: "Cliente pediu condições de pagamento" ou "Objeções diminuíram".'),
    evidencia: z.string().describe('Citação exata ou comportamento que mostra avanço.'),
    causa: z.string().describe('O que o vendedor fez que gerou esse avanço.'),
  })).describe('Sinais de que a venda está progredindo. Array vazio se não houver.'),

  tendencia: z.enum(['Avançando', 'Estagnado', 'Em risco', 'Perdido']).describe(
    'Avançando = mais sinais de avanço que de perda, cliente engajado. Estagnado = sem movimento em nenhum sentido. Em risco = sinais de perda presentes, mas reversível. Perdido = sinais claros de desistência ou quebra de confiança.'
  ),
  momentoCritico: z.string().describe(
    'O momento exato da conversa onde tudo virou — para melhor ou para pior. Cite o trecho ou comportamento específico. Ex: "Na linha X, o cliente repetiu a objeção de prazo pela segunda vez e o vendedor ignorou — a partir daí as respostas ficaram monossilábicas."'
  ),
});

// ── Schema 5: Plano de Resgate ────────────────────────────────────────────────
export const rescueSchema = z.object({

  causaPrincipalPerda: z.string().describe(
    'A causa raiz da perda em 1-2 frases diretas. Cite o comportamento do vendedor e a reação do cliente que selou a perda. Não seja genérico.'
  ),
  perfilIdealResgate: z.enum(['Pragmático', 'Analítico', 'Afável', 'Expressivo']).describe(
    'Perfil de vendedor com maior compatibilidade para resgatar esse cliente. Baseado na matriz de aderência entre os perfis.'
  ),
  perfilIdealRazao: z.string().describe(
    'Por que esse perfil tem mais chance com esse cliente agora? 1-2 frases concretas.'
  ),
  janelaTemporal: z.string().describe(
    'Quando fazer o resgate? Ex: "Aguardar 3 a 5 dias — clientes Afáveis precisam esfriar antes de receber novo contato." Baseado no perfil Jung e no estado de Momento.'
  ),
  abordagemResgate: z.string().describe(
    'Como reabrir a conversa. Específico para o perfil Jung + Momento + contexto da perda. Não pode ser genérico.'
  ),
  mensagemResgate: z.string().describe(
    'Mensagem pronta para enviar no resgate. OBRIGATÓRIO: referencie algo da conversa original sem cobrar ou pressionar. Tom de reconexão genuína — 2 a 3 linhas. Sem "só passando para ver", sem "você decidiu?".'
  ),
  oqueEvitarNoResgate: z.array(z.string()).min(1).max(3).describe(
    'O que absolutamente não fazer na abordagem de resgate com esse perfil específico. Cada item em 1 frase.'
  ),
});

// ── Schema 4: Sales Intelligence Record — Recomendações ──────────────────────
export const sirSchema = z.object({

  oqueFazerAgora: z.string().describe(
    'A ação mais importante a executar agora, específica para a combinação de perfis desse atendimento. Não pode ser genérica.'
  ),
  argumentoRecomendado: z.string().describe(
    'O argumento específico com maior chance de funcionar para esse cliente agora, considerando o perfil Jung, o estado de Momento e os sinais detectados.'
  ),
  tipoFechamento: z.string().describe(
    'Como conduzir o fechamento com esse cliente. Baseado no perfil: direto, gradual, por validação, por eliminação de risco, etc.'
  ),
  mensagemPronta: z.string().describe(
    'Mensagem pronta para copiar e enviar. OBRIGATÓRIO: referencie algo específico que o cliente disse ou fez nessa conversa. Tom ajustado ao perfil. 2-4 linhas. Humana, sem pressão, sem script genérico.'
  ),
  oqueEvitar: z.array(z.object({
    comportamento: z.string().describe('O que não fazer.'),
    motivo: z.string().describe('Por que isso especificamente afasta ESSE cliente com ESSE perfil.'),
  })).min(2).max(4),

  resultadoSugerido: z.enum(['fechada', 'perdida', 'em_andamento']).describe(
    'Resultado desta conversa com base nas evidências concretas. ' +
    'fechada = venda explicitamente concluída nesta conversa (pagamento confirmado, contrato assinado, "pode mandar o boleto", "fechado"). ' +
    'perdida = venda explicitamente encerrada (cliente disse não, foi para concorrente, cancelou, ghosting definitivo após última tentativa). ' +
    'em_andamento = qualquer outro caso — conversa ativa, proposta aberta, follow-up pendente, cliente ainda avaliando.'
  ),
});
