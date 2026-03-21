import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { CalendarEventInput, ExternalCalendar } from '../types';
import { addEvent, updateEvent, getExternalEventIds } from './eventService';
import { updateSyncTimestamp } from './externalCalendarService';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

/**
 * Google OAuth 認証を開始し、アクセストークンを取得する
 */
export async function authenticateGoogle(): Promise<{
  accessToken: string;
  refreshToken?: string;
} | null> {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'timekernel', path: 'google-auth' });
  console.warn('[Google Auth] redirectUri:', redirectUri);

  const request = new AuthSession.AuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  });

  const result = await request.promptAsync(discovery);

  if (result.type !== 'success' || !result.params.code) {
    return null;
  }

  // コードをトークンに交換
  const tokenResult = await AuthSession.exchangeCodeAsync(
    {
      clientId: GOOGLE_CLIENT_ID,
      code: result.params.code,
      redirectUri,
      extraParams: {
        code_verifier: request.codeVerifier || '',
      },
    },
    discovery
  );

  return {
    accessToken: tokenResult.accessToken,
    refreshToken: tokenResult.refreshToken || undefined,
  };
}

/**
 * Google Calendar のカレンダー一覧を取得する
 */
export async function fetchGoogleCalendarList(
  accessToken: string
): Promise<{ id: string; summary: string; backgroundColor: string }[]> {
  const res = await fetch(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Google API error: ${res.status}`);

  const data = await res.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    summary: item.summary || item.id,
    backgroundColor: item.backgroundColor || '#4285F4',
  }));
}

/**
 * Google Calendar のイベントを取得する（指定期間）
 */
export async function fetchGoogleEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<GoogleEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '500',
  });

  const res = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) throw new Error(`Google API error: ${res.status}`);

  const data = await res.json();
  return (data.items || []) as GoogleEvent[];
}

/**
 * Google Calendar にイベントを作成する
 */
export async function createGoogleEvent(
  accessToken: string,
  calendarId: string,
  event: { summary: string; start: string; end: string; date: string }
): Promise<string> {
  const body = {
    summary: event.summary,
    start: {
      dateTime: `${event.date}T${event.start}:00`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: `${event.date}T${event.end}:00`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  const res = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) throw new Error(`Google API error: ${res.status}`);
  const data = await res.json();
  return data.id;
}

/**
 * Google CalendarイベントをTimeKernelにインポートする
 */
export async function syncGoogleToTimeKernel(
  uid: string,
  externalCal: ExternalCalendar,
  targetCalendarId: string
): Promise<number> {
  if (!externalCal.accessToken || !externalCal.googleCalendarId) return 0;

  const now = new Date();
  const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const timeMax = new Date(now.getFullYear(), now.getMonth() + 4, 0).toISOString();

  const googleEvents = await fetchGoogleEvents(
    externalCal.accessToken,
    externalCal.googleCalendarId,
    timeMin,
    timeMax
  );

  // イベントドキュメント自体から externalId で重複チェック
  const existingMap = await getExternalEventIds(targetCalendarId, 'google');

  let importedCount = 0;
  for (const ge of googleEvents) {
    const startDate = ge.start?.dateTime || ge.start?.date || '';
    const endDate = ge.end?.dateTime || ge.end?.date || '';

    if (!startDate) continue;

    const startDt = new Date(startDate);
    const endDt = endDate ? new Date(endDate) : new Date(startDt.getTime() + 3600000);

    const date = startDt.toISOString().split('T')[0];
    const startTime = `${String(startDt.getHours()).padStart(2, '0')}:${String(startDt.getMinutes()).padStart(2, '0')}`;
    const endTime = `${String(endDt.getHours()).padStart(2, '0')}:${String(endDt.getMinutes()).padStart(2, '0')}`;

    const eventData: CalendarEventInput = {
      title: ge.summary || '(タイトルなし)',
      type: 'event',
      date,
      startTime,
      endTime,
      color: externalCal.color,
      createdBy: uid,
      externalId: ge.id,
      externalProvider: 'google',
    };

    const existingEventId = existingMap.get(ge.id);
    if (existingEventId) {
      await updateEvent(targetCalendarId, existingEventId, eventData);
    } else {
      await addEvent(targetCalendarId, eventData);
      importedCount++;
    }
  }

  await updateSyncTimestamp(uid, externalCal.id);
  return importedCount;
}

// ── Types ──

interface GoogleEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  status?: string;
}
