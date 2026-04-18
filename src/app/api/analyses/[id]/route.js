import { findAnalysisById } from '@/lib/repositories/analyses';
import { uuidParamSchema } from '@/schemas/api';
import { verifyJwt, getJwtFromRequest } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  const session = await verifyJwt(getJwtFromRequest(request));
  if (!session || session.role !== 'psicologo') {
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
