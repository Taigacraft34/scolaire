import { auth } from "@/auth";
import { NextResponse } from "next/server";

const ROUTES_PUBLIQUES = ["/connexion"];

export default auth((request) => {
  const { pathname } = request.nextUrl;

  const estPublique =
    ROUTES_PUBLIQUES.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith("/api/auth") ||
    // Protegees par leur propre secret partage (voir les routes), pas par une session ZITADEL.
    pathname.startsWith("/api/notifications/verifier") ||
    pathname.startsWith("/api/synchronisation/verifier");

  if (estPublique) return NextResponse.next();

  if (!request.auth) {
    const url = new URL("/connexion", request.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && request.auth.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons).*)"],
};
