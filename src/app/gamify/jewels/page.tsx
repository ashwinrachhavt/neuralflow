import { PageShell } from "@/components/layout/page-shell";
import { SectionHeader } from "@/components/section-header";
import { listPublicImages } from "@/lib/server/list-public-images";
import { generateMilestones } from "@/lib/gamification/progression";
import { JewelsGrid } from "./view";

export const dynamic = "force-dynamic";

export default async function JewelsPage() {
  // Show every jewel available in the public folder
  const images = await listPublicImages();
  const milestones = generateMilestones(images.length || 12);
  return (
    <PageShell>
      <SectionHeader
        title="Jewels"
        description="All rewards are locked. Finish tasks to earn priority points and unlock them one by one."
      />
      <JewelsGrid images={images} milestones={milestones} />
    </PageShell>
  );
}
