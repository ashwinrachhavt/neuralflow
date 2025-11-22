import { NextResponse } from "next/server";

import { fetchCommandCenterEntries } from "@/server/notion/notionClient";

export async function GET() {
  try {
    const projects = await fetchCommandCenterEntries();
    return NextResponse.json({ projects, count: projects.length });
  } catch (error) {
    console.error("[api/debug/notion-summary]", error);
    return NextResponse.json({ message: "Failed to load Notion summary" }, { status: 500 });
  }
}
