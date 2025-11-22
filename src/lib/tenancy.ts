import { prisma } from "@/lib/prisma";

export async function getOrCreateTenantForUser(params: {
  userId: string;
  slug: string;
  name: string;
}) {
  const { userId, slug, name } = params;

  // Create or reuse a tenant by slug; set owner as this user.
  const tenant = await prisma.tenant.upsert({
    where: { slug },
    update: {},
    create: {
      slug,
      name,
      ownerId: userId,
    },
    select: { id: true, slug: true, name: true, ownerId: true },
  });

  // Ensure membership exists (OWNER)
  await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId } },
    update: { role: "OWNER", status: "ACTIVE" },
    create: {
      tenantId: tenant.id,
      userId,
      role: "OWNER",
      status: "ACTIVE",
    },
  });

  return tenant;
}

