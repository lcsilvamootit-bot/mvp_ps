# Sinais de Perda e de Avanço por Perfil
**Fonte:** Derivado dos vídeos 1 e 2 — comportamentos e reações por tipo de cliente
**Status:** Validado — base da lógica de detecção de risco e oportunidade

---

## Fundamento

Os sinais não aparecem isolados nos materiais com esse nome, mas emergem das descrições de erro e acerto por perfil. O sinal é sempre uma **reação do cliente ao comportamento do vendedor** — não uma ação isolada do cliente.

> Identificar esses sinais exige prestar atenção não apenas ao que o cliente diz, mas à **forma como ele reage** às informações e ao ritmo da negociação.

---

## Sinais de Perda

Comportamentos e reações que indicam que a venda está em risco.

| Sinal | Perfil do cliente | O que aconteceu | Grau de risco |
|---|---|---|---|
| Acúmulo de objeções | Indeciso | Cliente coloca diversas objeções e duvida se o produto é a melhor resposta — sinal claro de insegurança crescente | Alto |
| Desconforto visível | Decidido | Vendedor demonstrou ansiedade para fechar — cliente fica desconfortável e pode desistir na hora | Alto |
| Insegurança crescente | Detalhista | Vendedor foi superficial ou não apresentou informações profundas e verdadeiras — cliente perde confiança | Alto |
| Afastamento | Pragmático | Vendedor foi prolixo, repetiu histórias ou chegou sem proposta pronta — cliente perde interesse | Alto |
| Cliente fica na defensiva | Crítico | Vendedor tentou "ganhar" a discussão — cliente se fecha e não avança | Alto |
| Estresse contamina o atendimento | Nervoso | Vendedor se deixou levar pela agressividade — situação escala em vez de dissipar | Médio-Alto |
| Perda de foco e tempo excessivo | Informal | Vendedor deu liberdade total ao lado pessoal — atendimento não avança para o fechamento | Médio |
| Ritmo incompatível | Apressado | Vendedor tentou mostrar mais opções — cliente perde a paciência e sai | Alto |
| Pressão prematura | Afável | Vendedor apressou o fechamento antes de construir vínculo — cliente se retrai | Médio-Alto |
| Dados insuficientes | Analítico | Vendedor argumentou só verbalmente sem fontes ou tabelas — cliente não se convence | Médio |

---

## Sinais de Avanço

Reações do cliente que indicam que a venda está progredindo.

| Sinal | Perfil do cliente | O que aconteceu | Força do sinal |
|---|---|---|---|
| Cliente sente que a decisão é dele | Crítico | Vendedor conduziu sem confrontar — cliente age como se tivesse chegado à conclusão sozinho | Muito forte |
| Cliente sente que ganhou mais do que os outros | Negociador | Vendedor negociou com limites mas fez o cliente se sentir especial | Muito forte |
| Cliente demonstra segurança após confusão inicial | Confuso / Indeciso | Vendedor fez perguntas simples, mostrou vantagens, guiou a decisão — cliente se acalma e avança | Forte |
| Cliente para de objetar | Indeciso | Objeções diminuem após o vendedor passar confiança e mostrar benefícios | Forte |
| Fechamento imediato sem resistência | Apressado / Decidido | Vendedor foi rápido e objetivo — cliente fecha sem fricção | Forte |
| Cliente se aprofunda nas perguntas | Detalhista | Perguntas ficam mais técnicas e específicas — cliente está construindo convicção | Forte |
| Cliente compartilha contexto pessoal | Afável / Informal | Vendedor criou vínculo genuíno — cliente abre informações que ajudam a personalizar a oferta | Médio-Forte |
| Cliente pede condições ou prazo | Qualquer | Cliente já decidiu internamente e está resolvendo o operacional | Muito forte |
| Ritmo do cliente desacelera (do agitado para o focado) | Expressivo / Nervoso | Vendedor dissipou energia negativa ou canalizou a energia expressiva para o produto | Forte |
| Cliente confirma entendimento | Analítico | Após receber dados e tabelas, cliente começa a validar em voz alta — está convencendo a si mesmo | Forte |

---

## Como a IA detecta cada sinal

### No texto

| Sinal | Padrões textuais a detectar |
|---|---|
| Acúmulo de objeções | Repetição de palavras como "mas", "porém", "não sei", "será que"; objeção nova após objeção já respondida |
| Decisão parecendo do cliente | "Eu acho que", "faz sentido para mim", "eu prefiro" — cliente usa primeira pessoa afirmativa |
| Segurança crescente | Perguntas migram de "preciso mesmo disso?" para "como funciona X?" |
| Pedido de condições | Menção a prazo, forma de pagamento, entrega, contrato, próximos passos |
| Fechamento sem fricção | Respostas curtas e afirmativas após proposta — "certo", "pode ser", "vamos fechar" |
| Insegurança crescente | Respostas vagas, monossilábicas após objeção não tratada — cliente se retrai |

