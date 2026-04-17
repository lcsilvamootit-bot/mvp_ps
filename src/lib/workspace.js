import { getDb } from '@/lib/db';

export async function getWorkspaceContext() {
  const sql = getDb();
  const rows = await sql`SELECT context_data FROM workspace_settings LIMIT 1`;
  return rows[0]?.context_data ?? {};
}

export async function saveWorkspaceContext(data, updatedBy = null) {
  const sql = getDb();
  await sql`
    UPDATE workspace_settings
    SET context_data = ${JSON.stringify(data)},
        updated_by   = ${updatedBy}
    WHERE id = (SELECT id FROM workspace_settings LIMIT 1)
  `;
}

export function buildContextBlock(ctx) {
  if (!ctx || !Object.keys(ctx).length) return '';

  const lines = [
    ctx.setor         && `• Setor: ${ctx.setor}`,
    ctx.produto       && `• Produto principal: ${ctx.produto}`,
    ctx.ticketMedio   && `• Ticket médio: ${ctx.ticketMedio}`,
    ctx.cicloDecisao  && `• Ciclo de decisão típico: ${ctx.cicloDecisao}`,
    ctx.perfilCliente && `• Perfil do cliente: ${ctx.perfilCliente}`,
    ctx.concorrentes  && `• Concorrentes mencionados com frequência: ${ctx.concorrentes}`,
    ctx.objecoes      && `• Objeções mais comuns nesse mercado:\n${ctx.objecoes}`,
    ctx.observacao    && `• Observação adicional: ${ctx.observacao}`,
  ].filter(Boolean);

  if (!lines.length) return '';

  return `CONTEXTO DO NEGÓCIO (use para calibrar todas as análises e recomendações):
${lines.join('\n')}`;
}
