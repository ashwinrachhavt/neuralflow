import { getOrCreateDbUser } from "@/lib/get-or-create-user";

export async function getCurrentUser() {
  // Returns the current user or null without throwing
  return getOrCreateDbUser();
}

export async function getCurrentUserOrThrow() {
  const user = await getOrCreateDbUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}
