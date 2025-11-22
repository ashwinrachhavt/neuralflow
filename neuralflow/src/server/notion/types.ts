export type NotionProject = {
  notionId: string;
  name: string;
  status?: string;
  points?: number;
  url?: string;
};

export type NotionDoc = {
  notionId: string;
  projectName?: string;
  title: string;
  content: string;
  url?: string;
};

export type NotionProjectSummary = {
  projects: NotionProject[];
  count: number;
};
