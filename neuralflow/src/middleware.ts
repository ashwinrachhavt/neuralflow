// src/middleware.ts (or /middleware.ts depending on your structure)
import { clerkMiddleware, type ClerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default clerkMiddleware(
  async (auth, req: NextRequest) => {
    const { userId, isPublicRoute, redirectToSignIn } = await auth();

    const { pathname } = new URL(req.url).pathname ? new URL(req.url) : { pathname: "" };

    // If this route isn’t public and the user is *not* signed in
    if (!userId && !isPublicRoute) {
      // If this is an API or TRPC route: send JSON 401
      if (pathname.startsWith("/api") || pathname.startsWith("/trpc")) {
        return NextResponse.json(
          { message: "Unauthorized" },
          { status: 401 }
        );
      }

      // Otherwise (a front-end page): redirect to sign in
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    // If user *is* signed in OR route is public → let through
    return NextResponse.next();
  },
  {
    publicRoutes: [
      "/",
      "/sign-in(.*)",
      "/sign-up(.*)",
      "/api/healthcheck",
      "/favicon.ico",
      "/robots.txt",
      "/sitemap.xml",
      "/.well-known/(.*)"
    ],
    ignoredRoutes: ["/api/healthcheck"]
  }
) as ClerkMiddleware;

export const config = {
  matcher: [
    // Protect all pages except Next.js internals & static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Protect API and TRPC routes
    "/(api|trpc)(.*)",
  ],
};
