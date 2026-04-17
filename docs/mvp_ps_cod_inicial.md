# Projeto — Inteligência de Gestão de Atendimento em Vendas

## 1. Visão Geral

Este projeto propõe o desenvolvimento de uma plataforma **AI-first** para inteligência de atendimento comercial, capaz de capturar interações de vendas, interpretar sinais relevantes, orientar a ação do vendedor e transformar cada atendimento em aprendizado operacional.

A proposta não é criar apenas um CRM com recursos de IA adicionados posteriormente. A IA deve ser o **núcleo do produto**, responsável por entender o contexto do atendimento, estruturar informações relevantes, emitir recomendações práticas e evoluir com base nos resultados reais obtidos.

### Nome interno sugerido para o MVP
**Sales Copilot de Atendimento**

### Definição do produto
Uma camada de inteligência que observa o atendimento, transforma a conversa em sinais úteis e devolve orientação prática para aumentar conversão, reduzir erros e acumular conhecimento operacional.

---

## 2. Objetivo do Projeto

A plataforma deve ser capaz de:

- Identificar o perfil do vendedor durante os atendimentos.
- Identificar o perfil do cliente durante o atendimento.
- Detectar sinais de perda de venda e orientar ações de reversão.
- Detectar sinais de avanço no processo comercial.
- Recomendar abordagens de fechamento com base no perfil do cliente.
- Registrar o histórico e os resultados dos atendimentos.
- Cruzar informações para gerar inteligência comercial acionável.
- Apoiar o desenvolvimento de vendedores com baixa taxa de conversão.

---

## 3. O que a Plataforma Deve Armazenar

A solução deve registrar, no mínimo:

- Se a venda foi efetivada ou não.
- Discordâncias do cliente, falhas e dificuldades no processo de atendimento em vendas efetivadas.
- Discordâncias do cliente, falhas e dificuldades no processo de atendimento em vendas não efetivadas.
- Soluções oferecidas ao cliente pelo vendedor.
- Postura do vendedor durante o atendimento, incluindo:
  - receptividade;
  - empenho para apresentar opções de produtos e benefícios;
  - intervalo entre interações;
  - disponibilidade para orientar o cliente durante o processo de fechamento.
- Resultados provenientes do cruzamento desses dados.

---

## 4. Inteligência Esperada da Plataforma

A partir dos dados armazenados, o sistema deve gerar análises como:

- Ranking dos percentuais de vendas efetivadas de cada vendedor por perfil de cliente.
- Soluções com maior percentual de conversão por perfil de cliente.
- Soluções com menor percentual de conversão por perfil de cliente.
- Soluções com maior percentual de conversão por vendedor.
- Recomendações de desenvolvimento para vendedores com baixa efetivação de vendas, considerando perfil de cliente e histórico de performance.

---

## 5. Princípios Críticos do Projeto

Existem dois pontos sensíveis que precisam ser respeitados desde o início:

1. O produto precisa nascer **AI-first**.
2. O atendimento precisa ser capturado **sem travar a operação**, sendo o **WhatsApp** o canal mais delicado do MVP.

### 5.1. Princípio AI-first

Se o projeto será AI-first, a IA precisa estar no centro do fluxo operacional, e não apenas no dashboard.

Cada atendimento deve passar por cinco etapas:

1. **Captura**
2. **Extração estruturada**
3. **Classificação**
4. **Recomendação**
5. **Aprendizado com resultado**

A IA deve produzir saída **estruturada, auditável e acionável**, e não apenas texto livre.

### 5.2. Princípio de Baixo Atrito Operacional

O MVP deve capturar os atendimentos sem exigir mudança brusca de comportamento da equipe comercial. Por isso, o uso do WhatsApp como canal principal precisa ser tratado com cuidado, priorizando integração oficial e mínima fricção na operação.

---

## 6. Escopo do MVP

O MVP precisa provar quatro coisas:

