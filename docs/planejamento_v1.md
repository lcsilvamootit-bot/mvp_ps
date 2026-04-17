# Planejamento V1 — Sales Intelligence
**Status:** Planejamento  
**Contexto:** Piloto em corretora de seguros e planos de saúde, time jovem, sócio psicólogo já ativo como consultor

---

## Estrutura de entregas

```
Protótipo V1  → validar o produto com dados reais (sem auth)
Produto V2    → entregável comercial (com auth, histórico, dashboard)
```

---

## Protótipo V1

*Meta: produto rodando na corretora, dados reais entrando, psicólogo validando*  
*Deploy: Vercel + Neon (PostgreSQL)*  
*Auth: nenhuma — acesso aberto por link*

### Dois usuários, dois fluxos

```
Corretor  → analisa atendimento → registra resultado → dado salvo no banco
Psicólogo → acessa /revisao → avalia os perfis detectados pela IA → feedback salvo
```

---

### Fluxo 1 — Corretor

**O que muda na interface atual:**
- [ ] Campo "Seu nome" (corretor) — texto livre, antes de colar a conversa
- [ ] Campo "Referência do cliente" — apelido/código, não dado sensível
- [ ] Botões Venda Fechada / Venda Perdida já existem — conectar ao banco
- [ ] Ao clicar em Fechada ou Perdida: salvar análise completa no banco

**O que salva no banco:**
```
data e hora
corretor (texto)
cliente_ref (texto)
conversa (texto, truncada)
perfil_jung, perfil_momento, contexto_temporal
tendencia, resultado (fechada/perdida)
gerou_resgate (boolean)
dados completos do diagnóstico (JSON)
```

---

### Fluxo 2 — Psicólogo (painel /revisao)

**O que construir:**
- [ ] Rota `/revisao` — protegida por senha simples no `.env` (sem auth formal)
- [ ] Lista de análises: data, corretor, cliente_ref, perfil Jung detectado, resultado
- [ ] Clique em uma análise → abre diagnóstico completo + conversa original
- [ ] Campos de avaliação:
  - Perfil Jung: `Correto / Parcialmente / Errado` + dropdown "qual seria?" (se errado)
  - Perfil Momento: `Correto / Parcialmente / Errado` + dropdown "qual seria?"
  - Contexto temporal: `Correto / Errado`
  - Observação livre (textarea) — insights que a IA não capturou
- [ ] Botão Salvar avaliação → grava na tabela `feedbacks`

**Por que o feedback do psicólogo é dado de treino, não só validação:**
```
Conversa original
  + Perfil detectado pela IA   ← o que o modelo achou
  + Perfil corrigido pelo sócio ← o que é verdade
  + Resultado real

= Ground truth que alimenta RAG e fine-tuning no V2
```
Sem isso, o RAG aprende com os erros da IA. Com isso, aprende com o que o psicólogo sabe.

---

### Banco de dados (Neon PostgreSQL)

**Decisões de design — DBA:**

| Dado | Coluna escalar | JSONB | Motivo |
|------|---------------|-------|--------|
| perfil_jung, tendencia, resultado | ✅ | — | Usados em WHERE/GROUP BY/dashboard |
| client_data, vendor_data, signals_data, sir_data | — | ✅ | Conteúdo narrativo, arrays internos, nunca filtrado isoladamente |
| rescue_plan | — | ✅ | Lido sempre junto com o atendimento, nullable |
| conversa_raw | ✅ (TEXT) | — | Campo longo mas pontual — TOAST comprime automaticamente |

**Schema completo:**

