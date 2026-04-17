import { NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/session';
import { verifySessionToken } from '@/lib/auth';

const PUBLIC_PATHS = ['/acesso', '/primeiro-acesso', '/login'];

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/_vercel') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // Rotas de auth — públicas
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // /dashboard/* — requer sessão JWT
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('session')?.value;
    const session = await verifyJwt(token);
    if (!session) {
      return NextResponse.redirect(new URL('/acesso', request.url));
    }
    if (session.mustChangePassword && pathname !== '/primeiro-acesso') {
      return NextResponse.redirect(new URL('/primeiro-acesso', request.url));
    }
    return NextResponse.next();
  }

  // /revisao/* — requer sessão do psicólogo (HMAC)
  if (pathname.startsWith('/revisao')) {
    const token = request.cookies.get('psych_session')?.value ?? null;
    const valid = await verifySessionToken(token);
    if (!valid) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // APIs — passam sem verificação de ACCESS_TOKEN no middleware
  // (cada route handler decide sua própria autenticação)
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Demais páginas — guarda via ACCESS_TOKEN
  const validToken = process.env.ACCESS_TOKEN;
  if (validToken) {
    const tokenParam = request.nextUrl.searchParams.get('token');
    const cookieToken = request.cookies.get('access_token')?.value;

    if (tokenParam === validToken) {
      const url = request.nextUrl.clone();
      url.searchParams.delete('token');
      const response = NextResponse.redirect(url);
      response.cookies.set('access_token', tokenParam, { path: '/', httpOnly: true, sameSite: 'lax' });
      return response;
    }

    if (cookieToken !== validToken) {
      return new NextResponse(
        `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Acesso Restrito</title></head>
        <body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;background:#fafafa;margin:0;">
          <div style="text-align:center;max-width:400px;padding:2rem;background:white;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
            <h1 style="color:#e63946;font-size:1.25rem;margin-bottom:0.75rem;">Acesso Restrito</h1>
            <p style="color:#555;font-size:0.9rem;">Verifique o link recebido e tente novamente.</p>
          </div>
        </body></html>`,
        { status: 403, headers: { 'content-type': 'text/html; charset=utf-8' } }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
