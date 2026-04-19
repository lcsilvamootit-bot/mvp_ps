# Planejamento — Integração PDF Maxxconnect

## Contexto

Vendedores que usam o CRM Maxxconnect podem exportar o histórico de atendimento como PDF. A feature adiciona suporte a esse upload no pipeline de análise existente, mantendo o mesmo fluxo SSE de `POST /api/analyze`.

---

## Status das Etapas

| Etapa | Descrição | Status |
|-------|-----------|--------|
| 0 | Spike — explorar estrutura do PDF real | ✅ Concluído |
| 1 | Parser `parseMaxxconnectPdf` | ✅ Concluído |
| 2 | Integração no pipeline `/api/analyze` | 🔲 Pendente |
| 3 | Transcricão dos áudios OCI | 🔲 Pendente |
| 4 | Badge de metadados do PDF no frontend | 🔲 Pendente |
| 5 | UI de conversa estilo WhatsApp | 🔲 Pendente |

---

## Etapa 0 — Spike (✅ Concluído)

Objetivo: entender a estrutura interna do PDF antes de escrever qualquer parser.

**O que foi descoberto:**

- PDF usa layout de tabela 2 colunas: coluna esquerda (x < 200) = remetente, coluna direita (x ≥ 280) = conteúdo da mensagem
- Coordenadas y aumentam de baixo para cima (y maior = mais alto na página = leitura anterior)
- **Problema crítico**: o rótulo do remetente aparece no meio vertical da célula — ou seja, conteúdo de uma mensagem pode ter y MAIOR que o sender label
- Arquivos (áudio, imagem, vídeo) aparecem como `Arquivo: filename.ext` com link OCI anotado no PDF
- Legendas de mídia podem ter múltiplas linhas, cada uma com sua própria anotação OCI

**Artefatos criados:**
- `scripts/spike-pdf.mjs` — dump bruto do PDF
- `scripts/debug-page1.mjs` — dump por página com coordenadas
- `scripts/debug-spacers.mjs` — itens de altura zero (espaçadores)
- `scripts/test-parser.mjs` — runner do parser contra PDF real

---

## Etapa 1 — Parser (✅ Concluído)

**Arquivo:** `src/lib/parsers/maxxconnect.js`

**Função exportada:** `parseMaxxconnectPdf(buffer: Buffer) → Promise<ConversaItem[]>`

**Tipo `ConversaItem`:**
```js
{
  ordem: number,
  remetente: 'cliente' | 'empresa' | 'sistema',
  remetenteNome: string,
  tipo: 'texto' | 'audio' | 'imagem' | 'video' | 'documento',
  conteudo: string | null,      // texto da mensagem
  urlAnexo: string | null,      // URL OCI do arquivo
  legenda: string | null,       // legenda de mídia
  transcricao: null,            // preenchido na Etapa 3
}
```

**Algoritmo de agrupamento (buffer-based):**

O problema do sender-no-meio exige uma abordagem de buffer:
1. Percorre itens da página em ordem decrescente de y (topo → base)
2. Quando encontra um item de mensagem com `*Nome*:` bold-prefix → ativa buffer
3. Quando encontra o sender label correspondente → flush do buffer para esse grupo
4. Conteúdo antes do primeiro sender da página → também vai para buffer

**Resultados contra PDF real (GEOVANI CASTRO - HISTORICO.pdf):**
- 134 itens total: 76 texto · 47 áudio · 5 imagem · 1 vídeo · 5 documento
- Todos os 47 URLs OCI de áudio resolvidos corretamente

**Problemas conhecidos (baixa prioridade):**
- Item #16: dois turnos distintos mesclados em um único `conteudo`
- Item #28: campo `legenda` contém prefixo `"Legenda: "` não removido

---

## Etapa 2 — Integração no Pipeline (🔲 Pendente)

**Arquivo:** `src/app/api/analyze/route.js`

**O que mudar:**

1. No parsing do `multipart/form-data`, detectar se o arquivo enviado tem `Content-Type: application/pdf` ou extensão `.pdf`
2. Se PDF → chamar `parseMaxxconnectPdf(buffer)` → obter `ConversaItem[]`
3. Montar `rawText` concatenando as mensagens de texto:
   ```
   [Cliente] NOME: mensagem
   [Empresa] NOME: mensagem
   ```
