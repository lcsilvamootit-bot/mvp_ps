import { verifySessionToken, getSessionFromRequest } from '@/lib/auth';
import { verifyJwt, getJwtFromRequest } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET(request) {
  // Verifica sessão JWT (gestor/vendedor)
  const jwtToken = getJwtFromRequest(request);
  const jwtSession = await verifyJwt(jwtToken);
  if (jwtSession) {
    return Response.json({ authenticated: true, role: jwtSession.role, name: jwtSession.name });
  }

  // Verifica sessão do psicólogo (HMAC)
  const psychToken = getSessionFromRequest(request);
  const valid = await verifySessionToken(psychToken);
  if (valid) return Response.json({ authenticated: true, role: 'psych' });

  return Response.json({ authenticated: false }, { status: 401 });
}
