import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { verifyJwt, getJwtFromRequest } from '@/lib/session';
import {
  createUser, ensureGestorTeam, addUserToTeam,
  listVendedoresByGestor, createInviteToken,
} from '@/lib/repositories/users';

export const runtime = 'nodejs';

async function requireGestor(request) {
  const token = getJwtFromRequest(request);
  const session = await verifyJwt(token);
  if (!session || session.role !== 'gestor') return null;
  return session;
}

export async function GET(request) {
  const session = await requireGestor(request);
  if (!session) return Response.json({ error: 'Não autorizado.' }, { status: 401 });

  try {
    const vendedores = await listVendedoresByGestor(session.sub);
    return Response.json(vendedores);
  } catch (err) {
    console.error('[GET /api/users]', err.message);
    return Response.json({ error: 'Erro ao listar usuários.' }, { status: 500 });
  }
}

const createUserSchema = z.object({
  name:  z.string().min(1).max(120),
  email: z.string().email(),
});

export async function POST(request) {
  const session = await requireGestor(request);
  if (!session) return Response.json({ error: 'Não autorizado.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  try {
    const user = await createUser({ name: parsed.data.name, email: parsed.data.email.toLowerCase() });
    const teamId = await ensureGestorTeam(session.sub);
    await addUserToTeam(teamId, user.id);
    const inviteToken = await createInviteToken(user.id);

    return Response.json({ ...user, inviteToken }, { status: 201 });
  } catch (err) {
    if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
      return Response.json({ error: 'E-mail já cadastrado.' }, { status: 409 });
    }
    console.error('[POST /api/users]', err.message);
    return Response.json({ error: 'Erro ao criar usuário.' }, { status: 500 });
  }
}
