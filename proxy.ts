import { NextResponse } from "next/server";
import { auth } from "@/auth";

const AUTH_PAGES = ["/login", "/signup"];

// Optimistic redirects only. The API routes still check the session
// themselves, so this is not the authorization boundary.
export default auth((request) => {
  const { pathname, search } = request.nextUrl;
  const isAuthPage = AUTH_PAGES.includes(pathname);
  const isSignedIn = Boolean(request.auth?.user);

  if (isSignedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  if (!isSignedIn && !isAuthPage) {
    const loginUrl = new URL("/login", request.nextUrl);

    if (pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", pathname + search);
    }

    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
