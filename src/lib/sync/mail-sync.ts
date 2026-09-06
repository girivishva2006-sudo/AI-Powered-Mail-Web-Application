export interface SyncConfig {
  pollInterval?: number;
  enablePush?: boolean;
}

export interface SyncEvent {
  type: "new_email" | "email_updated" | "email_deleted";
  emailId: string;
  threadId?: string;
  timestamp: string;
}

export type SyncCallback = (event: SyncEvent) => void;

export interface MailSyncService {
  start(): void;
  stop(): void;
  onSync(callback: SyncCallback): void;
  isRunning(): boolean;
}

export function createMailSyncService(config: SyncConfig = {}): MailSyncService {
  const { pollInterval = 30000 } = config;
  let running = false;
  let intervalId: NodeJS.Timeout | null = null;
  const callbacks: SyncCallback[] = [];

  return {
    start() {
      if (running) return;
      running = true;

      intervalId = setInterval(async () => {
        try {
          const response = await fetch("/api/mail/sync");
          if (response.ok) {
            const events: SyncEvent[] = await response.json();
            events.forEach((event) => {
              callbacks.forEach((cb) => cb(event));
            });
          }
        } catch (error) {
          console.error("Sync error:", error);
        }
      }, pollInterval);
    },

    stop() {
      running = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },

    onSync(callback: SyncCallback) {
      callbacks.push(callback);
    },

    isRunning() {
      return running;
    },
  };
}
