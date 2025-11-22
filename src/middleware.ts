// src/middleware.ts (or /middleware.ts depending on your structure)
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default clerkMiddleware(
  async (auth, req: NextRequest) => {
    const { userId } = await auth();
    const { pathname } = new URL(req.url);

    // Keep landing and auth pages fully public; no redirects here
    const publicMatchers = [
      "/",
      "/sign-in",
      "/sign-up",
      "/api/healthcheck",
      "/favicon.ico",
      "/robots.txt",
      "/sitemap.xml",
      "/.well-known",
    ];

    const isExplicitPublic = publicMatchers.some((p) =>
      pathname === p || pathname.startsWith(`${p}/`)
    );

    if (!userId && !isExplicitPublic) {
      // API/TRPC get JSON 401
      if (pathname.startsWith("/api") || pathname.startsWith("/trpc")) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
      // For app pages, allow the page-level SignedOut UI to render; do not hard-redirect here
      return NextResponse.next();
    }

    return NextResponse.next();
  }
);

export const config = {
  matcher: [
    "/",
    // Only run middleware on protected app sections and APIs
    "/dashboard/:path*",
    "/boards/:path*",
    "/todos/:path*",
    "/assistant/:path*",
    "/profile/:path*",
    "/pomodoro/:path*",
    "/(api|trpc)(.*)",
  ],
};
