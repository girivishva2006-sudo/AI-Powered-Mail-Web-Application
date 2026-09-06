"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { AppState, AppAction } from "@/types/app";
import { ComposeState } from "@/types/mail";

const initialComposeState: ComposeState = {
  to: "",
  subject: "",
  body: "",
};

const initialState: AppState = {
  currentView: "inbox",
  selectedEmailId: null,
  currentEmailId: null,
  searchQuery: "",
  activeFilters: {},
  composeState: initialComposeState,
  assistantMessages: [],
  isAssistantOpen: true,
  isLoading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_VIEW":
      return { ...state, currentView: action.payload, currentEmailId: null };
    case "SELECT_EMAIL":
      return { ...state, selectedEmailId: action.payload };
    case "OPEN_EMAIL":
      return { ...state, currentView: "email-detail", currentEmailId: action.payload };
    case "SET_SEARCH":
      return { ...state, searchQuery: action.payload };
    case "SET_FILTERS":
      return { ...state, activeFilters: { ...state.activeFilters, ...action.payload } };
    case "UPDATE_COMPOSE":
      return { ...state, composeState: { ...state.composeState, ...action.payload } };
    case "RESET_COMPOSE":
      return { ...state, composeState: initialComposeState };
    case "ADD_ASSISTANT_MESSAGE":
      return {
        ...state,
        assistantMessages: [...state.assistantMessages, action.payload],
      };
    case "UPDATE_TOOL_CALL":
      return {
        ...state,
        assistantMessages: state.assistantMessages.map((msg) =>
          msg.id === action.payload.messageId
            ? {
                ...msg,
                toolCalls: msg.toolCalls?.map((tc) =>
                  tc.id === action.payload.toolCall.id ? { ...tc, ...action.payload.toolCall } : tc
                ),
              }
            : msg
        ),
      };
    case "TOGGLE_ASSISTANT":
      return { ...state, isAssistantOpen: !state.isAssistantOpen };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
