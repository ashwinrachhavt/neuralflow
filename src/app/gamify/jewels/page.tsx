import { PageShell } from "@/components/layout/page-shell";
import { SectionHeader } from "@/components/section-header";
import { listStoneImages } from "@/lib/server/list-stone-images";
import { generateMilestones } from "@/lib/gamification/progression";
import { JewelsGrid } from "./view";

export const dynamic = "force-dynamic";

export default async function JewelsPage() {
  const images = await listStoneImages();
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
