import { saveReview } from '@/lib/repositories/analyses';
import { saveReviewSchema, uuidParamSchema } from '@/schemas/api';
import { verifyJwt, getJwtFromRequest } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST(request, { params }) {
  const session = await verifyJwt(getJwtFromRequest(request));
  if (!session || session.role !== 'psicologo') {
    return Response.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const { id } = await params;
  const idParsed = uuidParamSchema.safeParse({ id });
  if (!idParsed.success) {
    return Response.json({ error: 'ID inválido.' }, { status: 400 });
  }

  const body = await request.json();
  const parsed = saveReviewSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  try {
    const saved = await saveReview(id, parsed.data);
    if (!saved) return Response.json({ error: 'Análise não encontrada.' }, { status: 404 });
    return Response.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/analyses/[id]/review]', err.message);
    return Response.json({ error: 'Erro ao salvar avaliação.' }, { status: 500 });
  }
}
