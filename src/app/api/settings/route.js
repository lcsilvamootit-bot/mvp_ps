import { getWorkspaceContext, saveWorkspaceContext } from '@/lib/workspace';
import { verifySessionToken, getSessionFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

async function requirePsychSession(request) {
  const token = getSessionFromRequest(request);
  const valid = await verifySessionToken(token);
  if (!valid) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
  return null;
}

export async function GET(request) {
  const denied = await requirePsychSession(request);
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
  const denied = await requirePsychSession(request);
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
