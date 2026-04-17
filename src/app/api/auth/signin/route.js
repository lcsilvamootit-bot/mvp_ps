import bcrypt from 'bcryptjs';
import { signSession, sessionCookieHeader } from '@/lib/session';
import { findUserByEmail, getTeamIdsByUser } from '@/lib/repositories/users';

export const runtime = 'nodejs';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { email, password } = body;

  if (!email || !password) {
    return Response.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 });
  }

  const user = await findUserByEmail(email).catch(() => null);

  if (!user || !user.passwordHash) {
    return Response.json({ error: 'Credenciais inválidas.' }, { status: 401 });
  }

  if (!user.active) {
    return Response.json({ error: 'Conta inativa. Entre em contato com seu gestor.' }, { status: 403 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return Response.json({ error: 'Credenciais inválidas.' }, { status: 401 });
  }

  const teamIds = await getTeamIdsByUser(user.id);
  const token = await signSession({
    sub: user.id,
    role: user.role,
    name: user.name,
    teamIds,
    mustChangePassword: user.mustChangePassword,
  });

  const response = Response.json({
    id: user.id,
    name: user.name,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  });
  response.headers.set('Set-Cookie', sessionCookieHeader(token));
  return response;
}
