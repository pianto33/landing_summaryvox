import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, locales } from "@/locales/config";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Si la ruta ya incluye un código de país, no hacemos nada
  if (locales.some((code) => pathname.startsWith(`/${code}`))) {
    return NextResponse.next();
  }

  // Si no hay código de país, redirigimos a la versión default
  const newUrl = request.nextUrl.clone();
  newUrl.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(newUrl);
}

export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.png).*)",
};
