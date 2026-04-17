const COOKIE_NAME = 'psych_session';
const TTL_MS = 8 * 60 * 60 * 1000; // 8 horas

async function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('[auth] SESSION_SECRET não configurada.');
  const keyMaterial = new TextEncoder().encode(secret);
  return crypto.subtle.importKey(
    'raw', keyMaterial, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );
}

function toBase64Url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

export async function createSessionToken() {
  const payload = JSON.stringify({ role: 'psych', exp: Date.now() + TTL_MS });
  const enc = new TextEncoder();
  const payloadBytes = enc.encode(payload);
  const key = await getKey();
  const sig = await crypto.subtle.sign('HMAC', key, payloadBytes);
  return `${toBase64Url(payloadBytes)}.${toBase64Url(sig)}`;
}

export async function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return false;
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);
  try {
    const payloadBytes = fromBase64Url(payloadB64);
    const sigBytes = fromBase64Url(sigB64);
    const key = await getKey();
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, payloadBytes);
    if (!valid) return false;
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
    return payload.role === 'psych' && typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function sessionCookieHeader(token) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800`;
}

export function clearSessionCookieHeader() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/** Extrai o token do cookie tanto de NextRequest (proxy) quanto de Request (route handler). */
export function getSessionFromRequest(request) {
  // NextRequest (proxy / App Router): tem .cookies.get()
  const fromCookies = request.cookies?.get?.(COOKIE_NAME)?.value;
  if (fromCookies !== undefined) return fromCookies ?? null;

  // Fallback: header Cookie raw
  const raw = request.headers?.get?.('cookie') ?? '';
  const match = raw.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}
