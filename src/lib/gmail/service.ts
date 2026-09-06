import { EmailMessage, EmailAddress, EmailAttachment, MailFolder } from "@/types/mail";
import { GmailAPI } from "./client";

export interface MailProvider {
  listMessages(folder: MailFolder, maxResults?: number): Promise<{ messages: EmailMessage[]; nextPageToken?: string }>;
  getMessage(messageId: string): Promise<EmailMessage>;
  searchMessages(query: string, maxResults?: number): Promise<EmailMessage[]>;
  sendMessage(to: string, subject: string, body: string, replyToId?: string): Promise<{ id: string; threadId: string }>;
  markAsRead(messageId: string): Promise<void>;
  markAsUnread(messageId: string): Promise<void>;
  starMessage(messageId: string): Promise<void>;
  unstarMessage(messageId: string): Promise<void>;
  trashMessage(messageId: string): Promise<void>;
  untrashMessage(messageId: string): Promise<void>;
}

function parseAddress(headerValue: string | undefined): EmailAddress[] {
  if (!headerValue) return [];
  return headerValue.split(",").map((addr) => {
    const match = addr.match(/"?([^"<]*)"?\s*<?([^>]*@[^>]*)>?/);
    if (match) {
      return { name: match[1].trim(), email: match[2].trim() };
    }
    return { name: "", email: addr.trim() };
  });
}

interface HeaderType {
  name?: string | null;
  value?: string | null;
}

function getHeaderValue(headers: HeaderType[] | undefined, name: string): string | undefined {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || undefined;
}

function decodeBody(data: string | undefined): string {
  if (!data) return "";
  return Buffer.from(data, "base64url").toString("utf-8");
}

interface PartType {
  mimeType?: string | null;
  filename?: string | null;
  body?: { data?: string | null; size?: number | null; attachmentId?: string | null } | null;
  parts?: PartType[] | null;
}

async function getFullMessage(gmail: GmailAPI, messageId: string): Promise<EmailMessage> {
  const response = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const message = response.data;
  const headers = message.payload?.headers as HeaderType[] | undefined;

  let body = "";
  let bodyHtml = "";

  function extractParts(part: PartType | undefined | null) {
    if (!part) return;
    if (part.mimeType === "text/plain" && part.body?.data) {
      body = decodeBody(part.body.data);
    }
    if (part.mimeType === "text/html" && part.body?.data) {
      bodyHtml = decodeBody(part.body.data);
    }
    if (part.parts) {
      part.parts.forEach(extractParts);
    }
  }

  extractParts(message.payload as PartType);

  const attachments: EmailAttachment[] = [];
  function findAttachments(part: PartType | undefined | null) {
    if (!part) return;
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType || "application/octet-stream",
        size: part.body.size || 0,
        attachmentId: part.body.attachmentId,
      });
    }
    if (part.parts) {
      part.parts.forEach(findAttachments);
    }
  }

  findAttachments(message.payload as PartType);

  return {
    id: message.id || "",
    threadId: message.threadId || "",
    subject: getHeaderValue(headers, "Subject") || "(No Subject)",
    from: parseAddress(getHeaderValue(headers, "From"))[0] || { name: "", email: "" },
    to: parseAddress(getHeaderValue(headers, "To")),
    cc: parseAddress(getHeaderValue(headers, "Cc")),
    bcc: parseAddress(getHeaderValue(headers, "Bcc")),
    snippet: message.snippet || "",
    body,
    bodyHtml,
    date: getHeaderValue(headers, "Date") || new Date().toISOString(),
    isRead: !message.labelIds?.includes("UNREAD"),
    isStarred: message.labelIds?.includes("STARRED") || false,
    labels: message.labelIds || [],
    attachments: attachments.length > 0 ? attachments : undefined,
  };
}

export function createMailService(gmail: GmailAPI): MailProvider {
  return {
    async listMessages(folder, maxResults = 50) {
      const folderMap: Record<MailFolder, string> = {
        inbox: "INBOX",
        sent: "SENT",
        starred: "STARRED",
        drafts: "DRAFT",
        trash: "TRASH",
      };

      const response = await gmail.users.messages.list({
        userId: "me",
        labelIds: [folderMap[folder]],
        maxResults,
      });

      const messages = await Promise.all(
        (response.data.messages || []).map((msg) =>
          msg.id ? getFullMessage(gmail, msg.id) : null
        )
      );

      return {
        messages: messages.filter((m): m is EmailMessage => m !== null),
        nextPageToken: response.data.nextPageToken || undefined,
      };
    },

    async getMessage(messageId) {
      return getFullMessage(gmail, messageId);
    },

    async searchMessages(query, maxResults = 20) {
      const response = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults,
      });

      const messages = await Promise.all(
        (response.data.messages || []).map((msg) =>
          msg.id ? getFullMessage(gmail, msg.id) : null
        )
      );

      return messages.filter((m): m is EmailMessage => m !== null);
    },

    async sendMessage(to, subject, body, replyToId) {
      const emailLines = [
        `To: ${to}`,
        `Subject: ${subject}`,
        "Content-Type: text/plain; charset=utf-8",
        "",
        body,
      ];

      if (replyToId) {
        emailLines.splice(2, 0, `In-Reply-To: ${replyToId}`);
      }

      const raw = Buffer.from(emailLines.join("\r\n"))
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw,
        },
      });

      return {
        id: response.data.id || "",
        threadId: response.data.threadId || "",
      };
    },

    async markAsRead(messageId) {
      await gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        requestBody: {
          removeLabelIds: ["UNREAD"],
        },
      });
    },

    async markAsUnread(messageId) {
      await gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        requestBody: {
          addLabelIds: ["UNREAD"],
        },
      });
    },

    async starMessage(messageId) {
      await gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        requestBody: {
          addLabelIds: ["STARRED"],
        },
      });
    },

    async unstarMessage(messageId) {
      await gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        requestBody: {
          removeLabelIds: ["STARRED"],
        },
      });
    },

    async trashMessage(messageId) {
      await gmail.users.messages.trash({
        userId: "me",
        id: messageId,
      });
    },

    async untrashMessage(messageId) {
      await gmail.users.messages.untrash({
        userId: "me",
        id: messageId,
      });
    },
  };
}