```sql
-- Extensões (instalar agora, usar depois)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";  -- V3: RAG

-- ── workspace_settings (contexto do negócio — configurado pelo psicólogo) ──
-- 1 linha. Sempre. Psicólogo configura uma vez, todas as análises usam.
CREATE TABLE workspace_settings (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  context_data JSONB       NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by   TEXT        -- V1: nome livre | V2: FK users
);
INSERT INTO workspace_settings (context_data) VALUES ('{}');
-- Campos em context_data: setor, produto, ticketMedio, cicloDecisao,
-- perfilCliente, concorrentes, objecoes, observacao

-- Enums de domínio
CREATE TYPE perfil_jung      AS ENUM ('Pragmático', 'Analítico', 'Afável', 'Expressivo');
CREATE TYPE perfil_momento   AS ENUM ('Indeciso', 'Confuso', 'Decidido', 'Crítico', 'Nervoso', 'Apressado', 'Negociador', 'Detalhista', 'Informal');
CREATE TYPE contexto_temporal AS ENUM ('Ativo', 'Resgate', 'Follow-up', 'Indefinido');
CREATE TYPE tendencia_venda  AS ENUM ('Avançando', 'Estagnado', 'Em risco', 'Perdido');
CREATE TYPE resultado_real   AS ENUM ('fechada', 'perdida', 'resgate_bem_sucedido', 'resgate_frustrado', 'em_andamento');
CREATE TYPE nota_avaliacao   AS ENUM ('Acertou', 'Parcial', 'Errou');
CREATE TYPE nivel_risco      AS ENUM ('Alta', 'Média', 'Baixa');
CREATE TYPE nivel_aderencia  AS ENUM ('Alta', 'Média', 'Baixa');
CREATE TYPE avaliacao_psico  AS ENUM ('correto', 'parcialmente', 'errado');
CREATE TYPE user_role        AS ENUM ('gestor', 'vendedor');
CREATE TYPE auth_token_type  AS ENUM ('invite', 'reset');

-- ── users (vazia no V1, usada no V2) ──────────────────────────────
CREATE TABLE users (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 TEXT        NOT NULL,
  email                TEXT        NOT NULL UNIQUE,
  password_hash        TEXT,                    -- NULL = convite pendente
  role                 user_role   NOT NULL DEFAULT 'vendedor',
  active               BOOLEAN     NOT NULL DEFAULT true,
  must_change_password BOOLEAN     NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── teams + team_members (V2) ─────────────────────────────────────
CREATE TABLE teams (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL,
  gestor_id  UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE team_members (
  team_id   UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- ── auth_tokens (V2) ──────────────────────────────────────────────
CREATE TABLE auth_tokens (
  id         UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  token      TEXT            NOT NULL UNIQUE,
  type       auth_token_type NOT NULL,
  user_id    UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ     NOT NULL,
  used_at    TIMESTAMPTZ,               -- NULL = ainda válido
  created_at TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ── analyses (núcleo do produto) ──────────────────────────────────
CREATE TABLE analyses (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Quem fez: V1 = texto livre, V2 = FK
  -- Migração: UPDATE analyses SET user_id = users.id ... quando V2 ativar
  corretor_nome   TEXT,
  user_id         UUID          REFERENCES users(id) ON DELETE SET NULL,
  cliente_ref     TEXT,                  -- apelido/código — NUNCA CPF ou nome real

  conversa_raw    TEXT          NOT NULL, -- TOAST comprime automaticamente

  -- Escalares do cliente (usados em filtros/dashboard)
  perfil_jung            perfil_jung,
  perfil_momento         perfil_momento,
  contexto_temporal      contexto_temporal,
  tendencia              tendencia_venda,

  -- Escalares do vendedor
  perfil_natural_vendedor perfil_jung,
  aderencia_cliente       nivel_aderencia,
  fase1_nota              nota_avaliacao,
  fase2_nota              nota_avaliacao,
  risco_perda             nivel_risco,

  -- Conteúdo completo dos 4 schemas (nunca filtrado isoladamente)
  client_data   JSONB,   -- clientAnalysisSchema completo
  vendor_data   JSONB,   -- vendorAnalysisSchema completo
  signals_data  JSONB,   -- signalsSchema completo
  sir_data      JSONB,   -- sirSchema completo
  rescue_plan   JSONB,   -- rescueSchema — NULL até ser solicitado

  -- Resultado real
  resultado               resultado_real NOT NULL DEFAULT 'em_andamento',
  resultado_registrado_em TIMESTAMPTZ,

  -- Observabilidade da IA
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  model_used     TEXT NOT NULL DEFAULT 'gpt-4o',

  -- LGPD
  retain_until   DATE,        -- job de anonimização usa esse campo
  deleted_at     TIMESTAMPTZ, -- soft delete

  -- Multi-tenant V4 (NULL enquanto single-tenant)
  tenant_id      UUID,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── psych_reviews (ground truth do psicólogo) ─────────────────────
CREATE TABLE psych_reviews (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id     UUID          NOT NULL REFERENCES analyses(id) ON DELETE CASCADE UNIQUE,
  reviewer_nome   TEXT,                    -- V1: texto livre
  reviewer_id     UUID          REFERENCES users(id) ON DELETE SET NULL, -- V2

  jung_avaliacao     avaliacao_psico NOT NULL,
  jung_correto       perfil_jung,           -- preenchido se errou
  momento_avaliacao  avaliacao_psico NOT NULL,
  momento_correto    perfil_momento,        -- preenchido se errou
  contexto_avaliacao avaliacao_psico NOT NULL,
  contexto_correto   contexto_temporal,     -- preenchido se errou
  observacao         TEXT,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── analysis_embeddings (V3 — estrutura criada agora) ─────────────
CREATE TABLE analysis_embeddings (
  id              UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id     UUID    NOT NULL REFERENCES analyses(id) ON DELETE CASCADE UNIQUE,
  embedding       vector(1536),              -- text-embedding-3-small
  uses_corrected_profile BOOLEAN NOT NULL DEFAULT false,
  model_used      TEXT    NOT NULL DEFAULT 'text-embedding-3-small',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Índice HNSW criado no V3 quando houver dados suficientes:
-- CREATE INDEX ON analysis_embeddings USING hnsw (embedding vector_cosine_ops);

-- ── audio_fingerprints (V3B — dado biométrico / LGPD) ─────────────
CREATE TABLE audio_fingerprints (
  id                  UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id         UUID    NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  speaker_type        TEXT    NOT NULL CHECK (speaker_type IN ('vendedor', 'cliente')),
  fingerprint         vector(256),           -- resemblyzer/pyannote
  consent_given_at    TIMESTAMPTZ NOT NULL,
  consent_expires_at  TIMESTAMPTZ NOT NULL,
  consent_revoked_at  TIMESTAMPTZ,
  legal_basis         TEXT NOT NULL DEFAULT 'consentimento_art7_ix',
  data_subject_ref    TEXT NOT NULL,         -- referência LGPD ao titular
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Índices ───────────────────────────────────────────────────────
CREATE INDEX idx_analyses_corretor     ON analyses (corretor_nome)  WHERE deleted_at IS NULL;
CREATE INDEX idx_analyses_user_id      ON analyses (user_id)        WHERE deleted_at IS NULL;
CREATE INDEX idx_analyses_created_at   ON analyses (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_analyses_perfil_jung  ON analyses (perfil_jung)    WHERE deleted_at IS NULL;
CREATE INDEX idx_analyses_tendencia    ON analyses (tendencia)      WHERE deleted_at IS NULL;
CREATE INDEX idx_analyses_resultado    ON analyses (resultado)      WHERE deleted_at IS NULL;
CREATE INDEX idx_analyses_tenant_id    ON analyses (tenant_id)      WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_analyses_retain_until ON analyses (retain_until)   WHERE deleted_at IS NULL AND retain_until IS NOT NULL;
CREATE INDEX idx_analyses_client_gin   ON analyses USING GIN (client_data);
CREATE INDEX idx_analyses_signals_gin  ON analyses USING GIN (signals_data);
CREATE INDEX idx_psych_reviews_anal    ON psych_reviews (analysis_id);
CREATE INDEX idx_audio_fp_consent      ON audio_fingerprints (consent_expires_at) WHERE consent_revoked_at IS NULL;

-- ── Trigger updated_at ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_analyses_updated_at    BEFORE UPDATE ON analyses    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_users_updated_at       BEFORE UPDATE ON users       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_psych_reviews_updated_at BEFORE UPDATE ON psych_reviews FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

### Rotas de API (Backend)

**Client de banco:** `@neondatabase/serverless` — não `postgres.js`. Razão: Vercel é serverless; postgres.js abre conexões TCP persistentes que vazam entre invocações. O cliente Neon usa HTTP/WebSocket adequado ao modelo stateless.

```
POST   /api/analyses              → corretor salva análise + resultado
GET    /api/analyses              → psicólogo lista análises (?pendente=true)
GET    /api/analyses/[id]         → análise completa com review (se existir)
POST   /api/analyses/[id]/rescue  → salvar plano de resgate em análise existente
POST   /api/analyses/[id]/review  → psicólogo registra avaliação
GET    /api/settings              → ler contexto do negócio
POST   /api/settings              → psicólogo salva contexto do negócio
POST   /api/auth/login            → autenticar psicólogo (senha do .env)
POST   /api/auth/logout           → destruir sessão
GET    /api/auth/me               → verificar sessão ativa
```

**Proteção da rota `/revisao`:** HMAC com `SESSION_SECRET` via `crypto.subtle` (Edge-safe). Dois níveis: middleware.js redireciona para `/login` + cada route handler verifica novamente — não confiar só no middleware.

### Variáveis de ambiente a adicionar

```bash
DATABASE_URL=           # injetado automaticamente pelo Neon no Vercel
PSYCHOLOGIST_PASSWORD=  # senha da rota /revisao
SESSION_SECRET=         # openssl rand -base64 32
```

### Arquitetura V1

```
Next.js (Vercel)
├── /                        → análise (já existe + campos corretor/cliente)
├── /login                   → tela de login do psicólogo (senha única)
├── /revisao                 → painel do psicólogo (lista de análises)
├── /revisao/[id]            → análise individual + formulário de avaliação
├── /revisao/configuracoes   → contexto do negócio (psicólogo configura uma vez)
└── /api/
    ├── analyze/             (já existe — contexto injetado automaticamente)
    ├── rescue/              (já existe — contexto injetado automaticamente)
    ├── settings/            (novo)
    ├── analyses/            (novo)
    │   └── [id]/
    │       ├── rescue/      (novo)
    │       └── review/      (novo)
    └── auth/
        ├── login/           (novo)
        ├── logout/          (novo)
        └── me/              (novo)

