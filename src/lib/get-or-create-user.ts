import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getOrCreateDbUser() {
  const { userId } = await auth();

  // Dev bypass: allow testing APIs locally without Clerk cookie
  const allowBypass =
    process.env.NODE_ENV !== "production" && process.env.DEV_AUTH_BYPASS === "1";
  const bypassUserId = process.env.DEV_AUTH_BYPASS_USER_ID || "user_dev";

  const effectiveUserId = userId ?? (allowBypass ? bypassUserId : null);
  if (!effectiveUserId) return null;

  const existing = await prisma.user.findUnique({
    where: { id: effectiveUserId },
    select: { id: true, email: true, name: true, image: true, createdAt: true },
  });
  if (existing) return existing;

  // If we have a real Clerk user, mirror Clerk profile; else create a minimal dev user
  if (userId) {
    const clerkUser = await currentUser();
    return prisma.user.create({
      data: {
        id: userId,
        email: clerkUser?.emailAddresses?.[0]?.emailAddress ?? null,
        name: clerkUser?.fullName ?? null,
        image: clerkUser?.imageUrl ?? null,
      },
      select: { id: true, email: true, name: true, image: true, createdAt: true },
    });
  }

  return prisma.user.create({
    data: {
      id: effectiveUserId,
      email: "dev@example.com",
      name: "Dev User",
      image: null,
    },
    select: { id: true, email: true, name: true, image: true, createdAt: true },
  });
}