1. Que é possível capturar o atendimento.
2. Que é possível identificar sinais úteis.
3. Que é possível orientar melhor o vendedor.
4. Que é possível demonstrar ganho real depois.

### 6.1. Funcionalidades obrigatórias do MVP

#### 6.1.1. Captura de atendimento

O sistema deve permitir:

- captura de texto do atendimento;
- captura de áudio recebido;
- captura de imagem recebida;
- captura de vídeo recebido;
- identificação do vendedor responsável;
- identificação do cliente, conversa ou oportunidade;
- criação de uma timeline única por atendimento.

**Recomendação prática para o MVP:**

- Priorizar análise real de **texto + áudio**.
- Tratar **imagem** como apoio.
- Tratar **vídeo** inicialmente como armazenamento + metadado + análise futura.

#### 6.1.2. Extração estruturada do atendimento

A IA deve gerar, para cada atendimento:

- resumo do caso;
- objetivo do cliente;
- objeções levantadas;
- sinais de interesse;
- sinais de risco;
- produtos ou soluções ofertadas;
- postura percebida do vendedor;
- próximo melhor passo;
- chance estimada de fechamento;
- motivo provável de perda, quando houver.

#### 6.1.3. Classificação de perfil

O sistema deve classificar:

- perfil do vendedor;
- perfil do cliente;
- aderência vendedor x cliente;
- conflitos de estilo;
- oportunidades de abordagem.

> Os vídeos do Nicolau podem servir como fonte inicial para a taxonomia de perfis.

#### 6.1.4. Copiloto de orientação

Durante ou logo após o atendimento, o sistema deve exibir:

- o que fazer agora;
- o que evitar agora;
- argumento recomendado;
- tipo de fechamento recomendado;
- risco principal de perder a venda;
- solução que historicamente funciona melhor para aquele perfil.

#### 6.1.5. Registro de resultado

O sistema deve registrar:

- se a venda foi fechada ou não;
- valor da venda;
- produto ou solução final;
- motivo de perda ou atrito;
- observações do vendedor ou gestor;
- eventual reversão posterior.

> Sem esse bloco, não existe aprendizado consistente.

#### 6.1.6. Painel gerencial mínimo

O MVP deve oferecer um painel com:

- taxa de conversão por vendedor;
- taxa de conversão por perfil de cliente;
- principais objeções;
- principais causas de perda;
- argumentos ou soluções com melhor taxa de fechamento;
- ranking de acertos e oportunidades de coaching.

### 6.2. Funcionalidades importantes, mas não obrigatórias no MVP

Itens recomendados para uma **fase 2**:

- roteamento automático de lead para vendedor mais aderente;
- gamificação e premiação;
- coaching em tempo real com alerta instantâneo;
- análise profunda de vídeo e comportamento visual;
- integração completa com CRM e ERP;
- avaliação automática da qualidade do atendimento pelo gestor;
- benchmark entre lojas, unidades e equipes.

---

## 7. Regras de Negócio que Ainda Precisam Ser Definidas

O maior risco do projeto não é técnico. O maior risco é tentar construir uma solução “inteligente” sem regras claras.

### 7.1. Definição de perfil de cliente

É necessário definir:

- quais perfis existirão;
- quais sinais caracterizam cada perfil;
- quais evidências mínimas a IA precisa encontrar para classificar;
- se a classificação será:
  - única;
  - mista;
  - percentual por confiança.

**Exemplo de definição esperada:**

> Perfil X é identificado por urgência, foco em segurança, baixa tolerância a risco e preferência por validação externa.

### 7.2. Definição de perfil de vendedor

É necessário definir:

- quais perfis de vendedor existirão;
- como mapear vendedores novos;
- como corrigir classificações erradas;
- se o perfil é fixo ou evolutivo;
- se o sistema utilizará:
  - autoavaliação;
  - avaliação do gestor;
  - observação real dos atendimentos;
  - ou combinação dessas fontes.

### 7.3. Definição de sinal de perda

Esse conceito precisa deixar de ser abstrato e virar regra operacional.

