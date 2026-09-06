import { toolDefinitions, ToolCall, ToolResult, ToolDefinition } from "./tools";
import { AppState } from "@/types/app";
import { EmailMessage, SearchFilters } from "@/types/mail";

interface AIContext {
  state: AppState;
  emails: EmailMessage[];
}

export interface AIAgentResponse {
  message: string;
  toolCalls?: (ToolCall & { result?: ToolResult })[];
  stateChanges?: { type: string; payload: unknown }[];
}

function buildSystemPrompt(context: AIContext): string {
  const { state } = context;

  return `You are an AI assistant for an email application. You can help users manage their emails by performing actions in the application.

Current Application State:
- Current View: ${state.currentView}
- Current Email ID: ${state.currentEmailId || "None"}
- Search Query: ${state.searchQuery || "None"}
- Compose To: ${state.composeState.to || "None"}
- Compose Subject: ${state.composeState.subject || "None"}

Available Tools:
${toolDefinitions.map((t) => `- ${t.name}: ${t.description}`).join("\n")}

Rules:
1. Use tools to perform actions, don't just describe what you would do.
2. For sending emails, always confirm with the user first.
3. When the user says "reply to this", use get_current_email_context to identify the current email.
4. Keep responses concise and helpful.
5. If an action requires multiple steps, call tools sequentially.
6. When opening compose or filling forms, the UI will visually update to show the changes.`;
}

function parseUserIntent(message: string): { tool: string; args: Record<string, unknown> } | null {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("show") && lowerMessage.includes("unread")) {
    return { tool: "search_emails", args: { unreadOnly: true } };
  }

  if (lowerMessage.includes("show") && lowerMessage.includes("last")) {
    const daysMatch = message.match(/(\d+)\s*(?:days?|d)/i);
    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      return { tool: "search_emails", args: { dateFrom } };
    }
    return { tool: "search_emails", args: {} };
  }

  if (lowerMessage.includes("find") || lowerMessage.includes("search")) {
    const emailMatch = message.match(/from\s+(\w+)/i);
    if (emailMatch) {
      return { tool: "search_emails", args: { sender: emailMatch[1] } };
    }
    const queryMatch = message.match(/(?:about|for)\s+(.+)/i);
    if (queryMatch) {
      return { tool: "search_emails", args: { query: queryMatch[1] } };
    }
    return { tool: "search_emails", args: { query: message } };
  }

  if (lowerMessage.includes("open") && lowerMessage.includes("latest")) {
    const senderMatch = message.match(/from\s+(\w+)/i);
    return { tool: "get_latest_email", args: senderMatch ? { sender: senderMatch[1] } : {} };
  }

  if (lowerMessage.includes("open")) {
    return { tool: "navigate_to_view", args: { view: "inbox" } };
  }

  if (lowerMessage.includes("send") || lowerMessage.includes("compose")) {
    const toMatch = message.match(/to\s+(\S+)/i);
    const subjectMatch = message.match(/subject\s+(.+?)(?:\s+and\s+say|\s+with\s+body|\s*$)/i);
    const bodyMatch = message.match(/(?:say|body|content)\s+(.+)/i);

    return {
      tool: "open_compose",
      args: {
        to: toMatch?.[1] || "",
        subject: subjectMatch?.[1] || "",
        body: bodyMatch?.[1] || "",
      },
    };
  }

  if (lowerMessage.includes("reply")) {
    const bodyMatch = message.match(/(?:saying|say|reply)\s+(.+)/i);
    return {
      tool: "fill_reply",
      args: { body: bodyMatch?.[1] || "" },
    };
  }

  if (lowerMessage.includes("inbox")) {
    return { tool: "navigate_to_view", args: { view: "inbox" } };
  }

  if (lowerMessage.includes("sent")) {
    return { tool: "navigate_to_view", args: { view: "sent" } };
  }

  if (lowerMessage.includes("starred")) {
    return { tool: "navigate_to_view", args: { view: "starred" } };
  }

  if (lowerMessage.includes("draft")) {
    return { tool: "navigate_to_view", args: { view: "drafts" } };
  }

  return null;
}

