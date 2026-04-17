# Análise de Produto — Sales Copilot de Atendimento
**Data:** 2026-04-16
**Versão:** 1.0

---

## Contexto

Documento gerado com análise paralela de Product Owner e Especialista em UX sobre a documentação inicial do produto. Objetivo: identificar lacunas críticas, riscos de escopo e decisões que precisam ser tomadas antes de qualquer desenvolvimento.

---

# PARTE 1 — VISÃO DO PRODUCT OWNER

## 1. Clareza da Proposta de Valor

**Para quem compra (gestor comercial):** Razoavelmente clara. A promessa de "saber por que estou perdendo venda e o que fazer sobre isso" é tangível. O posicionamento "IA é o motor, não um plugin" diferencia bem.

**Para quem usa (vendedor):** Fraca. O vendedor não recebe nada no WhatsApp — o feedback vai para um painel separado. Isso cria um problema de adoção grave: o vendedor precisa mudar de canal para ver a orientação, exatamente quando está no meio de uma negociação.

**Problema estrutural:** A documentação mistura proposta de valor com resultado esperado. As perguntas ao final ("vendedores novos performam melhor?") são hipóteses de pesquisa, não proposta de valor do cliente.

**Ação necessária:** Definir dois value propositions separados:
- Para o gestor: inteligência de conversão
- Para o vendedor: orientação acionável

Se o vendedor não tem valor próprio, o produto é ferramenta de monitoramento, não copiloto.

---

## 2. Critérios de Aceitação Ausentes

Nenhuma das 6 features MVP tem critério de pronto definido.

| Feature | Lacuna crítica |
|---|---|
| Captura de atendimento | Latência máxima aceitável? O que acontece se o webhook falhar? Áudio de qual duração máxima? |
| Extração estruturada | Acurácia mínima aceitável por campo? Quem valida que o resumo está correto? |
| Classificação de perfil | Quantos perfis existem? Lógica de empate ou baixa confiança? Quem valida a primeira classificação? |
| Copiloto de orientação | Em quanto tempo a orientação precisa estar disponível? O que acontece sem histórico suficiente? |
| Registro de resultado | Quem registra — vendedor, gestor ou ambos? É obrigatório ou opcional? |
| Painel gerencial | Período mínimo de dados para ter validade? Atualização em tempo real ou batch? |

**Mais crítico:** sem definir quem registra o resultado e se é mandatório, o loop de aprendizado da IA nunca fecha.

---

## 3. Riscos de Escopo

Itens "fora do MVP" que voltarão como pressão durante o desenvolvimento:

- **Coaching em tempo real:** o vendedor está no WhatsApp, o feedback está em outro painel. A pergunta "por que não aparece aqui no WhatsApp?" virá na primeira demo. A resposta precisa estar preparada antes.
- **Integração com CRM/ERP:** o registro de resultado é manual. Assim que o time perceber que precisa registrar em dois lugares, pedirão integração.
- **Análise profunda de vídeo:** o MVP "armazena e analisa depois." Quem define quando é "depois"? Sem prazo e dono, vira dívida técnica.
- **Perfis evolutivos de vendedor:** para o MVP, o perfil é estático ou dinâmico? Se dinâmico, qual é o gatilho de atualização?
- **Benchmark entre unidades:** o painel gerencial com ranking já é embrião disso. Um gestor com duas filiais pedirá comparação no sprint 3.

---

## 4. Dependências Bloqueantes

Precisam estar resolvidas **antes do primeiro sprint de produto:**

| Dependência | Tipo | Impacto |
|---|---|---|
| Taxonomia de perfis (vídeos do Nicolau) | Bloqueante absoluto | Features 3, 4 e 6 não podem ser desenvolvidas sem ela |
| Definição de "venda efetivada" | Bloqueante absoluto | Feature 5 não tem schema definível sem isso |
| Acesso à WhatsApp Cloud API | Bloqueante crítico | Aprovação da Meta pode levar semanas |
| Dados históricos para base inicial | Bloqueante crítico | Sem histórico, a camada de recomendação não tem base |
| LGPD — parecer jurídico | Bloqueante de governança | Gravação de conversas sem consentimento é risco imediato |

---

## 5. Hipóteses Não Validadas

