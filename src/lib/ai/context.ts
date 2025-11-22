import { prisma } from "@/lib/prisma";

export type AgentContext = Awaited<ReturnType<typeof getAgentContext>>;

export async function getAgentContext(userId: string) {
  const now = new Date();

  const activeTasks = await prisma.task.findMany({
    where: {
      userId,
      status: { in: ["TODO", "IN_PROGRESS"] },
    },
    select: {
      id: true,
      title: true,
      priority: true,
      estimateMinutes: true,
    },
    take: 20,
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      energyProfile: true,
      goals: true,
    },
  });

  return {
    currentTime: now.toLocaleString("en-US", {
      weekday: "long",
      hour: "numeric",
      minute: "numeric",
    }),
    activeTasks,
    energyProfile: user?.energyProfile || "Standard 9-5 work pattern",
    goals: user?.goals || "Stay productive",
  };
}
