import { SignJWT, jwtVerify } from 'jose';

const getKey = () => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('[session] SESSION_SECRET não configurada.');
  return new TextEncoder().encode(secret);
};
const ALG = 'HS256';

export async function signSession(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(getKey());
}

export async function verifyJwt(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: [ALG] });
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieHeader(token) {
  return `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`;
}

export function clearSessionCookieHeader() {
  return `session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function getJwtFromRequest(request) {
  const fromCookies = request.cookies?.get?.('session')?.value;
  if (fromCookies !== undefined) return fromCookies ?? null;
  const raw = request.headers?.get?.('cookie') ?? '';
  const match = raw.match(/(?:^|;\s*)session=([^;]+)/);
  return match ? match[1] : null;
}