Neon PostgreSQL
├── analyses            → núcleo
├── psych_reviews       → ground truth do psicólogo
├── workspace_settings  → contexto do negócio (1 linha)
└── (users, teams, auth_tokens — criadas agora, usadas no V2)
```

### Ordem de implementação

```
Sprint 1 — Infraestrutura de banco
  → instalar @neondatabase/serverless
  → criar src/lib/db.js
  → rodar DDL no Neon

Sprint 2 — Fluxo do corretor (valor imediato)
  → POST /api/analyses
  → POST /api/analyses/[id]/rescue
  → conectar botões Fechada/Perdida no frontend

Sprint 3 — Auth do psicólogo + Configurações
  → src/lib/auth.js (HMAC token)
  → POST /api/auth/login, logout, me
  → middleware.js protege /revisao/*
  → /revisao/configuracoes já criada — protegida pelo middleware

Sprint 4 — Painel do psicólogo
  → GET /api/analyses + GET /api/analyses/[id]
  → POST /api/analyses/[id]/review
  → UI /revisao e /revisao/[id]
```

---

### O que NÃO entra no V1
- Auth (login/senha)
- Histórico por corretor com login
- Dashboard do gestor
- Embeddings / RAG
- Fingerprint de áudio
- Multi-tenant

---

## Produto V2 — entregável comercial

*Construir após validar o V1 com dados reais*

- Auth completa (Gestor + Vendedor) — já planejada na seção de Controle de Acesso
- Histórico de atendimentos por corretor (login → vê só os seus)
- Dashboard do gestor (métricas da equipe)
- Embeddings textuais acumulando (Neon + pgvector)
- RAG usando ground truth do psicólogo
- Deploy em domínio próprio

---

## Métrica de sucesso do V1
> 50+ conversas com resultado registrado + psicólogo revisou 30+ → IA acertando 75%+ nos perfis Jung → sócio consegue apontar o perfil mais perdido e o argumento que mais converte nessa corretora.

---

### Fase 1 — Fundação de dados (Semanas 8–16)
*Meta: sair da planilha e ter a base que vai alimentar a IA*

**Infraestrutura:**
- PostgreSQL como banco principal
- pgvector como extensão para embeddings (evita um serviço a mais)
- Tabelas: `conversations`, `analyses`, `outcomes`, `feedback`
- Autenticação simples: email + senha por corretor

**Tabela `feedback` — o dado mais valioso do sistema:**

```sql
-- Avaliações do psicólogo migradas da planilha para o banco
CREATE TABLE feedback (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id           UUID NOT NULL REFERENCES analyses(id),
  perfil_jung_correto   VARCHAR(20),   -- o que o psicólogo diz que é
  perfil_momento_correto VARCHAR(30),
  contexto_correto      VARCHAR(20),
  perfil_jung_acerto    BOOLEAN,       -- IA acertou ou não
  perfil_momento_acerto BOOLEAN,
  observacao            TEXT,          -- insight livre do psicólogo
  revisado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Esse dado é o que separa o RAG desta plataforma de qualquer concorrente genérico — é conhecimento validado por um psicólogo sobre atendimentos reais de seguros.

**Embeddings (OpenAI text-embedding-3-small):**

Cada conversa analisada gera um vetor e armazena junto com:
- Perfil detectado pela IA (Jung + Momento)
- **Perfil corrigido pelo psicólogo** (quando existe revisão)
- Resultado real (fechou/perdeu)
- Setor (seguros, plano de saúde, etc.)
- Sinal dominante de perda ou avanço

O embedding usa **o perfil corrigido quando disponível**, não o detectado. Isso garante que a busca por similaridade retorna casos com ground truth humano, não apenas inferência da IA.

**Por que embeddings aqui:**
Quando chegar uma conversa nova, o sistema busca as 5 mais similares com resultado conhecido. Em vez de só dizer "esse cliente é Analítico + Detalhista", diz "em 8 conversas similares nessa corretora validadas pelo psicólogo, 6 fecharam quando o vendedor mandou comparativo antes de ligar."

---

### Fase 2 — Camada RAG (Semanas 16–28)
*Meta: a IA deixa de ser genérica e passa a raciocinar com histórico real*

**RAG — Retrieval Augmented Generation:**

Quando uma nova conversa chega para análise:
1. Gera embedding da conversa
2. Busca as 5 conversas mais similares no banco (mesma corretora, perfil próximo)
3. Injeta esses exemplos reais no prompt do SIR:

```
Conversas similares nessa corretora:
- Analítico + Detalhista, contexto Follow-up → fechou após envio de comparativo de cobertura
- Analítico + Detalhista, contexto Resgate → perdeu após segunda insistência sem nova informação
- Analítico + Indeciso, contexto Ativo → fechou quando vendedor parou de pressionar e pediu dúvidas específicas
```

O modelo passa a recomendar com base em evidência real, não só taxonomia teórica.

**Playbook de objeções vetorizado:**

Cada objeção registrada ("tá caro", "vou pensar", "já tenho") vira um vetor com:
- Perfil do cliente que fez essa objeção
- Resposta que o vendedor usou
- Se funcionou ou não

Quando a IA detectar uma objeção similar, busca as respostas que funcionaram para esse perfil.

---

### Fase 3 — Camada de inteligência (Semanas 28–52)
*Meta: o produto começa a antecipar, não só diagnosticar*

**Outras técnicas viáveis além de embeddings:**

**1. Fine-tuning**
Com 500+ conversas rotuladas (perfil + resultado), treinar uma versão especializada do modelo base. Mais rápido, mais barato, mais preciso para esse nicho específico. O dado acumulado no Fase 0-2 é exatamente o dataset de treino.

**2. Predição de resultado**
Com padrões suficientes, construir um score: "conversas com esse perfil + esses sinais fecham em X% dos casos nessa corretora." O corretor vê: "Probabilidade de fechar: 68% — aqui está o que os 32% que não fecharam tinham em comum."

**3. Clustering semântico**
Agrupar conversas por similaridade sem rótulo pré-definido. Descobre padrões que ninguém sabia que existiam: "existe um tipo de cliente que sempre pede 3 semanas para decidir — aqui está o que os diferencia dos que decidem rápido."

**4. Knowledge graph de objeções**
Mapear: Perfil → Objeção → Argumento → Resultado  
"Objeção de preço com Pragmático foi superada por comparativo de cobertura em 71% dos casos. Com Afável, foi superada por depoimento de cliente similar em 68%."

**5. Semantic caching**
Conversas muito similares recebem análise em cache, sem nova chamada à IA. Reduz custo significativamente quando o volume escalar. Útil a partir de milhares de análises por mês.

**6. Otimização automática de prompts (DSPy)**
Usar framework DSPy para otimizar os prompts com base no feedback humano acumulado. Em vez de ajustar manualmente, o sistema aprende quais formulações produzem análises mais validadas pelo sócio.

---

### Fase 3B — Fingerprint de áudio e identificação de falantes (Semanas 32–48)
*Meta: reconhecer vendedor e cliente por voz, acumular perfil cross-conversas*

**O problema que resolve:**

Hoje cada conversa é analisada de forma isolada. Sem identificação de voz, o sistema não sabe que o cliente do áudio desta semana é o mesmo que sumiu há 3 semanas. Também não consegue medir se o vendedor melhorou o tom ao longo do tempo.

**Como funciona o fingerprint de áudio:**

1. Quando um áudio é enviado, antes da transcrição, roda **diarização de falantes** — separação automática de quem é o vendedor e quem é o cliente na gravação
2. Para cada falante detectado, extrai um **speaker embedding** — vetor numérico de ~256 dimensões que representa a assinatura vocal única daquela pessoa
3. O embedding é armazenado no banco com pgvector, vinculado ao atendimento
4. Em análises futuras, o sistema compara o novo embedding com os armazenados via **similaridade de cosseno**
5. Se similaridade > threshold (≈ 0.82): mesmo falante identificado

**O que isso habilita:**

| Use case | Como funciona |
|---|---|
| Mesmo cliente em conversas diferentes | Embedding do cliente novo bate com embedding de atendimento anterior → perfil acumulado automaticamente |
| Verificação de resgate | "Este áudio é do mesmo cliente que não fechou em 15/03?" → confirmação ou negação automática |
| Perfil evolutivo do vendedor | Tom, ritmo e pausa do vendedor medidos ao longo de dezenas de atendimentos → curva de desenvolvimento real |
| Rating cruzado | Mesmo cliente avaliou 3 vendedores diferentes → comparar qual abordagem gerou mais engajamento por voz |
| Clientes recorrentes | Cliente que renova plano todo ano é identificado automaticamente, sem depender de nome ou telefone |

**Técnicas e ferramentas:**

**Diarização (separar falantes):**
- `pyannote/speaker-diarization` — open source, estado da arte, roda em servidor próprio
- `AssemblyAI` — API com diarização nativa, integra direto com transcrição
- `Azure Speaker Recognition` — robusto para pt-BR

**Extração de embeddings (fingerprint):**
- `resemblyzer` — leve, gera d-vectors de 256 dimensões, open source
- `pyannote/embedding` — mais preciso, mesma família do diarizer
- `speechbrain` — framework completo para tarefas de voz

**Recomendação para o V1:**
Usar **AssemblyAI** para diarização + transcrição em uma única chamada (substitui Whisper quando há áudio com dois falantes). Extrair embeddings via `resemblyzer` ou `pyannote`. Armazenar em pgvector junto com os demais dados da conversa.

**Custo estimado por minuto de áudio:**
- AssemblyAI diarização: ~$0.003/min
- Embedding local (pyannote): custo de servidor, ~$0.001/min estimado
- Total: viável para volumes de piloto

**Pipeline de fingerprint:**

```
Áudio recebido
  → Diarização (separa VENDEDOR e CLIENTE)
  → Transcrição por falante ([VENDEDOR]: ... [CLIENTE]: ...)
  → Extração de embedding por falante
  → Busca no banco: existe embedding similar?
      → Sim: vincular ao perfil existente
      → Não: criar novo perfil de voz
  → Análise comportamental com contexto histórico do cliente
```

**Dados que ficam acumulados por cliente de voz:**
- Embedding de voz (identificação)
- Histórico de perfis detectados ao longo dos atendimentos
- Evolução do Perfil de Momento (era Indeciso → virou Decidido na 3ª conversa)
- Quais vendedores atenderam e com qual resultado
- Se foi resgatado e por quem

**Dados que ficam acumulados por vendedor:**
- Embedding de voz (autenticação — confirma que é realmente aquele vendedor)
- Evolução de tom ao longo do tempo (medido pelo ritmo de fala + pausas na transcrição)
- Padrão de aderência: com quais perfis de cliente performa melhor
- Rating de engajamento: clientes respondem mais quando ele fala de qual forma

**Considerações LGPD:**
- Embedding de voz é dado biométrico — base legal obrigatória antes de coletar
- Consentimento do cliente na gravação (o vendedor avisa que a conversa é gravada para fins de melhoria do atendimento)
- Armazenar embedding, não o áudio bruto, minimiza exposição
- Prazo de retenção definido (ex: 2 anos ou até encerramento do contrato)
- Direito de exclusão: delete do embedding remove todo o rastreamento daquele falante

---

### Fase 4 — Plataforma (12+ meses)
*Meta: expandir para outras corretoras com a base já validada*

- Multi-tenant (cada corretora com seu histórico isolado)
- Knowledge base por setor (seguros, plano de saúde, consórcio)
- Dashboard do gestor com padrões por corretor, por perfil, por produto
- API para integração com CRM
- Integração nativa com WhatsApp Business API
- Modelo fine-tuned por nicho

---

## Arquitetura técnica por fase

```
Fase 0:   Next.js + OpenAI Whisper + Google Sheets (webhook)
Fase 1:   + PostgreSQL + pgvector + Auth simples
Fase 2:   + Pipeline de embeddings textuais + RAG no SIR + Playbook vetorizado
Fase 3A:  + Score de probabilidade + Clustering + Fine-tuning
Fase 3B:  + AssemblyAI diarização + resemblyzer/pyannote embeddings de voz
          + Identificação cross-conversa + Perfil evolutivo por falante
Fase 4:   + Multi-tenant + WhatsApp API + CRM integration
```

---

## LGPD — Nasce com o produto, não depois

### Por que é diferente aqui

Esse produto processa três categorias de dado sensível simultaneamente:
- **Dado biométrico** (embedding de voz) — categoria especial, Art. 11 LGPD
- **Dado comportamental** (perfil psicológico inferido) — dado sensível por natureza
- **Conteúdo de conversa** (transcrição de atendimento) — pode conter dados pessoais do cliente final

Multa máxima ANPD: 2% do faturamento, até R$50 milhões por infração. Para um produto B2B que processa dados de clientes de terceiros, a responsabilidade é compartilhada entre você (operador) e a corretora (controlador).

---

### Base legal por tipo de dado

| Dado | Base legal aplicável | O que exige na prática |
|---|---|---|
| Transcrição da conversa | Legítimo interesse (melhoria do atendimento) + consentimento | Aviso de gravação antes do atendimento |
| Perfil comportamental inferido | Legítimo interesse | Finalidade documentada, proporcionalidade |
| Embedding de voz (vendedor) | Contrato de trabalho + política interna | Cláusula no contrato do corretor |
| Embedding de voz (cliente) | Consentimento explícito | Opt-in antes da gravação, não opt-out |
| Dados de menores | Proibido sem consentimento dos pais | Nunca coletar sem processo específico |

---

### O que precisa existir desde o primeiro atendimento

**1. Aviso de gravação obrigatório**

O corretor precisa avisar o cliente antes de qualquer gravação. Pode ser:
- Mensagem padrão no WhatsApp antes de iniciar: "Nossa conversa pode ser gravada para fins de melhoria do atendimento."
- Áudio ou mensagem automática no início de ligações
- Não pode ser em letra miúda no contrato — precisa ser explícito

**2. Consentimento para dado biométrico**

Embedding de voz é dado biométrico — base legal é **apenas consentimento** (Art. 11, II, a).
- Consentimento livre, informado, inequívoco
- Finalidade específica: "identificação do perfil de atendimento ao longo do tempo"
- Direito de retirar o consentimento a qualquer momento
- Sem consentimento: não gera embedding, processa só o texto

**3. Política de retenção**

| Dado | Prazo de retenção | Critério |
|---|---|---|
| Transcrição | 2 anos | Prazo prescricional de reclamações |
| Análise comportamental | 2 anos | Mesmo prazo |
| Embedding de voz | Vigência do consentimento | Delete imediato se retirar consentimento |
| Áudio bruto | Não armazenar | Só processar em memória, nunca persistir |

**Armazenar o embedding, nunca o áudio bruto.** O áudio bruto é o dado mais sensível e o que mais expõe. Depois de gerar o embedding e a transcrição, descarta.

**4. Direitos do titular**

O produto precisa responder a qualquer um desses pedidos em até 15 dias:
- Confirmação de existência de dados
- Acesso aos dados (o que foi coletado sobre mim?)
- Correção de dados incorretos
- Exclusão (delete de tudo, incluindo embedding)
- Portabilidade
- Informação sobre compartilhamento

Implementar desde a Fase 1: endpoint de exclusão por CPF ou ID do cliente.

---

### Arquitetura que nasce LGPD-ready

**Separação de dados por finalidade:**
```
conversations       → texto da conversa (sem dado pessoal identificável direto)
speaker_profiles    → embeddings de voz + consentimento + data de expiração
analyses            → resultados da IA (perfil, sinais, recomendações)
personal_data       → nome, telefone, CPF — tabela separada, acesso restrito
audit_log           → quem acessou o quê e quando
```

**Pseudoanonimização desde o início:**
- Conversas armazenadas com `client_token` (hash), não nome real
- Nome e telefone em tabela separada, vinculado só pelo token
- Análise e embedding nunca contêm dado identificável direto
- Para responder pedido de exclusão: delete do token + delete do embedding

**Controle de acesso:**
- Corretor vê só seus próprios atendimentos
- Gestor vê o time dele
- Nunca acesso cruzado entre corretoras
- Log de acesso imutável para auditoria

**Retenção automática:**
- Job diário verifica embeddings com consentimento expirado ou retirado → delete automático
- Notificação ao gestor quando dado está próximo do prazo de retenção

---

### DPO e documentação mínima

Mesmo no piloto, documentar:
- **ROPA** (Registro de Operações de Tratamento) — mapa de quais dados, para quê, por quanto tempo
- **DPIA** (Relatório de Impacto) — obrigatório para dado biométrico e perfil psicológico
- **Política de Privacidade** — para o produto e para a corretora usar com seus clientes
- **DPA** (Data Processing Agreement) — contrato entre você (operador) e a corretora (controlador)

Não precisa de advogado para tudo isso desde o dia 1 do piloto — mas precisa existir antes de escalar para mais de uma empresa.

---

### Resumo: o que implementar em cada fase

| Fase | O que implementar |
|---|---|
| Fase 0 (piloto) | Aviso de gravação, não armazenar áudio bruto, pseudoanonimização básica |
| Fase 1 (banco de dados) | Separação de tabelas, audit log, endpoint de exclusão, ROPA documentado |
| Fase 3B (fingerprint) | Consentimento explícito para biométrico, expiração automática de embeddings, DPIA |
| Fase 4 (plataforma) | DPA por cliente, DPO nomeado, processo formal de resposta a titulares |

---

---

# Controle de Acesso e Autenticação

> Análise estruturada — PO + UX + Backend + Frontend

---

## Visão Geral do Sistema

**Roles:** Gestor e Vendedor  
**Auth:** JWT via cookie httpOnly (sem localStorage)  
**Stack:** Next.js 16 App Router + `jose` (Edge Runtime) + `bcryptjs` + PostgreSQL

---

## User Stories (PO)

### Gestor

| ID | Story | Critério mínimo |
|----|-------|-----------------|
| G01 | Como gestor, quero fazer login com email/senha | JWT retornado, redirecionamento ao dashboard de equipe |
| G02 | Como gestor, quero criar um vendedor na minha equipe | Vendedor criado com `must_change_password: true`; convite enviado |
| G03 | Como gestor, quero inativar um vendedor sem deletar dados | Login bloqueado; histórico preservado |
| G04 | Como gestor, quero reativar um vendedor | Login liberado; dados anteriores visíveis normalmente |
| G05 | Como gestor, quero ver atendimentos e métricas de toda minha equipe | Visão agregada com drill-down por vendedor |
| G06 | Como gestor, quero ver desempenho individual de cada vendedor | Histórico e métricas por vendedor |
| G07 | Como gestor, quero alterar minha própria senha | Senha atualizada sem perda de sessão |

### Vendedor

| ID | Story | Critério mínimo |
|----|-------|-----------------|
| V01 | Como vendedor, no primeiro acesso quero ser obrigado a criar uma senha | Fluxo de troca forçada antes de qualquer outra tela |
| V02 | Como vendedor, quero fazer login para acessar meu dashboard | JWT retornado; acesso restrito aos próprios dados |
| V03 | Como vendedor, quero ver apenas meus próprios atendimentos | Isolamento total — outros vendedores invisíveis |
| V04 | Como vendedor, quero alterar minha própria senha | Senha atualizada com confirmação |
| V05 | Como vendedor inativado, quero ver uma mensagem clara | Tela dedicada com contato do gestor |
| V06 | Como vendedor, quero recuperar minha senha por email se esqueci | Link seguro enviado ao email com expiração de 1h |

### Compartilhado (Gestor e Vendedor)

| ID | Story | Critério mínimo |
|----|-------|-----------------|
| C01 | Como usuário, quero solicitar recuperação de senha pelo email | Resposta genérica independente de o email existir (anti-enumeration) |
| C02 | Como usuário, quero redefinir minha senha via link recebido por email | Token one-time, expira em 1h, invalidado após uso |

---

## O Que Cada Role Vê

### Gestor
- Dashboard com métricas agregadas da sua equipe
- Lista de atendimentos de todos os seus vendedores (com filtro por vendedor)
- Gestão de time: criar, ativar, inativar vendedores vinculados a ele
- **Não vê:** vendedores ou atendimentos de outros gestores

### Vendedor
- Dashboard apenas com suas próprias métricas
- Lista dos seus próprios atendimentos
- Análise individual de cada atendimento (a interface atual)
- **Não pode:** ver outros vendedores, criar usuários, acessar qualquer rota de gestão

---

## Regras de Negócio (Decisões Antes de Codificar)

### RN-01 — Vendedor pode pertencer a mais de um gestor?
- **MVP:** 1 vendedor → 1 gestor (relação simples, FK direta)
- **Fase 2:** 1 vendedor → N gestores (tabela pivot `team_members`)
- Mudança de A para B é aditiva e não quebra dados existentes

### RN-02 — Gestor vê dados de outro gestor?
- **MVP:** Não. Isolamento total por equipe. Sem super-gestor.
- **Fase 2:** Role de diretor/admin com visão cross-team (se o negócio escalar)

### RN-03 — Quem cria o primeiro gestor? (bootstrap problem)
- **Solução:** script de seed via variável de ambiente — sem endpoint público
- Precisa estar definido antes do deploy em produção

### RN-06 — Lag de inativação do JWT
- JWT emitido continua válido até expirar — vendedor inativado ainda opera pelo tempo restante
- **MVP:** access token de 1h + refresh token de 7 dias → max 1h de lag (aceitável)
- **Fase 2:** blacklist de refresh tokens se tolerância zero for exigida

### RN-05 — Atendimentos de vendedor inativado
- Dados sempre preservados e visíveis para o gestor com marcação de status "inativo"
- Nunca sumir dos agregados sem aviso

---

## Banco de Dados

```sql
-- Usuários: identidade + flags de auth
CREATE TABLE users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 VARCHAR(120) NOT NULL,
  email                VARCHAR(255) NOT NULL UNIQUE,
  password_hash        VARCHAR(255) NOT NULL,
  role                 VARCHAR(20)  NOT NULL CHECK (role IN ('gestor', 'vendedor')),
  active               BOOLEAN      NOT NULL DEFAULT TRUE,
  must_change_password BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Equipes: uma equipe pertence a um gestor
CREATE TABLE teams (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(120) NOT NULL,
  gestor_id  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Membros: vendedor <-> equipe (N:M pronto para Fase 2)
CREATE TABLE team_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id   UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_teams_gestor ON teams(gestor_id);
```

---

## JWT Payload

```js
// Access Token (1h)
{
  sub:                 "uuid-do-usuario",
  role:                "vendedor",          // "gestor" | "vendedor"
  teamIds:             ["uuid-team-1"],     // equipes do usuário — evita JOIN por request
  mustChangePassword:  false,               // redireciona para /primeiro-acesso se true
  active:              true,                // false = token rejeitado no middleware
  iat, exp
}

// Refresh Token (7 dias) — mais enxuto
{ sub, jti, iat, exp }                      // jti permite revogação individual
```

**`teamIds` no token:** evita JOIN a cada request. Para MVPs com equipes pequenas é a troca certa — o token cresce ~50 bytes por equipe.

---

## Fluxo Completo: Criação de Vendedor → Primeiro Acesso

```
1. Gestor preenche: nome + telefone (WhatsApp) + email
2. Backend gera token de convite com crypto.randomBytes(32) — salva no banco com exp 72h
3. Salva must_change_password: true no banco (sem senha ainda)
4. Envia link via WhatsApp: "Seu acesso está pronto! [link] (expira em 72h)"
5. Vendedor abre link → token validado + email pré-preenchido (readonly) + campo "nova senha"
6. Após criar senha: bcrypt(senha, 12) salvo + must_change_password: false + token deletado
7. Emite tokens limpos → redirect para /dashboard/vendedor
```

**Não exibir senha temporária** para o gestor — elimina o vetor de "senha anotada no papel".

---

## Fluxo Completo: Recuperação de Senha por Email

```
1. Usuário acessa /esqueci-senha e informa o email
2. Backend busca o usuário — responde SEMPRE a mesma mensagem (anti-enumeration):
   "Se este e-mail estiver cadastrado, você receberá as instruções em breve."
3. Se o email existir:
   a. Deleta tokens de reset anteriores do mesmo email (prefixo "reset:<email>")
   b. Gera token com crypto.randomBytes(32) — salva com expiração de 1h
   c. Envia email com link: /redefinir-senha?token=<hex>
4. Usuário clica no link → tela com campo "nova senha" + confirmação
5. Backend valida: token existe? não expirou? (se expirado, deleta e retorna erro)
6. Atualiza password_hash com bcrypt(novaSenha, 12)
7. Deleta o token (one-time — não pode reutilizar)
8. Redirect para /login com mensagem de sucesso
```

### Rotas novas para esse fluxo

```
POST /api/auth/esqueci-senha   → body: { email }
POST /api/auth/redefinir-senha → body: { token, novaSenha }
```

### Segurança do fluxo

| Regra | Por quê |
|-------|---------|
| Resposta genérica sempre | Não revelar quais emails estão cadastrados (user enumeration) |
| `crypto.randomBytes(32)` | 256 bits de entropia — impossível de adivinhar por brute force |
| Expiração 1h | Janela curta limita exposição se email for interceptado |
| One-time token | Deletado após uso — link não pode ser reutilizado |
| Prefixo `reset:<email>` | Namespace separa tokens de reset dos tokens de convite |
| Deletar tokens anteriores antes de criar | Evita acúmulo de tokens válidos simultâneos no banco |

### Email que vai ser enviado

```
Assunto: Recuperação de senha — Sales Intelligence

Olá [Nome],

Recebemos uma solicitação para redefinir a senha da sua conta.

[Redefinir minha senha]  ← botão com o link

Este link expira em 1 hora.
Se você não solicitou isso, ignore este email — sua senha não será alterada.
```

### Adições ao banco para suportar os dois fluxos (convite + reset)

```sql
-- Tokens de uso único: convite de vendedor E reset de senha
CREATE TABLE auth_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token      VARCHAR(64) NOT NULL UNIQUE,  -- crypto.randomBytes(32).toString('hex')
  type       VARCHAR(20) NOT NULL CHECK (type IN ('invite', 'reset')),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_tokens_token   ON auth_tokens(token);
CREATE INDEX idx_auth_tokens_user    ON auth_tokens(user_id, type);
```

Usar uma tabela unificada `auth_tokens` com `type` é mais limpo que duas tabelas separadas. Ambos os fluxos seguem o mesmo ciclo: gerar → usar → deletar.

---

## Estrutura de Arquivos (Frontend)

```
src/
├── proxy.js                          ← Substituir (guard JWT com jose)
├── lib/
│   ├── session.js                    ← encrypt/decrypt JWT (server-only + jose)
│   ├── dal.js                        ← verifySession(), verifyRole() com React.cache
│   ├── rate-limit.js                 ← Upstash Redis → in-memory fallback (reuso do IA Licit)
│   └── actions/
│       ├── auth.js                   ← 'use server': login, logout, trocarSenha
│       ├── recovery.js               ← 'use server': esqueci-senha, redefinir-senha
│       └── gestores.js               ← 'use server': criarVendedor, toggleAtivo
├── app/
│   ├── (auth)/                       ← Route group público (sem layout de app)
│   │   ├── login/page.js
│   │   ├── primeiro-acesso/page.js   ← Troca obrigatória de senha (must_change_password)
│   │   ├── esqueci-senha/page.js     ← Formulário: só email
│   │   └── redefinir-senha/page.js   ← Formulário: nova senha + confirmação (recebe ?token=)
│   └── dashboard/
│       ├── layout.js                 ← Shell autenticado (SessionProvider)
│       ├── page.js                   ← Redireciona por role para /gestor ou /vendedor
│       ├── gestor/
│       │   ├── layout.js             ← verifyRole('gestor') — redireciona se não for
│       │   ├── page.js               ← Métricas da equipe
│       │   ├── equipe/page.js        ← Lista com badges: Convite pendente / Ativo / Inativo
│       │   └── equipe/novo/page.js   ← Formulário criar vendedor
│       └── vendedor/
│           ├── layout.js             ← verifyRole('vendedor')
│           ├── page.js               ← Dashboard pessoal
│           └── analise/page.js       ← Interface atual (src/app/page.js migrada)
```

---

## Proteção de Rotas

**Dois níveis obrigatórios — não confiar só em um:**

**Nível 1 — `proxy.js` (Edge Middleware):** verificação otimista com cookie local. Redireciona para login se sem sessão, para `/primeiro-acesso` se `mustChangePassword: true`, para `/dashboard` se role errado. Nunca acessar banco aqui.

**Nível 2 — DAL em cada `page.js` e Server Action:** verificação real. Layouts não re-renderizam em navegação client-side (Partial Rendering) — o `layout.js` é defesa de UX, o `page.js` é a defesa real.

```js
// src/lib/dal.js
import 'server-only'
import { cache } from 'react'

export const verifySession = cache(async () => {
  const session = await decrypt((await cookies()).get('session')?.value)
  if (!session?.userId) redirect('/login')
  return session
})

export const verifyRole = cache(async (requiredRole) => {
  const session = await verifySession()
  if (session.role !== requiredRole) redirect('/dashboard')
  return session
})
```

`React.cache` garante que `verifySession()` é executado uma única vez por render pass, mesmo chamado em múltiplos componentes.

---

## Geração Segura de Tokens e Senhas

```js
// src/lib/auth/tokens.js
import crypto from 'crypto'
import bcrypt from 'bcryptjs'  // mesma lib do IA Licit — reaproveitamento direto

// Token de convite / reset de senha — 256 bits de entropia
// Nunca Math.random() — não é criptograficamente seguro
export function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex')  // 64 chars hex
}

// Senha temporária legível para eventual fallback manual
// Usa crypto.randomInt (CSPRNG), não Math.random
const UPPER   = 'ABCDEFGHJKLMNPQRSTUVWXYZ'  // sem I, O (confundem com 1, 0)
const LOWER   = 'abcdefghjkmnpqrstuvwxyz'   // sem i, l, o
const DIGITS  = '23456789'                   // sem 0, 1
const SPECIAL = '@#$%&'

export function generateTempPassword() {
  const rand = (set) => set[crypto.randomInt(0, set.length)]
  const parts = [rand(UPPER), rand(SPECIAL), rand(DIGITS),
    ...Array.from({ length: 5 }, () => rand(LOWER + DIGITS))]
  // Fisher-Yates shuffle — posição dos chars não é previsível
  for (let i = parts.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [parts[i], parts[j]] = [parts[j], parts[i]]
  }
  return parts.join('')
}

export const hashPassword   = (plain) => bcrypt.hash(plain, 12)
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash)
```

---

## UX: Estados e Comunicação

### Estados do vendedor na lista do gestor

| Status | Badge | Ação disponível |
|--------|-------|-----------------|
| Convite pendente | Amarelo | Reenviar convite |
| Ativo | Verde | Inativar |
| Inativo | Cinza | Reativar |

### Conta inativa — copy recomendado
```
"Sua conta está temporariamente inativa.
Entre em contato com seu gestor para reativar o acesso."
```
Nunca: "Acesso negado", "Conta suspensa" ou redirect para suporte genérico.

### Erros críticos de UX a evitar
1. **Senha temporária visível** — usar link com token, sem senha manual
2. **Link expirando em 24h** — usar 48-72h com botão de reenvio para o gestor
3. **Validação de senha só no submit** — validação inline enquanto digita + barra de força
4. **Redirect pós-login sem destino claro** — gestor → `/dashboard/gestor`, vendedor → `/dashboard/vendedor`
5. **Status de convite invisível** — badge "Convite pendente" obrigatório na lista
6. **Erro de login genérico** — distinguir: credenciais erradas vs. conta inativa vs. erro de rede
7. **Formulário em mobile com botão atrás do teclado** — testar com teclado aberto

---

## MVP vs Fase 2

### Construir agora (MVP)
- Login email/senha + JWT httpOnly cookie
- Roles: Gestor e Vendedor (sem super-gestor)
- Gestor cria vendedor → link de convite via WhatsApp (token `crypto.randomBytes(32)`, expira 72h)
- Troca de senha obrigatória no primeiro acesso (`must_change_password`)
- Recuperação de senha por email (esqueci-senha → link com expiração 1h)
- Gestor ativa/inativa vendedor
- Isolamento de dados por equipe (`teamIds` no token)
- Tokens: access 1h + refresh 7 dias
- Rate limiting no login: 5 tentativas/min por IP (Upstash em prod, in-memory em dev)
- Anti-enumeration no esqueci-senha (resposta genérica sempre)
- Script de seed para criação do primeiro gestor
- 1 vendedor → 1 gestor

### Fase 2 (após validação)
- Vendedor em múltiplas equipes
- Role de diretor/super-gestor com visão cross-team
- Blacklist de tokens para revogação imediata
- Auditoria de acessos
- SSO / OAuth corporativo
- 2FA

---

## Dependências a Adicionar

```bash
npm install jose bcryptjs server-only nodemailer @upstash/ratelimit @upstash/redis
# jose:                 JWT para Edge Runtime (proxy.js roda no Edge)
# bcryptjs:             mesma lib do IA Licit — reaproveitamento direto
# server-only:          garante em build time que módulos server nunca vazam para o cliente
# nodemailer:           envio de email para recuperação de senha
# @upstash/ratelimit:   rate limiting distribuído para login (Upstash Redis em prod)
# @upstash/redis:       client Redis para Upstash (serverless-safe)
```

---

## O que torna esse produto defensável

| Camada | O que é | Por que não é copiável |
|---|---|---|
| Dados | Conversas reais + perfis + resultados por nicho | Ninguém tem — leva meses para acumular |
| Domínio | Taxonomia validada pelo sócio psicólogo | Expertise humana que o concorrente precisa contratar |
| RAG | Recomendações baseadas no histórico da própria corretora | Específico para cada cliente — genérico não compete |
| Fine-tuning | Modelo treinado no comportamento de compra de seguros | Dataset proprietário — impossível de replicar sem os dados |
| Fingerprint de voz | Embeddings de voz de clientes e vendedores acumulados | Requer meses de gravações reais — não se constrói do zero |
| Perfil evolutivo | Histórico de cada cliente e vendedor por voz ao longo do tempo | Dado longitudinal — só existe com tempo de operação real |

---

## Próximo passo imediato

Implementar a Fase 0:
1. Campos de corretor + referência do cliente no formulário
2. Webhook para Google Sheets ao registrar resultado
3. Estrutura da planilha para o sócio acompanhar

Tudo que vem depois depende de ter dados reais. Os dados dependem de corretores usando. Corretores usam se sentirem que ficaram mais inteligentes na primeira vez.

**A Fase 0 não é infraestrutura. É a única coisa que importa agora.**
