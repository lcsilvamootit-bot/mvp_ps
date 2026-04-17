# Taxonomia de Perfis de Cliente
**Fonte:** Vídeo 1 — Prof. Carlos Júlio (baseado em Carl Jung)
**Status:** Validado — pronto para uso no prompt de análise

---

## Fundamento teórico

Baseado em Carl Jung e psicologia comportamental. Duas variáveis principais cruzadas em matriz 2x2:

- **Eixo 1 — Decisão:** Razão (lógica, dados, assertividade) vs. Emoção (relacionamento, sentimentos)
- **Eixo 2 — Ritmo:** Rápido (ágil, decide na hora) vs. Lento (analisa com calma, usa o tempo)

**Regra de ouro:** não tratar todos os clientes da mesma forma. Tratar como o cliente quer ser tratado, não como o vendedor acha que ele quer.

**Janela de identificação:** primeiros 5 minutos de interação.

---

## Os 4 Perfis

### 1. Pragmático (Razão + Rápido)

**Quem é:**
Assertivo, focado, decide rápido com base em informações. Detesta perder tempo.

**Sinais de identificação:**

| Canal | Sinal |
|---|---|
| Áudio / voz | Tom forte, assertivo |
| Vídeo / corpo | Gestos impositivos |
| Texto / comportamento | Direto, sem rodeios, não repete assuntos, quer proposta pronta |

**O que evitar:**
- Ser prolixo (falar demais)
- Repetir histórias
- Chegar sem proposta definida
- Atrasar

**Táticas:**
- Ser extremamente direto
- Cumprir horários rigorosamente
- Levar a proposta pronta para avaliação rápida
- Ir ao ponto imediatamente

---

### 2. Analítico (Razão + Lento)

**Quem é:**
Racional como o Pragmático, mas sem pressa. Analisa cuidadosamente antes de agir. Adora dados, tabelas, pesquisas, sites.

**Sinais de identificação:**

| Canal | Sinal |
|---|---|
| Áudio / voz | Tom constante, sem variação de entonação |
| Vídeo / corpo | Gestos pensativos |
| Texto / comportamento | Pede dados, faz perguntas técnicas, menciona pesquisas, levanta informações antes de decidir |

**O que evitar:**
- Pressionar para decisão rápida
- Apresentar dados imprecisos
- Pular etapas de análise

**Táticas:**
- Alimentar com dados concretos, pesquisas e tabelas
- Respeitar o ritmo — dar tempo para processar antes de pedir decisão
- Trazer benchmarks, comparativos, fontes

---

### 3. Afável (Emoção + Lento)

**Quem é:**
Age mais com o coração do que com a razão. Ritmo tranquilo. Extremamente acolhedor, simpático. É o cliente que oferece café e recebe com alegria.

**Sinais de identificação:**

| Canal | Sinal |
|---|---|
| Áudio / voz | Tom suave |
| Vídeo / corpo | Gestos contidos, calmos |
| Texto / comportamento | Palavras gentis, foco em relacionamento, pergunta sobre o vendedor, sem pressa para fechar |

**O que evitar:**
- Pressão de qualquer tipo
- Abordagem muito formal ou fria
- Focar só no produto sem criar conexão

**Táticas:**
- Manter abordagem suave, simpática e sem pressão
- Conectar-se de forma humana primeiro
- Respeitar o tempo — não empurrar para decisão

---

### 4. Expressivo (Emoção + Rápido)

**Quem é:**
Agitado, faz várias coisas ao mesmo tempo. Alta expressividade verbal e corporal. O perfil "pavão" — gosta de ser o centro das atenções. Fala de futebol, família, assuntos gerais.

**Sinais de identificação:**

| Canal | Sinal |
|---|---|
| Áudio / voz | Alta inflexão — muda muito o tom, dinâmico, animado |
| Vídeo / corpo | Gestos fartos e abundantes (gesticula muito) |
| Texto / comportamento | Fala de assuntos pessoais, desvia do foco, quer ser ouvido |

**O que evitar:**
- Tentar competir na conversa
- Ser frio ou muito técnico
- Erro clássico: achar que todo cliente é expressivo e tentar falar de futebol com todos

**Táticas:**
- Dar espaço para ele falar e ser o centro das atenções
- Usar repertório variado — não só futebol ou política
- Conduzi-lo suavemente de volta ao foco quando necessário

---

## Matriz Visual

```
                    RAZÃO
                      |
         ANALÍTICO    |    PRAGMÁTICO
           (lento)    |      (rápido)
                      |
LENTO ────────────────┼──────────────── RÁPIDO
                      |
           AFÁVEL     |    EXPRESSIVO
           (lento)    |      (rápido)
                      |
                   EMOÇÃO
```

---

## Prompt estruturado para análise de IA

Baseado no material do vídeo, adaptado para uso no Sales Copilot:

```
CONTEXTO E PAPEL:
Atue como especialista em psicologia de vendas e comportamento do consumidor.
Sua tarefa é analisar os dados de interação com o cliente e classificá-lo em um
dos 4 perfis da matriz comportamental.

EIXOS DE ANÁLISE:
- Fator Decisão: o cliente foca mais em Razão (lógica, dados, eficiência) ou
  Emoção (relacionamento, sentimentos, contexto pessoal)?
- Fator Ritmo: o cliente é Rápido (ágil, decide na hora, agitado) ou Lento
  (analisa com calma, usa o tempo, não tem pressa)?

SINAIS POR PERFIL:

PRAGMÁTICO (Razão + Rápido):
- Voz: tom forte, assertivo
- Corpo: gestos impositivos
- Texto: direto, sem rodeios, quer proposta pronta, detesta repetição e perda de tempo

ANALÍTICO (Razão + Lento):
- Voz: tom constante, sem variação de entonação
- Corpo: gestos pensativos
- Texto: pede dados, faz perguntas técnicas, menciona pesquisas, quer comparativos

AFÁVEL (Emoção + Lento):
- Voz: tom suave
- Corpo: gestos contidos e calmos
- Texto: palavras gentis, foco em relacionamento, acolhedor, sem pressa

EXPRESSIVO (Emoção + Rápido):
- Voz: alta variação de tom, dinâmico, animado
- Corpo: gestos fartos e abundantes
- Texto: fala de assuntos pessoais (família, futebol), desvia do foco, quer ser ouvido

SAÍDA OBRIGATÓRIA (formato JSON):
{
  "perfil_identificado": "<Pragmático|Analítico|Afável|Expressivo>",
  "confiança": "<Alta|Média|Baixa>",
  "evidências": {
    "voz": "<trecho ou sinal identificado>",
    "corpo": "<gesto ou postura identificada>",
    "texto": ["<citação 1>", "<citação 2>"]
  },
  "eixo_decisao": "<Razão|Emoção>",
  "eixo_ritmo": "<Rápido|Lento>",
  "plano_de_acao": {
    "fazer": ["<ação 1>", "<ação 2>"],
    "evitar": ["<item 1>", "<item 2>"],
    "argumento_recomendado": "<argumento específico para esse perfil>"
  }
}

DADOS DE ENTRADA:
[transcrição da conversa]
[sinais de áudio: modulação, volume, ritmo de fala]
[sinais visuais: gestos, postura, expressão]
```

---

## O que ainda falta para completar a taxonomia

- [ ] Perfis de vendedor (esperado no vídeo 2)
- [ ] Sinais de aderência / conflito vendedor-cliente
- [ ] Objeções típicas por perfil de cliente
- [ ] Argumentos vencedores por perfil de cliente (virá do histórico real)
