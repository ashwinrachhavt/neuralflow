import { NotionDoc, NotionProject } from "./types";

const NOTION_API_BASE_URL = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

const NOTION_API_KEY = process.env.NOTION_API_KEY ?? "";
const COMMAND_CENTER_DB_ID = process.env.NOTION_COMMAND_CENTER_DB_ID ?? "";
const NEURAL_FLOW_PAGE_ID = process.env.NOTION_NEURAL_FLOW_PAGE_ID ?? "";

type NotionRichText = {
  plain_text: string;
};

type NotionTitleProperty = {
  id: string;
  type: "title";
  title: NotionRichText[];
};

type NotionRichTextProperty = {
  id: string;
  type: "rich_text";
  rich_text: NotionRichText[];
};

type NotionNumberProperty = {
  id: string;
  type: "number";
  number: number | null;
};

type NotionSelectValue = {
  id: string;
  name: string;
  color?: string;
};

type NotionSelectProperty = {
  id: string;
  type: "select";
  select: NotionSelectValue | null;
};

type NotionStatusProperty = {
  id: string;
  type: "status";
  status: NotionSelectValue | null;
};

type NotionUrlProperty = {
  id: string;
  type: "url";
  url: string | null;
};

type NotionRelationProperty = {
  id: string;
  type: "relation";
  relation: Array<{ id: string }>;
};

type NotionPropertyValue =
  | NotionTitleProperty
  | NotionRichTextProperty
  | NotionNumberProperty
  | NotionSelectProperty
  | NotionStatusProperty
  | NotionUrlProperty
  | NotionRelationProperty
  | { id: string; type: string; [key: string]: unknown };

type NotionPage = {
  id: string;
  url?: string;
  properties: Record<string, NotionPropertyValue>;
};

type NotionQueryResponse = {
  results: NotionPage[];
};

type NotionBlock = {
  id: string;
  type: string;
  [key: string]: any;
};

type NotionBlockListResponse = {
  results: NotionBlock[];
};

const FALLBACK_PROJECTS: NotionProject[] = [
  {
    notionId: "mock-project-1",
    name: "Command Center Kickoff",
    status: "In Progress",
    points: 8,
    url: "https://www.notion.so/mock-project-1",
  },
  {
    notionId: "mock-project-2",
    name: "Neural Flow Research",
    status: "Backlog",
    points: 5,
    url: "https://www.notion.so/mock-project-2",
  },
];

const FALLBACK_DOC: NotionDoc = {
  notionId: "mock-doc-1",
  projectName: "Neural Flow",
  title: "Neural Flow Overview",
  content:
    "This is placeholder content for the Neural Flow page. Configure NOTION_API_KEY and page IDs to load real data.",
  url: "https://www.notion.so/mock-doc-1",
};

const warnedContexts = new Set<string>();

const warnOnce = (context: string, message: string) => {
  if (warnedContexts.has(context)) return;
  warnedContexts.add(context);
  console.warn(message);
};

const getPlainText = (richText?: NotionRichText[]): string => {
  if (!richText?.length) return "";
  return richText.map(chunk => chunk.plain_text).join("").trim();
};

const pickProperty = (properties: Record<string, NotionPropertyValue>, keys: string[]): NotionPropertyValue | undefined => {
  for (const key of keys) {
    const value = properties[key];
    if (value) return value;
  }
  return undefined;
};

const getTextValue = (property?: NotionPropertyValue): string | undefined => {
  if (!property) return undefined;

  if (property.type === "title") return getPlainText(property.title);
  if (property.type === "rich_text") return getPlainText(property.rich_text);
  if (property.type === "select" && property.select) return property.select.name;
  if (property.type === "status" && property.status) return property.status.name;
  if (property.type === "url") return property.url ?? undefined;

  return undefined;
};

const getNumberValue = (property?: NotionPropertyValue): number | undefined => {
  if (!property || property.type !== "number") return undefined;
  return typeof property.number === "number" ? property.number : undefined;
};

