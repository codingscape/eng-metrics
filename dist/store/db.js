import path from 'node:path';
import Database from 'better-sqlite3';
import { clientDir, ensureDir } from '../paths.js';
export function openDb(client) {
    const dir = path.join(clientDir(client), 'store');
    ensureDir(dir);
    const dbPath = path.join(dir, 'metrics.sqlite');
    const db = new Database(dbPath);
    db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS prs (
      client TEXT NOT NULL,
      repo_full_name TEXT NOT NULL,
      pr_number INTEGER NOT NULL,
      pr_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      closed_at TEXT,
      merged_at TEXT,
      author_login TEXT,
      PRIMARY KEY (client, repo_full_name, pr_number)
    );

    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      client TEXT NOT NULL,
      started_at TEXT NOT NULL,
      start_iso TEXT NOT NULL,
      end_iso TEXT NOT NULL
    );
  `);
    return db;
}