Exemplos:

- demora excessiva entre respostas;
- objeção repetida sem tratamento;
- pedido de comparação ignorado;
- oferta incompatível com o perfil do cliente;
- quebra de confiança;
- excesso de pressão;
- ausência de próximo passo claro.

### 7.4. Definição de sinal de bom andamento

Exemplos:

- cliente pede condição;
- cliente compartilha contexto real;
- cliente confirma entendimento;
- cliente aceita o próximo passo;
- cliente pede prazo ou documentação;
- cliente demonstra urgência de implantação ou compra.

### 7.5. Definição de postura do vendedor

A avaliação precisa se basear em critérios observáveis, como:

- tempo de resposta;
- clareza;
- objetividade;
- repertório de solução;
- empatia;
- insistência excessiva;
- condução de fechamento;
- tratamento de objeções;
- constância de follow-up.

### 7.6. Definição de venda efetivada

É necessário estabelecer o marco oficial de conversão. Exemplos de possibilidades:

- proposta enviada;
- pagamento realizado;
- contrato assinado;
- onboarding iniciado;
- entrega concluída.

> Sem esse critério fechado, toda métrica perde consistência.

### 7.7. Limites de recomendação do sistema

É preciso definir até onde a IA pode atuar. Por exemplo:

- sugerir argumento;
- sugerir oferta;
- sugerir desconto;
- sugerir troca de vendedor;
- sugerir pausa de insistência;
- sugerir escalonamento para gestor.

### 7.8. Validação humana do feedback da IA

É necessário responder:

- o vendedor pode contestar?
- o gestor pode corrigir?
- a correção humana gera aprendizado?
- a correção humana tem prioridade sobre a classificação automática?

### 7.9. Diferença entre vendedor experiente e novato

O sistema precisa prever trilhas diferentes:

- **novato:** apoio mais explícito;
- **veterano:** feedback mais cirúrgico e menos intrusivo.

### 7.10. Transformação de conhecimento em padrão operacional

É necessário definir:

- o que vira playbook;
- quando uma boa prática é promovida a padrão;
- quem aprova;
- quando reavaliar;
- como isso chega aos novos vendedores.

---

## 8. Definições Técnicas Pendentes

### 8.1. Canais do MVP

É preciso definir se o MVP abrangerá:

- somente WhatsApp;
- atendimento presencial;
- ligações;
- CRM/manual;
- combinação desses canais.

**Recomendação inicial:**

- MVP com **WhatsApp + input manual de vendedor/gestor**.

### 8.2. Nível de análise por mídia

Para controlar custo e complexidade:

- **Texto:** análise completa no MVP.
- **Áudio:** transcrição + análise completa no MVP.
- **Imagem:** OCR ou inspeção leve, opcional no MVP.
- **Vídeo:** armazenar e talvez analisar frames-chave depois.

### 8.3. Tempo da análise

É necessário definir se a análise será:

- em tempo real;
- quase real-time;
- pós-atendimento.

**Recomendação inicial:**

- MVP em **quase real-time** ou **pós-atendimento curto**, com retorno em poucos minutos.

### 8.4. Canal de retorno do feedback

Como a proposta é **não responder pelo WhatsApp**, o feedback precisa aparecer em outro ponto da jornada:

- painel web do vendedor;
- painel do gestor;
- aplicativo interno;
- extensão ou webview de acompanhamento.

> Sem canal de retorno, a captura perde valor operacional.

### 8.5. Modelo de dados inicial

As entidades mínimas sugeridas são:

- Atendimento
- Mensagem
- Mídia
- Vendedor
- Cliente
- PerfilCliente
- PerfilVendedor
- Sinal
- Objeção
- SoluçãoOfertada
- Recomendação
- ResultadoVenda
- FeedbackHumano
- Regra/Playbook
- MétricaAgregada

### 8.6. Motor de IA em camadas

Sugestão de separação em quatro camadas:

#### a) Ingestão
- webhook do WhatsApp;
- upload manual;
- integrações futuras.

