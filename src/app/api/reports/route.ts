import { NextResponse } from "next/server";

export async function GET() {
  const mockReports = [
    {
      id: "rep-1",
      name: "Q2 Social Sentiment Summary",
      type: "PDF",
      date: "2026-05-28T14:30:00Z",
      status: "completed",
      workspaceName: "SocialPulse AI (Global)",
      downloads: 12,
    },
    {
      id: "rep-2",
      name: "Acme Retail Competitor Analytics",
      type: "Excel",
      date: "2026-05-25T10:15:00Z",
      status: "completed",
      workspaceName: "Acme Corp (Retail)",
      downloads: 5,
    },
  ];

  return NextResponse.json({
    success: true,
    data: mockReports,
  });
}
