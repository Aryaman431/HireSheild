import { NextResponse, type NextRequest } from 'next/server'
import { isClerkConfigured } from '@/lib/auth-config'
import { clerkMiddleware } from '@clerk/nextjs/server'

const clerkHandler = clerkMiddleware()

export default function middleware(req: NextRequest) {
  if (isClerkConfigured()) {
    return clerkHandler(req, {} as any)
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