| Hipótese | Risco se falsa |
|---|---|
| O vendedor vai abrir o painel separado durante ou após o atendimento | Adoção zero |
| A análise de IA chegará perto do resultado real | Produto sem credibilidade — repete falha do PoC anterior |
| Os vídeos do Nicolau têm taxonomia suficientemente estruturada | Base de conhecimento inválida |
| Vendedores vão registrar resultado voluntariamente | Loop de aprendizado nunca fecha |
| Gestores vão agir com base nas recomendações | Produto gera dado mas não muda comportamento |
| A classificação de perfil é estável após poucas interações | Sistema recomenda mal no início e perde credibilidade antes de ter dados |

**A mais fácil de testar:** hipótese do painel separado. Uma sessão de observação de 2 horas com um vendedor real resolve isso antes de um sprint de desenvolvimento.

---

## 6. Lacunas de Regra de Negócio — As 3 Mais Bloqueantes

**"Postura do vendedor":** sem proxy observável (tempo de resposta, número de perguntas feitas, linguagem de urgência), o campo "postura percebida" no SIR é texto livre sem valor analítico.

**"O que o sistema pode recomendar":** ausência total de governança sobre o output da IA. O sistema pode sugerir desconto? Ignorar um cliente? Rotular cliente como "difícil"? Sem limites definidos, cria passivo trabalhista e reputacional.

**"Como uma boa prática vira padrão/playbook":** sem dono humano e cadência definida, o aprendizado acumula no sistema mas nunca vira orientação estruturada. A camada 4 da arquitetura vira data warehouse sem uso.

**Lacuna não listada:** a feature 3 menciona "conflitos de estilo vendedor/cliente" — mas qual é a ação recomendada quando há conflito? Trocar o vendedor? Ajustar abordagem? Sem isso, detectar conflito não gera ação.

---

## 7. Priorização Sugerida

### Sprint 0 — Pré-requisitos (não é produto)

1. Processar os vídeos do Nicolau → documento estruturado com no mínimo 3 perfis de cliente e 3 de vendedor com critérios observáveis
2. Definir "venda efetivada" com o cliente — um parágrafo, assinado pelo dono do produto
3. Obter acesso operacional à WhatsApp Cloud API (número homologado, webhook funcionando em staging)
4. Parecer jurídico sobre LGPD para gravação de conversas
5. Inventário dos dados históricos disponíveis — quantidade, formato, qualidade
6. Sessão de observação com 2 vendedores reais para validar hipótese do painel separado

### Sprint 1 — Único objetivo: provar que a análise chega perto do resultado real

**Entra:**
- Captura de texto via webhook WhatsApp (apenas texto)
- Extração dos campos de maior valor: objeções levantadas, sinais de risco, próximo passo sugerido
- Registro de resultado manual simplificado: fechou / não fechou / motivo (3 campos)
- Comparação previsão vs. resultado — não precisa ser painel, uma query direta serve

**Fica fora:**
- Classificação de perfil (depende da taxonomia validada)
- Copiloto de orientação (depende da classificação)
- Painel gerencial (sem dados suficientes)
- Áudio, imagem, vídeo

**Critério de sucesso:** em N atendimentos capturados, a hipótese de resultado da IA coincide com o resultado real em pelo menos X% dos casos. Os valores de N e X precisam ser definidos antes do sprint começar.

---

# PARTE 2 — VISÃO DO ESPECIALISTA EM UX

## 1. Mapeamento de Usuários

A documentação trata "o vendedor" como entidade única. Na prática são três perfis com necessidades radicalmente diferentes:

**Vendedor novato (0-6 meses)**
Alta ansiedade, baixa confiança. Para ele, o copiloto é um colete salva-vidas. Se funcionar bem, abraça. Se der conselho errado uma vez, para de confiar e nunca mais volta.

**Vendedor veterano (2+ anos)**
Tem ritmo próprio. Para ele, o copiloto é uma ameaça sutil à autonomia ou burocracia extra. Vai tolerar se o insight for melhor que o dele. Vai abandonar se sentir que a IA está errada sobre o que já sabe.

**Gestor/coordenador comercial**
Não atende, mas quer entender o time. É quem decide se a ferramenta fica. É o comprador real — mas não é quem usa no dia a dia.

**Conflito crítico que a documentação ignora:** o gestor tem interesse em que os dados sejam capturados. O vendedor tem interesse em fechar a venda com o mínimo de fricção. Esses interesses podem entrar em conflito direto.

---

## 2. Jornadas Críticas e Pontos de Atrito

**Jornada 1 — Atendimento e captura (várias vezes por dia)**

```
Cliente envia mensagem
→ Vendedor responde (no WhatsApp, onde ele está)
→ Sistema captura automaticamente
→ Análise roda em background
→ Feedback aparece no dashboard separado
```

