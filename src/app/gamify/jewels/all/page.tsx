import { PageShell } from "@/components/layout/page-shell";
import { SectionHeader } from "@/components/section-header";
import { JewelsGrid } from "../view";
import { listPublicImages } from "@/lib/server/list-public-images";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "All Jewels",
    description: "All public images displayed as jewels.",
};

export default async function AllJewelsPage() {
    const images = await listPublicImages();
    // Map to the shape expected by JewelsGrid, marking all as unlocked.
    const enriched = images.map((im) => ({
        ...im,
        unlocked: true,
        theme: "",
        rarity: "COMMON" as const,
    }));

    return (
        <PageShell>
            <SectionHeader title="All Jewels" description="All public assets previewed as jewels." />
            <JewelsGrid images={enriched} />
        </PageShell>
    );
}
