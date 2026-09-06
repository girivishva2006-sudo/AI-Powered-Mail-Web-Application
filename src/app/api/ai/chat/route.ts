/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

const mockEmails = [
  { id: "1", subject: "Project Update - Q4 Planning", from: { name: "Sarah Chen", email: "sarah.chen@company.com" }, snippet: "Hi team, I wanted to share the latest updates on the Q4 project planning...", isRead: false, isStarred: true, date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: "2", subject: "Re: Meeting Tomorrow", from: { name: "David Park", email: "david.park@company.com" }, snippet: "Sure, I'll be there at 3pm. Looking forward to it!", isRead: true, isStarred: false, date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: "3", subject: "Your Weekly Digest", from: { name: "Newsletter", email: "digest@company.com" }, snippet: "Here's your weekly summary of activity and updates...", isRead: true, isStarred: false, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "4", subject: "Invoice #1234 - Payment Due", from: { name: "Accounting", email: "accounting@company.com" }, snippet: "Please find attached the invoice for services rendered...", isRead: false, isStarred: false, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "5", subject: "Team Lunch Friday", from: { name: "Emily Wong", email: "emily.wong@company.com" }, snippet: "Hey! Are you free for team lunch this Friday at noon?", isRead: true, isStarred: true, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "6", subject: "Welcome to the Team!", from: { name: "HR Department", email: "hr@company.com" }, snippet: "We're excited to welcome you to the team...", isRead: true, isStarred: false, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "7", subject: "Conference Registration Confirmed", from: { name: "TechConf 2026", email: "noreply@techconf.com" }, snippet: "Your registration for TechConf 2026 has been confirmed...", isRead: true, isStarred: true, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "8", subject: "Security Alert: New Login Detected", from: { name: "Security Team", email: "security@company.com" }, snippet: "We detected a new login to your account from a new device...", isRead: false, isStarred: false, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
];

async function fetchRealEmails(accessToken: string, query: string, maxResults: number = 20) {
  try {
    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!listResponse.ok) return null;
    const listData = await listResponse.json();
    if (!listData.messages) return [];
    const emails = await Promise.all(
      listData.messages.slice(0, 15).map(async (msg: { id: string }) => {
        try {
          const msgResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (!msgResponse.ok) return null;
          const msgData = await msgResponse.json();
          const headers = msgData.payload?.headers || [];
          const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
          const fromMatch = getHeader("From").match(/"?([^"<]*)"?\s*<?([^>]*@[^>]*)>?/);
          const from = fromMatch ? { name: fromMatch[1].trim(), email: fromMatch[2].trim() } : { name: getHeader("From"), email: getHeader("From") };
          return { id: msgData.id, subject: getHeader("Subject") || "(No Subject)", from, snippet: msgData.snippet || "", date: getHeader("Date"), isRead: !msgData.labelIds?.includes("UNREAD"), isStarred: msgData.labelIds?.includes("STARRED") || false };
        } catch { return null; }
      })
    );
    return emails.filter(Boolean);
  } catch { return null; }
}

function formatEmailList(emails: any[], title: string): string {
  if (emails.length === 0) return "No emails found.";
  const list = emails.slice(0, 8).map((e, i) =>
    `${i + 1}. **${e.from.name || e.from.email}** - ${e.subject}\n   ${e.snippet?.substring(0, 60) || ""}... ${e.isRead ? "" : "(unread)"}`
  ).join("\n\n");
  return `**${title}** (${emails.length} emails)\n\n${list}`;
}

