# AI Mail - AI-Powered Email Client

A modern email client where an AI assistant can control the UI through natural language.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Mail Application                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────────────┐ │
│  │  Sidebar  │    │  Main Content │    │   AI Assistant Panel   │ │
│  │  - Inbox  │    │  - Mail List  │    │   - Chat Interface    │ │
│  │  - Sent   │    │  - Mail Detail│    │   - Tool Execution    │ │
│  │  - Starred│    │  - Compose    │    │   - State Updates     │ │
│  │  - Drafts │    │               │    │                       │ │
│  │  - Trash  │    │               │    │                       │ │
│  └──────────┘    └──────────────┘    └───────────────────────┘ │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                     Application State (Context API)              │
├─────────────────────────────────────────────────────────────────┤
│                     AI Agent Layer (Tool Calling)                │
├─────────────────────────────────────────────────────────────────┤
│                     Gmail Service Layer                          │
├─────────────────────────────────────────────────────────────────┤
│                     PostgreSQL (Prisma ORM)                      │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL, Prisma ORM
- **Auth**: NextAuth.js v5 with Google OAuth
- **Email**: Gmail API
- **AI**: Custom agent with tool calling architecture

## AI Agent Architecture

The AI assistant uses a tool-based agent architecture:

1. **User sends a message** via the chat interface
2. **Agent processes intent** and determines which tools to call
3. **Tools execute actions** (search, open, compose, etc.)
4. **Application state updates** in response to tool execution
5. **UI re-renders** to reflect the new state

### Available Tools

| Tool | Description |
|------|-------------|
| `get_current_view` | Get current application state |
| `search_emails` | Search emails with filters |
| `get_email` | Get specific email by ID |
| `get_latest_email` | Get latest email from sender |
| `open_email` | Open and display an email |
| `open_compose` | Open compose form |
| `fill_compose_form` | Fill compose fields |
| `send_email` | Send email (with confirmation) |
| `open_reply` | Open reply form |
| `fill_reply` | Fill reply body |
| `mark_as_read` | Mark email as read |
| `navigate_to_view` | Navigate to different view |
| `get_current_email_context` | Get current email context |

## Gmail OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

### Required OAuth Scopes

- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/gmail.modify`

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai_mail"

# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""

# AI Provider
AI_PROVIDER="openai"
AI_API_KEY=""
```

## Local Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd ai-mail

# 2. Install dependencies
npm install

# 3. Set up database
npx prisma generate
npx prisma db push

# 4. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 5. Run development server
npm run dev
```

## Running the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## Real-Time Sync Architecture

The application includes an abstraction layer for real-time mail synchronization:

```
MailSyncService (Interface)
├── GmailSyncService (Gmail Implementation)
│   ├── Google Pub/Sub for push notifications
│   └── Polling fallback for development
└── MailProvider (Future implementations)
```

For development, a polling mechanism can be used. In production, Google Pub/Sub provides push notifications.

## Security Considerations

- OAuth tokens are stored server-side only
- API keys never exposed to the browser
- All Gmail operations go through authenticated API routes
- Input validation on all tool parameters
- Session-based authentication with NextAuth

## Design Decisions

### Why Tool-Based Agent Architecture?

Instead of regex-based intent routing, we use a tool-based agent:

1. **Extensibility**: Easy to add new capabilities
2. **Type Safety**: Strongly typed tool schemas
3. **Flexibility**: LLM determines optimal tool usage
4. **Transparency**: Users see which tools are executed
5. **Maintainability**: No complex pattern matching code

### Why Context API for State?

- Built into React, no extra dependencies
- Centralized state management
- Easy integration with AI tool execution
- Predictable state updates

## Known Limitations

- Gmail API rate limits apply
- Real-time sync requires Google Pub/Sub setup
- AI responses are template-based (can be enhanced with actual LLM)
- No attachment handling in compose yet

## Future Improvements

- [ ] Integrate actual LLM provider (OpenAI, Anthropic)
- [ ] Implement Google Pub/Sub for real-time sync
- [ ] Add attachment support
- [ ] Implement email threading
- [ ] Add keyboard shortcuts
- [ ] Support multiple email providers
- [ ] Add email scheduling
- [ ] Implement email templates
