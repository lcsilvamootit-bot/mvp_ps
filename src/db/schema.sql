-- ============================================================
-- Sales Intelligence — Schema V1
-- Rodar no Neon SQL Editor (Vercel → Storage → Neon → SQL Editor)
-- ============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector — V3 (estrutura criada agora)

-- ── Enums de domínio ──────────────────────────────────────────
CREATE TYPE perfil_jung       AS ENUM ('Pragmático', 'Analítico', 'Afável', 'Expressivo');
CREATE TYPE perfil_momento    AS ENUM ('Indeciso', 'Confuso', 'Decidido', 'Crítico', 'Nervoso', 'Apressado', 'Negociador', 'Detalhista', 'Informal');
CREATE TYPE contexto_temporal AS ENUM ('Ativo', 'Resgate', 'Follow-up', 'Indefinido');
CREATE TYPE tendencia_venda   AS ENUM ('Avançando', 'Estagnado', 'Em risco', 'Perdido');
CREATE TYPE resultado_real    AS ENUM ('fechada', 'perdida', 'resgate_bem_sucedido', 'resgate_frustrado', 'em_andamento');
CREATE TYPE nota_avaliacao    AS ENUM ('Acertou', 'Parcial', 'Errou');
CREATE TYPE nivel_risco       AS ENUM ('Alta', 'Média', 'Baixa');
CREATE TYPE nivel_aderencia   AS ENUM ('Alta', 'Média', 'Baixa');
CREATE TYPE avaliacao_psico   AS ENUM ('correto', 'parcialmente', 'errado');
CREATE TYPE user_role         AS ENUM ('gestor', 'vendedor');
CREATE TYPE auth_token_type   AS ENUM ('invite', 'reset');

-- ── users (vazia no V1 — usada no V2) ────────────────────────
CREATE TABLE users (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 TEXT        NOT NULL,
  email                TEXT        NOT NULL UNIQUE,
  password_hash        TEXT,                        -- NULL = convite pendente
  role                 user_role   NOT NULL DEFAULT 'vendedor',
  active               BOOLEAN     NOT NULL DEFAULT true,
  must_change_password BOOLEAN     NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── teams + team_members (V2) ─────────────────────────────────
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

-- ── auth_tokens (V2) ──────────────────────────────────────────
CREATE TABLE auth_tokens (
  id         UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  token      TEXT            NOT NULL UNIQUE,
  type       auth_token_type NOT NULL,
  user_id    UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ     NOT NULL,
  used_at    TIMESTAMPTZ,               -- NULL = ainda válido
  created_at TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ── analyses (núcleo do produto) ──────────────────────────────
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Quem fez: V1 = texto livre, V2 = FK
  corretor_nome TEXT,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  cliente_ref   TEXT,                  -- apelido/código — NUNCA CPF ou nome real

  conversa_raw TEXT NOT NULL,          -- TOAST comprime automaticamente

  -- Escalares do cliente (usados em filtros/dashboard)
  perfil_jung       perfil_jung,
  perfil_momento    perfil_momento,
  contexto_temporal contexto_temporal,
  tendencia         tendencia_venda,

  -- Escalares do vendedor (usados em filtros/dashboard)
  perfil_natural_vendedor perfil_jung,
  aderencia_cliente       nivel_aderencia,
  fase1_nota              nota_avaliacao,
  fase2_nota              nota_avaliacao,
  risco_perda             nivel_risco,

  -- Conteúdo completo dos 4 schemas (nunca filtrado isoladamente)
  client_data  JSONB,  -- clientAnalysisSchema completo
  vendor_data  JSONB,  -- vendorAnalysisSchema completo
  signals_data JSONB,  -- signalsSchema completo
  sir_data     JSONB,  -- sirSchema completo
  rescue_plan  JSONB,  -- rescueSchema — NULL até ser solicitado

  -- Resultado real
  resultado               resultado_real NOT NULL DEFAULT 'em_andamento',
  resultado_registrado_em TIMESTAMPTZ,

  -- Observabilidade da IA
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  model_used     TEXT NOT NULL DEFAULT 'gpt-4o',

  -- LGPD
  retain_until DATE,         -- job de anonimização usa esse campo
  deleted_at   TIMESTAMPTZ,  -- soft delete

  -- Multi-tenant V4 (NULL enquanto single-tenant)
  tenant_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── psych_reviews (ground truth do psicólogo) ─────────────────
CREATE TABLE psych_reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE UNIQUE,
  reviewer_nome TEXT,                          -- V1: texto livre
  reviewer_id   UUID REFERENCES users(id) ON DELETE SET NULL,  -- V2

  jung_avaliacao     avaliacao_psico NOT NULL,
  jung_correto       perfil_jung,              -- preenchido se avaliacao = 'errado'
  momento_avaliacao  avaliacao_psico NOT NULL,
  momento_correto    perfil_momento,           -- preenchido se avaliacao = 'errado'
  contexto_avaliacao avaliacao_psico NOT NULL,
  contexto_correto   contexto_temporal,        -- preenchido se avaliacao = 'errado'
  observacao         TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── analysis_embeddings (V3 — estrutura criada agora) ─────────
CREATE TABLE analysis_embeddings (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID    NOT NULL REFERENCES analyses(id) ON DELETE CASCADE UNIQUE,
  embedding   vector(1536),                    -- text-embedding-3-small
  uses_corrected_profile BOOLEAN NOT NULL DEFAULT false,
  model_used  TEXT    NOT NULL DEFAULT 'text-embedding-3-small',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Índice HNSW só no V3, quando houver dados suficientes:
-- CREATE INDEX ON analysis_embeddings USING hnsw (embedding vector_cosine_ops);

-- ── Índices ───────────────────────────────────────────────────
CREATE INDEX idx_analyses_corretor      ON analyses (corretor_nome)   WHERE deleted_at IS NULL;
CREATE INDEX idx_analyses_user_id       ON analyses (user_id)         WHERE deleted_at IS NULL;
CREATE INDEX idx_analyses_created_at    ON analyses (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_analyses_perfil_jung   ON analyses (perfil_jung)     WHERE deleted_at IS NULL;
CREATE INDEX idx_analyses_tendencia     ON analyses (tendencia)       WHERE deleted_at IS NULL;
CREATE INDEX idx_analyses_resultado     ON analyses (resultado)       WHERE deleted_at IS NULL;
CREATE INDEX idx_analyses_tenant_id     ON analyses (tenant_id)       WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_analyses_retain_until  ON analyses (retain_until)    WHERE deleted_at IS NULL AND retain_until IS NOT NULL;
CREATE INDEX idx_analyses_client_gin    ON analyses USING GIN (client_data);
CREATE INDEX idx_analyses_signals_gin   ON analyses USING GIN (signals_data);
CREATE INDEX idx_psych_reviews_analysis ON psych_reviews (analysis_id);
CREATE INDEX idx_auth_tokens_token      ON auth_tokens (token);
CREATE INDEX idx_auth_tokens_user       ON auth_tokens (user_id, type);
CREATE INDEX idx_team_members_user      ON team_members (user_id);
CREATE INDEX idx_teams_gestor           ON teams (gestor_id);

-- ── workspace_settings (contexto do negócio — configurado pelo psicólogo) ──
CREATE TABLE workspace_settings (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  context_data JSONB       NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by   TEXT        -- V1: nome livre | V2: FK users
);

-- Seed: garante que sempre existe 1 registro
INSERT INTO workspace_settings (context_data) VALUES ('{}');

-- ── Trigger updated_at ────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_analyses_updated_at
  BEFORE UPDATE ON analyses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_workspace_settings_updated_at
  BEFORE UPDATE ON workspace_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_psych_reviews_updated_at
  BEFORE UPDATE ON psych_reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
