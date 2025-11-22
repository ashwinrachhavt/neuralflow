import { PageShell } from "@/components/layout/page-shell";
import { SectionHeader } from "@/components/section-header";
import { JewelsGrid } from "./view";
import { listPublicImages } from "@/lib/server/list-public-images";
import { generateMilestones } from "@/lib/gamification/progression";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Jewels",
  description: "All public images rendered as jewels (design view).",
};

export default async function JewelsPage() {
  const images = await listPublicImages();
  const milestones = generateMilestones(images.length || 12);
  const points = 0; // Keep simple: design view shows as locked by default

  return (
    <PageShell>
      <SectionHeader title="Jewels" description="All public assets previewed as jewels." />
      <JewelsGrid images={images} milestones={milestones} points={points} />
    </PageShell>
  );
}

