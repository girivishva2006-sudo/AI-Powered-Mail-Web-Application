import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

async function fetchEmails(accessToken: string, query: string, maxResults: number = 20) {
  try {
    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!listResponse.ok) return [];

    const listData = await listResponse.json();
    if (!listData.messages) return [];

    const emailPromises = listData.messages.slice(0, 15).map(async (msg: { id: string }) => {
      try {
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!msgResponse.ok) return null;
        const msgData = await msgResponse.json();
        const headers = msgData.payload?.headers || [];

        const getHeader = (name: string) =>
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

        const fromMatch = getHeader("From").match(/"?([^"<]*)"?\s*<?([^>]*@[^>]*)>?/);
        const from = fromMatch
          ? { name: fromMatch[1].trim(), email: fromMatch[2].trim() }
          : { name: getHeader("From"), email: getHeader("From") };

        return {
          id: msgData.id,
          subject: getHeader("Subject") || "(No Subject)",
          from,
          snippet: msgData.snippet || "",
          date: getHeader("Date"),
          isRead: !msgData.labelIds?.includes("UNREAD"),
          isStarred: msgData.labelIds?.includes("STARRED") || false,
        };
      } catch {
        return null;
      }
    });

    return (await Promise.all(emailPromises)).filter(Boolean);
  } catch {
    return [];
  }
}

function formatEmailList(emails: any[], title: string): string {
  if (emails.length === 0) return `No emails found.`;

  const list = emails.slice(0, 8).map((e, i) =>
    `${i + 1}. **${e.from.name || e.from.email}** - ${e.subject}\n   ${e.snippet?.substring(0, 60) || ""}... ${e.isRead ? "" : "(unread)"}`
  ).join("\n\n");

  return `**${title}** (${emails.length} emails)\n\n${list}`;
}

function getDateRange(message: string): { from?: string; to?: string } {
  const lower = message.toLowerCase();
  const now = new Date();

  if (lower.includes("today")) {
    return { from: new Date(now.setHours(0, 0, 0, 0)).toISOString() };
  }
  if (lower.includes("yesterday")) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return { from: yesterday.toISOString() };
  }
  if (lower.includes("this week")) {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return { from: weekAgo.toISOString() };
  }
  if (lower.includes("last week")) {
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return { from: twoWeeksAgo.toISOString(), to: weekAgo.toISOString() };
  }
  if (lower.includes("this month")) {
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);
    return { from: monthAgo.toISOString() };
  }

  const daysMatch = message.match(/(\d+)\s*(?:days?|d)/i);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    const dateFrom = new Date(now);
    dateFrom.setDate(dateFrom.getDate() - days);
    return { from: dateFrom.toISOString() };
  }

  return {};
}

