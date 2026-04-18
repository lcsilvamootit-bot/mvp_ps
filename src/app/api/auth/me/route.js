import { verifyJwt, getJwtFromRequest } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET(request) {
  const session = await verifyJwt(getJwtFromRequest(request));
  if (!session) return Response.json({ authenticated: false }, { status: 401 });
  return Response.json({ authenticated: true, role: session.role, name: session.name });
}
