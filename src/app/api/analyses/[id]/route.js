import { findAnalysisById, updateAnalysisResultado } from '@/lib/repositories/analyses';
import { uuidParamSchema, updateResultadoSchema } from '@/schemas/api';
import { verifySessionToken, getSessionFromRequest, isAuthenticated } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  const token = getSessionFromRequest(request);
  if (!await verifySessionToken(token)) {
    return Response.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const { id } = await params;
  const idParsed = uuidParamSchema.safeParse({ id });
  if (!idParsed.success) {
    return Response.json({ error: 'ID inválido.' }, { status: 400 });
  }

  try {
    const analysis = await findAnalysisById(id);
    if (!analysis) return Response.json({ error: 'Análise não encontrada.' }, { status: 404 });
    return Response.json(analysis);
  } catch (err) {
    console.error('[GET /api/analyses/[id]]', err.message);
    return Response.json({ error: 'Erro ao buscar análise.' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  if (!await isAuthenticated(request)) {
    return Response.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const { id } = await params;
  const idParsed = uuidParamSchema.safeParse({ id });
  if (!idParsed.success) {
    return Response.json({ error: 'ID inválido.' }, { status: 400 });
  }

  const body = await request.json();
  const parsed = updateResultadoSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  try {
    const updated = await updateAnalysisResultado(id, parsed.data.resultado);
    if (!updated) return Response.json({ error: 'Análise não encontrada.' }, { status: 404 });
    return Response.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/analyses/[id]]', err.message);
    return Response.json({ error: 'Erro ao atualizar análise.' }, { status: 500 });
  }
}
