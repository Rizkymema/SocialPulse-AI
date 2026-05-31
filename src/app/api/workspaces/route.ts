import { NextResponse } from "next/server";
import { initialWorkspaces } from "@/lib/mockData";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: initialWorkspaces,
  });
}
