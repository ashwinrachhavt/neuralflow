import { getOrCreateDbUser } from "@/lib/get-or-create-user";

export async function getCurrentUserOrThrow() {
  const user = await getOrCreateDbUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}