4. Marcar arquivos de tipo `audio` para transcrição (Etapa 3)
5. Emitir evento SSE `{ event: 'upload', status: 'done', label: 'PDF processado — N mensagens' }`
6. Continuar pipeline GPT normalmente com o `rawText` montado

**Critérios de aceitação:**
- Upload de PDF dispara o mesmo pipeline SSE que upload de texto/áudio
- `rawText` resultante é equivalente a colar a conversa manualmente
- PDF sem áudios completa o pipeline sem nenhuma etapa extra

---

## Etapa 3 — Transcrição de Áudios OCI (🔲 Pendente)

**Contexto:** Os 47 áudios do PDF são URLs públicas OCI. Precisam ser baixados e enviados ao Whisper.

**Fluxo:**
1. Filtrar `ConversaItem[]` por `tipo === 'audio'`
2. Para cada URL: `fetch(url)` → `arrayBuffer()` → enviar ao Whisper como `audio.ogg`
3. Preencher `item.transcricao` com o texto retornado
4. Inserir a transcrição no `rawText` na posição correta do turno
5. Emitir progresso SSE: `{ event: 'transcribe', label: 'Transcrevendo áudio N/M' }`

**Estratégia de paralelismo:** processar no máximo 3 áudios em paralelo (`Promise.allSettled` em batches de 3) para não exceder rate limit do Whisper.

**Critérios de aceitação:**
- Pipeline completa com transcrições inseridas nos turnos corretos
- Falha em um áudio não aborta o pipeline (usa `[áudio não transcrito]` como fallback)
- Progresso de transcrição visível no frontend via SSE

---

## Etapa 4 — Badge de Metadados no Frontend (🔲 Pendente)

**Arquivo:** `src/app/page.js`

**O que exibir após upload de PDF:**

```
PDF importado — 134 mensagens (76 texto · 47 áudio · 5 imagem)
Participantes: GEOVANI CASTRO (cliente) · NOME EMPRESA (empresa)
```

**Como implementar:**
- Adicionar campo `pdfMeta` no evento SSE `upload` quando a fonte for PDF
- No frontend, renderizar um `<PdfMetaBadge>` acima das seções de análise
- Badge não aparece para uploads de texto/áudio comuns

---

## Etapa 5 — UI de Conversa Estilo WhatsApp (🔲 Pendente)

**Arquivo novo:** `src/app/ui/ConversationTimeline.js`

**Requisito do produto:** "efeito UAU" — visualização da conversa parseada antes de rodar a análise.

**Layout:**
- Balões à esquerda (cliente) e à direita (empresa), igual WhatsApp
- Ícone + label do tipo de mídia para áudio/vídeo/imagem (não exibe a mídia em si)
- Se transcrição disponível → exibir abaixo do ícone de áudio em itálico
- Legenda de imagem exibida abaixo do balão

**Fluxo:**
1. Após parse do PDF (evento `upload done`), frontend recebe `conversaItems[]` via SSE
2. Renderiza `<ConversationTimeline items={conversaItems} />` em seção expansível
3. Seção começa colapsada, botão "Ver conversa (134 mensagens)"

**Critérios de aceitação:**
- Renderiza corretamente cliente à esquerda, empresa à direita
- Sem travamento com 134+ itens (virtualizar se necessário — usar `@tanstack/virtual`)
- Responsivo em mobile

---

## Dependências Técnicas

| Dependência | Status |
|-------------|--------|
| `pdfjs-dist@^5.6.205` | ✅ Instalado |
| `openai` (Whisper) | ✅ Já presente |
| `@tanstack/virtual` (lista virtual) | 🔲 Instalar se Etapa 5 travar em PDFs grandes |

---

## Riscos

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| PDF de outra versão do Maxxconnect com layout diferente | Média | Logar `x`/`y` quando `parseSender` falhar 100% da página |
| Rate limit Whisper com 40+ áudios | Alta | Batches de 3 + retry com backoff |
| Timeout Vercel (10s) com transcrição em série | Alta | Processar transcrições assíncronas pós-resposta ou Vercel Pro (60s) |
| PDF corrompido / protegido por senha | Baixa | Tratar `getDocument` rejection com mensagem clara ao usuário |
