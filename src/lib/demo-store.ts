"use client";

import { EmailMessage } from "@/types/mail";

const initialMockEmails: EmailMessage[] = [
  {
    id: "1",
    threadId: "t1",
    subject: "Project Update - Q4 Planning",
    from: { name: "Sarah Chen", email: "sarah.chen@company.com" },
    to: [{ name: "Me", email: "me@example.com" }],
    snippet: "Hi team, I wanted to share the latest updates on the Q4 project planning...",
    body: `Hi team,

I wanted to share the latest updates on the Q4 project planning. We've made significant progress on the new features and I think we're on track to meet our deadlines.

Key highlights:
1. Backend API is 80% complete
2. Frontend redesign is in review
3. Testing phase starts next week

Please review the attached documents and let me know if you have any questions.

Best regards,
Sarah`,
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    isStarred: true,
    labels: ["work"],
  },
  {
    id: "2",
    threadId: "t2",
    subject: "Re: Meeting Tomorrow",
    from: { name: "David Park", email: "david.park@company.com" },
    to: [{ name: "Me", email: "me@example.com" }],
    snippet: "Sure, I'll be there at 3pm. Looking forward to it!",
    body: `Sure, I'll be there at 3pm. Looking forward to it!

David`,
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    isStarred: false,
    labels: [],
  },
  {
    id: "3",
    threadId: "t3",
    subject: "Your Weekly Digest",
    from: { name: "Newsletter", email: "digest@company.com" },
    to: [{ name: "Me", email: "me@example.com" }],
    snippet: "Here's your weekly summary of activity and updates...",
    body: `Here's your weekly summary of activity and updates:

- 5 new messages
- 3 meetings scheduled
- 2 tasks completed
- 1 document shared

Have a great week!

Best,
Newsletter Team`,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    isStarred: false,
    labels: ["notifications"],
  },
  {
    id: "4",
    threadId: "t4",
    subject: "Invoice #1234 - Payment Due",
    from: { name: "Accounting", email: "accounting@company.com" },
    to: [{ name: "Me", email: "me@example.com" }],
    snippet: "Please find attached the invoice for services rendered...",
    body: `Dear Customer,

Please find attached the invoice for services rendered in August 2026.

Invoice Details:
- Invoice Number: #1234
- Amount: $2,500.00
- Due Date: September 15, 2026

Payment can be made via bank transfer or online portal.

Thank you for your business.

Best regards,
Accounting Team`,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    isStarred: false,
    labels: ["finance"],
  },
  {
    id: "5",
    threadId: "t5",
    subject: "Team Lunch Friday",
    from: { name: "Emily Wong", email: "emily.wong@company.com" },
    to: [{ name: "Me", email: "me@example.com" }],
    snippet: "Hey! Are you free for team lunch this Friday at noon?",
    body: `Hey!

Are you free for team lunch this Friday at noon? We're thinking of trying that new Italian place downtown.

Let me know if you can make it!

Best,
Emily`,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    isStarred: true,
    labels: ["social"],
  },
  {
    id: "6",
    threadId: "t6",
    subject: "Welcome to the Team!",
    from: { name: "HR Department", email: "hr@company.com" },
    to: [{ name: "Me", email: "me@example.com" }],
    snippet: "We're excited to welcome you to the team...",
    body: `Dear New Team Member,

We're excited to welcome you to the team! Here are some important details:

1. Your first day orientation is scheduled for Monday
2. Please bring your ID and signed documents
3. Check your email for login credentials

If you have any questions, please don't hesitate to reach out.

Best regards,
HR Department`,
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    isStarred: false,
    labels: ["hr"],
  },
  {
    id: "7",
    threadId: "t7",
    subject: "Conference Registration Confirmed",
    from: { name: "TechConf 2026", email: "noreply@techconf.com" },
    to: [{ name: "Me", email: "me@example.com" }],
    snippet: "Your registration for TechConf 2026 has been confirmed...",
    body: `Thank you for registering for TechConf 2026!

Registration Details:
- Event: TechConf 2026
- Date: October 15-17, 2026
- Location: Convention Center
- Badge: #TC2026-1234

Please save this email as your confirmation. We look forward to seeing you there!

Best,
TechConf Team`,
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    isStarred: true,
    labels: ["events"],
  },
  {
    id: "8",
    threadId: "t8",
    subject: "Security Alert: New Login Detected",
    from: { name: "Security Team", email: "security@company.com" },
    to: [{ name: "Me", email: "me@example.com" }],
    snippet: "We detected a new login to your account from a new device...",
    body: `Security Alert

We detected a new login to your account:
- Device: Chrome on Windows
- Location: New York, USA
- Time: Just now

If this was you, no action is needed. If you don't recognize this activity, please change your password immediately.

Best,
Security Team`,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    isStarred: false,
    labels: ["security"],
  },
];

