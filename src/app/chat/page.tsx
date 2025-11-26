import { PageShell } from "@/components/layout/page-shell";
import { SectionHeader } from "@/components/section-header";
import { SmartTodoChat } from "@/components/chat/SmartTodoChat";

export const metadata = {
  title: 'Chat',
  description: 'Smart Todo chat assistant',
};

export default function ChatPage() {
  return (
    <PageShell size="xl">
      <SectionHeader
        title="Assistant"
        description="Chat with your todo-aware assistant."
      />
      <SmartTodoChat />
    </PageShell>
  );
}

