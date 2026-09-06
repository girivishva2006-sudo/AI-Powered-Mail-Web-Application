export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  snippet: string;
  body: string;
  bodyHtml?: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  attachments?: EmailAttachment[];
}

export interface EmailAddress {
  name: string;
  email: string;
}

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}

export interface EmailListResult {
  messages: EmailMessage[];
  nextPageToken?: string;
  totalEstimate?: number;
}

export type MailFolder = "inbox" | "sent" | "starred" | "drafts" | "trash";

export interface ComposeState {
  to: string;
  subject: string;
  body: string;
  replyToId?: string;
  forwardId?: string;
}

export interface SearchFilters {
  query?: string;
  sender?: string;
  dateFrom?: string;
  dateTo?: string;
  unreadOnly?: boolean;
  folder?: MailFolder;
}
