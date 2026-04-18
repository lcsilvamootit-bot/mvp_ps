import { getWorkspaceContext, saveWorkspaceContext } from '@/lib/workspace';
import { verifyJwt, getJwtFromRequest } from '@/lib/session';

export const runtime = 'nodejs';

async function requirePsicologo(request) {
  const session = await verifyJwt(getJwtFromRequest(request));
  if (!session || session.role !== 'psicologo') {
    return Response.json({ error: 'Não autorizado.' }, { status: 401 });
  }
  return null;
}

export async function GET(request) {
  const denied = await requirePsicologo(request);
  if (denied) return denied;

  try {
    const data = await getWorkspaceContext();
    return Response.json(data);
  } catch (err) {
    console.error('[GET /api/settings]', err.message);
    return Response.json({ error: 'Erro ao carregar configurações.' }, { status: 500 });
  }
}

export async function POST(request) {
  const denied = await requirePsicologo(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { updatedBy, ...contextData } = body;

    const allowed = ['setor', 'produto', 'ticketMedio', 'cicloDecisao',
                     'perfilCliente', 'concorrentes', 'objecoes', 'observacao'];

    const clean = Object.fromEntries(
      Object.entries(contextData)
        .filter(([k, v]) => allowed.includes(k) && typeof v === 'string')
        .map(([k, v]) => [k, v.trim()])
        .filter(([, v]) => v.length > 0)
    );

    await saveWorkspaceContext(clean, updatedBy ?? null);
    return Response.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/settings]', err.message);
    return Response.json({ error: 'Erro ao salvar configurações.' }, { status: 500 });
  }
}
