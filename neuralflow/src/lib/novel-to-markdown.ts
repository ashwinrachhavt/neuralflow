type NovelNode = {
  type?: string;
  text?: string;
  content?: NovelNode[];
};

/**
 * Super-light transformer that extracts plain text from a Novel/Tiptap document.
 * Swap this with a full-fidelity serializer once the editor schema is finalised.
 */
export function novelJsonToMarkdown(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "";

  try {
    const document = doc as NovelNode;
    const buffer: string[] = [];

    walk(document, buffer);

    return buffer
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch (error) {
    console.warn("[novelJsonToMarkdown] failed to serialise", error);
    return "";
  }
}

function walk(node: NovelNode, buffer: string[]) {
  if (!node) return;

  if (node.text) {
    buffer.push(node.text);
  }

  if (node.content && Array.isArray(node.content)) {
    for (const child of node.content) {
      walk(child ?? {}, buffer);
    }
  }

  if (node.type === "paragraph" || node.type === "heading") {
    buffer.push("\n");
  }
}