#### b) Extração
- transcrição;
- parsing;
- resumo;
- identificação de entidades;
- extração de objeções;
- identificação de sinais.

#### c) Inteligência
- perfil;
- risco;
- recomendação;
- aderência vendedor-cliente.

#### d) Aprendizado
- comparação entre previsão da IA e resultado real.

### 8.7. Base de conhecimento inicial

A base de conhecimento pode começar com:

- os 2 vídeos do Nicolau;
- conteúdos internos;
- scripts de venda;
- históricos de conversão;
- objeções recorrentes;
- soluções de sucesso.

Essa base deve ser organizada em:

- taxonomia de perfis;
- repertório de objeções;
- táticas recomendadas;
- exemplos de atendimentos bons e ruins.

### 8.8. Observabilidade e auditoria

Cada análise precisa registrar:

- input analisado;
- versão do prompt ou pipeline;
- evidências encontradas;
- score de confiança;
- recomendação emitida;
- resultado real posterior.

### 8.9. Segurança, consentimento e LGPD

**LGPD não é configuração final. É fundação. Nasce com o produto.**

---

#### Por que é diferente aqui

Esse produto processa três categorias de dado sensível simultaneamente:
- **Dado biométrico** (embedding de voz) — categoria especial, Art. 11 LGPD
- **Dado comportamental** (perfil psicológico inferido) — sensível por natureza
- **Conteúdo de conversa** (transcrição) — pode conter dados pessoais do cliente final

A corretora é o **controlador** dos dados. O produto é o **operador**. Se houver infração, a multa cai na corretora — não só no produto. Isso é argumento de venda, não obstáculo.

Multa máxima ANPD: 2% do faturamento, até R$50 milhões por infração.

---

#### Base legal por tipo de dado

| Dado | Base legal | Exige na prática |
|---|---|---|
| Transcrição da conversa | Legítimo interesse + consentimento | Aviso de gravação antes do atendimento |
| Perfil comportamental inferido | Legítimo interesse | Finalidade documentada |
| Embedding de voz do vendedor | Contrato de trabalho + política interna | Cláusula no contrato do corretor |
| Embedding de voz do cliente | Consentimento explícito | Opt-in — nunca opt-out |

---

#### O que precisa existir desde o primeiro atendimento

**Aviso de gravação obrigatório**

O corretor avisa o cliente antes de gravar. Pode ser uma mensagem padrão:

> "Olá! Só te informar que nossa conversa pode ser utilizada para fins de melhoria do atendimento. Qualquer dúvida é só perguntar."

Uma linha. Consentimento dado. Processo cumprido.

**Nunca armazenar o áudio bruto**

Processar em memória, gerar transcrição e embedding, descartar o áudio. O áudio bruto é o dado mais sensível e o que mais expõe. Depois de processado, não persiste.

**Pseudoanonimização desde o início**

Conversas armazenadas com `client_token` (hash), não nome real. Nome e telefone em tabela separada, vinculada só pelo token. Análise e embedding nunca contêm dado identificável direto.

**Retenção com prazo definido**

| Dado | Prazo | Critério |
|---|---|---|
| Transcrição | 2 anos | Prazo prescricional |
| Análise comportamental | 2 anos | Mesmo prazo |
| Embedding de voz | Vigência do consentimento | Delete imediato se retirado |
| Áudio bruto | Não armazenar | Só em memória durante processamento |

**Direitos do titular (responder em até 15 dias)**

- Confirmação de existência de dados
- Acesso ao que foi coletado
- Correção de dados incorretos
- Exclusão completa (incluindo embedding)
- Portabilidade
- Informação sobre compartilhamento

---

#### Documentação mínima obrigatória

- **ROPA** — mapa de quais dados, para quê, por quanto tempo
- **DPIA** — obrigatório para dado biométrico e perfil psicológico
- **Política de Privacidade** — para o produto e para a corretora usar com seus clientes
- **DPA** (Data Processing Agreement) — contrato entre produto (operador) e corretora (controlador)

