import { clearSessionCookieHeader } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST() {
  const response = Response.json({ ok: true });
  response.headers.set('Set-Cookie', clearSessionCookieHeader());
  return response;
}