function processUserMessage(message: string, emails: any[]) {
  const lower = message.toLowerCase();
  let responseMessage = "";
  let toolCalls: any[] = [];
  let stateChanges: any[] = [];

  if (lower.includes("unread") || lower.includes("new")) {
    const unreadEmails = emails.filter((e: any) => !e.isRead);
    toolCalls = [{ id: "tc-1", name: "search_emails", args: { unreadOnly: true }, result: unreadEmails, status: "completed" }];
    stateChanges = [{ type: "SET_FILTERS", payload: { unreadOnly: true } }];
    responseMessage = formatEmailList(unreadEmails, "Unread Emails");
  } else if (lower.includes("from")) {
    const senderMatch = message.match(/from\s+([a-zA-Z0-9\s]+)/i);
    if (senderMatch) {
      const sender = senderMatch[1].trim().toLowerCase();
      const filtered = emails.filter((e: any) => e.from.name.toLowerCase().includes(sender) || e.from.email.toLowerCase().includes(sender));
      toolCalls = [{ id: "tc-1", name: "search_emails", args: { sender }, result: filtered, status: "completed" }];
      responseMessage = formatEmailList(filtered, `Emails from ${senderMatch[1].trim()}`);
    }
  } else if (lower.includes("search") || lower.includes("find") || lower.includes("about")) {
    const queryMatch = message.match(/(?:search|find|about)\s+(.+)/i);
    if (queryMatch) {
      const query = queryMatch[1].replace(/["']/g, "").trim();
      const filtered = emails.filter((e: any) => e.subject.toLowerCase().includes(query.toLowerCase()) || e.snippet?.toLowerCase().includes(query.toLowerCase()));
      toolCalls = [{ id: "tc-1", name: "search_emails", args: { query }, result: filtered, status: "completed" }];
      responseMessage = formatEmailList(filtered, `Search Results for "${query}"`);
    }
  } else if (lower.includes("starred") || lower.includes("important")) {
    const starred = emails.filter((e: any) => e.isStarred);
    toolCalls = [{ id: "tc-1", name: "navigate_to_view", args: { view: "starred" }, result: null, status: "completed" }];
    stateChanges = [{ type: "SET_VIEW", payload: "starred" }];
    responseMessage = formatEmailList(starred, "Starred Emails");
  } else if (lower.includes("show") || lower.includes("list") || lower.includes("all") || lower.includes("emails") || lower.includes("inbox")) {
    toolCalls = [{ id: "tc-1", name: "get_current_view", args: {}, result: { emails }, status: "completed" }];
    responseMessage = formatEmailList(emails, "Your Inbox");
  } else if (lower.includes("send") || lower.includes("compose") || lower.includes("write")) {
    const toMatch = message.match(/(?:to|email|send)\s+([a-zA-Z0-9@._-]+)/i);
    const subjectMatch = message.match(/subject\s+(.+?)(?:\s+and|\s+with|\s+saying|\s*$)/i);
    const bodyMatch = message.match(/(?:say|body|content|and say|saying)\s+(.+)/i);
    toolCalls = [{ id: "tc-1", name: "open_compose", args: { to: toMatch?.[1] || "", subject: subjectMatch?.[1] || "", body: bodyMatch?.[1] || "" }, result: null, status: "completed" }];
    stateChanges = [{ type: "SET_VIEW", payload: "compose" }, { type: "UPDATE_COMPOSE", payload: { to: toMatch?.[1] || "", subject: subjectMatch?.[1] || "", body: bodyMatch?.[1] || "" } }];
    responseMessage = `Opening compose form${toMatch?.[1] ? ` for ${toMatch[1]}` : ""}.`;
  } else if (lower.includes("reply")) {
    const bodyMatch = message.match(/(?:saying|say|reply)\s+(.+)/i);
    toolCalls = [{ id: "tc-1", name: "open_reply", args: {}, result: null, status: "completed" }];
    stateChanges = [{ type: "SET_VIEW", payload: "compose" }, { type: "UPDATE_COMPOSE", payload: { body: bodyMatch?.[1] || "" } }];
    responseMessage = "Opening reply form.";
  } else if (lower.includes("go to") || lower.includes("open")) {
    if (lower.includes("sent")) {
      toolCalls = [{ id: "tc-1", name: "navigate_to_view", args: { view: "sent" }, result: null, status: "completed" }];
      stateChanges = [{ type: "SET_VIEW", payload: "sent" }];
      responseMessage = "Navigating to sent folder.";
    } else if (lower.includes("draft")) {
      toolCalls = [{ id: "tc-1", name: "navigate_to_view", args: { view: "drafts" }, result: null, status: "completed" }];
      stateChanges = [{ type: "SET_VIEW", payload: "drafts" }];
      responseMessage = "Navigating to drafts.";
    } else {
      const emailMatch = emails.find((e: any) => lower.includes(e.from.name.toLowerCase().split(" ")[0]) || lower.includes(e.subject.toLowerCase().split(" ")[0]));
      if (emailMatch) {
        toolCalls = [{ id: "tc-1", name: "open_email", args: { emailId: emailMatch.id }, result: emailMatch, status: "completed" }];
        stateChanges = [{ type: "OPEN_EMAIL", payload: emailMatch.id }];
        responseMessage = `Opening email: "${emailMatch.subject}" from ${emailMatch.from.name}`;
      } else {
        toolCalls = [{ id: "tc-1", name: "navigate_to_view", args: { view: "inbox" }, result: null, status: "completed" }];
        stateChanges = [{ type: "SET_VIEW", payload: "inbox" }];
        responseMessage = "Going to inbox.";
      }
    }
  } else {
    responseMessage = "**Here's what I can do:**\n\n" +
      "**Search & Filter:**\n" +
      "• \"Show me emails\" - View all emails\n" +
      "• \"Show unread emails\" - See unread only\n" +
      "• \"Find emails from Sarah\" - Search by sender\n" +
      "• \"Search about project\" - Search by keyword\n\n" +
      "**Open & Read:**\n" +
      "• \"Open email from David\" - Open specific email\n" +
      "• \"Go to sent\" - Navigate to folders\n\n" +
      "**Compose & Send:**\n" +
      "• \"Send email to john@example.com\" - Compose\n" +
      "• \"Reply saying I'll be there\" - Quick reply";
  }

  return { message: responseMessage, toolCalls, stateChanges };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    let emails = mockEmails;

    try {
      const { getServerSession } = await import("next-auth");
      const { authOptions } = await import("@/lib/auth/config");
      const session = await getServerSession(authOptions);

      if (session?.accessToken) {
        const realEmails = await fetchRealEmails(session.accessToken, "in:inbox", 20);
        if (realEmails !== null) {
          emails = realEmails;
        }
      }
    } catch {
      console.log("Using demo mode - no session");
    }

    const result = processUserMessage(message, emails);

    return NextResponse.json({
      message: result.message,
      toolCalls: result.toolCalls,
      stateChanges: result.stateChanges,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}
