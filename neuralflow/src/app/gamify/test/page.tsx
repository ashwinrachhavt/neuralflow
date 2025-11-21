import { PageShell } from "@/components/layout/page-shell";
import { SectionHeader } from "@/components/section-header";
import { listPublicImages } from "@/lib/server/list-public-images";
import { SelectorAndSwitcher } from "./selector-and-switcher";
import { RewardSimulator } from "./simulator";

export const dynamic = "force-dynamic";

export default async function GamifyTestPage() {
  const images = await listPublicImages();
  // Server component: pass images to client components below via props
  return (
    <PageShell size="lg">
      <div className="space-y-6">
        <SectionHeader title="Rewards prototyping" description="Admin-only playground: simulate milestones and preview reward animations." />
        <RewardSimulator images={images} />
        <div className="pt-2">
          <SectionHeader title="Image switcher" description="Manually switch images and trigger reward animation." />
          <SelectorAndSwitcher images={images} />
        </div>
      </div>
    </PageShell>
  );
}
