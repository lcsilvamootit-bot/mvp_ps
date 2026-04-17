import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { signSession, sessionCookieHeader } from '@/lib/session';
import { findAndConsumeInviteToken, findUserById, setPassword, getTeamIdsByUser } from '@/lib/repositories/users';

export const runtime = 'nodejs';

const schema = z.object({
  token:    z.string().min(1),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres.'),
});

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 });
  }

  const { token, password } = parsed.data;

  const userId = await findAndConsumeInviteToken(token).catch(() => null);
  if (!userId) {
    return Response.json({ error: 'Link inválido ou expirado.' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await setPassword(userId, passwordHash);

  const user = await findUserById(userId);
  const teamIds = await getTeamIdsByUser(userId);
  const sessionToken = await signSession({
    sub: user.id,
    role: user.role,
    name: user.name,
    teamIds,
    mustChangePassword: false,
  });

  const response = Response.json({ id: user.id, name: user.name, role: user.role });
  response.headers.set('Set-Cookie', sessionCookieHeader(sessionToken));
  return response;
}
