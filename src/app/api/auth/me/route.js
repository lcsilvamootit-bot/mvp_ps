import { verifySessionToken, getSessionFromRequest } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request) {
  const token = getSessionFromRequest(request);
  const valid = await verifySessionToken(token);
  if (!valid) return Response.json({ authenticated: false }, { status: 401 });
  return Response.json({ authenticated: true, role: 'psych' });
}
