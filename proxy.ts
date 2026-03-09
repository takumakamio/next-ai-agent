import { type NextRequest, NextResponse } from 'next/server'

const proxy = async (req: NextRequest) => {
  // Set request headers
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-url', req.url)

  // Continue with the request
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  return response
}

export default proxy

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|trpc|_vercel|favicon.ico|.*\\..*).*)'],
}
