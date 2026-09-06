# AI Mail - AI-Powered Email Client

An intelligent email client where an AI assistant controls the UI through natural language commands. Built with Next.js 16, React 19, and Gmail API integration.

## Live Demo

**[Try the Demo](https://ai-powered-mail-web-application-imbk.onrender.com/demo)** - No login required, uses mock data to showcase all features.

> **Note**: The full Gmail integration requires Google OAuth verification. The demo mode lets you explore all UI features instantly.

---

## Features

- **AI Assistant** - Control the entire UI with natural language commands
- **Gmail Integration** - Read, send, search, star, and delete real emails
- **Smart Compose** - AI-assisted email composition with reply/forward
- **Dark/Light Mode** - Toggle between themes, persists preference
- **Responsive Design** - Collapsible sidebar, adaptive layouts
- **Real-time Search** - Instant email filtering by sender, subject, content
- **Folder Management** - Inbox, Sent, Drafts, Trash, Starred with counts
- **Demo Mode** - Full feature access without login for showcasing

---

## Screenshots

### Login Screen
![Login Screen](screenshots/login.png)

### Main Inbox View
![Inbox View](screenshots/inbox.png)

### AI Assistant in Action
![AI Assistant](screenshots/assistant.png)

### Dark Mode
![Dark Mode](screenshots/dark-mode.png)

### Demo Mode
![Demo Mode](screenshots/demo.png)

---

## Architecture

### High-Level Overview

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

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 16, React 19 | Server components, App Router, latest React features |
| **Styling** | Tailwind CSS, shadcn/ui | Rapid UI development, consistent design system |
| **State** | React Context API | Built-in, no extra deps, perfect for AI tool integration |
| **Auth** | NextAuth.js v4 | Seamless Google OAuth, session management |
| **Database** | PostgreSQL + Prisma | Type-safe ORM, easy schema management |
| **Email** | Gmail API | Direct integration with user's Gmail |
| **Deployment** | Render | Free tier, easy setup, auto-deploys from GitHub |

---

## Local Setup

### Prerequisites

- Node.js 18+ (recommended: 20)
- npm or yarn
- PostgreSQL (local or cloud like Neon)
- Google Cloud Console account

### Step 1: Clone & Install

```bash
git clone https://github.com/girivishva2006-sudo/AI-Powered-Mail-Web-Application.git
cd ai-mail
npm install
```

### Step 2: Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### Step 3: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Configure consent screen:
   - User Type: External
   - App name: Your app name
   - Add your email as test user
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret

### Step 4: Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai_mail"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="random-secret-string"

# Access Control (empty = allow all)
ALLOWED_EMAILS=""
```

### Step 5: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Quick Start (Demo Mode)

Want to try it immediately without setup? Use the **[Live Demo](https://ai-powered-mail-web-application-imbk.onrender.com/demo)** - no configuration needed!

---

## AI Assistant Guide

The AI assistant uses a **tool-based agent architecture**. Here's how it works:

### How It Works

1. **User sends message** via chat interface
2. **Agent parses intent** and determines which tools to call
3. **Tools execute actions** on the application
4. **State updates** trigger UI re-renders
5. **Response generated** summarizing what happened

### Available Commands

| Category | Commands | Example |
|----------|----------|---------|
| **Search** | Show, Find, Search, About | "Show unread emails" |
| **Filter** | Unread, From, Starred | "Find emails from Sarah" |
| **Open** | Open, Go to | "Open email from David" |
| **Navigate** | Sent, Drafts, Inbox | "Go to sent folder" |
| **Compose** | Send, Write, Compose | "Send email to john@example.com" |
| **Reply** | Reply, Respond | "Reply saying I'll be there" |

### Example Interactions

```
User: "Show me all unread emails"
AI: [Searches inbox, filters unread, displays list]

User: "Find emails from Sarah about the project"
AI: [Filters by sender + keyword, shows results]

User: "Send an email to john@example.com with subject 'Meeting Update'"
AI: [Opens compose form, fills recipient and subject]

User: "Reply to the latest email saying I'll be there at 3pm"
AI: [Opens reply form, fills response body]
```

### Tool Architecture

```typescript
// Tools are defined with schemas and execute against app state
const tools = {
  search_emails: { query, sender, unreadOnly },
  navigate_to_view: { view: "inbox" | "sent" | "starred" },
  open_email: { emailId },
  open_compose: { to, subject, body },
  // ... more tools
};
```

---

## Architecture Decisions & Trade-offs

### 1. Context API vs Redux/Zustand

**Decision**: Used React Context API for state management.

**Why**:
- Built into React, zero extra dependencies
- Perfect for this app's state complexity
- Easy integration with AI tool execution (tools dispatch actions directly)

**Trade-off**:
- Less efficient for frequent updates (not an issue here)
- No devtools like Redux (acceptable for project scope)

### 2. Tool-Based Agent vs Direct Function Calls

**Decision**: Implemented tool-based agent architecture instead of direct function calls.

**Why**:
- **Extensibility**: Easy to add new capabilities without modifying core logic
- **Transparency**: Users see exactly what tools are executed
- **Type Safety**: Strongly typed tool schemas prevent errors
- **Testability**: Each tool can be tested independently

**Trade-off**:
- More initial setup complexity
- Slightly slower than direct function calls (negligible)

### 3. Mock Data for Demo vs Full Backend

**Decision**: Created a demo mode with mock data instead of requiring full backend setup.

**Why**:
- Anyone can try the app immediately without Google OAuth
- Perfect for interviews and demonstrations
- No database or API keys required

**Trade-off**:
- Mock data is static (not real-time)
- Some features limited in demo mode

### 4. Next.js 16 with App Router

**Decision**: Used Next.js 16 with App Router instead of Pages Router.

**Why**:
- Server components for better performance
- Built-in API routes (no separate backend needed)
- Better TypeScript support
- Modern React patterns

**Trade-off**:
- Newer, less community resources than Pages Router
- Some learning curve for App Router patterns

### 5. Regex-Based AI vs LLM Integration

**Decision**: Implemented regex-based intent parsing instead of actual LLM API calls.

**Why**:
- **Zero cost**: No API fees for AI processing
- **Instant responses**: No network latency
- **Reliable**: Deterministic, no hallucinations
- **Demo-friendly**: Works offline, no API keys needed

**Trade-off**:
- Less flexible than actual LLM
- Can't handle complex natural language
- Requires predefined patterns

**Future**: Easy to swap in OpenAI/Anthropic by replacing the `processUserMessage` function.

---

## Security Considerations

- **OAuth tokens** stored server-side only (never exposed to browser)
- **API keys** environment variables, never committed to git
- **Session-based auth** with NextAuth.js
- **Input validation** on all tool parameters
- **Rate limiting** via Gmail API quotas
- **CORS** configured for production domain only

---

## Project Structure

```
ai-mail/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/  # NextAuth route
│   │   │   ├── mail/                # Gmail API endpoints
│   │   │   └── ai/chat/             # AI assistant endpoint
│   │   ├── demo/                    # Demo mode (no auth)
│   │   └── page.tsx                 # Main login/app
│   ├── components/
│   │   ├── assistant/               # AI chat panel
│   │   ├── mail/                    # Email components
│   │   └── ui/                      # shadcn/ui components
│   ├── lib/
│   │   ├── auth/                    # NextAuth config
│   │   ├── demo-store.ts            # Mock data store
│   │   └── app-context.tsx          # State management
│   └── types/                       # TypeScript types
├── prisma/                          # Database schema
├── public/                          # Static assets
└── .env.example                     # Environment template
```

---

## What I'd Improve With More Time

### High Priority

1. **Real LLM Integration**
   - Replace regex-based AI with OpenAI/Anthropic API
   - Add conversation memory for context-aware responses
   - Implement streaming responses for better UX

2. **Email Threading**
   - Group emails by conversation
   - Show reply chains in thread view
   - Support inline replies within threads

3. **Attachment Support**
   - Upload files in compose
   - View/download attachments
   - Preview images and PDFs

### Medium Priority

4. **Real-Time Sync**
   - Google Pub/Sub for instant notifications
   - WebSocket updates for multi-device sync
   - Offline support with service workers

5. **Keyboard Shortcuts**
   - `j/k` - Navigate up/down
   - `Enter` - Open email
   - `c` - Compose
   - `r` - Reply
   - `/` - Search

6. **Email Scheduling**
   - Schedule emails for later
   - Recurring emails
   - Time zone awareness

### Low Priority

7. **Multi-Account Support**
   - Add multiple Gmail accounts
   - Switch between accounts
   - Unified inbox view

8. **Advanced Features**
   - Email templates
   - Snooze emails
   - Smart categories (Promotions, Social, etc.)
   - Contact management
   - Calendar integration

9. **Performance Optimizations**
   - Virtual scrolling for large inboxes
   - Lazy loading email bodies
   - Image optimization
   - Bundle size reduction

10. **Testing**
    - Unit tests for tools and utils
    - Integration tests for API routes
    - E2E tests with Playwright
    - Accessibility testing

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details

---

## Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Prisma](https://www.prisma.io/) - Database ORM
- [NextAuth.js](https://next-auth.js.org/) - Authentication
