import { auth } from '../app/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnLoginPage = req.nextUrl.pathname === '/';
  const isOnPublicPage = req.nextUrl.pathname.startsWith('/api/auth');

  // Allow public pages
  if (isOnPublicPage || isOnLoginPage) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};