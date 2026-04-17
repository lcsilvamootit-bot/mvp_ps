# Taxonomia de Perfis de Momento de Compra
**Fonte:** Vídeo 2 — 9 Perfis Comportamentais
**Status:** Validado — pronto para uso no prompt de análise

---

## Fundamento

Diferente do modelo de Jung (personalidade estável), este modelo foca no **estado do cliente no momento da compra** — suas necessidades, expectativas e comportamento durante o atendimento. Um mesmo cliente pode ter personalidade Analítica (vídeo 1) e estar em estado Indeciso (vídeo 2) naquele momento específico.

**4 indicadores de análise:**
1. **Clareza:** sabe o que quer ou está perdido/inseguro?
2. **Temperamento:** calmo, comunicativo, crítico ou agressivo?
3. **Ritmo de compra:** tem pressa ou precisa de tempo e detalhes?
4. **Foco de valor:** resolver um problema, relacionamento ou vantagem financeira?

---

## Os 9 Perfis

### 1. Indeciso

**Comportamento:** Inseguro, duvida se precisa do produto ou se a marca é a melhor.

**Sinais:**
- Coloca diversas objeções durante a conversa
- Volta em pontos já respondidos
- Não avança sozinho para a decisão

**Plano de ação:**
- Mostrar vantagens concretas
- Passar confiança (não pressão)
- Encaminhar ativamente o processo de decisão

---

### 2. Confuso

**Comportamento:** Tem ideia vaga do que deseja, não demonstra segurança.

**Sinais:**
- Não consegue se expressar de forma objetiva
- Não sabe explicar a própria dúvida ou problema
- Responde vagamente quando questionado

**Plano de ação:**
- Ter paciência
- Fazer perguntas simples e diretas
- Sugerir algo que atenda à necessidade percebida
- Transmitir segurança — o vendedor assume o papel de guia

---

### 3. Decidido

**Comportamento:** Já estudou o produto, visitou concorrentes, veio para comprar.

**Sinais:**
- Direto ao ponto
- Focado na aquisição
- Faz poucas perguntas, geralmente sobre condições

**Plano de ação:**
- Ser objetivo
- Não demonstrar ansiedade para fechar — isso deixa o cliente desconfortável
- Não criar fricção desnecessária no processo

---

### 4. Crítico

**Comportamento:** Não aceita outras opiniões, quer demonstrar que sabe mais.

**Sinais:**
- Questiona os dados apresentados
- Contesta argumentos do vendedor
- Pode ser difícil de negociar

**Plano de ação:**
- Ter calma e tolerância
- Evitar discussões diretas
- Fazer com que a decisão final pareça ter vindo inteiramente dele

---

### 5. Nervoso e Grosseiro

**Comportamento:** Agressividade, discute por qualquer coisa — relevante ou não.

**Sinais:**
- Tom de voz elevado (áudio)
- Postura de confronto (vídeo)
- Estressado desde o início do atendimento

**Plano de ação:**
- Ter jogo de cintura
- Entender o motivo da raiva antes de reagir
- Ser sucinto e educado
- Não deixar o estresse contaminar o atendimento

---

### 6. Apressado e Ansioso

**Comportamento:** Sem paciência para aguardar, geralmente já decidiu o que quer.

**Sinais:**
- Ritmo acelerado (áudio/vídeo)
- Tenta cortar explicações longas
- Respostas curtas, impaciência visível

**Plano de ação:**
- Ser muito rápido
- Fechar a venda sem tentar mostrar outras opções
- Não desperdiçar o tempo dele

---

### 7. Negociador

**Comportamento:** Quer vantagens a todo custo.

**Sinais:**
- Só fecha se sentir que teve mais benefícios do que outros clientes
- Foca em preço, desconto ou condições especiais
- Compara com concorrentes para criar pressão

**Plano de ação:**
- Mostrar-se aberto a negociar
- Impor limites claros
- Lembrar que o preço é relativo à qualidade do serviço/produto

---

### 8. Sem Pressa e Detalhista

**Comportamento:** Passa muito tempo buscando o máximo de informações, difícil de persuadir.

