export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, ToolParameter>;
    required: string[];
  };
}

export interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  result: unknown;
  error?: string;
}

export const toolDefinitions: ToolDefinition[] = [
  {
    name: "get_current_view",
    description: "Get the current view and state of the application",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "search_emails",
    description: "Search emails with filters",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query for subject, content, or sender" },
        sender: { type: "string", description: "Filter by sender email or name" },
        dateFrom: { type: "string", description: "Start date filter (ISO format)" },
        dateTo: { type: "string", description: "End date filter (ISO format)" },
        unreadOnly: { type: "boolean", description: "Only show unread emails" },
      },
      required: [],
    },
  },
  {
    name: "get_email",
    description: "Get a specific email by ID",
    parameters: {
      type: "object",
      properties: {
        emailId: { type: "string", description: "The email ID" },
      },
      required: ["emailId"],
    },
  },
  {
    name: "get_latest_email",
    description: "Get the latest email from a specific sender or overall",
    parameters: {
      type: "object",
      properties: {
        sender: { type: "string", description: "Filter by sender email or name" },
      },
      required: [],
    },
  },
  {
    name: "open_email",
    description: "Open and display an email",
    parameters: {
      type: "object",
      properties: {
        emailId: { type: "string", description: "The email ID to open" },
      },
      required: ["emailId"],
    },
  },
  {
    name: "open_compose",
    description: "Open the compose form",
    parameters: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email" },
        subject: { type: "string", description: "Email subject" },
        body: { type: "string", description: "Email body" },
      },
      required: [],
    },
  },
  {
    name: "fill_compose_form",
    description: "Fill the compose form fields",
    parameters: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email" },
        subject: { type: "string", description: "Email subject" },
        body: { type: "string", description: "Email body" },
      },
      required: [],
    },
  },
  {
    name: "send_email",
    description: "Send an email (requires confirmation)",
    parameters: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email" },
        subject: { type: "string", description: "Email subject" },
        body: { type: "string", description: "Email body" },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "open_reply",
    description: "Open reply form for current email",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "fill_reply",
    description: "Fill the reply body",
    parameters: {
      type: "object",
      properties: {
        body: { type: "string", description: "Reply body text" },
      },
      required: ["body"],
    },
  },
  {
    name: "mark_as_read",
    description: "Mark an email as read",
    parameters: {
      type: "object",
      properties: {
        emailId: { type: "string", description: "The email ID" },
      },
      required: ["emailId"],
    },
  },
  {
    name: "navigate_to_view",
    description: "Navigate to a specific view",
    parameters: {
      type: "object",
      properties: {
        view: {
          type: "string",
          description: "The view to navigate to",
          enum: ["inbox", "sent", "starred", "drafts", "trash"],
        },
      },
      required: ["view"],
    },
  },
  {
    name: "get_current_email_context",
    description: "Get context about the currently viewed email",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];
