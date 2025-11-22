import { runWeeklyReview } from "../src/lib/ai/orchestrator";
import { prisma } from "../src/lib/prisma";

async function main() {
    console.log("Finding a user...");
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error("No user found in database.");
        return;
    }
    console.log(`Found user: ${user.id} (${user.email})`);

    console.log("Running weekly review...");
    const end = new Date();
    const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    try {
        const result = await runWeeklyReview(user.id, start, end);
        console.log("Weekly review completed successfully!");
        console.log("Summary:", result.reporterResult.summary);
        console.log("Experiments:", result.reporterResult.experiments);
        console.log("SWOT:", JSON.stringify(result.reporterResult.swot, null, 2));
    } catch (error) {
        console.error("Error running weekly review:", error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