export async function processMessage(
  message: string,
  context: AIContext
): Promise<AIAgentResponse> {
  const intent = parseUserIntent(message);

  if (!intent) {
    return {
      message: "I'm not sure what you'd like me to do. I can help you:\n- Search emails\n- Open emails\n- Compose and send emails\n- Navigate between views\n- Reply to emails\n\nWhat would you like to do?",
    };
  }

  const toolDef = toolDefinitions.find((t) => t.name === intent.tool);
  if (!toolDef) {
    return { message: "Unknown tool requested." };
  }

  const toolCall: ToolCall = {
    id: `tc-${Date.now()}`,
    name: intent.tool,
    args: intent.args,
  };

  try {
    const result = await executeTool(intent.tool, intent.args, context);

    return {
      message: result.message,
      toolCalls: [{ ...toolCall, result: { toolCallId: toolCall.id, result: result.data } }],
      stateChanges: result.stateChanges,
    };
  } catch (error) {
    return {
      message: `Error executing ${intent.tool}: ${error instanceof Error ? error.message : "Unknown error"}`,
      toolCalls: [
        {
          ...toolCall,
          result: {
            toolCallId: toolCall.id,
            result: null,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        },
      ],
    };
  }
}

interface ToolExecutionResult {
  message: string;
  data: unknown;
  stateChanges?: { type: string; payload: unknown }[];
}

async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  context: AIContext
): Promise<ToolExecutionResult> {
  const { state, emails } = context;

  switch (toolName) {
    case "get_current_view":
      return {
        message: `Current view: ${state.currentView}`,
        data: {
          view: state.currentView,
          emailId: state.currentEmailId,
          searchQuery: state.searchQuery,
        },
      };

    case "search_emails": {
      let filtered = [...emails];

      if (args.sender) {
        const sender = (args.sender as string).toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.from.email.toLowerCase().includes(sender) ||
            e.from.name.toLowerCase().includes(sender)
        );
      }

      if (args.query) {
        const query = (args.query as string).toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.subject.toLowerCase().includes(query) ||
            e.snippet.toLowerCase().includes(query)
        );
      }

      if (args.unreadOnly) {
        filtered = filtered.filter((e) => !e.isRead);
      }

      if (args.dateFrom) {
        const dateFrom = new Date(args.dateFrom as string);
        filtered = filtered.filter((e) => new Date(e.date) >= dateFrom);
      }

      return {
        message: `Found ${filtered.length} email(s) matching your criteria.`,
        data: filtered,
        stateChanges: [
          { type: "SET_FILTERS", payload: args as SearchFilters },
        ],
      };
    }

    case "get_email": {
      const email = emails.find((e) => e.id === args.emailId);
      if (!email) {
        return { message: "Email not found.", data: null };
      }
      return { message: `Found email: ${email.subject}`, data: email };
    }

    case "get_latest_email": {
      let filtered = [...emails];
      if (args.sender) {
        const sender = (args.sender as string).toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.from.email.toLowerCase().includes(sender) ||
            e.from.name.toLowerCase().includes(sender)
        );
      }
      const latest = filtered[0];
      if (!latest) {
        return { message: "No emails found.", data: null };
      }
      return {
        message: `Latest email: "${latest.subject}" from ${latest.from.name || latest.from.email}`,
        data: latest,
      };
    }

    case "open_email":
      return {
        message: "Opening email...",
        data: null,
        stateChanges: [{ type: "OPEN_EMAIL", payload: args.emailId }],
      };

    case "open_compose":
      return {
        message: "Opening compose form...",
        data: null,
        stateChanges: [
          { type: "SET_VIEW", payload: "compose" },
          {
            type: "UPDATE_COMPOSE",
            payload: {
              to: args.to || "",
              subject: args.subject || "",
              body: args.body || "",
            },
          },
        ],
      };

    case "fill_compose_form":
      return {
        message: "Filling compose form...",
        data: null,
        stateChanges: [
          { type: "UPDATE_COMPOSE", payload: args },
        ],
      };

    case "send_email":
      return {
        message: `Ready to send email to ${args.to} with subject "${args.subject}". Please confirm.`,
        data: args,
      };

    case "open_reply": {
      if (!state.currentEmailId) {
        return { message: "No email is currently open to reply to.", data: null };
      }
      const currentEmail = emails.find((e) => e.id === state.currentEmailId);
      if (!currentEmail) {
        return { message: "Current email not found.", data: null };
      }
      return {
        message: `Opening reply to ${currentEmail.from.email}...`,
        data: null,
        stateChanges: [
          {
            type: "UPDATE_COMPOSE",
            payload: {
              to: currentEmail.from.email,
              subject: `Re: ${currentEmail.subject}`,
              body: "",
              replyToId: currentEmail.id,
            },
          },
          { type: "SET_VIEW", payload: "compose" },
        ],
      };
    }

    case "fill_reply":
      return {
        message: "Filling reply body...",
        data: null,
        stateChanges: [
          {
            type: "UPDATE_COMPOSE",
            payload: { body: args.body },
          },
        ],
      };

    case "mark_as_read":
      return {
        message: "Marking email as read...",
        data: null,
      };

    case "navigate_to_view":
      return {
        message: `Navigating to ${args.view}...`,
        data: null,
        stateChanges: [{ type: "SET_VIEW", payload: args.view }],
      };

    case "get_current_email_context": {
      if (!state.currentEmailId) {
        return { message: "No email is currently open.", data: null };
      }
      const email = emails.find((e) => e.id === state.currentEmailId);
      if (!email) {
        return { message: "Current email not found.", data: null };
      }
      return {
        message: `Currently viewing: "${email.subject}" from ${email.from.name || email.from.email}`,
        data: {
          id: email.id,
          subject: email.subject,
          from: email.from,
          date: email.date,
          snippet: email.snippet,
        },
      };
    }

    default:
      return { message: `Unknown tool: ${toolName}`, data: null };
  }
}
