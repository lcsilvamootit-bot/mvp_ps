import { NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';

function hasAccessToken(request) {
  const validToken = process.env.ACCESS_TOKEN;
  if (!validToken) return false;
  const tokenParam = request.nextUrl.searchParams.get('token');
  const cookieToken = request.cookies.get('access_token')?.value;
  return tokenParam === validToken || cookieToken === validToken;
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Estáticos e favicon passam sempre
  if (pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Rotas de API: valida ACCESS_TOKEN via header ou cookie
  if (pathname.startsWith('/api')) {
    const validToken = process.env.ACCESS_TOKEN;
    if (!validToken) {
      return NextResponse.json({ error: 'Acesso restrito.' }, { status: 403 });
    }
    const headerToken = request.headers.get('x-access-token');
    const cookieToken = request.cookies.get('access_token')?.value;
    if (headerToken !== validToken && cookieToken !== validToken) {
      return NextResponse.json({ error: 'Acesso restrito.' }, { status: 403 });
    }
    return NextResponse.next();
  }

  // Páginas: valida ACCESS_TOKEN via query param ou cookie
  if (!hasAccessToken(request)) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="pt-BR">
        <head><meta charset="UTF-8"><title>Acesso Restrito</title></head>
        <body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;background:#fafafa;margin:0;">
          <div style="text-align:center;max-width:400px;padding:2rem;background:white;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
            <h1 style="color:#e63946;font-size:1.25rem;margin-bottom:0.75rem;">Acesso Restrito</h1>
            <p style="color:#555;font-size:0.9rem;">Verifique o link recebido e tente novamente.</p>
          </div>
        </body>
      </html>`,
      { status: 403, headers: { 'content-type': 'text/html; charset=utf-8' } }
    );
  }

  // /revisao/* requer adicionalmente a sessão do psicólogo
  if (pathname.startsWith('/revisao')) {
    const sessionToken = request.cookies.get('psych_session')?.value ?? null;
    const valid = await verifySessionToken(sessionToken);
    if (!valid) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ACCESS_TOKEN via query param: persiste no cookie e redireciona sem o token na URL
  const tokenParam = request.nextUrl.searchParams.get('token');
  if (tokenParam) {
    const url = request.nextUrl.clone();
    url.searchParams.delete('token');
    const response = NextResponse.redirect(url);
    response.cookies.set('access_token', tokenParam, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
