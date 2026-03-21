import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('timekernel.db');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: SQLite.SQLiteDatabase): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS calendars (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      endDate TEXT,
      isAllDay INTEGER DEFAULT 0,
      startTime TEXT,
      endTime TEXT,
      hourlyWage REAL,
      color TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      calendarId TEXT NOT NULL,
      recurrence TEXT,
      externalId TEXT,
      externalProvider TEXT,
      FOREIGN KEY (calendarId) REFERENCES calendars(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS timetables (
      id TEXT PRIMARY KEY,
      calendarId TEXT,
      isPublic INTEGER DEFAULT 0,
      slots TEXT NOT NULL DEFAULT '{}'
    );

    CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
    CREATE INDEX IF NOT EXISTS idx_events_calendar_date ON events(calendarId, date);
    CREATE INDEX IF NOT EXISTS idx_events_external ON events(externalProvider, externalId);
  `);

  // Migration for existing DBs
  const migrations = [
    'ALTER TABLE events ADD COLUMN endDate TEXT',
    'ALTER TABLE events ADD COLUMN isAllDay INTEGER DEFAULT 0',
  ];
  for (const sql of migrations) {
    try { db.runSync(sql); } catch {}
  }
}