Atrito: o feedback não está onde o vendedor está. Ele não vai trocar de tela no meio de um atendimento.

**Jornada 2 — Registro de resultado**

```
Venda termina
→ Vendedor precisa registrar no dashboard
→ Mas ele está no WhatsApp comemorando ou já atendendo outra pessoa
```

Atrito: registro manual após o fato é o que os vendedores mais abandonam em qualquer ferramenta.

**Jornada 3 — Consulta de coaching**

```
Vendedor quer entender por que está perdendo vendas
→ Abre o dashboard
→ Interpreta análises, scores, classificações
→ Precisa conectar isso com o que vai fazer diferente amanhã
```

Atrito: distância entre o insight e a ação. O dashboard mostra o passado. O vendedor precisa do futuro.

---

## 3. Problemas de Adoção — Em Ordem de Impacto

1. **Fricção de canal:** qualquer coisa que exija sair do WhatsApp para outra tela durante o atendimento tem adoção próxima de zero.
2. **Incerteza sobre vigilância:** "isso está me avaliando para me demitir ou para me ajudar?" Se não for claro desde o onboarding, o vendedor vai ser passivo-agressivo com a ferramenta.
3. **Confiança zero no início:** os primeiros insights vão ser genéricos (taxonomias ainda indefinidas). Se o vendedor ler análises que parecem genéricas ou erradas logo no início, o produto está morto para ele.
4. **Registro de resultado é trabalho manual:** taxa de preenchimento vai para o chão se não for automático ou no mesmo canal.
5. **Falta de "o que fazer agora":** se a recomendação for uma lista de 5 itens, o vendedor ignora. Se for uma frase — "esse cliente é do perfil Racional, use dados de comparação" — ele pode usar.

---

## 4. Canal de Feedback — Dashboard Separado é a Solução Certa?

**Não. Pelo menos não como canal primário de feedback em tempo próximo ao atendimento.**

O dashboard funciona bem para: revisão semanal, coaching, análise histórica. Mas precisa de um ritual claro para ser acessado (reunião de equipe, 1:1, checagem de metas).

Para orientação em tempo próximo ao atendimento, um resumo curto via WhatsApp (thread separada ou bot interno) tem muito mais chance de ser consumido.

**O risco real:** o dashboard se torna ferramenta do gestor, não do vendedor — criando assimetria de poder que corrói a confiança.

---

## 5. Sobrecarga Cognitiva no Sales Intelligence Record

O SIR tem 10+ outputs por atendimento sem hierarquia definida. O problema não é a quantidade — é a ausência de priorização.

**Princípio:** cada tela deve responder a uma única pergunta.

| Momento | Pergunta do usuário | O que mostrar |
|---|---|---|
| Durante o atendimento | "O que eu faço agora?" | Uma recomendação + no máximo 2 sinais críticos |
| Logo após o atendimento | "Como foi? Preciso registrar?" | Resumo em 3 linhas + campo de resultado |
| Revisão semanal | "Por que estou perdendo vendas?" | Padrões agregados, não análise individual |

**Arquitetura de informação sugerida:**

- **Camada 1** (sempre visível): Perfil do cliente resumido + Uma recomendação principal + Score de confiança
- **Camada 2** (expandível): Objeções detectadas + Sinais de risco/interesse + Postura percebida
- **Camada 3** (gestor / revisão): Análise completa + Histórico + Comparação com padrões

O vendedor nunca precisa ver a Camada 3. O gestor raramente precisa da Camada 1 em detalhe.

---

## 6. Confiança na IA — Como Construir

A confiança não vem do modelo — vem da especificidade e da consistência ao longo do tempo.

**Práticas que constroem confiança:**

- **Mostre o trecho que originou o insight:** se o sistema diz "cliente demonstrou resistência a preço", mostre a frase do cliente que gerou essa conclusão.
- **Score de confiança honesto:** "Análise baseada em 3 atendimentos com esse perfil. Confiança: baixa." É melhor do que um número alto que depois se prova errado.
- **Mecanismo de feedback simples:** um botão "concordo / discordo" por análise, sem precisar escrever nada.
- **Acertos visíveis:** "Nas últimas 4 semanas, em 8 de 10 casos onde o sistema identificou risco de preço, a venda não fechou."

**Risco maior:** se o sistema errar de forma gritante no começo, o vendedor forma uma opinião negativa muito difícil de reverter. A fase inicial precisa de supervisão humana intensa.

---

## 7. Novato vs Veterano — Comportamento Diferenciado

