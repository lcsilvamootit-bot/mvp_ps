import { getDb } from '@/lib/db';
import { toCamel, toCamelAll } from '@/lib/utils';

export async function createAnalysis(data) {
  const sql = getDb();
  const registradoEm = data.resultado !== 'em_andamento' ? new Date().toISOString() : null;

  const rows = await sql`
    INSERT INTO analyses (
      corretor_nome, cliente_ref, conversa_raw, resultado, resultado_registrado_em,
      perfil_jung, perfil_momento, contexto_temporal, tendencia,
      perfil_natural_vendedor, aderencia_cliente, fase1_nota, fase2_nota, risco_perda,
      client_data, vendor_data, signals_data, sir_data,
      prompt_version, model_used
    ) VALUES (
      ${data.corretorNome   ?? null},
      ${data.clienteRef     ?? null},
      ${data.conversaRaw},
      ${data.resultado},
      ${registradoEm},
      ${data.perfilJung             ?? null},
      ${data.perfilMomento          ?? null},
      ${data.contextoTemporal       ?? null},
      ${data.tendencia              ?? null},
      ${data.perfilNaturalVendedor  ?? null},
      ${data.aderenciaCliente       ?? null},
      ${data.fase1Nota              ?? null},
      ${data.fase2Nota              ?? null},
      ${data.riscoPerdaNota         ?? null},
      ${JSON.stringify(data.clientData)},
      ${JSON.stringify(data.vendorData)},
      ${JSON.stringify(data.signalsData)},
      ${data.sirData ? JSON.stringify(data.sirData) : null},
      ${'v1'},
      ${'gpt-4o'}
    )
    RETURNING id, created_at
  `;
  return toCamel(rows[0]);
}

export async function saveRescuePlan(id, rescuePlan) {
  const sql = getDb();
  const rows = await sql`
    UPDATE analyses
    SET rescue_plan = ${JSON.stringify(rescuePlan)}
    WHERE id = ${id} AND deleted_at IS NULL
    RETURNING id
  `;
  return rows.length > 0;
}

export async function findAnalysisById(id) {
  const sql = getDb();
  const rows = await sql`
    SELECT a.*, pr.jung_avaliacao, pr.observacao
    FROM analyses a
    LEFT JOIN psych_reviews pr ON pr.analysis_id = a.id
    WHERE a.id = ${id} AND a.deleted_at IS NULL
  `;
  return rows[0] ? toCamel(rows[0]) : null;
}

export async function listAnalyses({ pendente = false, page = 1, limit = 20 } = {}) {
  const sql = getDb();
  const offset = (page - 1) * limit;
  const rows = await sql`
    SELECT
      a.id, a.corretor_nome, a.cliente_ref, a.resultado,
      a.perfil_jung, a.tendencia, a.created_at,
      (pr.id IS NOT NULL) AS tem_review
    FROM analyses a
    LEFT JOIN psych_reviews pr ON pr.analysis_id = a.id
    WHERE a.deleted_at IS NULL
      AND (${pendente}::boolean = false OR pr.id IS NULL)
    ORDER BY a.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return toCamelAll(rows);
}
