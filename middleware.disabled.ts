// middleware.ts
import { NextResponse }       from 'next/server'
import type { NextRequest }   from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname, cookies } = req
  // jeśli ścieżka zaczyna się od /admin, poza /admin/login, wymaga tokenu:
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = cookies.get('admin-token')?.value
    if (token !== 'allow') {
      // przekieruj na logowanie
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }
  return NextResponse.next()
}

// stosujemy middleware tylko na /admin
export const config = {
  matcher: ['/admin/:path*']
}