**Novato — interface diretiva:**
- Mostrar recomendação com contexto explicativo e exemplo concreto
- Normalizar o aprendizado com benchmarks do time
- Reduzir ambiguidade — nunca usar adjetivos vagos sem exemplos

**Veterano — interface consultiva:**
- Apresentar o insight sem dizer o que fazer — "detectamos 3 objeções de preço. Você costuma usar argumento X. Taxa de sucesso histórica: 67%."
- Permitir discordância explícita com campo opcional de justificativa (isso captura conhecimento tácito)
- Mostrar onde ele está acima da média — o veterano precisa sentir que o sistema o reconhece como bom, não que está sendo monitorado

**Risco de interface única:** condescendente demais para o veterano, abstrata demais para o novato. Os dois rejeitam por motivos opostos.

---

## 8. O Momento de "Wow" no Demo

**A tela que faria olhos brilharem:**

> "Esse cliente levantou a objeção de prazo de entrega. Nos últimos 3 casos com esse perfil onde o vendedor usou o argumento de estoque garantido + data de corte, 2 fecharam. Nos casos onde o vendedor negociou prazo diretamente, 0 fecharam."

Isso cria três reações simultâneas:
- Gestor: "é exatamente o que eu precisava para coaching."
- Vendedor novato: "eu teria tentado negociar prazo. Vou usar o outro argumento."
- Vendedor veterano: "isso bate com o que eu já faço intuitivamente — mas agora tenho número."

**Segundo momento de "wow":** evolução de um vendedor novato em 60 dias de uso. Uma curva de aprendizado comprimida é o argumento mais poderoso para a compra.

**O que não impressiona:** dashboards genéricos com gráficos de pizza, scores sem contexto, análises que o vendedor olha e pensa "eu já sabia disso."

---

## 9. Riscos de UX que Podem Matar o Produto

Em ordem de probabilidade e impacto:

1. **O feedback nunca chega no momento certo.** Se a orientação só aparece no dashboard, e o vendedor só abre quando o gestor manda, o produto vira ferramenta de auditoria, não copiloto.

2. **As análises iniciais são genéricas demais.** Os vídeos do Nicolau ainda não foram processados. A janela de impressão positiva é pequena — provavelmente as primeiras duas semanas.

3. **O registro de resultado vira trabalho morto.** Com dados incompletos, o loop de aprendizado da IA quebra e o produto nunca melhora. Morte lenta.

4. **O gestor usa o dashboard contra o vendedor.** Se um gestor usar "postura percebida" ou "score de confiança" em uma reunião de demissão, a notícia se espalha pelo time em 24 horas. Nenhum vendedor será honesto com a ferramenta depois disso.

5. **Conflito de classificação sem explicação.** Se o sistema classifica um cliente como "perfil X" e o vendedor discorda fortemente sem entender o porquê, a desconfiança se instala de forma permanente.

6. **Sobrecarga no onboarding.** Se o primeiro acesso for uma tela com 10 campos e scores sem contexto, o vendedor fecha e não abre de novo.

---

# PARTE 3 — CONVERGÊNCIAS E DECISÕES PRIORITÁRIAS

## Onde PO e UX convergem

| Tema | Convergência |
|---|---|
| Taxonomia de perfis | Bloqueante absoluto para análise de qualidade e para UX confiável |
| Canal de feedback | Dashboard separado não funciona como canal de orientação em tempo real |
| Registro de resultado | Manual e separado do WhatsApp = taxa de preenchimento perto de zero |
| Início da operação | As primeiras semanas são críticas — análise genérica mata confiança de forma irreversível |
| Governança da IA | Precisa de limites claros antes de ir ao ar |

## As 5 decisões que precisam ser tomadas agora

1. **Taxonomia:** processar os vídeos do Nicolau e fechar os perfis com critérios observáveis — isso desbloqueia tudo.
2. **Canal de feedback ao vendedor:** definir se haverá entrega de orientação no mesmo canal do atendimento (WhatsApp) ou se o dashboard é suficiente para o MVP.
3. **Registro de resultado:** definir quem registra, como, e se é obrigatório. Sem isso, o loop de aprendizado não existe.
4. **Governança da IA:** definir o que o sistema pode e não pode recomendar, e como os dados de análise podem ser usados pelo gestor.
5. **Critério de sucesso do Sprint 1:** N atendimentos, X% de acurácia na hipótese de resultado. Definir os números antes de começar.

---

*Documento gerado em 2026-04-16. Revisão recomendada após processamento dos vídeos do Nicolau e validação da taxonomia de perfis.*
