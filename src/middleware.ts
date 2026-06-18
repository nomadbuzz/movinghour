import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  if (pathname === "/login") {
    if (isLoggedIn) {
      return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
    }
    return;
  }

  if (
    (pathname.startsWith("/dashboard") || pathname.startsWith("/settings")) &&
    !isLoggedIn
  ) {
    return Response.redirect(new URL("/login", req.nextUrl.origin));
  }

  if (pathname === "/" && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (pathname === "/" && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
