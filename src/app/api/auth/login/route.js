import { createSessionToken, sessionCookieHeader } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { password } = body;

  const validPassword = process.env.PSYCHOLOGIST_PASSWORD;
  if (!validPassword || password !== validPassword) {
    return Response.json({ error: 'Senha inválida.' }, { status: 401 });
  }

  const token = await createSessionToken();
  const response = Response.json({ ok: true });
  response.headers.set('Set-Cookie', sessionCookieHeader(token));
  return response;
}
