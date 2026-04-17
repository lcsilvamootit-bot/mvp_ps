import { verifyJwt, getJwtFromRequest } from '@/lib/session';
import { toggleUserActive } from '@/lib/repositories/users';
import { uuidParamSchema } from '@/schemas/api';

export const runtime = 'nodejs';

export async function PATCH(request, { params }) {
  const token = getJwtFromRequest(request);
  const session = await verifyJwt(token);
  if (!session || session.role !== 'gestor') {
    return Response.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const { id } = await params;
  const parsed = uuidParamSchema.safeParse({ id });
  if (!parsed.success) {
    return Response.json({ error: 'ID inválido.' }, { status: 400 });
  }

  try {
    const result = await toggleUserActive(id);
    if (!result) return Response.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    return Response.json(result);
  } catch (err) {
    console.error('[PATCH /api/users/[id]]', err.message);
    return Response.json({ error: 'Erro ao atualizar usuário.' }, { status: 500 });
  }
}
