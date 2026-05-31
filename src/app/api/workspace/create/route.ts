import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Workspace name is required" },
        { status: 400 }
      );
    }

    const createdWorkspace = {
      id: `ws-${Math.random().toString(36).substring(2, 9)}`,
      name: name.trim(),
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: createdWorkspace,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body payload" },
      { status: 500 }
    );
  }
}
