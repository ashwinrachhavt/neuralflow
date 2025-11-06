import { clerkMiddleware } from "@clerk/nextjs/server";

const publicPaths = new Set(["/", "/sign-in", "/sign-up"]);

export default clerkMiddleware((auth, request) => {
  const { pathname } = request.nextUrl;

  if (
    publicPaths.has(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/public")
  ) {
    return;
  }

  if (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up")
  ) {
    return;
  }

  const { userId, redirectToSignIn } = auth();

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: request.url });
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
