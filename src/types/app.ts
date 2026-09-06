import { MailFolder, ComposeState, SearchFilters } from "./mail";

export type ViewType = "inbox" | "sent" | "starred" | "drafts" | "trash" | "email-detail" | "compose";

export interface AppState {
  currentView: ViewType;
  selectedEmailId: string | null;
  currentEmailId: string | null;
  searchQuery: string;
  activeFilters: SearchFilters;
  composeState: ComposeState;
  assistantMessages: AssistantMessage[];
  isAssistantOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: ToolCall[];
  timestamp: string;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: "pending" | "running" | "completed" | "error";
}

export type AppAction =
  | { type: "SET_VIEW"; payload: ViewType }
  | { type: "SELECT_EMAIL"; payload: string | null }
  | { type: "OPEN_EMAIL"; payload: string }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_FILTERS"; payload: SearchFilters }
  | { type: "UPDATE_COMPOSE"; payload: Partial<ComposeState> }
  | { type: "RESET_COMPOSE" }
  | { type: "ADD_ASSISTANT_MESSAGE"; payload: AssistantMessage }
  | { type: "UPDATE_TOOL_CALL"; payload: { messageId: string; toolCall: Partial<ToolCall> & { id: string } } }
  | { type: "TOGGLE_ASSISTANT" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };
