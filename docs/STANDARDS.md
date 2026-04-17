# Padrões do Projeto — Sales Intelligence

Referência única para nomenclatura, estrutura de código e convenções. Qualquer dúvida sobre como nomear ou organizar algo, consultar aqui primeiro.

---

## 1. Nomenclatura Geral

| Contexto | Convenção | Exemplo |
|----------|-----------|---------|
| Variáveis | camelCase | `clientData`, `perfilJung`, `isLoading` |
| Funções | camelCase | `handleVendaFechada()`, `getAnalyses()` |
| Classes | PascalCase | `ApiError`, `SessionProvider` |
| Componentes React | PascalCase | `ClientProfileBand`, `VendorBand` |
| Constantes globais | UPPER_SNAKE_CASE | `MAX_TOKENS`, `ADERENCIA_MATRIX` |
| Arquivos de componente | PascalCase | `LoginForm.js`, `AnalysisBand.js` |
| Arquivos de utilitário/lib | camelCase | `session.js`, `db.js`, `rateLimit.js` |
| Arquivos de rota Next.js | kebab-case (pasta) | `esqueci-senha/`, `primeiro-acesso/` |
| Variáveis de ambiente | UPPER_SNAKE_CASE | `DATABASE_URL`, `OPENAI_API_KEY` |

---

## 2. Banco de Dados

### Nomenclatura

| Elemento | Convenção | Exemplo |
|----------|-----------|---------|
| Tabelas | snake_case, plural | `analyses`, `psych_reviews`, `auth_tokens` |
| Colunas | snake_case | `corretor_nome`, `perfil_jung`, `created_at` |
| Índices | `idx_<tabela>_<coluna>` | `idx_analyses_created_at` |
| Triggers | `trg_<tabela>_<acao>` | `trg_analyses_updated_at` |
| Funções | snake_case | `set_updated_at()` |
| Enums | snake_case | `perfil_jung`, `resultado_real` |
| FKs (coluna) | `<tabela_singular>_id` | `analysis_id`, `user_id`, `team_id` |

### Campos obrigatórios em toda tabela

```sql
id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4()
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Tabelas que têm atualização de dados também incluem:
```sql
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- + trigger trg_<tabela>_updated_at
```

Tabelas que têm soft delete incluem:
```sql
deleted_at  TIMESTAMPTZ   -- NULL = ativo
```

### Tipos preferidos

| Dado | Tipo PostgreSQL | Motivo |
|------|----------------|--------|
| IDs | `UUID` | Sem exposição de sequência, distribuído |
| Textos curtos (nome, email) | `TEXT` | Sem limite artificial, PostgreSQL otimiza igual |
| Textos longos (conversa, observação) | `TEXT` | TOAST comprime automaticamente acima de 2KB |
| Datas com hora | `TIMESTAMPTZ` | Sempre com timezone — nunca `TIMESTAMP` |
| Datas sem hora | `DATE` | Ex: `retain_until` |
| Booleanos | `BOOLEAN` | Nunca `SMALLINT` ou `CHAR` |
| Valores de domínio fechado | `ENUM` do PostgreSQL | Integridade no motor, aparece no schema |
| Objetos complexos / arrays | `JSONB` | GIN indexável, binário (mais rápido que `JSON`) |
| Vetores (embeddings) | `vector(n)` | pgvector — dimensão fixa |
| Valores monetários | `NUMERIC(10,2)` | Nunca `FLOAT` para dinheiro |

### Quando usar coluna escalar vs JSONB

**Coluna escalar** quando o campo aparece em `WHERE`, `ORDER BY`, `GROUP BY` ou é exibido em listagem.

**JSONB** quando o campo é conteúdo narrativo, array de objetos internos, ou estrutura que muda com a evolução do produto e nunca é filtrada isoladamente.

### Índices

- Sempre criar índices parciais com `WHERE deleted_at IS NULL` em tabelas com soft delete
- Não criar índice composto até ter evidência de query lenta — índice prematuro piora escritas
- Índice GIN em colunas JSONB que serão consultadas ad-hoc
- Índice HNSW (pgvector) só criado quando a tabela tiver dados suficientes

---

## 3. Backend (Next.js Route Handlers)

### Estrutura de um route handler

```js
// src/app/api/<recurso>/route.js
import { z } from 'zod'
import { getDb } from '@/lib/db'

// Schema de validação — sempre no topo, antes do handler
const bodySchema = z.object({
  campo: z.string().min(1).max(200),
})

export async function POST(request) {
  // 1. Parse e validação de input — sempre com safeParse
  const body = await request.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Dados inválidos', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  // 2. Lógica de negócio
  try {
    const sql = getDb()
    const result = await sql`INSERT INTO ...`
    return Response.json({ id: result[0].id }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/recurso]', err.message)
    return Response.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
```

### Regras obrigatórias

- **Sempre validar input com Zod** — nunca confiar em dados da request sem validação
- **Nunca vazar `err.message` em produção** — logar no servidor, retornar mensagem genérica ao cliente
- **Nunca vazar `ZodError.issues` completo** em produção — apenas em desenvolvimento
- **Parâmetros de rota são Promise no Next.js 16** — sempre `const { id } = await params`
- **Verificação de autenticação no topo** do handler — antes de qualquer lógica
- **`export const runtime = 'nodejs'`** em rotas que usam banco ou bcrypt (não rodam no Edge)

### Respostas de API

```js
// Sucesso com dado
Response.json({ data: resultado }, { status: 200 })

// Criação
Response.json({ id: novoId }, { status: 201 })

// Sem conteúdo
Response.json({ ok: true }, { status: 200 })

// Erro de validação
Response.json({ error: 'Descrição clara do problema.' }, { status: 400 })

// Não autenticado
Response.json({ error: 'Não autorizado.' }, { status: 401 })

// Sem permissão
Response.json({ error: 'Sem permissão.' }, { status: 403 })

// Não encontrado
Response.json({ error: 'Não encontrado.' }, { status: 404 })

// Erro interno
Response.json({ error: 'Erro interno.' }, { status: 500 })
```

### Maturidade de API — Nível 2 (Richardson)

Este projeto segue o **Nível 2** do Modelo de Maturidade de Richardson: recursos + verbos HTTP corretos + status codes semânticos.

| Verbo | Quando usar |
|-------|-------------|
| `GET` | Leitura — nunca altera estado |
| `POST` | Criação de novo recurso |
| `PATCH` | Atualização parcial de recurso existente |
| `PUT` | Substituição completa (raro neste projeto) |
| `DELETE` | Remoção (soft delete — `deleted_at`) |

**Estrutura de URL correta:**

```
GET    /api/analyses              → lista
GET    /api/analyses/[id]         → busca por ID
POST   /api/analyses              → cria
PATCH  /api/analyses/[id]         → atualiza parcialmente
POST   /api/analyses/[id]/rescue  → ação sobre sub-recurso (aceito no Nível 2)
POST   /api/analyses/[id]/review  → idem
```

Sub-recursos de ação (`/rescue`, `/review`) são aceitos quando o verbo HTTP sozinho não descreve a operação com clareza.

**O que nunca fazer:**

```
// ❌ Nível 0 — RPC disfarçado
POST /api → { action: "getAnalysis", id: "123" }

// ❌ Nível 1 — ignora verbos
POST /api/analyses/123/save
POST /api/analyses/123/get

// ✅ Nível 2
GET  /api/analyses/123
PATCH /api/analyses/123
```

---

### Nomenclatura de variáveis no backend

```js
// Dados vindos do banco → camelCase na aplicação
const { perfil_jung, created_at } = row        // desestruturação do banco
const perfilJung = perfil_jung                  // converter para camelCase antes de retornar

// Dados que vão para o banco → snake_case nos parâmetros SQL
await sql`INSERT INTO analyses (perfil_jung, created_at) VALUES (${perfilJung}, NOW())`

// Constantes de módulo → UPPER_SNAKE_CASE
const MAX_CONVERSA_LENGTH = 8000
const SALT_ROUNDS = 12
```

### Organização de `src/lib/`

```
src/lib/
  db.js          → singleton do cliente Neon
  session.js     → encrypt/decrypt JWT (server-only)
  dal.js         → verifySession(), verifyRole() com React.cache
  auth.js        → createSessionToken(), verifySessionToken()
  rateLimit.js   → checkRateLimit() com fallback in-memory
  actions/
    auth.js      → Server Actions: login, logout, trocarSenha
    recovery.js  → Server Actions: esqueci-senha, redefinir-senha
    gestores.js  → Server Actions: criarVendedor, toggleAtivo
```

---

## 4. Frontend (React / Next.js)

### Nomenclatura de componentes e props

```jsx
// Componente → PascalCase
function ClientProfileBand({ data, isLoading }) { ... }

// Props → camelCase
<ClientProfileBand data={clientData} isLoading={isStreaming} />

// Handlers → prefixo handle + PascalCase
const handleVendaFechada = async () => { ... }
const handleFormSubmit = (e) => { ... }

// Estados → camelCase, booleanos com prefixo is/has/can
const [isLoading, setIsLoading] = useState(false)
const [hasError, setHasError] = useState(false)
const [clientData, setClientData] = useState(null)

// Refs → camelCase + sufixo Ref
const formRef = useRef(null)
const inputRef = useRef(null)
```

### Estrutura de um componente

```jsx
// 1. Imports externos
import { useState } from 'react'

// 2. Imports internos
import { someHelper } from '@/lib/helpers'

// 3. Constantes locais (se houver)
const MAX_LENGTH = 500

// 4. Componente
export default function MeuComponente({ prop1, prop2 }) {
  // 4a. States
  const [isLoading, setIsLoading] = useState(false)

  // 4b. Handlers
  const handleSubmit = async () => { ... }

  // 4c. JSX
  return (
    <div>...</div>
  )
}
```

### Fetch de API no cliente

```js
// Sempre tratar erro — nunca deixar fetch sem catch
const salvarAnalise = async (dados) => {
  setIsLoading(true)
  try {
    const res = await fetch('/api/analyses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? 'Erro desconhecido')
    }
    return await res.json()
  } catch (err) {
    console.error('[salvarAnalise]', err.message)
    setHasError(true)
  } finally {
    setIsLoading(false)
  }
}
```

### Arquivos e pastas

```
src/app/
  (auth)/              → route group público — parênteses não aparecem na URL
    login/page.js
    primeiro-acesso/page.js
    esqueci-senha/page.js
    redefinir-senha/page.js
  dashboard/
    gestor/
    vendedor/
  revisao/             → painel do psicólogo (kebab-case nas pastas)
    [id]/page.js

src/app/ui/            → componentes reutilizáveis
  LoginForm.js         → PascalCase
  AnalysisBand.js
  VendorBand.js
```

### Tailwind

- Classes utilitárias direto no JSX — sem CSS separado para componentes simples
- Extrair para componente quando o bloco de classes for repetido 3+ vezes
- Nunca usar `style={{}}` inline para layout — apenas para valores dinâmicos que Tailwind não cobre

---

## 5. Conversão banco → API (snake_case → camelCase)

O banco usa `snake_case`. A API retorna `camelCase`. A conversão acontece na camada de serviço/route handler, não no banco.

```js
// Função utilitária em src/lib/db.js
export function toCamel(row) {
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [
      k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
      v,
    ])
  )
}

// Uso no route handler
const rows = await sql`SELECT * FROM analyses WHERE id = ${id}`
return Response.json(toCamel(rows[0]))
```

---

## 6. Clean Code

### Funções

**Uma função faz uma coisa.** Se o nome precisa de "e" para descrever o que faz, é duas funções.

```js
// ❌ faz duas coisas
async function validateAndSaveAnalysis(data) { ... }

// ✅ separadas — cada uma com responsabilidade única
async function validateAnalysis(data) { ... }
async function saveAnalysis(data) { ... }
```

**Máximo 3 parâmetros.** Mais que isso, usar objeto.

```js
// ❌
function createUser(name, email, role, teamId, mustChange) { ... }

// ✅
function createUser({ name, email, role, teamId, mustChangePassword }) { ... }
```

**Sem comentários que explicam o óbvio.** O código deve se explicar pelo nome. Comentário só para decisões não óbvias.

```js
// ❌ comentário inútil
// incrementa o contador
count++

// ✅ comentário que agrega — explica o porquê, não o quê
// salt 12 = equilíbrio entre segurança e latência em serverless (Vercel ~100ms budget)
const hash = await bcrypt.hash(password, 12)
```

**Early return** — evitar aninhamento profundo.

```js
// ❌ pirâmide da perdição
async function handler(req) {
  const body = await req.json()
  if (body) {
    const parsed = schema.safeParse(body)
    if (parsed.success) {
      const user = await getUser(parsed.data.id)
      if (user) {
        return Response.json(user)
      }
    }
  }
}

// ✅ early return
async function handler(req) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Inválido' }, { status: 400 })

  const user = await getUser(parsed.data.id)
  if (!user) return Response.json({ error: 'Não encontrado' }, { status: 404 })

  return Response.json(user)
}
```

### Tamanho

- **Função:** máximo ~30 linhas. Acima disso, candidata a extração.
- **Arquivo:** máximo ~200 linhas. Acima disso, dividir por responsabilidade.
- **Componente:** máximo ~150 linhas. Extrair sub-componentes quando crescer.

### Nomes

O nome deve revelar intenção. Sem abreviações exceto as convencionadas (`id`, `url`, `req`, `res`).

```js
// ❌
const d = await sql`SELECT * FROM analyses WHERE id = ${id}`
const u = d[0]
const f = u.perfil_jung

// ✅
const rows = await sql`SELECT * FROM analyses WHERE id = ${analysisId}`
const analysis = rows[0]
const perfilJung = analysis.perfil_jung
```

---

## 7. Reutilização — Quando e Como

**Regra dos três:** só extrair para função/componente reutilizável quando o código aparecer **3 vezes ou mais**. Antes disso, duplicação é aceitável — abstração prematura cria acoplamento desnecessário.

```js
// Apareceu 2x? Deixa duplicado por enquanto.
// Apareceu 3x? Extrai.
```

### Utilitários genéricos (`src/lib/utils.js`)

Funções puras sem dependência de contexto do produto.

```js
// src/lib/utils.js

// Converte chaves snake_case para camelCase (já definido em seção 5)
export function toCamel(row) { ... }

// Converte array de rows
export function toCamelAll(rows) {
  return rows.map(toCamel)
}

// Trunca texto preservando palavras inteiras
export function truncate(text, maxLength) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '...'
}

// Formata data para pt-BR
export function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// Formata data + hora para pt-BR
export function formatDateTime(date) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}
```

---

## 8. Patterns Aplicados ao Projeto

### Repository Pattern — acesso ao banco centralizado

Toda query ao banco passa por funções de repositório em `src/lib/repositories/`. Route handlers nunca escrevem SQL diretamente.

```js
// src/lib/repositories/analyses.js
import { getDb } from '@/lib/db'
import { toCamel, toCamelAll } from '@/lib/utils'

export async function createAnalysis(data) {
  const sql = getDb()
  const rows = await sql`
    INSERT INTO analyses (
      corretor_nome, cliente_ref, conversa_raw, resultado,
      perfil_jung, perfil_momento, contexto_temporal, tendencia,
      client_data, vendor_data, signals_data, sir_data,
      prompt_version, model_used
    ) VALUES (
      ${data.corretorNome}, ${data.clienteRef}, ${data.conversaRaw}, ${data.resultado},
      ${data.perfilJung}, ${data.perfilMomento}, ${data.contextoTemporal}, ${data.tendencia},
      ${JSON.stringify(data.clientData)}, ${JSON.stringify(data.vendorData)},
      ${JSON.stringify(data.signalsData)}, ${JSON.stringify(data.sirData)},
      ${'v1'}, ${'gpt-4o'}
    )
    RETURNING id, created_at
  `
  return toCamel(rows[0])
}

export async function findAnalysisById(id) {
  const sql = getDb()
  const rows = await sql`
    SELECT a.*, pr.jung_avaliacao, pr.observacao
    FROM analyses a
    LEFT JOIN psych_reviews pr ON pr.analysis_id = a.id
    WHERE a.id = ${id} AND a.deleted_at IS NULL
  `
  return rows[0] ? toCamel(rows[0]) : null
}

export async function listAnalyses({ pendente = false, page = 1, limit = 20 } = {}) {
  const sql = getDb()
  const offset = (page - 1) * limit
  const rows = await sql`
    SELECT a.id, a.corretor_nome, a.cliente_ref, a.resultado,
           a.perfil_jung, a.tendencia, a.created_at,
           (pr.id IS NOT NULL) AS tem_review
    FROM analyses a
    LEFT JOIN psych_reviews pr ON pr.analysis_id = a.id
    WHERE a.deleted_at IS NULL
      AND (${pendente}::boolean = false OR pr.id IS NULL)
    ORDER BY a.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `
  return toCamelAll(rows)
}
```

O route handler fica limpo — apenas orquestra:

```js
// src/app/api/analyses/route.js
import { createAnalysis, listAnalyses } from '@/lib/repositories/analyses'
import { saveAnalysisSchema } from '@/schemas/api'

export async function POST(request) {
  const body = await request.json()
  const parsed = saveAnalysisSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Inválido' }, { status: 400 })

  try {
    const analysis = await createAnalysis(parsed.data)
    return Response.json(analysis, { status: 201 })
  } catch (err) {
    console.error('[POST /api/analyses]', err.message)
    return Response.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
```

### Factory Pattern — criação de objetos complexos

Centraliza a lógica de montar objetos com defaults e transformações.

```js
// src/lib/factories/analysisFactory.js

// Monta o objeto para inserção no banco a partir dos dados do frontend
export function buildAnalysisRecord({ corretor, clienteRef, conversa, resultado, clientData, vendorData, signalsData, sirData }) {
  return {
    corretorNome:     corretor,
    clienteRef:       clienteRef ?? null,
    conversaRaw:      conversa,
    resultado,
    perfilJung:       clientData.perfilJung,
    perfilMomento:    clientData.perfilMomento,
    contextoTemporal: clientData.contextoTemporal,
    tendencia:        signalsData.tendencia,
    clientData,
    vendorData,
    signalsData,
    sirData,
  }
}
```

### Strategy Pattern — comportamento variável por perfil Jung

Evita `if/else` ou `switch` espalhados quando o comportamento muda por perfil.

```js
// src/lib/strategies/rescueStrategy.js

const strategies = {
  Pragmático:  { janelaMin: 1, janelaMax: 2,  tom: 'direto e objetivo, sem rodeios' },
  Analítico:   { janelaMin: 3, janelaMax: 5,  tom: 'dados e comparativos, sem pressão' },
  Afável:      { janelaMin: 5, janelaMax: 7,  tom: 'reconexão genuína, perguntar como está' },
  Expressivo:  { janelaMin: 1, janelaMax: 2,  tom: 'novidade ou benefício exclusivo, entusiasmo' },
}

export function getRescueStrategy(perfilJung) {
  return strategies[perfilJung] ?? strategies['Analítico']
}
```

### Middleware Pattern — composição de guards em API

```js
// src/lib/middleware/compose.js

// Compõe múltiplos guards em sequência
// Retorna o primeiro erro encontrado ou null (pode prosseguir)
export async function compose(...guards) {
  for (const guard of guards) {
    const error = await guard()
    if (error) return error
  }
  return null
}

// Uso em route handler
import { compose } from '@/lib/middleware/compose'
import { requirePsychologistSession } from '@/lib/auth'
import { requireValidUUID } from '@/lib/middleware/validators'

export async function GET(request, { params }) {
  const { id } = await params
  const error = await compose(
    () => requirePsychologistSession(request),
    () => requireValidUUID(id),
  )
  if (error) return error

  // lógica normal...
}
```

### Custom Hook Pattern — lógica de estado reutilizável no frontend

```js
// src/hooks/useAnalysis.js
'use client'
import { useState, useCallback } from 'react'

export function useAnalysis() {
  const [isLoading, setIsLoading]     = useState(false)
  const [isSaving, setIsSaving]       = useState(false)
  const [error, setError]             = useState(null)
  const [analysisId, setAnalysisId]   = useState(null)

  const saveResult = useCallback(async ({ resultado, corretor, clienteRef, conversa, clientData, vendorData, signalsData, sirData, rescueData }) => {
    setIsSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultado, corretor, clienteRef, conversa, clientData, vendorData, signalsData, sirData, rescueData }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const data = await res.json()
      setAnalysisId(data.id)
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setIsSaving(false)
    }
  }, [])

  return { isLoading, isSaving, error, analysisId, saveResult }
}

// Uso no componente — zero lógica de fetch no JSX
function ResultadoButtons({ conversa, clientData, vendorData, signalsData, sirData }) {
  const { isSaving, error, saveResult } = useAnalysis()

  const handleFechada = () => saveResult({ resultado: 'fechada', conversa, clientData, vendorData, signalsData, sirData })
  const handlePerdida = () => saveResult({ resultado: 'perdida', conversa, clientData, vendorData, signalsData, sirData })

  return (...)
}
```

### Generics com Zod — schemas reutilizáveis

```js
// src/schemas/api.js

// Schema de paginação genérico — reusado em qualquer listagem
export const paginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// Schema de resposta paginada — wrapper genérico
export const paginatedSchema = (itemSchema) => z.object({
  data:  z.array(itemSchema),
  total: z.number(),
  page:  z.number(),
  limit: z.number(),
})

// Schema de UUID para params de rota
export const uuidParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
})

// Uso:
const parsed = uuidParamSchema.safeParse({ id })
const queryParsed = paginationSchema.safeParse(
  Object.fromEntries(new URL(request.url).searchParams)
)
```

---

## 9. O Que Nunca Fazer

| ❌ Proibido | ✅ Alternativa |
|------------|---------------|
| `Math.random()` para tokens/senhas | `crypto.randomBytes(32)` ou `crypto.randomInt()` |
| `console.log` em produção para debug | `console.error` com contexto `[rota]` só em erros reais |
| SQL concatenado com string | Template literals do `@neondatabase/serverless` (parameterizado) |
| Lógica de negócio no componente React | Extrair para custom hook ou Server Action |
| `any` implícito — receber `body` sem validar | Sempre `schema.safeParse(body)` antes de usar |
| Objeto inteiro no JWT | Apenas IDs e flags — nunca dados de negócio |
| `localStorage` para sessão/token | Cookie `httpOnly` gerenciado pelo servidor |
| Fetch sem tratamento de erro | Try/catch + estado de erro explícito |
| Funções com mais de 3 parâmetros posicionais | Objeto desestruturado |
| Comentário que explica o óbvio | Nome que dispensa comentário |

---

## 10. Commits

```
feat: adiciona painel de revisão do psicólogo
fix: corrige validação do campo corretor_nome
refactor: extrai lógica de auth para lib/auth.js
chore: adiciona índice idx_analyses_resultado
```

Prefixos: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`
