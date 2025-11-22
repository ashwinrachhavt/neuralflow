import { DaoPlayground } from "@/components/debug/DaoPlayground";

export const metadata = {
  title: "DAO AI Debug",
};

export default function Page() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <DaoPlayground />
    </main>
  );
}