const mockSentEmails: EmailMessage[] = [
  {
    id: "sent-1",
    threadId: "st1",
    subject: "Re: Project Update - Q4 Planning",
    from: { name: "Me", email: "me@example.com" },
    to: [{ name: "Sarah Chen", email: "sarah.chen@company.com" }],
    snippet: "Thanks Sarah! The updates look great. I'll review the documents...",
    body: `Thanks Sarah! The updates look great. I'll review the documents and get back to you by end of day.

Best,
Me`,
    date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    isStarred: false,
    labels: [],
  },
  {
    id: "sent-2",
    threadId: "st2",
    subject: "Team Lunch This Friday",
    from: { name: "Me", email: "me@example.com" },
    to: [{ name: "Emily Wong", email: "emily.wong@company.com" }],
    snippet: "Hey Emily! Count me in for Friday's lunch...",
    body: `Hey Emily! Count me in for Friday's lunch. That Italian place sounds perfect.

See you there!

Best,
Me`,
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    isStarred: false,
    labels: [],
  },
];

const mockDraftEmails: EmailMessage[] = [
  {
    id: "draft-1",
    threadId: "dt1",
    subject: "Quarterly Report Draft",
    from: { name: "Me", email: "me@example.com" },
    to: [{ name: "Manager", email: "manager@company.com" }],
    snippet: "Here's the draft for the quarterly report...",
    body: `Here's the draft for the quarterly report:

## Key Metrics
- Revenue: $500K
- New Customers: 150
- Retention Rate: 95%

## Highlights
- Launched new feature X
- Expanded to 3 new markets

[Draft in progress]`,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    isStarred: false,
    labels: ["drafts"],
  },
];

const mockTrashEmails: EmailMessage[] = [
  {
    id: "trash-1",
    threadId: "tr1",
    subject: "Spam Email - Special Offer!",
    from: { name: "Spammer", email: "spam@fake.com" },
    to: [{ name: "Me", email: "me@example.com" }],
    snippet: "Congratulations! You've won a prize...",
    body: `Congratulations! You've won a prize! Click here to claim...

[This was spam]`,
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    isStarred: false,
    labels: ["spam"],
  },
];

class DemoStore {
  private inbox: EmailMessage[] = [...initialMockEmails];
  private sent: EmailMessage[] = [...mockSentEmails];
  private drafts: EmailMessage[] = [...mockDraftEmails];
  private trash: EmailMessage[] = [...mockTrashEmails];
  private nextId = 100;

  getFolder(folder: string): EmailMessage[] {
    switch (folder) {
      case "inbox": return this.inbox;
      case "sent": return this.sent;
      case "drafts": return this.drafts;
      case "trash": return this.trash;
      case "starred": return this.inbox.filter(e => e.isStarred);
      default: return this.inbox;
    }
  }

  getEmail(id: string): EmailMessage | undefined {
    return [...this.inbox, ...this.sent, ...this.drafts, ...this.trash].find(e => e.id === id);
  }

  markAsRead(id: string): void {
    const email = this.getEmail(id);
    if (email) email.isRead = true;
  }

  toggleStar(id: string): boolean {
    const email = this.getEmail(id);
    if (email) {
      email.isStarred = !email.isStarred;
      return email.isStarred;
    }
    return false;
  }

  deleteEmail(id: string): boolean {
    const idx = this.inbox.findIndex(e => e.id === id);
    if (idx !== -1) {
      const [email] = this.inbox.splice(idx, 1);
      this.trash.unshift(email);
      return true;
    }
    return false;
  }

  sendEmail(to: string, subject: string, body: string): EmailMessage {
    const newEmail: EmailMessage = {
      id: `sent-${this.nextId++}`,
      threadId: `st-${this.nextId}`,
      subject,
      from: { name: "Me", email: "me@example.com" },
      to: [{ name: to, email: to }],
      snippet: body.substring(0, 100),
      body,
      date: new Date().toISOString(),
      isRead: true,
      isStarred: false,
      labels: [],
    };
    this.sent.unshift(newEmail);
    return newEmail;
  }
}

export const demoStore = new DemoStore();
