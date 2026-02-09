import { type NextRequest, NextResponse } from 'next/server'
import { DEFAULT_LOCALE } from './lib/constants'

const proxy = async (req: NextRequest) => {
  const currentUrl = req.nextUrl.clone()

  // Get locale from cookie, fallback to default
  const locale = req.cookies.get('NEXT_LOCALE')?.value || DEFAULT_LOCALE

  // Set request headers
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-url', req.url)
  requestHeaders.set('x-locale', locale)

  // Continue with the request
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Ensure locale cookie is always set
  if (!req.cookies.get('NEXT_LOCALE')) {
    response.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      sameSite: 'lax',
    })
  }

  return response
}

export default proxy

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|trpc|_vercel|favicon.ico|.*\\..*).*)'],
}
