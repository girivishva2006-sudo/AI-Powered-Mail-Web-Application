import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const emailCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 30000;

function getCachedData(key: string) {
  const cached = emailCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: unknown) {
  emailCache.set(key, { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder") || "inbox";
    const query = searchParams.get("q");
    const maxResults = parseInt(searchParams.get("maxResults") || "20");

    const cacheKey = `${folder}-${query}-${maxResults}-${session.user?.email}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const folderMap: Record<string, string> = {
      inbox: "in:inbox",
      sent: "in:sent",
      starred: "is:starred",
      drafts: "in:draft",
      trash: "in:trash",
    };

    let gmailQuery = folderMap[folder] || "in:inbox";
    if (query) {
      gmailQuery = `${gmailQuery} ${query}`;
    }

    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(gmailQuery)}&maxResults=${maxResults}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    if (!listResponse.ok) {
      console.error("Gmail list error:", await listResponse.text());
      return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
    }

    const listData = await listResponse.json();

    if (!listData.messages || listData.messages.length === 0) {
      const result = { messages: [], nextPageToken: listData.nextPageToken };
      setCachedData(cacheKey, result);
      return NextResponse.json(result);
    }

    const emailPromises = listData.messages.slice(0, maxResults).map(async (msg: { id: string }) => {
      try {
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );

        if (!msgResponse.ok) return null;

        const msgData = await msgResponse.json();
        const headers = msgData.payload?.headers || [];

        const getHeader = (name: string) =>
          headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

        const fromMatch = getHeader("From").match(/"?([^"<]*)"?\s*<?([^>]*@[^>]*)>?/);
        const from = fromMatch
          ? { name: fromMatch[1].trim(), email: fromMatch[2].trim() }
          : { name: getHeader("From"), email: getHeader("From") };

        return {
          id: msgData.id,
          threadId: msgData.threadId,
          subject: getHeader("Subject") || "(No Subject)",
          from,
          to: [{ name: "Me", email: session.user?.email || "" }],
          snippet: msgData.snippet || "",
          body: "",
          date: getHeader("Date"),
          isRead: !msgData.labelIds?.includes("UNREAD"),
          isStarred: msgData.labelIds?.includes("STARRED") || false,
          labels: msgData.labelIds || [],
        };
      } catch {
        return null;
      }
    });

    const emails = await Promise.all(emailPromises);
    const result = {
      messages: emails.filter(Boolean),
      nextPageToken: listData.nextPageToken,
    };

    setCachedData(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Gmail API error:", error);
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
  }
}
