import { cn } from "@/lib/utils";

function stripMarkdown(input: string) {
  return input
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/[*_~#>-]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
}

export type CardDescriptionPreviewProps = {
  content?: string | null;
  className?: string;
};

export function CardDescriptionPreview({ content, className }: CardDescriptionPreviewProps) {
  if (!content) return null;
  const clean = stripMarkdown(content);

  return (
    <p className={cn("text-sm text-muted-foreground line-clamp-2", className)}>
      {clean || "Add more detail to this task"}
    </p>
  );
}
