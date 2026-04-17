# Avaliação 360º do Vendedor
**Fonte:** Prompts integrados baseados nos vídeos 1 e 2
**Status:** Validado — base da lógica de avaliação de postura do vendedor

---

## Conceito

A avaliação do vendedor opera em **duas camadas sequenciais e complementares**:

| Fase | O que avalia | Baseado em |
|---|---|---|
| Fase 1 — Comunicação | A forma: tom, ritmo, linguagem corporal, repertório | 4 Perfis de Jung |
| Fase 2 — Tática | O conteúdo: como lidou com o estado de compra do cliente | 9 Perfis de Momento |

**O erro que a ferramenta detecta que avaliação humana normalmente não detecta:**
Um vendedor pode acertar a Fase 1 (identificou que o cliente era Afável, usou tom suave) e errar a Fase 2 (não percebeu que o cliente estava Confuso e foi simpático demais sem ser diretivo). A ferramenta pune a falta de adaptação dupla.

---

## Fase 1 — Avaliação da Comunicação (Primeiros 5 Minutos)

### Regras de ouro avaliadas

**Regra de Ouro da Abordagem:**
O vendedor parou de tratar o cliente como ele (vendedor) gostaria de ser tratado, e passou a tratá-lo como o cliente quer ser tratado?

**Uso dos Primeiros 5 Minutos:**
O vendedor utilizou os 5 minutos iniciais para mapear e classificar o cliente em um dos 4 perfis?

**Repertório:**
O vendedor demonstrou repertório variado e evitou o erro de achar que todo cliente quer falar de futebol, religião ou política?

---

### Critérios por perfil identificado no cliente

**Cliente Pragmático (Razão + Rápido)**

| Comportamento correto | Comportamento incorreto |
|---|---|
| Foi assertivo e focado | Foi prolixo |
| Evitou repetir histórias | Repetiu pontos já ditos |
| Cumpriu horários | Atrasou ou enrolou |
| Trouxe proposta pronta | Chegou sem proposta |

---

**Cliente Analítico (Razão + Lento)**

| Comportamento correto | Comportamento incorreto |
|---|---|
| Forneceu tabelas, pesquisas, dados concretos | Deu respostas vagas ou superficiais |
| Respeitou o ritmo de análise | Apressou a decisão |
| Trouxe fontes e comparativos | Baseou-se só em argumentos verbais |

---

**Cliente Afável (Emoção + Lento)**

| Comportamento correto | Comportamento incorreto |
|---|---|
| Usou tom de voz suave | Foi frio ou formal demais |
| Manteve gestos contidos | Foi impositivo ou agitado |
| Focou no relacionamento | Ignorou o aspecto humano |
| Respeitou o ritmo | Pressionou para fechar |

---

**Cliente Expressivo (Emoção + Rápido)**

| Comportamento correto | Comportamento incorreto |
|---|---|
| Acompanhou a alta inflexão de voz | Foi monótono |
| Deu espaço para o cliente falar | Competiu na conversa |
| Ouviu sobre família, interesses | Ignorou os assuntos pessoais |
| Usou repertório específico | Usou papo genérico (futebol com todos) |

---

## Fase 2 — Avaliação da Tática de Venda (Momento de Compra)

### Critérios por perfil de momento identificado no cliente

**Lidando com insegurança**

| Estado | Comportamento correto | Comportamento incorreto |
|---|---|---|
| Indeciso | Encaminhou ativamente o processo de decisão, mostrou vantagens, passou confiança | Deixou o cliente sozinho para decidir, ou pressionou sem construir confiança |
| Confuso | Teve paciência, fez perguntas simples, sugeriu algo que transmitiu segurança | Foi simpático mas pouco diretivo — não guiou a decisão |

**Lidando com foco e pressa**

| Estado | Comportamento correto | Comportamento incorreto |
|---|---|---|
| Decidido | Foi objetivo, não demonstrou ansiedade para fechar | Demonstrou ansiedade, criou desconforto no cliente |
| Apressado | Foi muito rápido, fechou sem mostrar opções desnecessárias | Tentou mostrar mais produtos, atrasou o fechamento |

**Lidando com atritos e negociações**

| Estado | Comportamento correto | Comportamento incorreto |
|---|---|---|
| Crítico | Teve calma, evitou discussões, fez a decisão parecer do cliente | Entrou em confronto, tentou "ganhar" o debate |
| Nervoso | Teve jogo de cintura, foi sucinto e educado, buscou entender a raiva | Deixou o estresse contaminar o atendimento |
| Negociador | Mostrou-se aberto mas impôs limites, lembrou da qualidade do serviço | Cedeu sem limite ou foi inflexível sem justificativa |

**Lidando com ritmos lentos**

| Estado | Comportamento correto | Comportamento incorreto |
|---|---|---|
| Detalhista | Forneceu respostas profundas, verdadeiras e completas, sem ser superficial | Foi superficial, gerou insegurança |
| Informal | Tratou com simpatia mas controlou o tempo, impôs limites para o lado pessoal | Perdeu o controle do tempo, deixou a conversa pessoal dominar |

---

## Prompt Unificado de Avaliação 360º