O DPA não precisa de advogado para o piloto. Mas precisa existir antes de escalar para mais de uma empresa.

---

#### Como apresentar para o cliente aceitar

LGPD mal explicada para cliente vira objeção de venda. Bem explicada vira argumento de venda.

**A virada de perspectiva:** não se fala em LGPD. Fala-se em **proteção da operação deles**.

**Para o gestor/dono:**

> "Toda gravação de atendimento que vocês fazem hoje já é dado pessoal. Se um cliente reclamar na ANPD, a responsabilidade é de vocês como empresa. O que a gente está trazendo já vem com o processo que protege isso — consentimento documentado, dado armazenado de forma segura, exclusão quando o cliente pedir. Vocês ganham inteligência de vendas e ficam cobertos ao mesmo tempo."

**Para o corretor:**

Não fala em LGPD. Fala em:

> "Antes de começar o atendimento, manda essa mensagem para o cliente."

Uma linha. Processo cumprido.

**O argumento que fecha:**

> "Hoje quando o corretor de vocês grava um áudio no WhatsApp, tem algum processo formal de consentimento?"

A resposta vai ser não.

> "Então vocês já estão expostos agora, sem saber. A gente está chegando para organizar isso junto com a inteligência de vendas. Não é custo — é cobertura."

**O que entregar na reunião:**

1. Termo de consentimento — texto simples que o corretor usa com o cliente antes de gravar
2. DPA de uma página — o que cada parte é responsável
3. Política de retenção — quanto tempo fica, como sai

Três documentos. Uma reunião. Objeção vira diferencial.

Produto que nasce LGPD-ready vira diferencial com empresas maiores. RH e jurídico de grandes corretoras bloqueiam produto que não tem isso documentado.

---

#### O que implementar por fase

| Fase | O que implementar |
|---|---|
| Fase 0 (piloto) | Aviso de gravação, não armazenar áudio bruto, pseudoanonimização básica |
| Fase 1 (banco de dados) | Separação de tabelas, audit log, endpoint de exclusão, ROPA documentado |
| Fase 3B (fingerprint de voz) | Consentimento explícito para biométrico, expiração automática de embeddings, DPIA |
| Fase 4 (plataforma) | DPA por cliente, DPO nomeado, processo formal de resposta a titulares |

### 8.10. Avaliação de qualidade da IA

Métricas mínimas sugeridas:

- acurácia da classificação de perfil;
- precisão na identificação de sinais de perda;
- utilidade percebida da recomendação;
- taxa de aceitação do feedback;
- impacto em conversão;
- redução do tempo de ramp-up de vendedores novos.

---

## 9. Arquitetura Conceitual AI-first

O núcleo do sistema deve tratar cada atendimento como um **Sales Intelligence Record**, contendo:

- contexto;
- perfil do cliente;
- perfil do vendedor;
- sinais positivos;
- sinais de risco;
- objeções;
- solução ofertada;
- recomendação;
- score de confiança;
- hipótese de resultado.

### Fluxo conceitual

```text
Atendimento
  → leitura multimodal
  → estruturação
  → orientação
  → resultado
  → aprendizado
```

### Princípio de guarda-corpo

A IA não deve agir livremente sem validação. O fluxo recomendado é:

1. IA extrai e propõe.
2. Regras de negócio validam.
3. O sistema exibe recomendação explicável.
4. O humano corrige quando necessário.

Esse modelo reduz o risco de alucinação operacional e melhora governança.

---

## 10. Estratégia para WhatsApp no MVP

### Caminho recomendado

#### Fase 1
- uso da **WhatsApp Business Platform / Cloud API**;
- recebimento via **webhook**;
- captura de texto, áudio, imagem, vídeo e documentos;
- persistência completa do material recebido;
- processamento de IA fora do fluxo principal.

### Se o cliente já usa WhatsApp Business App