function processUserMessage(message: string, emails: any[], context: any) {
  const lower = message.toLowerCase();
  let responseMessage = "";
  let toolCalls: any[] = [];
  let stateChanges: any[] = [];

  // Time-based queries
  const dateRange = getDateRange(message);
  const hasTimeQuery = lower.includes("today") || lower.includes("yesterday") ||
    lower.includes("week") || lower.includes("month") || /\d+\s*days?/i.test(lower);

  // Unread emails
  if (lower.includes("unread") || lower.includes("new") || lower.includes("read")) {
    const unreadEmails = emails.filter((e: any) => !e.isRead);
    toolCalls = [{ id: "tc-1", name: "search_emails", args: { unreadOnly: true }, result: unreadEmails, status: "completed" }];
    stateChanges = [{ type: "SET_FILTERS", payload: { unreadOnly: true } }];
    responseMessage = formatEmailList(unreadEmails, "Unread Emails");
  }
  // Search by sender
  else if (lower.includes("from")) {
    const senderMatch = message.match(/from\s+([a-zA-Z0-9\s]+)/i);
    if (senderMatch) {
      const sender = senderMatch[1].trim().toLowerCase();
      const filtered = emails.filter(
        (e: any) => e.from.name.toLowerCase().includes(sender) || e.from.email.toLowerCase().includes(sender)
      );
      toolCalls = [{ id: "tc-1", name: "search_emails", args: { sender }, result: filtered, status: "completed" }];
      responseMessage = formatEmailList(filtered, `Emails from ${senderMatch[1].trim()}`);
    }
  }
  // Search by subject/keyword
  else if (lower.includes("search") || lower.includes("find") || lower.includes("about") || lower.includes("containing")) {
    const queryMatch = message.match(/(?:search|find|about|containing)\s+(.+)/i);
    if (queryMatch) {
      const query = queryMatch[1].replace(/["']/g, "").trim();
      const filtered = emails.filter(
        (e: any) => e.subject.toLowerCase().includes(query.toLowerCase()) ||
                   e.snippet?.toLowerCase().includes(query.toLowerCase()) ||
                   e.from.name.toLowerCase().includes(query.toLowerCase())
      );
      toolCalls = [{ id: "tc-1", name: "search_emails", args: { query }, result: filtered, status: "completed" }];
      responseMessage = formatEmailList(filtered, `Search Results for "${query}"`);
    }
  }
  // Starred emails
  else if (lower.includes("starred") || lower.includes("important") || lower.includes("flagged")) {
    const starred = emails.filter((e: any) => e.isStarred);
    toolCalls = [{ id: "tc-1", name: "navigate_to_view", args: { view: "starred" }, result: null, status: "completed" }];
    stateChanges = [{ type: "SET_VIEW", payload: "starred" }];
    responseMessage = formatEmailList(starred, "Starred Emails");
  }
  // Time-based with other filters
  else if (hasTimeQuery) {
    let filtered = emails;
    if (dateRange.from) {
      const fromDate = new Date(dateRange.from);
      filtered = filtered.filter((e: any) => new Date(e.date) >= fromDate);
    }
    toolCalls = [{ id: "tc-1", name: "search_emails", args: { dateFrom: dateRange.from }, result: filtered, status: "completed" }];
    responseMessage = formatEmailList(filtered, "Emails");
  }
  // Show all emails
  else if (lower.includes("show") || lower.includes("list") || lower.includes("all") || lower.includes("emails") || lower.includes("inbox")) {
    toolCalls = [{ id: "tc-1", name: "get_current_view", args: {}, result: { emails }, status: "completed" }];
    responseMessage = formatEmailList(emails, "Your Inbox");
  }
  // Compose / send email
  else if (lower.includes("send") || lower.includes("compose") || lower.includes("write") || lower.includes("email to")) {
    const toMatch = message.match(/(?:to|email|send)\s+([a-zA-Z0-9@._-]+)/i);
    const subjectMatch = message.match(/subject\s+(.+?)(?:\s+and|\s+with|\s+saying|\s*$)/i);
    const bodyMatch = message.match(/(?:say|body|content|and say|saying)\s+(.+)/i);

    const to = toMatch?.[1] || "";
    const subject = subjectMatch?.[1] || "";
    const body = bodyMatch?.[1] || "";

    toolCalls = [{ id: "tc-1", name: "open_compose", args: { to, subject, body }, result: null, status: "completed" }];
    stateChanges = [
      { type: "SET_VIEW", payload: "compose" },
      { type: "UPDATE_COMPOSE", payload: { to, subject, body } },
    ];

    let msg = "Opening compose form";
    if (to) msg += ` for ${to}`;
    if (subject) msg += ` with subject "${subject}"`;
    if (body) msg += ` saying "${body}"`;
    responseMessage = msg + ".";
  }
  // Reply
  else if (lower.includes("reply")) {
    const bodyMatch = message.match(/(?:saying|say|reply|respond)\s+(.+)/i);
    toolCalls = [{ id: "tc-1", name: "open_reply", args: {}, result: null, status: "completed" }];
    stateChanges = [
      { type: "SET_VIEW", payload: "compose" },
      { type: "UPDATE_COMPOSE", payload: { body: bodyMatch?.[1] || "" } },
    ];
    responseMessage = bodyMatch ? `Opening reply with: "${bodyMatch[1]}"` : "Opening reply form.";
  }
  // Navigate
  else if (lower.includes("go to") || lower.includes("open") || lower.includes("show")) {
    if (lower.includes("sent")) {
      toolCalls = [{ id: "tc-1", name: "navigate_to_view", args: { view: "sent" }, result: null, status: "completed" }];
      stateChanges = [{ type: "SET_VIEW", payload: "sent" }];
      responseMessage = "Navigating to sent folder.";
    } else if (lower.includes("draft")) {
      toolCalls = [{ id: "tc-1", name: "navigate_to_view", args: { view: "drafts" }, result: null, status: "completed" }];
      stateChanges = [{ type: "SET_VIEW", payload: "drafts" }];
      responseMessage = "Navigating to drafts.";
    } else if (lower.includes("trash")) {
      toolCalls = [{ id: "tc-1", name: "navigate_to_view", args: { view: "trash" }, result: null, status: "completed" }];
      stateChanges = [{ type: "SET_VIEW", payload: "trash" }];
      responseMessage = "Navigating to trash.";
    } else {
      // Try to open a specific email
      const emailMatch = emails.find(
        (e: any) =>
          lower.includes(e.from.name.toLowerCase().split(" ")[0]) ||
          lower.includes(e.subject.toLowerCase().split(" ")[0])
      );
      if (emailMatch) {
        toolCalls = [{ id: "tc-1", name: "open_email", args: { emailId: emailMatch.id }, result: emailMatch, status: "completed" }];
        stateChanges = [{ type: "OPEN_EMAIL", payload: emailMatch.id }];
        responseMessage = `Opening email: "${emailMatch.subject}" from ${emailMatch.from.name || emailMatch.from.email}`;
      } else {
        toolCalls = [{ id: "tc-1", name: "navigate_to_view", args: { view: "inbox" }, result: null, status: "completed" }];
        stateChanges = [{ type: "SET_VIEW", payload: "inbox" }];
        responseMessage = "Going to inbox.";
      }
    }
  }
  // Help / default
  else {
    responseMessage = "**Here's what I can do:**\n\n" +
      "**Search & Filter:**\n" +
      "• \"Show me emails\" - View all emails\n" +
      "• \"Show unread emails\" - See unread only\n" +
      "• \"Find emails from Sarah\" - Search by sender\n" +
      "• \"Search about project\" - Search by keyword\n" +
      "• \"Show emails from this week\" - Time filter\n\n" +
      "**Open & Read:**\n" +
      "• \"Open email from David\" - Open specific email\n" +
      "• \"Go to sent\" - Navigate to folders\n\n" +
      "**Compose & Send:**\n" +
      "• \"Send email to john@example.com\" - Compose\n" +
      "• \"Send email with subject Meeting\" - With subject\n" +
      "• \"Reply saying I'll be there\" - Quick reply\n\n" +
      "**Other:**\n" +
      "• \"Show starred emails\" - Important emails";
  }

  return { message: responseMessage, toolCalls, stateChanges };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { message, context } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const emails = await fetchEmails(session.accessToken, "in:inbox", 20);
    const result = processUserMessage(message, emails, context);

    return NextResponse.json({
      message: result.message,
      toolCalls: result.toolCalls,
      stateChanges: result.stateChanges,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