const mapNotionPageToProject = (page: NotionPage): NotionProject | null => {
  const nameProp = pickProperty(page.properties, ["Name", "Project", "Title"]);
  const statusProp = pickProperty(page.properties, ["Status", "Stage", "State"]);
  const pointsProp = pickProperty(page.properties, ["Points", "Estimate"]);
  const urlProp = pickProperty(page.properties, ["URL", "Link"]);

  const name = getTextValue(nameProp);
  if (!name) return null;

  const project: NotionProject = {
    notionId: page.id,
    name,
  };

  const status = getTextValue(statusProp);
  if (status) project.status = status;

  const points = getNumberValue(pointsProp);
  if (typeof points === "number") project.points = points;

  const url = getTextValue(urlProp) ?? page.url;
  if (url) project.url = url;

  return project;
};

const blockToPlainText = (block: NotionBlock): string | undefined => {
  const payload = block[block.type];
  if (!payload) return undefined;

  const richText: NotionRichText[] = payload.rich_text ?? payload.title ?? [];
  const text = getPlainText(richText);

  if (!text) return undefined;

  if (block.type === "heading_1") return `# ${text}`;
  if (block.type === "heading_2") return `## ${text}`;
  if (block.type === "heading_3") return `### ${text}`;
  if (block.type === "bulleted_list_item") return `• ${text}`;
  if (block.type === "numbered_list_item") return `1. ${text}`;

  return text;
};

const mapNotionPageToDoc = (page: NotionPage, blocks: NotionBlock[]): NotionDoc => {
  const titleProp = pickProperty(page.properties, ["Name", "Title"]);
  const projectProp = pickProperty(page.properties, ["Project", "Command Center Link"]);

  const title = getTextValue(titleProp) ?? "Untitled Notion Doc";
  const projectName = getTextValue(projectProp);

  const content = blocks
    .map(blockToPlainText)
    .filter((text): text is string => Boolean(text))
    .join("\n\n");

  return {
    notionId: page.id,
    title,
    content,
    projectName,
    url: page.url,
  };
};

const notionFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  if (!NOTION_API_KEY) {
    throw new Error("NOTION_API_KEY is not configured");
  }

  const response = await fetch(`${NOTION_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new Error(`Notion API error (${response.status}): ${errorPayload}`);
  }

  return (await response.json()) as T;
};

export const fetchCommandCenterEntries = async (): Promise<NotionProject[]> => {
  if (!NOTION_API_KEY || !COMMAND_CENTER_DB_ID) {
    warnOnce(
      "command-center",
      "[Notion] NOTION_API_KEY or NOTION_COMMAND_CENTER_DB_ID missing. Falling back to mock Command Center data.",
    );
    return FALLBACK_PROJECTS;
  }

  try {
    const res = await notionFetch<NotionQueryResponse>(`/databases/${COMMAND_CENTER_DB_ID}/query`, {
      method: "POST",
      body: JSON.stringify({ page_size: 100 }),
    });

    const projects = res.results
      .map(mapNotionPageToProject)
      .filter((project): project is NotionProject => Boolean(project));

    return projects.length ? projects : FALLBACK_PROJECTS;
  } catch (error) {
    console.error("[Notion] Failed to fetch Command Center entries", error);
    return FALLBACK_PROJECTS;
  }
};

export const fetchNeuralFlowPage = async (): Promise<NotionDoc> => {
  if (!NOTION_API_KEY || !NEURAL_FLOW_PAGE_ID) {
    warnOnce(
      "neural-flow",
      "[Notion] NOTION_API_KEY or NOTION_NEURAL_FLOW_PAGE_ID missing. Returning mock Neural Flow document.",
    );
    return FALLBACK_DOC;
  }

  try {
    const [page, blocks] = await Promise.all([
      notionFetch<NotionPage>(`/pages/${NEURAL_FLOW_PAGE_ID}`),
      notionFetch<NotionBlockListResponse>(`/blocks/${NEURAL_FLOW_PAGE_ID}/children?page_size=100`),
    ]);

    return mapNotionPageToDoc(page, blocks.results);
  } catch (error) {
    console.error("[Notion] Failed to fetch Neural Flow page", error);
    return FALLBACK_DOC;
  }
};