```
CONTEXTO E PAPEL:
Atue como Auditor Mestre de Qualidade em Vendas.
Analise a transcrição, o áudio e o vídeo do atendimento e avalie o vendedor
em duas frentes complementares:
(1) adequação de perfil de comunicação — baseado nos 4 Perfis de Jung
(2) resolução situacional — baseado nos 9 Tipos de Cliente

---

FASE 1 — AVALIAÇÃO DA COMUNICAÇÃO (Primeiros 5 Minutos)
Objetivo: verificar se o vendedor parou de tratar as pessoas como ele acha
que devem ser tratadas e passou a tratá-las como elas querem ser tratadas.

Identifique o perfil do cliente e avalie se o vendedor:

CLIENTE PRAGMÁTICO (Razão + Rápido):
- Cumpriu horários?
- Evitou histórias longas e prolixidade?
- Entregou proposta pronta de forma rápida?

CLIENTE ANALÍTICO (Razão + Lento):
- Forneceu dados, tabelas, fontes, sites?
- Respeitou o ritmo constante e pensativo?

CLIENTE AFÁVEL (Emoção + Lento):
- Usou tom de voz suave?
- Manteve gestos contidos?
- Focou no relacionamento?

CLIENTE EXPRESSIVO (Emoção + Rápido):
- Acompanhou a alta inflexão de voz?
- Deu espaço para o cliente falar?
- Usou repertório específico (não genérico)?

---

FASE 2 — AVALIAÇÃO DA TÁTICA DE VENDA (Momento de Compra)
Identifique o estado de compra do cliente e avalie se o vendedor:

INDECISOS ou CONFUSOS:
- Teve paciência e fez perguntas simples?
- Passou confiança e encaminhou ativamente a decisão?

DECIDIDOS ou APRESSADOS:
- Foi rápido e objetivo?
- Evitou demonstrar ansiedade ou mostrar opções desnecessárias?

CRÍTICOS:
- Teve tolerância, evitou discussões?
- Conduziu para que a decisão parecesse vir do cliente?

NERVOSOS E GROSSEIROS:
- Manteve jogo de cintura, foi educado e sucinto?
- Buscou entender a origem da agressividade?

NEGOCIADORES:
- Mostrou-se aberto mas impôs limites claros?
- Lembrou o cliente sobre a qualidade do serviço?

DETALHISTAS:
- Forneceu informações profundas, verdadeiras e completas?
- Evitou ser superficial?

INFORMAIS E COMUNICATIVOS:
- Foi simpático mas controlou o tempo?
- Impôs limites para não deixar o lado pessoal dominar?

---

SAÍDA OBRIGATÓRIA (formato JSON):
{
  "diagnostico_cliente": {
    "perfil_jung": "<Pragmático|Analítico|Afável|Expressivo>",
    "perfil_momento": "<Indeciso|Confuso|Decidido|Crítico|Nervoso|Apressado|Negociador|Detalhista|Informal>",
    "combinacao": "<Perfil Jung> + <Perfil Momento>"
  },
  "fase1_comunicacao": {
    "nota": "<Acertou|Parcial|Errou>",
    "acertos": ["<trecho ou comportamento observado>"],
    "erros": ["<trecho ou comportamento incorreto>"],
    "evidencias": ["<citação da transcrição ou sinal de áudio/vídeo>"]
  },
  "fase2_tatica": {
    "nota": "<Acertou|Parcial|Errou>",
    "acertos": ["<trecho ou comportamento observado>"],
    "erros": ["<trecho ou comportamento incorreto>"],
    "evidencias": ["<citação da transcrição ou sinal de áudio/vídeo>"]
  },
  "veredito": {
    "pontos_fortes": ["<o que o vendedor fez bem>"],
    "pontos_de_melhoria": ["<o que deve ser corrigido>"],
    "acao_imediata": "<o que o vendedor deve fazer diferente no próximo atendimento com esse perfil>",
    "risco_de_perda": "<Alta|Média|Baixa>"
  }
}

DADOS DE ENTRADA:
[transcrição da conversa]
[sinais de áudio: tom, ritmo, volume, inflexão]
[sinais visuais: gestos, postura, expressão]
```

---

## Como o produto usa essa avaliação

### Por atendimento

Cada atendimento gera:
1. Classificação do cliente (Jung + Momento)
2. Avaliação do vendedor (Fase 1 + Fase 2)
3. Veredito com evidências rastreáveis

### Ao longo do tempo

O acúmulo de avaliações permite ao produto responder:

- Qual vendedor tem melhor adaptação de comunicação (Fase 1)?
- Qual vendedor tem melhor resolução situacional (Fase 2)?
- Qual vendedor tem dificuldade com qual combinação de perfil?
- Quais erros são recorrentes por vendedor?

### Para coaching

O relatório não diz "você foi ruim". Diz:

> "Acertou ao usar tom suave com o cliente Afável (Fase 1), mas errou ao não perceber que ele estava Confuso e precisava de perguntas diretas para se sentir guiado (Fase 2). Próxima vez com esse perfil: após criar o vínculo, assuma o papel de guia com perguntas simples."

Isso é coaching cirúrgico baseado em evidência — não avaliação subjetiva do gestor.

### Para ramp-up de vendedores novos

O produto consegue identificar quais combinações de perfil o vendedor ainda não domina e priorizar treinamento nessas combinações antes que virem padrão de perda.

---

## Relação com os outros documentos de taxonomia

| Documento | Conteúdo |
|---|---|
| `taxonomia_perfis_cliente.md` | 4 perfis de Jung — quem é o cliente |
| `taxonomia_perfis_momento_compra.md` | 9 perfis de momento — estado de compra do cliente |
| `taxonomia_integracao_perfis.md` | Como usar os dois juntos na prática |
| `avaliacao_vendedor.md` (este) | Como avaliar se o vendedor aplicou os dois corretamente |

---

## O que ainda falta

- [ ] Perfil de personalidade do vendedor (análogo ao modelo Jung para clientes) — não estava nos vídeos
- [ ] Critérios de aderência vendedor-cliente (qual combinação de perfis funciona melhor)
- [ ] Sinais de perda e sinais de avanço específicos por combinação (virá do histórico real)
- [ ] Exemplos de atendimentos bons e ruins anotados (base de fine-tuning)