**Sinais:**
- Faz perguntas profundas
- Exige respostas detalhadas
- Não avança sem ter certeza de que a compra vale a pena

**Plano de ação:**
- Responder com profundidade e verdade — não ser superficial
- Apresentar todos os benefícios
- Respeitar o ritmo — não apressar

---

### 9. Informal e Comunicativo

**Comportamento:** Sente-se em casa, adora conversar.

**Sinais:**
- Muito simpático (vídeo/áudio)
- Tenta levar o assunto para o lado pessoal
- Gosta de criar vínculo antes de comprar

**Plano de ação:**
- Tratar com simpatia
- Não dar muita liberdade para o lado pessoal
- Conduzir de volta ao foco sem ser brusco — o atendimento não pode se estender a ponto de prejudicar outras vendas

---

## Prompt estruturado para análise de IA

```
CONTEXTO E PAPEL:
Atue como especialista em análise de comportamento do consumidor.
Analise os dados de interação e classifique o cliente em um dos 9 perfis
de momento de compra.

INDICADORES DE ANÁLISE:
1. Clareza: o cliente sabe o que quer ou está perdido/inseguro?
2. Temperamento: calmo, comunicativo, crítico ou agressivo?
3. Ritmo de compra: tem pressa ou precisa de tempo e detalhes?
4. Foco de valor: resolver um problema, relacionamento ou vantagem financeira?

PERFIS E SINAIS:

INDECISO: múltiplas objeções, insegurança, dificuldade de avançar
CONFUSO: não sabe explicar o que quer, responde vagamente
DECIDIDO: direto, focado em condições, já pesquisou antes
CRÍTICO: questiona dados, não aceita opiniões, quer parecer que sabe mais
NERVOSO: tom elevado, postura de confronto, agressividade
APRESSADO: ritmo acelerado, corta explicações, impaciência visível
NEGOCIADOR: foca em preço/desconto/vantagem, compara com concorrentes
DETALHISTA: faz perguntas profundas, exige respostas completas, não avança sem certeza
INFORMAL: muito simpático, leva para o lado pessoal, quer criar vínculo

SAÍDA OBRIGATÓRIA (formato JSON):
{
  "perfil_momento": "<nome do perfil>",
  "confiança": "<Alta|Média|Baixa>",
  "indicadores": {
    "clareza": "<sabe o que quer|parcialmente claro|confuso>",
    "temperamento": "<calmo|comunicativo|crítico|agressivo>",
    "ritmo": "<acelerado|moderado|lento>",
    "foco_valor": "<resolução de problema|relacionamento|vantagem financeira>"
  },
  "evidências": ["<citação ou sinal 1>", "<citação ou sinal 2>"],
  "plano_de_acao": {
    "abordagem": "<orientação específica para o perfil>",
    "fazer": ["<ação 1>", "<ação 2>"],
    "evitar": ["<item 1>", "<item 2>"]
  }
}

DADOS DE ENTRADA:
[transcrição da conversa]
[sinais de áudio: tom, ritmo, volume]
[sinais visuais: postura, expressão, gesticulação]
```

---

## Relação com os 4 perfis de Jung (vídeo 1)

Os dois modelos são complementares, não concorrentes:

| Modelo | O que responde |
|---|---|
| 4 perfis de Jung | "Que tipo de pessoa é esse cliente?" (traço estável de personalidade) |
| 9 perfis de momento | "Em que estado esse cliente está agora?" (estado situacional de compra) |

**Exemplos de combinação:**
- Analítico + Detalhista → precisa de dados E de tempo. Dar tabelas completas e não pressionar.
- Pragmático + Apressado → quer decisão rápida e proposta pronta. Ir direto e fechar rápido.
- Afável + Informal → quer relacionamento. Criar conexão, mas conduzir para o fechamento.
- Expressivo + Crítico → quer atenção E quer parecer que sabe mais. Dar palco e deixar a decisão parecer dele.

**O produto usa os dois modelos em paralelo** — a classificação completa de um cliente é: `Perfil Jung + Perfil Momento`.