### No áudio

| Sinal | Padrões de áudio a detectar |
|---|---|
| Desconforto / afastamento | Tom que esfria, respostas ficam mais curtas, pausas longas após proposta |
| Segurança crescente | Tom que estabiliza, ritmo de fala fica mais constante |
| Acúmulo de tensão (Nervoso) | Volume sobe progressivamente, ritmo acelera |
| Dissipação de tensão | Volume cai, tom suaviza após jogo de cintura do vendedor |
| Interesse real | Perguntas formuladas com entonação curiosa, não defensiva |

### No comportamento / padrão da conversa

| Sinal | Padrão a detectar |
|---|---|
| Objeção repetida não tratada | Mesma objeção aparece 2+ vezes sem resposta direta do vendedor |
| Avanço real | Número de objeções cai ao longo da conversa |
| Estagnação | Conversa circula nos mesmos pontos sem avançar |
| Virada | Mudança de tom do cliente após argumento específico do vendedor |
| Perda silenciosa | Cliente para de responder, respostas ficam monossilábicas, sem engajamento |

---

## Prompt para detecção de sinais

```
CONTEXTO E PAPEL:
Analise o atendimento e identifique os sinais de avanço e de perda presentes
na conversa, considerando o perfil do cliente (Jung + Momento) e o comportamento
do vendedor.

SINAIS DE PERDA — o que observar:
- Objeção repetida sem resposta direta do vendedor
- Cliente fica monossilábico ou para de engajar
- Tom do cliente esfria após proposta ou argumento
- Acúmulo de objeções novas ao longo da conversa
- Vendedor foi prolixo com Pragmático
- Vendedor foi superficial com Detalhista
- Vendedor demonstrou ansiedade com Decidido
- Vendedor perdeu controle do tempo com Informal
- Vendedor entrou em confronto com Crítico

SINAIS DE AVANÇO — o que observar:
- Cliente usa primeira pessoa afirmativa ("eu prefiro", "faz sentido pra mim")
- Perguntas migram de resistência para operacional (prazo, pagamento, entrega)
- Número de objeções cai ao longo da conversa
- Cliente confirma entendimento em voz alta
- Cliente compartilha contexto pessoal relevante
- Tom do cliente estabiliza ou aquece após argumento
- Cliente para de questionar e começa a planejar

SAÍDA OBRIGATÓRIA (formato JSON):
{
  "sinais_de_perda": [
    {
      "sinal": "<descrição do sinal>",
      "momento": "<onde na conversa>",
      "evidencia": "<citação ou padrão observado>",
      "causa": "<o que o vendedor fez ou deixou de fazer>",
      "gravidade": "<Alta|Média|Baixa>"
    }
  ],
  "sinais_de_avanco": [
    {
      "sinal": "<descrição do sinal>",
      "momento": "<onde na conversa>",
      "evidencia": "<citação ou padrão observado>",
      "causa": "<o que o vendedor fez que gerou esse avanço>"
    }
  ],
  "tendencia_geral": "<Avançando|Estagnado|Em risco|Perdido>",
  "momento_critico": "<o ponto exato onde a conversa virou para melhor ou pior>",
  "acao_recomendada": "<o que o vendedor deve fazer agora para recuperar ou consolidar>"
}

DADOS DE ENTRADA:
[transcrição da conversa]
[perfil do cliente: Jung + Momento]
[sinais de áudio e vídeo disponíveis]
```

---

## Como o produto usa os sinais

### Em tempo próximo ao atendimento
- Detectar o momento crítico de virada — onde a venda se perdeu ou se ganhou
- Orientar o vendedor sobre a ação imediata para recuperar ou consolidar

### No registro de resultado
- Cruzar: "o sistema detectou 3 sinais de perda — a venda não fechou — confirma?"
- Retroalimentar o aprendizado com o resultado real

### No painel gerencial
- Quais sinais de perda são mais frequentes por vendedor?
- Quais sinais de perda são mais frequentes por perfil de cliente?
- Quais argumentos reverteram sinais de perda em avanço?

### Para coaching
- "Nos seus atendimentos com clientes Analíticos, o sinal mais frequente de perda é resposta superficial. Isso aconteceu em 6 dos seus últimos 8 atendimentos com esse perfil."

---

## Relação com os outros documentos

| Documento | Conteúdo |
|---|---|
| `taxonomia_perfis_cliente.md` | 4 perfis Jung do cliente |
| `taxonomia_perfis_momento_compra.md` | 9 perfis de momento de compra |
| `taxonomia_integracao_perfis.md` | Como usar os dois modelos juntos |
| `perfil_vendedor.md` | Perfil natural do vendedor + ponto cego |
| `avaliacao_vendedor.md` | Avaliação 360º — forma + tática |
| `sinais_perda_avanco.md` (este) | Sinais de risco e oportunidade por perfil + detecção por canal |
