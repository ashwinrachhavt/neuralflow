import { prisma } from '@/lib/prisma';

export async function getUserOverview(userId: string) {
  const now = new Date();
  const inSevenDays = new Date(now);
  inSevenDays.setDate(inSevenDays.getDate() + 7);

  const [
    user,
    boards,
    events,
    meetings,
    projects,
    gamificationProfile,
    stones,
    stoneProgresses,
    achievements,
    decks,
    reviews,
    focusSessions,
    memberships,
    reporterProfile,
    quizzes,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
      },
    }),
    prisma.board.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          select: { id: true, name: true, position: true },
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 100,
          select: {
            id: true,
            title: true,
            descriptionMarkdown: true,
            status: true,
            priority: true,
            type: true,
            columnId: true,
            projectId: true,
            docId: true,
            tags: true,
            estimatedPomodoros: true,
            dueDate: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    }),
    prisma.calendarEvent.findMany({
      where: { userId, startAt: { gte: now, lt: inSevenDays } },
      orderBy: { startAt: 'asc' },
      select: {
        id: true,
        title: true,
        type: true,
        startAt: true,
        endAt: true,
        descriptionMarkdown: true,
        relatedTaskId: true,
        location: true,
        tags: true,
      },
    }),
    prisma.calendarEvent.findMany({
      where: { userId, startAt: { gte: now, lt: inSevenDays }, type: 'MEETING' },
      orderBy: { startAt: 'asc' },
      select: {
        id: true,
        title: true,
        startAt: true,
        endAt: true,
        descriptionMarkdown: true,
      },
    }),
    prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        status: true,
        points: true,
        notionUrl: true,
        updatedAt: true,
        _count: { select: { tasks: true, docs: true } },
      },
    }),
    prisma.userGamificationProfile.findUnique({
      where: { userId },
      select: {
        userId: true,
        xp: true,
        level: true,
        longestDailyStreak: true,
        currentDailyStreak: true,
        lastActivityDate: true,
        totalTasksCompleted: true,
        totalDeepWorkBlocks: true,
        totalPomodoros: true,
        updatedAt: true,
      },
    }),
    prisma.userStone.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        stoneId: true,
        earnedAt: true,
        source: true,
        relatedTaskIds: true,
        note: true,
        stone: {
          select: { slug: true, name: true, rarity: true, imagePath: true },
        },
      },
    }),
    prisma.userStoneProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        stoneId: true,
        currentShards: true,
        targetShards: true,
        updatedAt: true,
        stone: { select: { slug: true, name: true, rarity: true } },
      },
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        earnedAt: true,
        metadata: true,
        achievement: {
          select: { slug: true, name: true, description: true, icon: true },
        },
      },
    }),
    prisma.flashcardDeck.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        sourceNoteId: true,
        updatedAt: true,
        _count: { select: { cards: true, quizzes: true } },
      },
    }),
    prisma.flashcardReview.findMany({
      where: { userId },
      orderBy: { reviewedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        flashcardId: true,
        reviewedAt: true,
        easeFactor: true,
        intervalDays: true,
        grade: true,
      },
    }),
    prisma.focusSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        eventId: true,
        startedAt: true,
        endedAt: true,
        completed: true,
        interruptions: true,
      },
    }),
    prisma.membership.findMany({
      where: { userId },
      include: {
        tenant: { select: { id: true, slug: true, name: true, ownerId: true } },
      },
    }),
    prisma.reporterProfile.findUnique({
      where: { userId },
      select: {
        userId: true,
        personalityNotes: true,
        preferredCadence: true,
        longTermGoals: true,
        experiments: true,
        trendNotes: true,
        updatedAt: true,
      },
    }),
    prisma.quiz.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { questions: true, attempts: true } },
      },
      take: 50,
    }),
  ]);

  return {
    user,
    boards,
    calendar: { events, meetings },
    projects,
    gamification: {
      profile: gamificationProfile,
      stones,
      stoneProgresses,
      achievements,
    },
    flashcards: { decks, reviews },
    quizzes,
    focus: { sessions: focusSessions },
    memberships,
    reporterProfile,
    fetchedAt: now.toISOString(),
  };
}
