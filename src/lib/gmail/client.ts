import { google, gmail_v1 } from "googleapis";

export type GmailAPI = gmail_v1.Gmail;

export interface GmailClientConfig {
  accessToken: string;
  refreshToken?: string;
}

export function createGmailClient(config: GmailClientConfig): GmailAPI {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: config.accessToken,
    refresh_token: config.refreshToken,
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}
