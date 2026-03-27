const GOOGLE_AUTH = "https://oauth2.googleapis.com/token";
const CAL_EVENTS = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

function clientId(): string | undefined {
  return process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
}

function clientSecret(): string | undefined {
  return process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
}

export function googleOAuthRedirectUri(): string {
  return (
    process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() ||
    "http://localhost:3000/api/v1/connectors/cloud/oauth/callback/google-calendar"
  );
}

export function isGoogleCalendarStubMode(): boolean {
  return process.env.CONNECTOR_CLOUD_STUB === "1" || process.env.VITEST === "true";
}

export function googleCalendarReadScope(): string {
  return "https://www.googleapis.com/auth/calendar.readonly";
}

export function googleCalendarWriteScope(): string {
  return "https://www.googleapis.com/auth/calendar.events";
}

export async function exchangeGoogleAuthorizationCode(code: string): Promise<GoogleTokenResponse> {
  if (isGoogleCalendarStubMode()) {
    return {
      access_token: "stub-google-access",
      refresh_token: "stub-google-refresh",
      expires_in: 3600,
      token_type: "Bearer",
    };
  }
  const cid = clientId();
  const sec = clientSecret();
  if (!cid || !sec) {
    throw new Error("GOOGLE_OAUTH_CLIENT_ID/SECRET not configured");
  }
  const body = new URLSearchParams({
    code,
    client_id: cid,
    client_secret: sec,
    redirect_uri: googleOAuthRedirectUri(),
    grant_type: "authorization_code",
  });
  const res = await fetch(GOOGLE_AUTH, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`google_token_exchange_failed: ${res.status} ${t.slice(0, 200)}`);
  }
  return (await res.json()) as GoogleTokenResponse;
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  if (isGoogleCalendarStubMode()) {
    return {
      access_token: "stub-google-access-refreshed",
      expires_in: 3600,
      token_type: "Bearer",
    };
  }
  const cid = clientId();
  const sec = clientSecret();
  if (!cid || !sec) {
    throw new Error("GOOGLE_OAUTH_CLIENT_ID/SECRET not configured");
  }
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: cid,
    client_secret: sec,
    grant_type: "refresh_token",
  });
  const res = await fetch(GOOGLE_AUTH, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`google_token_refresh_failed: ${res.status} ${t.slice(0, 200)}`);
  }
  return (await res.json()) as GoogleTokenResponse;
}

export interface CalendarEventSummary {
  id: string;
  summary: string;
  start?: string;
  end?: string;
}

export async function listPrimaryCalendarEvents(
  accessToken: string,
  maxResults: number,
): Promise<CalendarEventSummary[]> {
  if (isGoogleCalendarStubMode()) {
    return [
      { id: "stub-1", summary: "Stub team sync", start: new Date().toISOString() },
      { id: "stub-2", summary: "Stub roadmap review", start: new Date(Date.now() + 86400000).toISOString() },
    ];
  }
  const timeMin = new Date().toISOString();
  const url = new URL(CAL_EVENTS);
  url.searchParams.set("maxResults", String(Math.min(Math.max(maxResults, 1), 50)));
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("timeMin", timeMin);

  const res = await fetch(url.toString(), {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`google_calendar_list_failed: ${res.status} ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    items?: Array<{ id: string; summary?: string; start?: { dateTime?: string }; end?: { dateTime?: string } }>;
  };
  return (data.items ?? []).map((it) => ({
    id: it.id,
    summary: it.summary ?? "(no title)",
    start: it.start?.dateTime,
    end: it.end?.dateTime,
  }));
}

export async function createPrimaryCalendarEvent(
  accessToken: string,
  summary: string,
  startIso: string,
): Promise<{ id: string; htmlLink?: string }> {
  if (isGoogleCalendarStubMode()) {
    return { id: "stub-created", htmlLink: "https://calendar.google.com/stub" };
  }
  const res = await fetch(CAL_EVENTS, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      summary,
      start: { dateTime: startIso },
      end: { dateTime: new Date(new Date(startIso).getTime() + 3600000).toISOString() },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`google_calendar_create_failed: ${res.status} ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as { id: string; htmlLink?: string };
  return { id: data.id, htmlLink: data.htmlLink };
}
