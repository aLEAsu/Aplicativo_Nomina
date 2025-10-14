import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Solo proteger rutas que empiezan con /dashboard, /employees, /novelties, /payroll, /reports
  const protectedPaths = ["/dashboard", "/employees", "/novelties", "/payroll", "/reports"]
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))

  // Verificar si hay sesión mediante la cookie 'session' (establecida en el login)
  const hasSession = request.cookies.get("session")

  // Solo redirigir a login si intenta acceder a ruta protegida sin sesión
  if (isProtectedPath && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
}
