import { NextRequest, NextResponse } from "next/server";
import { initialPosts } from "@/lib/mockData";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspace");

  let filteredPosts = initialPosts;
  if (workspaceId) {
    filteredPosts = initialPosts.filter((p) => p.workspace_id === workspaceId);
  }

  return NextResponse.json({
    success: true,
    data: filteredPosts,
  });
}
