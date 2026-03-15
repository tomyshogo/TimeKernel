import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  getTodayEvents,
  getEventsByDate,
  getEventsByRange,
  getFreeSlots,
  getShiftSummary,
  getCalendars,
  getTimetable,
} from './tools/readTools';
import {
  addEvent,
  updateEvent,
  deleteEvent,
  addShift,
} from './tools/writeTools';

export function createServer(uid: string): Server {
  const server = new Server(
    { name: 'timekernel', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'get_today_events',
        description: '今日の予定一覧を取得する',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'get_events_by_date',
        description: '指定日の予定一覧を取得する',
        inputSchema: {
          type: 'object',
          properties: {
            date: { type: 'string', description: '日付 (YYYY-MM-DD)' },
          },
          required: ['date'],
        },
      },
      {
        name: 'get_events_by_range',
        description: '期間指定で予定一覧を取得する',
        inputSchema: {
          type: 'object',
          properties: {
            startDate: { type: 'string', description: '開始日 (YYYY-MM-DD)' },
            endDate: { type: 'string', description: '終了日 (YYYY-MM-DD)' },
          },
          required: ['startDate', 'endDate'],
        },
      },
      {
        name: 'get_free_slots',
        description: '指定期間の空き日を取得する',
        inputSchema: {
          type: 'object',
          properties: {
            startDate: { type: 'string', description: '開始日 (YYYY-MM-DD)' },
            endDate: { type: 'string', description: '終了日 (YYYY-MM-DD)' },
          },
          required: ['startDate', 'endDate'],
        },
      },
      {
        name: 'get_shift_summary',
        description: '指定月のバイト集計（勤務時間・給料）を取得する',
        inputSchema: {
          type: 'object',
          properties: {
            yearMonth: { type: 'string', description: '年月 (YYYY-MM)' },
          },
          required: ['yearMonth'],
        },
      },
      {
        name: 'get_calendars',
        description: '参加中のカレンダー一覧を取得する',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'get_timetable',
        description: '時間割を取得する',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'add_event',
        description: '予定を追加する',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: '予定のタイトル' },
            type: {
              type: 'string',
              enum: ['class', 'event', 'shift'],
              description: '予定タイプ',
            },
            date: { type: 'string', description: '日付 (YYYY-MM-DD)' },
            startTime: { type: 'string', description: '開始時刻 (HH:MM)' },
            endTime: { type: 'string', description: '終了時刻 (HH:MM)' },
            calendarId: {
              type: 'string',
              description: 'カレンダーID（省略時は最初のカレンダー）',
            },
            hourlyWage: {
              type: 'number',
              description: '時給（バイトのみ）',
            },
          },
          required: ['title', 'type', 'date', 'startTime', 'endTime'],
        },
      },
      {
        name: 'update_event',
        description: '予定を編集する',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: { type: 'string' },
            eventId: { type: 'string' },
            title: { type: 'string' },
            date: { type: 'string' },
            startTime: { type: 'string' },
            endTime: { type: 'string' },
          },
          required: ['calendarId', 'eventId'],
        },
      },
      {
        name: 'delete_event',
        description: '予定を削除する（作成者のみ）',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: { type: 'string' },
            eventId: { type: 'string' },
          },
          required: ['calendarId', 'eventId'],
        },
      },
      {
        name: 'add_shift',
        description: 'バイトシフトを追加する',
        inputSchema: {
          type: 'object',
          properties: {
            date: { type: 'string', description: '日付 (YYYY-MM-DD)' },
            startTime: { type: 'string', description: '開始時刻 (HH:MM)' },
            endTime: { type: 'string', description: '終了時刻 (HH:MM)' },
            hourlyWage: { type: 'number', description: '時給' },
            title: { type: 'string', description: 'タイトル（省略時: バイト）' },
            calendarId: { type: 'string' },
          },
          required: ['date', 'startTime', 'endTime', 'hourlyWage'],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      let result: unknown;

      switch (name) {
        case 'get_today_events':
          result = await getTodayEvents(uid);
          break;
        case 'get_events_by_date':
          result = await getEventsByDate(uid, (args as { date: string }).date);
          break;
        case 'get_events_by_range':
          result = await getEventsByRange(
            uid,
            (args as { startDate: string; endDate: string }).startDate,
            (args as { startDate: string; endDate: string }).endDate
          );
          break;
        case 'get_free_slots':
          result = await getFreeSlots(
            uid,
            (args as { startDate: string; endDate: string }).startDate,
            (args as { startDate: string; endDate: string }).endDate
          );
          break;
        case 'get_shift_summary':
          result = await getShiftSummary(
            uid,
            (args as { yearMonth: string }).yearMonth
          );
          break;
        case 'get_calendars':
          result = await getCalendars(uid);
          break;
        case 'get_timetable':
          result = await getTimetable(uid);
          break;
        case 'add_event':
          result = await addEvent(uid, args as Parameters<typeof addEvent>[1]);
          break;
        case 'update_event':
          await updateEvent(uid, args as Parameters<typeof updateEvent>[1]);
          result = { success: true };
          break;
        case 'delete_event':
          await deleteEvent(uid, args as Parameters<typeof deleteEvent>[1]);
          result = { success: true };
          break;
        case 'add_shift':
          result = await addShift(uid, args as Parameters<typeof addShift>[1]);
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

export async function startServer(uid: string) {
  const server = createServer(uid);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
