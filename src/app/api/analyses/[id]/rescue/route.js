import { saveRescuePlan } from '@/lib/repositories/analyses';
import { saveRescueSchema, uuidParamSchema } from '@/schemas/api';
import { verifyJwt, getJwtFromRequest } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST(request, { params }) {
  const session = await verifyJwt(getJwtFromRequest(request));
  if (!session) return Response.json({ error: 'Não autorizado.' }, { status: 401 });

  const { id } = await params;

  const idParsed = uuidParamSchema.safeParse({ id });
  if (!idParsed.success) {
    return Response.json({ error: 'ID inválido.' }, { status: 400 });
  }

  const body = await request.json();
  const parsed = saveRescueSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  try {
    const saved = await saveRescuePlan(id, parsed.data.rescuePlan);
    if (!saved) return Response.json({ error: 'Análise não encontrada.' }, { status: 404 });
    return Response.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/analyses/[id]/rescue]', err.message);
    return Response.json({ error: 'Erro ao salvar plano de resgate.' }, { status: 500 });
  }
}
