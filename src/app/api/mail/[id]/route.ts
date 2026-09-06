import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

function decodeBase64Url(data: string): string {
  return Buffer.from(data, "base64url").toString("utf-8");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    const msgResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    if (!msgResponse.ok) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const msgData = await msgResponse.json();
    const headers = msgData.payload?.headers || [];

    const getHeader = (name: string) =>
      headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

    const fromMatch = getHeader("From").match(/"?([^"<]*)"?\s*<?([^>]*@[^>]*)>?/);
    const from = fromMatch
      ? { name: fromMatch[1].trim(), email: fromMatch[2].trim() }
      : { name: getHeader("From"), email: getHeader("From") };

    let body = "";
    let bodyHtml = "";

    function extractParts(part: any) {
      if (!part) return;
      if (part.mimeType === "text/plain" && part.body?.data) {
        body = decodeBase64Url(part.body.data);
      }
      if (part.mimeType === "text/html" && part.body?.data) {
        bodyHtml = decodeBase64Url(part.body.data);
      }
      if (part.parts) {
        part.parts.forEach(extractParts);
      }
    }

    extractParts(msgData.payload);

    return NextResponse.json({
      id: msgData.id,
      threadId: msgData.threadId,
      subject: getHeader("Subject") || "(No Subject)",
      from,
      to: [{ name: "Me", email: session.user?.email || "" }],
      snippet: msgData.snippet || "",
      body,
      bodyHtml,
      date: getHeader("Date"),
      isRead: !msgData.labelIds?.includes("UNREAD"),
      isStarred: msgData.labelIds?.includes("STARRED") || false,
      labels: msgData.labelIds || [],
    });
  } catch (error) {
    console.error("Gmail API error:", error);
    return NextResponse.json({ error: "Failed to fetch email" }, { status: 500 });
  }
}
