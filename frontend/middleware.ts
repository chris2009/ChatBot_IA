import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/login"];
const ADMIN_PATHS = ["/users"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rutas públicas
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Verificar rutas admin
    if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
      // Leer role desde auth-info cookie
      const authInfoCookie = request.cookies.get("auth-info")?.value;
      if (authInfoCookie) {
        const decoded = Buffer.from(authInfoCookie, "base64").toString("utf-8");
        const authInfo = JSON.parse(decoded);
        if (authInfo.role !== "admin") {
          return NextResponse.redirect(new URL("/chat", request.url));
        }
      } else {
        return NextResponse.redirect(new URL("/chat", request.url));
      }
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
