import * as Clipboard from 'expo-clipboard';

export function generateShareLink(calendarId: string): string {
  return `https://timekernel.app/join/${calendarId}`;
}

export function generateDeepLink(calendarId: string): string {
  return `timekernel://join/${calendarId}`;
}

export async function copyShareLink(calendarId: string): Promise<void> {
  const link = generateShareLink(calendarId);
  await Clipboard.setStringAsync(link);
}

export function extractCalendarIdFromLink(link: string): string | null {
  const webMatch = link.match(/timekernel\.app\/join\/([a-zA-Z0-9]+)/);
  if (webMatch) return webMatch[1];

  const deepMatch = link.match(/timekernel:\/\/join\/([a-zA-Z0-9]+)/);
  if (deepMatch) return deepMatch[1];

  return null;
}
