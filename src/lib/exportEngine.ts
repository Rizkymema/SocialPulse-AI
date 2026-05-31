import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ExportDataset } from "./exportTypes";

// Add declaration for autoTable extension on jsPDF (v5 standalone API)

/**
 * Clean characters to prevent CSV breaks
 */
const escapeCSV = (val: unknown) => {
  if (val === null || val === undefined) return "";
  let stringVal = String(val);
  // replace double quotes with pair of double quotes
  stringVal = stringVal.replace(/"/g, '""');
  // wrap in quotes if has comma, quote, or newline
  if (stringVal.search(/("|,|\n)/g) >= 0) {
    stringVal = `"${stringVal}"`;
  }
  return stringVal;
};

/**
 * 1. CSV EXPORT
 */
export const exportToCSV = (
  dataset: ExportDataset,
  filename: string = "social_pulse_data.csv"
) => {
  const headers = [
    "Post ID",
    "Platform",
    "Username",
    "Post URL",
    "Post Content",
    "Post Likes",
    "Post Comments",
    "Post Shares",
    "Post Views",
    "Post Timestamp",
    "Post Sentiment",
    "Positive Comments",
    "Neutral Comments",
    "Negative Comments",
    "Comment ID",
    "Comment Author",
    "Comment Text",
    "Comment Likes",
    "Comment Timestamp",
    "Comment Parent",
    "Comment Sentiment",
  ];

  const commentsByPost = dataset.comments.reduce((map, comment) => {
    const comments = map.get(comment.postId) ?? [];
    comments.push(comment);
    map.set(comment.postId, comments);
    return map;
  }, new Map<string, typeof dataset.comments>());

  const rows = dataset.posts.flatMap((post) => {
    const comments = commentsByPost.get(post.id) ?? [];
    const postColumns = [
      post.id,
      post.platform.toUpperCase(),
      post.username,
      post.url,
      post.content,
      post.likes,
      post.comments,
      post.shares,
      post.views,
      post.timestamp,
      post.sentiment.toUpperCase(),
      post.commentSentiments.positive,
      post.commentSentiments.neutral,
      post.commentSentiments.negative,
    ];

    if (comments.length === 0) {
      return [[...postColumns, "", "", "", "", "", "", ""]];
    }

    return comments.map((comment) => [
      ...postColumns,
      comment.id,
      comment.author,
      comment.content,
      comment.likes,
      comment.timestamp,
      comment.parent,
      comment.sentiment.toUpperCase(),
    ]);
  });

  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 2. EXCEL EXPORT (Multi-sheet)
 */
export const exportToExcel = (
  dataset: ExportDataset,
  workspaceName: string,
  filename: string = "social_pulse_data.xlsx"
) => {
  const wb = XLSX.utils.book_new();
  const posts = dataset.posts;
  const comments = dataset.comments;

  // --- Sheet 1: Summary Stats ---
  const totalPosts = posts.length;
  const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
  const totalComments = posts.reduce((sum, p) => sum + p.comments, 0);
  const totalShares = posts.reduce((sum, p) => sum + p.shares, 0);
  const totalViews = posts.reduce((sum, p) => sum + p.views, 0);
  const exportedComments = comments.length;
  const totalEngagement = totalLikes + totalComments + totalShares;

  const platformCounts = posts.reduce((acc, p) => {
    acc[p.platform] = (acc[p.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sentimentCounts = posts.reduce((acc, p) => {
    acc[p.sentiment] = (acc[p.sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const commentSentimentCounts = comments.reduce((acc, comment) => {
    acc[comment.sentiment] = (acc[comment.sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const summaryData = [
    ["Workspace Name", workspaceName],
    ["Export Date", new Date().toLocaleString()],
    [],
    ["METRIC OVERVIEW", "VALUE"],
    ["Total Collected Posts", totalPosts],
    ["Total Likes", totalLikes],
    ["Total Comments", totalComments],
    ["Total Exported Comment Rows", exportedComments],
    ["Total Shares", totalShares],
    ["Total Views", totalViews],
    ["Total Engagement Score", totalEngagement],
    [],
    ["PLATFORM DISTRIBUTION", "POST COUNT"],
    ["Instagram", platformCounts.instagram || 0],
    ["TikTok", platformCounts.tiktok || 0],
    ["Facebook", platformCounts.facebook || 0],
    ["YouTube", platformCounts.youtube || 0],
    [],
    ["SENTIMENT DISTRIBUTION", "POST COUNT", "PERCENTAGE"],
    [
      "Positive", 
      sentimentCounts.positive || 0, 
      totalPosts ? `${Math.round(((sentimentCounts.positive || 0) / totalPosts) * 100)}%` : "0%"
    ],
    [
      "Neutral", 
      sentimentCounts.neutral || 0, 
      totalPosts ? `${Math.round(((sentimentCounts.neutral || 0) / totalPosts) * 100)}%` : "0%"
    ],
    [
      "Negative", 
      sentimentCounts.negative || 0, 
      totalPosts ? `${Math.round(((sentimentCounts.negative || 0) / totalPosts) * 100)}%` : "0%"
    ],
    [],
    ["COMMENT SENTIMENT DISTRIBUTION", "COMMENT COUNT", "PERCENTAGE"],
    [
      "Positive",
      commentSentimentCounts.positive || 0,
      exportedComments
        ? `${Math.round(((commentSentimentCounts.positive || 0) / exportedComments) * 100)}%`
        : "0%",
    ],
    [
      "Neutral",
      commentSentimentCounts.neutral || 0,
      exportedComments
        ? `${Math.round(((commentSentimentCounts.neutral || 0) / exportedComments) * 100)}%`
        : "0%",
    ],
    [
      "Negative",
      commentSentimentCounts.negative || 0,
      exportedComments
        ? `${Math.round(((commentSentimentCounts.negative || 0) / exportedComments) * 100)}%`
        : "0%",
    ],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Analytics Summary");

  // --- Sheet 2: Raw Posts ---
  const rawPostsData = posts.map((p) => ({
    ID: p.id,
    Platform: p.platform.toUpperCase(),
    Username: p.username,
    URL: p.url,
    Content: p.content,
    Likes: p.likes,
    Comments: p.comments,
    Shares: p.shares,
    Views: p.views,
    Engagement: p.likes + p.comments + p.shares,
    Timestamp: p.timestamp,
    Sentiment: p.sentiment.toUpperCase(),
    PositiveComments: p.commentSentiments.positive,
    NeutralComments: p.commentSentiments.neutral,
    NegativeComments: p.commentSentiments.negative,
  }));

  const wsPosts = XLSX.utils.json_to_sheet(rawPostsData);
  XLSX.utils.book_append_sheet(wb, wsPosts, "Collected Posts");

  const commentsData = comments.map((comment) => ({
    CommentID: comment.id,
    PostID: comment.postId,
    Platform: comment.postPlatform.toUpperCase(),
    Username: comment.postUsername,
    PostURL: comment.postUrl,
    PostTimestamp: comment.postTimestamp,
    Author: comment.author,
    Comment: comment.content,
    CommentLikes: comment.likes,
    CommentTimestamp: comment.timestamp,
    Parent: comment.parent,
    Sentiment: comment.sentiment.toUpperCase(),
  }));

  const wsComments = commentsData.length
    ? XLSX.utils.json_to_sheet(commentsData)
    : XLSX.utils.aoa_to_sheet([["No comments exported"]]);
  XLSX.utils.book_append_sheet(wb, wsComments, "Collected Comments");

  // Write and Save
  XLSX.writeFile(wb, filename);
};

/**
 * 3. PDF REPORT EXPORT (AI-styled premium document)
 */
export const exportToPDF = (
  dataset: ExportDataset,
  workspaceName: string,
  aiSummary: string,
  filename: string = "social_pulse_report.pdf"
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const posts = dataset.posts;
  const comments = dataset.comments;

  // Branding Primary Color: Deep Indigo HSL(240, 5%, 6%) => Hex #1f1f23, Indigo accent #6366f1
  const colorPrimary: [number, number, number] = [99, 102, 241]; // [R, G, B]
  const colorDark: [number, number, number] = [15, 15, 19];
  const colorMuted: [number, number, number] = [113, 113, 122];

  // --- 1. Header (Banner Style) ---
  doc.setFillColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.rect(0, 0, pageWidth, 45, "F");

  // App Logo/Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("SocialPulse AI", 15, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(161, 161, 170);
  doc.text("Social Media Intelligence & Sentiment Engine", 15, 26);

  // Report Label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setFillColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
  doc.rect(pageWidth - 65, 15, 50, 18, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.text("EXECUTIVE REPORT", pageWidth - 60, 22, { align: "left" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`DATE: ${new Date().toLocaleDateString()}`, pageWidth - 60, 28);

  // --- 2. Workspace & Date Info ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text(`Workspace Performance: ${workspaceName}`, 15, 58);

  doc.setDrawColor(228, 228, 231);
  doc.setLineWidth(0.5);
  doc.line(15, 62, pageWidth - 15, 62);

  // --- 3. Key Performance Indicators (Grid Cards) ---
  const totalPosts = posts.length;
  const totalExportedComments = comments.length;

  const posSentiment = comments.filter((comment) => comment.sentiment === "positive").length;
  const posPct = totalExportedComments
    ? Math.round((posSentiment / totalExportedComments) * 100)
    : 0;

  // Render KPI boxes
  const colW = (pageWidth - 40) / 3;
  
  // Card 1: Total Posts
  doc.setFillColor(244, 244, 245);
  doc.rect(15, 68, colW, 25, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
  doc.text("Collected Posts", 20, 75);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.text(totalPosts.toString(), 20, 86);

  // Card 2: Engagement Score
  doc.setFillColor(244, 244, 245);
  doc.rect(20 + colW, 68, colW, 25, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
  doc.text("Exported Comments", 25 + colW, 75);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
  doc.text(totalExportedComments.toLocaleString(), 25 + colW, 86);

  // Card 3: Positive Mentions
  doc.setFillColor(244, 244, 245);
  doc.rect(25 + colW * 2, 68, colW, 25, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
  doc.text("Positive Comments", 30 + colW * 2, 75);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(16, 185, 129); // Green
  doc.text(`${posPct}%`, 30 + colW * 2, 86);

  // --- 4. AI-Generated Summary Panel ---
  doc.setFillColor(240, 242, 254); // Light purple fill
  doc.rect(15, 102, pageWidth - 30, 38, "F");
  doc.setDrawColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
  doc.setLineWidth(1.5);
  doc.line(15, 102, 15, 140); // left accent border

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
  doc.text("🧠 AI COGNITIVE SUMMARY", 20, 108);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);

  // Split description text into wraps
  const textLines = doc.splitTextToSize(aiSummary, pageWidth - 40);
  doc.text(textLines, 20, 115);

  // --- 5. Data Table (Top Posts) ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.text("Latest Social Mentions Analysis", 15, 150);

  const tableHeaders = [["Username", "Platform", "Content", "Engagement", "Sentiment"]];
  const tableRows = posts.map((p) => [
    `@${p.username}`,
    p.platform.toUpperCase(),
    p.content.length > 55 ? `${p.content.substring(0, 52)}...` : p.content,
    (p.likes + p.comments + p.shares).toLocaleString(),
    p.sentiment.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: 154,
    head: tableHeaders,
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: colorDark, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 20 },
      2: { cellWidth: 85 },
      3: { cellWidth: 25, halign: "right" },
      4: { cellWidth: 25, halign: "center" },
    },
    styles: { fontSize: 8 },
  });

  let commentsStartY = ((doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 154) + 14;
  if (commentsStartY > 250) {
    doc.addPage();
    commentsStartY = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
  doc.text("Comments Appendix", 15, commentsStartY);

  if (comments.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
    doc.text("Tidak ada komentar yang tersedia untuk ikut diunduh.", 15, commentsStartY + 8);
  } else {
    autoTable(doc, {
      startY: commentsStartY + 4,
      head: [["Post", "Author", "Sentiment", "Likes", "Comment"]],
      body: comments.map((comment) => [
        `@${comment.postUsername}`,
        comment.author,
        comment.sentiment.toUpperCase(),
        comment.likes.toString(),
        comment.content,
      ]),
      theme: "grid",
      headStyles: { fillColor: colorPrimary, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 28 },
        2: { cellWidth: 22, halign: "center" },
        3: { cellWidth: 16, halign: "right" },
        4: { cellWidth: 88 },
      },
      styles: { fontSize: 7, cellPadding: 2 },
      margin: { left: 15, right: 15 },
    });
  }

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(colorMuted[0], colorMuted[1], colorMuted[2]);
    doc.text("SocialPulse AI platform reports are automatically compiled and validated.", 15, 285);
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - 30, 285);
  }

  // Save
  doc.save(filename);
};
