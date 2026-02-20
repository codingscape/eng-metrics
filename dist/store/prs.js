import { openDb } from './db.js';
export function loadPrsForWindow(client, window) {
    const db = openDb(client);
    const rows = db
        .prepare(`
      SELECT pr_json
      FROM prs
      WHERE client = ?
        AND (
          (created_at BETWEEN ? AND ?)
          OR (merged_at BETWEEN ? AND ?)
          OR (closed_at BETWEEN ? AND ?)
        )
    `)
        .all(client, window.start, window.end, window.start, window.end, window.start, window.end);
    return rows.map((row) => JSON.parse(row.pr_json));
}