Vale avaliar a estratégia de coexistência para reduzir mudança operacional e facilitar adoção.

### Canal de feedback

Como a proposta é não enviar respostas pelo WhatsApp:

- o vendedor visualiza o feedback em dashboard;
- o gestor acompanha uma visão consolidada;
- alertas podem existir fora do canal de conversa.

---

## 11. Visão de Custo do MVP

O custo do MVP deve ser avaliado em três blocos:

### 11.1. Custo do canal
Relaciona-se ao uso do WhatsApp e sua política comercial.

### 11.2. Custo de IA
Principais drivers:

- transcrição de áudio;
- análise de mídia;
- reprocessamento;
- volume de atendimentos.

### 11.3. Custo de armazenamento
Principais drivers:

- áudio;
- vídeo;
- anexos;
- logs de análise;
- trilhas de auditoria.

### Leitura prática

O maior vilão de custo do MVP tende a ser **vídeo**, não texto.

---

## 12. O que Deve Ficar Fora do MVP

Para proteger prazo, custo e foco, recomenda-se retirar do MVP inicial:

- análise profunda de vídeo;
- coaching ao vivo em tempo real dentro da conversa;
- premiação automática;
- ranking público agressivo;
- roteamento automático sem supervisão;
- integração com todos os sistemas ao mesmo tempo;
- modelagem psicológica sofisticada demais logo na primeira versão.

---

## 13. Resultado Esperado do MVP

Ao final do MVP, a equipe deve conseguir responder com clareza:

- vendedores novos performam melhor com a ferramenta?
- quais perfis de cliente mais sofrem perda?
- quais vendedores performam melhor com quais perfis?
- quais objeções mais derrubam venda?
- quais argumentos realmente funcionam?
- a orientação da IA ajuda ou atrapalha?

---

## 14. Backlog Inicial Recomendado

### Bloco 1 — Fundamentos
- taxonomia de perfil de cliente;
- taxonomia de perfil de vendedor;
- definição de sinais de perda;
- definição de sinais de avanço;
- definição de postura comercial;
- definição formal de venda efetivada.

### Bloco 2 — Conhecimento
- extrair conteúdo dos 2 vídeos;
- estruturar playbooks;
- cadastrar objeções e respostas;
- cadastrar soluções e procedimentos vencedores.

### Bloco 3 — Produto
- captura de atendimento;
- timeline do caso;
- análise de texto e áudio;
- classificação de perfil;
- recomendação;
- registro de resultado.

### Bloco 4 — Gestão
- dashboard de conversão;
- dashboard de objeções;
- dashboard de aderência vendedor x cliente;
- trilha de coaching.

### Bloco 5 — Governança
- LGPD;
- auditoria;
- revisão humana;
- métricas de qualidade da IA.

---

## 15. Recomendação Final

A melhor definição para este projeto é:

> Uma plataforma AI-first de inteligência comercial que transforma atendimento em aprendizado operacional e aumenta a taxa de conversão sem depender apenas da experiência individual do vendedor.

### Direcionamento final para o MVP

- **Canal principal:** WhatsApp
- **Mídias analisadas no MVP:** texto + áudio
- **Imagem:** opcional
- **Vídeo:** armazenar agora, analisar depois
- **Saída operacional:** dashboard/copilot, e não resposta no WhatsApp
- **Base de conhecimento inicial:** vídeos do Nicolau + playbooks internos
- **Objetivo do MVP:** coaching prático + inteligência gerencial + retenção de conhecimento

---

## 16. Próximos Passos Sugeridos

1. Fechar taxonomia de perfis de cliente e vendedor.
2. Definir formalmente sinais de perda, sinais de avanço e venda efetivada.
3. Escolher o canal oficial do MVP e validar a estratégia com WhatsApp.
4. Estruturar a base de conhecimento inicial.
5. Desenhar o modelo de dados e o fluxo técnico da ingestão até o aprendizado.
6. Priorizar backlog de MVP com foco em texto, áudio, dashboard e auditoria.

